import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PrecificacaoView from '../PrecificacaoView';
import { desligarMedicao, enviados, ligarMedicao } from '../../../test/medicao';

const FERRAMENTA = 'quanto-cobrar';

const montar = () => {
  const r = render(<PrecificacaoView><p>texto do guia</p></PrecificacaoView>);
  // O carregamento do localStorage agenda um timer
  act(() => {
    vi.runAllTimers();
  });
  return r;
};

const digitar = (rotulo: string, valor: string | number) => {
  act(() => {
    fireEvent.change(screen.getByLabelText(rotulo), { target: { value: String(valor) } });
  });
};

const abrir = (titulo: string) => {
  const detalhes = screen.getByText(titulo).closest('details') as HTMLDetailsElement;
  detalhes.setAttribute('open', '');
  fireEvent(detalhes, new Event('toggle'));
};

describe('Quanto cobrar pelo serviço — medição de uso', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    sendBeacon = ligarMedicao();
  });
  afterEach(() => {
    vi.useRealTimers();
    desligarMedicao();
    vi.restoreAllMocks();
  });

  it('marca a visita uma vez ao abrir a página, mesmo re-renderizando', () => {
    const { rerender } = montar();
    rerender(<PrecificacaoView><p>texto do guia</p></PrecificacaoView>);
    expect(enviados(sendBeacon)).toEqual([{ f: FERRAMENTA, e: 'visita' }]);
  });

  it('marca "comecou" uma vez só, na primeira mudança de campo', () => {
    montar();
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'comecou' });
    digitar('Aluguel e condomínio', 800);
    digitar('Luz e água', 150);
    digitar('Quanto você tira para viver', 3000);
    expect(enviados(sendBeacon).filter((x) => x.e === 'comecou')).toEqual([{ f: FERRAMENTA, e: 'comecou' }]);
  });

  it('marca "resultado" só quando há preço mínimo, e uma vez só', () => {
    montar();
    digitar('Aluguel e condomínio', 800);
    expect(screen.getAllByText('Falta pouco').length).toBeGreaterThan(0);
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'resultado' });

    digitar('Horas que leva', 3);
    expect(screen.queryAllByText('Falta pouco')).toHaveLength(0);
    digitar('Horas que leva', 4);
    digitar('Material', 40);
    expect(enviados(sendBeacon).filter((x) => x.e === 'resultado')).toEqual([{ f: FERRAMENTA, e: 'resultado' }]);
  });

  it('quem volta com horas salvas não conta "resultado" ao abrir; conta "comecou" e "resultado" (uma vez cada) depois de mexer', () => {
    window.localStorage.setItem(
      'pricing_data',
      JSON.stringify({
        custosFixos: { aluguel: 800, energia: 0, internet: 0, contador: 0, softwares: 0, equipe: 0, proLabore: 3000 },
        capacidade: { diasTrabalhados: 22, horasDiarias: 8, percentualOciosidade: 20 },
        servico: { nome: '', horasEstimadas: 4, materiaisDiretos: 0, deslocamento: 0, impostosPercentual: 0, precoDesejado: 0 },
      }),
    );
    montar();
    expect(screen.queryAllByText('Falta pouco')).toHaveLength(0);
    expect(enviados(sendBeacon)).toEqual([{ f: FERRAMENTA, e: 'visita' }]);

    digitar('Material', 40);
    digitar('Material', 50);
    expect(enviados(sendBeacon)).toEqual([
      { f: FERRAMENTA, e: 'visita' },
      { f: FERRAMENTA, e: 'comecou' },
      { f: FERRAMENTA, e: 'resultado' },
    ]);
  });

  it('"resultado" nunca vem antes de "comecou"', () => {
    montar();
    digitar('Horas que leva', 3);
    const eventos = enviados(sendBeacon).map((x) => x.e);
    expect(eventos.indexOf('comecou')).toBeGreaterThanOrEqual(0);
    expect(eventos.indexOf('resultado')).toBeGreaterThan(eventos.indexOf('comecou'));
  });

  it('marca "convite" no clique do link, uma vez só', () => {
    montar();
    const link = screen.getByRole('link', { name: 'Mostre numa página com botão de WhatsApp →' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    fireEvent.click(link);
    expect(enviados(sendBeacon).filter((x) => x.e === 'convite')).toEqual([{ f: FERRAMENTA, e: 'convite' }]);
  });

  it('marca "guia" ao abrir "Como funciona esta conta", uma vez só, e não ao abrir outros recolhíveis', () => {
    montar();
    digitar('Horas que leva', 3);
    abrir('Ver a conta passo a passo');
    abrir('+ Outras contas (internet, contador, programas, funcionários, DAS)');
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'guia' });

    abrir('Como funciona esta conta');
    abrir('Como funciona esta conta');
    expect(enviados(sendBeacon).filter((x) => x.e === 'guia')).toEqual([{ f: FERRAMENTA, e: 'guia' }]);
  });

  it('manda só eventos desta ferramenta, nunca "planilha"', () => {
    montar();
    digitar('Horas que leva', 3);
    abrir('Como funciona esta conta');
    const todos = enviados(sendBeacon);
    expect(todos.every((x) => x.f === FERRAMENTA)).toBe(true);
    expect(todos.map((x) => x.e).sort()).toEqual(['comecou', 'guia', 'resultado', 'visita']);
  });

  it('sem NEXT_PUBLIC_TOOLS_USO_URL nada é enviado', () => {
    vi.stubEnv('NEXT_PUBLIC_TOOLS_USO_URL', '');
    const fetchEspiao = vi.fn();
    vi.stubGlobal('fetch', fetchEspiao);
    montar();
    digitar('Horas que leva', 3);
    abrir('Como funciona esta conta');
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchEspiao).not.toHaveBeenCalled();
  });

  it('se o envio falhar, a ferramenta continua calculando', () => {
    sendBeacon.mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sem rede')));
    montar();
    digitar('Horas que leva', 3);
    expect(screen.getByRole('region', { name: 'Seu resultado' })).toHaveTextContent('Preço mínimo deste serviço');
  });
});

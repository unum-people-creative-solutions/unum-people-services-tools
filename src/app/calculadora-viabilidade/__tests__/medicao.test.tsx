import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ViabilidadeView from '../ViabilidadeView';
import { desligarMedicao, enviados, ligarMedicao } from '../../../test/medicao';

const FERRAMENTA = 'vale-anunciar';

const montar = () => render(<ViabilidadeView><p>texto do guia</p></ViabilidadeView>);

const digitar = (rotulo: string, valor: string | number) => {
  act(() => {
    const campo = screen.getByLabelText(rotulo);
    fireEvent.change(campo, { target: { value: String(valor) } });
    fireEvent.blur(campo);
  });
};

const preencherOrcamento = () => {
  digitar('Preço médio de cada venda', 300);
  digitar('Quanto custa entregar essa venda', 60);
  digitar('Quanto custa cada clique', 2);
  digitar('De cada 100 que clicam, quantos chamam você', 6);
  digitar('Quanto você quer gastar em anúncio', 600);
};

const abrir = (titulo: string) => {
  const detalhes = screen.getByText(titulo).closest('details') as HTMLDetailsElement;
  detalhes.setAttribute('open', '');
  fireEvent(detalhes, new Event('toggle'));
};

describe('Vale a pena anunciar? — medição de uso', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    sendBeacon = ligarMedicao();
  });
  afterEach(() => {
    desligarMedicao();
    vi.restoreAllMocks();
  });

  it('marca a visita uma vez ao abrir a página, mesmo re-renderizando', () => {
    const { rerender } = montar();
    rerender(<ViabilidadeView><p>texto do guia</p></ViabilidadeView>);
    expect(enviados(sendBeacon)).toEqual([{ f: FERRAMENTA, e: 'visita' }]);
  });

  it('marca "comecou" uma vez só, na primeira mudança de campo', () => {
    montar();
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'comecou' });
    digitar('Preço médio de cada venda', 300);
    digitar('Quanto custa entregar essa venda', 60);
    digitar('Quanto custa cada clique', 2);
    act(() => {
      fireEvent.click(screen.getByRole('radio', { name: 'Quero um número de clientes' }));
    });
    expect(enviados(sendBeacon).filter((x) => x.e === 'comecou')).toEqual([{ f: FERRAMENTA, e: 'comecou' }]);
  });

  it('marca "resultado" só quando o resultado tem número, e uma vez só', () => {
    montar();
    digitar('Preço médio de cada venda', 300);
    expect(screen.getAllByText('Falta pouco').length).toBeGreaterThan(0);
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'resultado' });

    preencherOrcamento();
    expect(screen.queryAllByText('Falta pouco')).toHaveLength(0);
    digitar('Quanto você quer gastar em anúncio', 900);
    digitar('Quanto você quer gastar em anúncio', 1200);
    expect(enviados(sendBeacon).filter((x) => x.e === 'resultado')).toEqual([{ f: FERRAMENTA, e: 'resultado' }]);
  });

  it('"resultado" vem depois de "comecou": preencher até ter número manda os dois, nessa ordem, uma vez cada', () => {
    montar();
    preencherOrcamento();
    expect(enviados(sendBeacon).map((x) => x.e)).toEqual(['visita', 'comecou', 'resultado']);
  });

  it('marca "convite" no clique do link, uma vez só', () => {
    montar();
    const link = screen.getByRole('link', { name: 'Mande os cliques para uma página com o seu WhatsApp →' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    fireEvent.click(link);
    expect(enviados(sendBeacon).filter((x) => x.e === 'convite')).toEqual([{ f: FERRAMENTA, e: 'convite' }]);
  });

  it('marca "guia" ao abrir "Como funciona esta conta", uma vez só, e não ao abrir a conta passo a passo', () => {
    montar();
    preencherOrcamento();
    abrir('Ver a conta passo a passo');
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'guia' });

    abrir('Como funciona esta conta');
    abrir('Como funciona esta conta');
    expect(enviados(sendBeacon).filter((x) => x.e === 'guia')).toEqual([{ f: FERRAMENTA, e: 'guia' }]);
  });

  it('manda só eventos desta ferramenta, nunca "planilha"', () => {
    montar();
    preencherOrcamento();
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
    preencherOrcamento();
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
    preencherOrcamento();
    expect(screen.getByRole('region', { name: 'Seu resultado' })).toHaveTextContent('vendas');
  });

  it('com a medição ligada, continua sem guardar nada no aparelho (RF-MU-13)', () => {
    const setItem = vi.spyOn(window.localStorage, 'setItem');
    montar();
    preencherOrcamento();
    abrir('Como funciona esta conta');
    fireEvent.click(screen.getByRole('button', { name: 'Começar de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect(sendBeacon).toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    const chaves = (s: Storage) =>
      Object.keys(s).filter((c) => typeof (s as unknown as Record<string, unknown>)[c] !== 'function');
    expect(chaves(window.localStorage)).toEqual([]);
    expect(chaves(window.sessionStorage)).toEqual([]);
  });
});

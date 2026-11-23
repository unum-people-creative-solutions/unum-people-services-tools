import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PortfolioView from '../PortfolioView';
import { desligarMedicao, enviados, ligarMedicao } from '../../../test/medicao';

const FERRAMENTA = 'servicos-compensam';

const montar = () => {
  const r = render(<PortfolioView><p>texto do guia</p></PortfolioView>);
  // O carregamento do localStorage agenda um timer; uma segunda rodada cobre efeitos em cadeia
  act(() => {
    vi.runAllTimers();
  });
  act(() => {
    vi.runAllTimers();
  });
  return r;
};

const cadastrar = (nome: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));
  screen
    .getAllByRole('radio', { name: 'Sim' })
    .slice(0, 1)
    .forEach((r) => fireEvent.click(r));
  for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
  fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: nome } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
};

const abrir = (titulo: string) => {
  const detalhes = screen.getByText(titulo).closest('details') as HTMLDetailsElement;
  detalhes.setAttribute('open', '');
  fireEvent(detalhes, new Event('toggle'));
};

describe('Quais serviços compensam — medição de uso', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    sendBeacon = ligarMedicao();
    // jsdom não baixa arquivos: o clique no link temporário do CSV não pode navegar
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:falso', revokeObjectURL: () => undefined }));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    desligarMedicao();
    vi.restoreAllMocks();
  });

  it('marca a visita uma vez ao abrir a página, mesmo re-renderizando', () => {
    const { rerender } = montar();
    rerender(<PortfolioView><p>texto do guia</p></PortfolioView>);
    expect(enviados(sendBeacon)).toEqual([{ f: FERRAMENTA, e: 'visita' }]);
  });

  it('marca "comecou" uma vez só, na primeira mudança de campo da gaveta', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'comecou' });
    const sims = screen.getAllByRole('radio', { name: 'Sim' });
    fireEvent.click(sims[0]);
    fireEvent.click(sims[1]);
    fireEvent.click(sims[2]);
    expect(enviados(sendBeacon).filter((x) => x.e === 'comecou')).toEqual([{ f: FERRAMENTA, e: 'comecou' }]);
    // sem nenhum serviço salvo não há resultado na tela: o funil não pode contar "viram o resultado"
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'resultado' });
  });

  it('marca "resultado" quando há um serviço com nota na tela, e uma vez só', () => {
    montar();
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'resultado' });
    cadastrar('Primeiro');
    act(() => {
      vi.runAllTimers();
    });
    cadastrar('Segundo');
    act(() => {
      vi.runAllTimers();
    });
    expect(enviados(sendBeacon).filter((x) => x.e === 'resultado')).toEqual([{ f: FERRAMENTA, e: 'resultado' }]);
  });

  it('quem volta com serviços salvos não conta "resultado" ao abrir; conta "comecou" e "resultado" (uma vez cada) depois de interagir', () => {
    window.localStorage.setItem(
      'portfolio_services',
      JSON.stringify([{ id: '1', nome: 'Salvo', esforco: 50, complexidade: 50, padronizacao: 50, lucratividade: 50 }]),
    );
    montar();
    expect(screen.queryByText('Salvo')).not.toBeNull();
    expect(enviados(sendBeacon)).toEqual([{ f: FERRAMENTA, e: 'visita' }]);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));
    const sims = screen.getAllByRole('radio', { name: 'Sim' });
    fireEvent.click(sims[0]);
    fireEvent.click(sims[1]);
    expect(enviados(sendBeacon)).toEqual([
      { f: FERRAMENTA, e: 'visita' },
      { f: FERRAMENTA, e: 'comecou' },
      { f: FERRAMENTA, e: 'resultado' },
    ]);
  });

  it('marca "convite" no clique do link, uma vez só', () => {
    montar();
    const link = screen.getByRole('link', { name: 'Mostre esses serviços numa página com o seu WhatsApp →' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    fireEvent.click(link);
    expect(enviados(sendBeacon).filter((x) => x.e === 'convite')).toEqual([{ f: FERRAMENTA, e: 'convite' }]);
  });

  it('marca "guia" ao abrir "Como funciona esta conta", uma vez só', () => {
    montar();
    abrir('Como funciona esta conta');
    abrir('Como funciona esta conta');
    expect(enviados(sendBeacon).filter((x) => x.e === 'guia')).toEqual([{ f: FERRAMENTA, e: 'guia' }]);
  });

  it('marca "planilha" ao baixar o CSV, uma vez só', () => {
    montar();
    cadastrar('Primeiro');
    act(() => {
      vi.runAllTimers();
    });
    expect(enviados(sendBeacon)).not.toContainEqual({ f: FERRAMENTA, e: 'planilha' });
    fireEvent.click(screen.getByRole('button', { name: 'Baixar planilha (CSV)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Baixar planilha (CSV)' }));
    expect(enviados(sendBeacon).filter((x) => x.e === 'planilha')).toEqual([{ f: FERRAMENTA, e: 'planilha' }]);
  });

  it('sem NEXT_PUBLIC_TOOLS_USO_URL nada é enviado', () => {
    vi.stubEnv('NEXT_PUBLIC_TOOLS_USO_URL', '');
    const fetchEspiao = vi.fn();
    vi.stubGlobal('fetch', fetchEspiao);
    montar();
    cadastrar('Primeiro');
    abrir('Como funciona esta conta');
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchEspiao).not.toHaveBeenCalled();
  });

  it('se o envio falhar, o serviço continua sendo salvo', () => {
    sendBeacon.mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sem rede')));
    montar();
    cadastrar('Primeiro');
    act(() => {
      vi.runAllTimers();
    });
    expect(JSON.parse(window.localStorage.getItem('portfolio_services') ?? '[]')).toHaveLength(1);
  });
});

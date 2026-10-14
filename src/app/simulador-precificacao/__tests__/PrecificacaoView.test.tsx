import { render, screen, fireEvent, act } from '@testing-library/react';
import PrecificacaoView from '../PrecificacaoView';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Header e Footer para focar na lógica da view
vi.mock('../../../components/Header', () => ({
  Header: ({ onOpenHelp }: { onOpenHelp?: () => void }) => (
    <div data-testid="header">
      <button onClick={onOpenHelp}>Ajuda</button>
    </div>
  )
}));
vi.mock('../../../components/Footer', () => ({
  Footer: () => <div data-testid="footer" />
}));
vi.mock('../../../components/AdUnit', () => ({
  AdUnit: ({ slot }: { slot?: string }) => <div data-testid="ad-unit" data-ad-slot={slot} />
}));

// true quando `depois` vem depois de `antes` na ordem do documento
const vemDepois = (antes: Element, depois: Element) =>
  Boolean(antes.compareDocumentPosition(depois) & Node.DOCUMENT_POSITION_FOLLOWING);

// Os blocos de anúncio (AdUnit simulado), na ordem do documento
const anunciosNaTela = () => screen.queryAllByTestId('ad-unit');


describe('PrecificacaoView', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  it('deve atualizar o Piso Aceitável quando o Pró-labore muda', async () => {
    render(<PrecificacaoView />);
    
    // Simula carregamento do localStorage
    act(() => {
      vi.runAllTimers();
    });

    const proLaboreInput = screen.getByLabelText(/Pró-labore/i);
    
    await act(async () => {
      fireEvent.change(proLaboreInput, { target: { value: '5000' } });
      vi.runAllTimers();
    });

    // Com dias=22, horas=8, ociosidade=20% -> horasFaturaveis = 140.8
    // Custo/hora = 5000 / 140.8 = 35.51
    // Piso (sem outros dados) = 0 (porque horasEstimadas é 0)
    
    const horasEstimadasInput = screen.getByLabelText(/Horas Estimadas/i);
    await act(async () => {
      fireEvent.change(horasEstimadasInput, { target: { value: '10' } });
      vi.runAllTimers();
    });

    // Custo base = 35.51 * 10 = 355.11
    // Piso = 355.11
    const pisoValue = screen.getByText(/R\$ 355,11/);
    expect(pisoValue).toBeInTheDocument();
  });

  it('deve mostrar aviso se o preço estiver abaixo do piso', async () => {
    render(<PrecificacaoView />);
    
    act(() => {
      vi.runAllTimers();
    });

    // Set up a situation where floor is 500 and price is 400
    const proLaboreInput = screen.getByLabelText(/Pró-labore/i);
    const horasEstimadasInput = screen.getByLabelText(/Horas Estimadas/i);
    const precoInput = screen.getByLabelText(/Quanto deseja cobrar\?/i);

    await act(async () => {
      fireEvent.change(proLaboreInput, { target: { value: '5000' } });
      fireEvent.change(horasEstimadasInput, { target: { value: '20' } }); // Piso ~710
      fireEvent.change(precoInput, { target: { value: '400' } });
      vi.runAllTimers();
    });

    expect(screen.getByText(/Atenção: O preço sugerido está abaixo do piso aceitável/i)).toBeInTheDocument();
  });

  it('margem de exatamente 20% não mostra o aviso de margem apertada (guia: "a partir de 20%")', async () => {
    render(<PrecificacaoView />);
    act(() => {
      vi.runAllTimers();
    });

    // Sem custos fixos nem imposto: custo base = R$ 80 de material; preço R$ 100 → margem 20%
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Materiais Diretos/i), { target: { value: '80' } });
      fireEvent.change(screen.getByLabelText(/Quanto deseja cobrar\?/i), { target: { value: '100' } });
      vi.runAllTimers();
    });

    expect(screen.getByText('20,00%')).toBeInTheDocument();
    expect(screen.queryByText(/Margem Apertada/i)).not.toBeInTheDocument();
  });

  it('enquanto carrega, mostra o guia e só o anúncio que vem depois dele', () => {
    render(<PrecificacaoView><p>GUIA-TESTE</p></PrecificacaoView>);

    const guia = screen.getByText('GUIA-TESTE');
    const anuncios = anunciosNaTela();
    expect(anuncios).toHaveLength(1);
    expect(anuncios[0]).toHaveAttribute('data-ad-slot', '7715444307');
    expect(vemDepois(guia, anuncios[0])).toBe(true);
    expect(screen.getByRole('main')).toContainElement(guia);
    expect(vemDepois(anuncios[0], screen.getByTestId('footer'))).toBe(true);
  });

  it('carregada, põe um anúncio entre a ferramenta e o guia e outro depois do guia', () => {
    render(<PrecificacaoView><p>GUIA-TESTE</p></PrecificacaoView>);
    act(() => {
      vi.runAllTimers();
    });

    const titulo = screen.getByRole('heading', { level: 1 });
    const campo = screen.getByLabelText(/Pró-labore/i);
    const fimDaFerramenta = screen.getByRole('link', { name: /CONHECER UNUM PEOPLE/i });
    const guia = screen.getByText('GUIA-TESTE');
    const anuncios = anunciosNaTela();

    expect(anuncios).toHaveLength(2);
    const [meio, fim] = anuncios;
    expect(meio).toHaveAttribute('data-ad-slot', '1270666901');
    expect(fim).toHaveAttribute('data-ad-slot', '7715444307');
    expect(vemDepois(titulo, meio)).toBe(true);
    expect(vemDepois(campo, meio)).toBe(true);
    expect(vemDepois(fimDaFerramenta, meio)).toBe(true);
    expect(vemDepois(meio, guia)).toBe(true);
    expect(vemDepois(guia, fim)).toBe(true);
    expect(screen.getByRole('main')).toContainElement(guia);
    expect(vemDepois(fim, screen.getByTestId('footer'))).toBe(true);
  });

  it('não abre a ajuda sozinha na primeira visita, e o botão Ajuda abre', () => {
    render(<PrecificacaoView />);
    // Duas rodadas: o carregamento do localStorage agenda um timer, e o
    // efeito que reage ao carregamento poderia agendar outro.
    act(() => {
      vi.runAllTimers();
    });
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByRole('button', { name: /Entendi, Prosseguir/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ajuda' }));
    expect(screen.getByRole('button', { name: /Entendi, Prosseguir/i })).toBeInTheDocument();
  });
});

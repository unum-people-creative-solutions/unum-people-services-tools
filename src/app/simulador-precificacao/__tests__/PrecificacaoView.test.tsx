import { render, screen, fireEvent, act } from '@testing-library/react';
import PrecificacaoView from '../PrecificacaoView';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Header e Footer para focar na lógica da view
vi.mock('../../components/Header', () => ({
  Header: () => <div data-testid="header" />
}));
vi.mock('../../components/Footer', () => ({
  Footer: () => <div data-testid="footer" />
}));
vi.mock('../../components/AdUnit', () => ({
  AdUnit: () => <div data-testid="ad-unit" />
}));

// true quando `depois` vem depois de `antes` na ordem do documento
const vemDepois = (antes: Element, depois: Element) =>
  Boolean(antes.compareDocumentPosition(depois) & Node.DOCUMENT_POSITION_FOLLOWING);

// Os blocos do AdSense renderizados pelo AdUnit real, na ordem do documento
const anunciosNaTela = () => Array.from(document.querySelectorAll('ins[data-ad-slot]'));


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

  it('enquanto carrega, mostra o guia e só o anúncio que vem depois dele', () => {
    render(<PrecificacaoView><p>GUIA-TESTE</p></PrecificacaoView>);

    const guia = screen.getByText('GUIA-TESTE');
    const anuncios = anunciosNaTela();
    expect(anuncios).toHaveLength(1);
    expect(anuncios[0]).toHaveAttribute('data-ad-slot', '7715444307');
    expect(vemDepois(guia, anuncios[0])).toBe(true);
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
  });
});

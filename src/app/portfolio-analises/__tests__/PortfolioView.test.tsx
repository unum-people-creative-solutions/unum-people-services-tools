import { render, screen, fireEvent, act } from '@testing-library/react';
import PortfolioView from '../PortfolioView';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependências externas
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

// true quando `depois` vem depois de `antes` na ordem do documento
const vemDepois = (antes: Element, depois: Element) =>
  Boolean(antes.compareDocumentPosition(depois) & Node.DOCUMENT_POSITION_FOLLOWING);

// Anúncio do Google (<ins>) ou o marcador de anúncio de desenvolvimento
const anunciosNaTela = () => [
  ...Array.from(document.querySelectorAll('ins')),
  ...screen.queryAllByText(/AdSense|Publicidade/i),
];

// Mock crypto.randomUUID
if (!global.crypto) {
  (global as unknown as { crypto: unknown }).crypto = {
    randomUUID: () => 'test-uuid-' + Math.random()
  };
}

describe('PortfolioView', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  it('deve abrir o drawer de novo serviço ao clicar no botão "Novo Serviço"', async () => {
    render(<PortfolioView />);
    
    act(() => {
      vi.runAllTimers();
    });

    const novoBotao = screen.getByRole('button', { name: /novo serviço/i });
    fireEvent.click(novoBotao);

    // O primeiro passo é 'Esforço' (procuramos no título do passo)
    expect(screen.getByRole('heading', { name: /esforço/i })).toBeInTheDocument();
  });

  it('deve permitir adicionar um serviço respondendo o questionário', async () => {
    render(<PortfolioView />);
    
    act(() => {
      vi.runAllTimers();
    });

    // Abrir drawer
    fireEvent.click(screen.getByRole('button', { name: /novo serviço/i }));

    // Passo 1 a 4: Esforço, Complexidade, Padronização, Lucratividade
    for(let i = 0; i < 4; i++) {
        const nextButton = screen.getByRole('button', { name: /próximo/i });
        fireEvent.click(nextButton);
    }

    // Passo Final: Nome
    const nomeInput = screen.getByPlaceholderText(/Ex: Consultoria Técnica/i);
    fireEvent.change(nomeInput, { target: { value: 'Serviço de Teste' } });

    const salvarBotao = screen.getByRole('button', { name: /salvar serviço/i });
    fireEvent.click(salvarBotao);

    // Deve aparecer na lista (pode haver versão Desktop e Mobile, então pegamos a primeira)
    expect(screen.getAllByText('Serviço de Teste')[0]).toBeInTheDocument();
  });

  it('enquanto carrega, mostra o guia, sem anúncio', () => {
    render(<PortfolioView><p>GUIA-TESTE</p></PortfolioView>);

    const guia = screen.getByText('GUIA-TESTE');
    expect(anunciosNaTela()).toHaveLength(0);
    expect(screen.getByRole('main')).toContainElement(guia);
    expect(vemDepois(guia, screen.getByTestId('footer'))).toBe(true);
  });

  it('carregada, o guia vem logo depois da ferramenta, sem anúncio no meio nem no fim', () => {
    render(<PortfolioView><p>GUIA-TESTE</p></PortfolioView>);
    act(() => {
      vi.runAllTimers();
    });

    const titulo = screen.getByRole('heading', { level: 1 });
    const botao = screen.getByRole('button', { name: /novo serviço/i });
    const fimDaFerramenta = screen.getByRole('link', { name: /CONHECER UNUM PEOPLE/i });
    const guia = screen.getByText('GUIA-TESTE');

    expect(anunciosNaTela()).toHaveLength(0);
    expect(vemDepois(titulo, guia)).toBe(true);
    expect(vemDepois(botao, guia)).toBe(true);
    expect(vemDepois(fimDaFerramenta, guia)).toBe(true);
    expect(screen.getByRole('main')).toContainElement(guia);
    expect(vemDepois(guia, screen.getByTestId('footer'))).toBe(true);
  });

  it('não abre a ajuda sozinha na primeira visita, e o botão Ajuda abre', () => {
    render(<PortfolioView />);
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

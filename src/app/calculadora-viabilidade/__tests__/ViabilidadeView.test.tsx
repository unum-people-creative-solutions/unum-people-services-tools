import { render, screen, fireEvent } from '@testing-library/react';
import ViabilidadeView from '../ViabilidadeView';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock components to isolate the view logic
vi.mock('../../../components/Header', () => ({
  Header: () => <div data-testid="header" />
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

vi.mock('../../../components/WelcomeModal', () => ({
  WelcomeModal: () => <div data-testid="welcome-modal" />
}));

describe('ViabilidadeView', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('deve renderizar a seleção inicial de caminho', () => {
    render(<ViabilidadeView />);
    expect(screen.getByText(/Tenho um orçamento/i)).toBeInTheDocument();
    expect(screen.getByText(/Tenho uma meta/i)).toBeInTheDocument();
  });

  it('deve permitir selecionar o cenário "Orçamento para Esforço"', () => {
    render(<ViabilidadeView />);
    
    const budgetButton = screen.getByText(/Tenho um orçamento/i).closest('button');
    if (budgetButton) fireEvent.click(budgetButton);

    expect(screen.getByText(/Preencha os dados básicos da sua operação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ticket Médio/i)).toBeInTheDocument();
  });

  it('deve calcular corretamente a viabilidade no cenário de orçamento', async () => {
    render(<ViabilidadeView />);
    
    // Escolher caminho
    const budgetButton = screen.getByText(/Tenho um orçamento/i).closest('button');
    if (budgetButton) fireEvent.click(budgetButton);

    // Preencher formulário
    // Margem = 100 - 20 = 80
    // Visitantes = 1000 / 1 = 1000
    // Leads = 1000 * 0.1 = 100
    // Vendas PE = 1000 / 80 = 12.5 -> 13
    // Tx Vendas Exigida = (12.5 / 100) * 100 = 12.5%
    fireEvent.change(screen.getByLabelText(/Ticket Médio/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Custo Variável/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/CPC Médio/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Taxa de Conversão da LP/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Orçamento da Campanha/i), { target: { value: '1000' } });

    const analyzeButton = screen.getByText(/Gerar Diagnóstico/i);
    fireEvent.click(analyzeButton);

    // Verificar resultados
    expect(screen.getByText(/Seu Diagnóstico de Viabilidade/i)).toBeInTheDocument();
    expect(screen.getByText(/13/)).toBeInTheDocument(); // Vendas para Ponto de Equilíbrio
    expect(screen.getByText(/12/)).toBeInTheDocument(); // Taxa de Vendas Exigida (12.5% ou 12,5%)
    expect(screen.getByText(/Cenário Viável/i)).toBeInTheDocument();
  });

  it('deve calcular corretamente a viabilidade no cenário de meta de clientes', () => {
    render(<ViabilidadeView />);
    
    // Escolher caminho
    const goalButton = screen.getByText(/Tenho uma meta/i).closest('button');
    if (goalButton) fireEvent.click(goalButton);

    fireEvent.change(screen.getByLabelText(/Ticket Médio/i), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/Meta de Clientes/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/CPC Médio/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Taxa de Conversão da LP/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Taxa de Fechamento \(Vendas\)/i), { target: { value: '50' } });

    const analyzeButton = screen.getByText(/Gerar Diagnóstico/i);
    fireEvent.click(analyzeButton);

    // Verificar resultados
    expect(screen.getByText(/R\$ 400,00/)).toBeInTheDocument(); // Orçamento Necessário
    expect(screen.getByText((content) => content.includes('20') && content.includes('oportunidades'))).toBeInTheDocument(); // Leads
  });

  it('deve exibir erro se a margem de contribuição for negativa', () => {
    render(<ViabilidadeView />);
    
    const budgetButton = screen.getByText(/Tenho um orçamento/i).closest('button');
    if (budgetButton) fireEvent.click(budgetButton);

    fireEvent.change(screen.getByLabelText(/Ticket Médio/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Custo Variável/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/CPC Médio/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Taxa de Conversão da LP/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Orçamento da Campanha/i), { target: { value: '1000' } });
    
    const analyzeButton = screen.getByText(/Gerar Diagnóstico/i);
    fireEvent.click(analyzeButton);

    expect(screen.getByText(/Margem de contribuição negativa/i)).toBeInTheDocument();
  });

  it('fechamento exigido de exatamente 20% ainda é viável (arriscado só acima de 20%)', () => {
    render(<ViabilidadeView />);
    fireEvent.click(screen.getByText(/Tenho um orçamento/i).closest('button')!);
    fireEvent.change(screen.getByLabelText(/Ticket Médio/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/Custo Variável/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/CPC Médio/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Taxa de Conversão da LP/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Orçamento da Campanha/i), { target: { value: '1000' } });
    fireEvent.click(screen.getByText(/Gerar Diagnóstico/i));

    // margem 100 → 10 vendas; 1.000 cliques × 5% = 50 oportunidades; 10 ÷ 50 = 20%
    expect(screen.getByText(/Este é um cenário viável e saudável/i)).toBeInTheDocument();
    expect(screen.queryByText(/Este cenário é arriscado/i)).not.toBeInTheDocument();
  });

  describe('arredonda pelo valor exato, sem ruído de ponto flutuante', () => {
    const preencherBase = (ticket: string, custo: string, cpc: string, conversao: string) => {
      fireEvent.change(screen.getByLabelText(/Ticket Médio/i), { target: { value: ticket } });
      fireEvent.change(screen.getByLabelText(/Custo Variável/i), { target: { value: custo } });
      fireEvent.change(screen.getByLabelText(/CPC Médio/i), { target: { value: cpc } });
      fireEvent.change(screen.getByLabelText(/Taxa de Conversão da LP/i), { target: { value: conversao } });
    };
    const textoDaTela = () => (document.body.textContent ?? '').replace(/ /g, ' ');

    it('orçamento: R$ 500 a R$ 1,50 por clique com 3% de conversão dá 10 oportunidades', () => {
      render(<ViabilidadeView />);
      fireEvent.click(screen.getByText(/Tenho um orçamento/i).closest('button')!);
      preencherBase('300', '60', '1,50', '3');
      fireEvent.change(screen.getByLabelText(/Orçamento da Campanha/i), { target: { value: '500' } });
      fireEvent.click(screen.getByText(/Gerar Diagnóstico/i));

      // 500 ÷ 1,5 × 0,03 = 10 (em ponto flutuante: 9,999…)
      expect(textoDaTela()).toContain('cerca de 10 oportunidades');
    });

    it('orçamento: R$ 600 com margem de R$ 60 pede 10 vendas, não 11', () => {
      render(<ViabilidadeView />);
      fireEvent.click(screen.getByText(/Tenho um orçamento/i).closest('button')!);
      preencherBase('64,35', '4,35', '1', '10');
      fireEvent.change(screen.getByLabelText(/Orçamento da Campanha/i), { target: { value: '600' } });
      fireEvent.click(screen.getByText(/Gerar Diagnóstico/i));

      // 64,35 − 4,35 = 60 (em ponto flutuante: 59,999…), e 600 ÷ 60 = 10
      expect(textoDaTela()).toContain('transformar 10 dessas oportunidades');
    });

    it('orçamento: R$ 110 a R$ 1,10 por clique dá 100 cliques', () => {
      render(<ViabilidadeView />);
      fireEvent.click(screen.getByText(/Tenho um orçamento/i).closest('button')!);
      preencherBase('300', '60', '1,10', '10');
      fireEvent.change(screen.getByLabelText(/Orçamento da Campanha/i), { target: { value: '110' } });
      fireEvent.click(screen.getByText(/Gerar Diagnóstico/i));

      // 110 ÷ 1,1 = 100 (em ponto flutuante: 99,999…)
      expect(screen.getByText('Visitantes').nextElementSibling).toHaveTextContent(/^100$/);
    });

    it('meta: 5 clientes a R$ 2 por clique, 5% de conversão e 20% de fechamento dão 500 cliques e 25 oportunidades', () => {
      render(<ViabilidadeView />);
      fireEvent.click(screen.getByText(/Tenho uma meta/i).closest('button')!);
      preencherBase('300', '60', '2', '5');
      fireEvent.change(screen.getByLabelText(/Meta de Clientes/i), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/Taxa de Fechamento \(Vendas\)/i), { target: { value: '20' } });
      fireEvent.click(screen.getByText(/Gerar Diagnóstico/i));

      // 5 × 2 ÷ (0,05 × 0,2) = 1.000; 1.000 ÷ 2 = 500 cliques; 500 × 0,05 = 25
      expect(textoDaTela()).toContain('aproximadamente 25 oportunidades');
      expect(screen.getByText('Visitantes').nextElementSibling).toHaveTextContent(/^500$/);
    });
  });

  it('põe um anúncio entre a ferramenta e o guia e outro depois do guia', () => {
    render(<ViabilidadeView><p>GUIA-TESTE</p></ViabilidadeView>);

    const titulo = screen.getByRole('heading', { level: 1 });
    const pergunta = screen.getByText('O QUE VOCÊ DESEJA DESCOBRIR?');
    const ultimaOpcao = screen.getByText(/Tenho uma meta/i);
    const guia = screen.getByText('GUIA-TESTE');
    const anuncios = anunciosNaTela();

    expect(anuncios).toHaveLength(2);
    const [meio, fim] = anuncios;
    expect(meio).toHaveAttribute('data-ad-slot', '1270666901');
    expect(fim).toHaveAttribute('data-ad-slot', '7715444307');
    expect(vemDepois(titulo, meio)).toBe(true);
    expect(vemDepois(pergunta, meio)).toBe(true);
    expect(vemDepois(ultimaOpcao, meio)).toBe(true);
    expect(vemDepois(meio, guia)).toBe(true);
    expect(vemDepois(guia, fim)).toBe(true);
  });
});

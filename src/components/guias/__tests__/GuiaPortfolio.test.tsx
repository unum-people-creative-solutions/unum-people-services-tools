import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GuiaPortfolio, EXEMPLO_PORTFOLIO } from '../GuiaPortfolio';
import PortfolioView from '../../../app/portfolio-analises/PortfolioView';
import { quadranteDe } from '../../ServiceCharts';
import type { Service } from '../../../types';

const TOPICOS = [
  'Para que serve',
  'Como a conta é feita',
  'Exemplo com números',
  'Como ler o resultado',
  'Erros comuns',
  'Perguntas frequentes',
  'Aviso',
  'Quem fez',
];

const textoDe = (el: Element) => (el.textContent ?? '').replace(/ /g, ' ');
const contarPalavras = (el: Element) => textoDe(el).split(/\s+/).filter(Boolean).length;

describe('GuiaPortfolio', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tem um título e os oito tópicos, na ordem', () => {
    render(<GuiaPortfolio />);
    expect(screen.getByRole('heading', { level: 2, name: /Guia do Mapeamento Estratégico de Portfólio/ })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(TOPICOS);
    expect(screen.getByRole('region', { name: /Guia do Mapeamento Estratégico de Portfólio/ }).tagName).toBe('SECTION');
  });

  it('tem pelo menos 600 palavras', () => {
    const { container } = render(<GuiaPortfolio />);
    expect(contarPalavras(container)).toBeGreaterThanOrEqual(600);
  });

  it('mostra no exemplo as notas, os quadrantes e a atratividade dos dois serviços', () => {
    render(<GuiaPortfolio />);
    const exemplo = textoDe(screen.getByRole('heading', { name: 'Exemplo com números' }).parentElement!);
    expect(exemplo).toContain('17%, 17%, 83% e 67%');
    expect(exemplo).toContain('Eficiente');
    expect(exemplo).toContain('Estrela');
    expect(exemplo).toContain('79,2%');
    expect(exemplo).toContain('83%, 83%, 17% e 50%');
    expect(exemplo).toContain('Crítico');
    expect(exemplo).toContain('Oportunidade');
    expect(exemplo).toContain('25%');
  });

  it('com as respostas do exemplo, a ferramenta real dá a mesma atratividade', () => {
    render(<PortfolioView />);
    act(() => {
      vi.runAllTimers();
    });

    for (const servico of EXEMPLO_PORTFOLIO.servicos) {
      fireEvent.click(screen.getByRole('button', { name: /novo serviço/i }));
      for (const eixo of ['esforco', 'complexidade', 'padronizacao', 'lucratividade'] as const) {
        const sim = screen.getAllByRole('button', { name: 'SIM' });
        sim.slice(0, servico.sim[eixo]).forEach((botao) => fireEvent.click(botao));
        fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
      }
      // Resumo do drawer antes de salvar: as notas que o guia cita
      expect(screen.getByText(`Esforço: ${servico.notas.esforco}%`)).toBeInTheDocument();
      expect(screen.getByText(`Complexidade: ${servico.notas.complexidade}%`)).toBeInTheDocument();
      expect(screen.getByText(`Padronização: ${servico.notas.padronizacao}%`)).toBeInTheDocument();
      expect(screen.getByText(`Lucratividade: ${servico.notas.lucratividade}%`)).toBeInTheDocument();
      fireEvent.change(screen.getByPlaceholderText(/Ex: Consultoria Técnica/i), { target: { value: servico.nome } });
      fireEvent.click(screen.getByRole('button', { name: /salvar serviço/i }));
    }

    // A ferramenta mostra a atratividade com uma casa decimal e ponto
    expect(screen.getAllByText('79.2%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('25.0%').length).toBeGreaterThan(0);

    // Quadrantes: as notas exatas que a ferramenta gravou, na regra dos gráficos
    const gravados: Service[] = JSON.parse(window.localStorage.getItem('portfolio_services') ?? '[]');
    for (const servico of EXEMPLO_PORTFOLIO.servicos) {
      const s = gravados.find((g) => g.nome === servico.nome)!;
      expect(quadranteDe(s.esforco, s.complexidade, 'operacao')).toBe(servico.operacao);
      expect(quadranteDe(s.padronizacao, s.lucratividade, 'decisao')).toBe(servico.decisao);
    }
  });
});

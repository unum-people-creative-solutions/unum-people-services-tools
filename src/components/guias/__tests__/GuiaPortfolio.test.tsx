import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GuiaPortfolio, EXEMPLO_PORTFOLIO } from '../GuiaPortfolio';
import PortfolioView from '../../../app/portfolio-analises/PortfolioView';
import { quadranteDe } from '../../ServiceCharts';
import type { Service } from '../../../types';
import { regrasDoGuia, textoDe, topico } from './regras';

regrasDoGuia({
  nome: 'GuiaPortfolio',
  guia: () => <GuiaPortfolio />,
  titulo: 'Como descobrir quais serviços compensam',
  rotulosDoPasso: [
    'Adicionar serviço',
    'Dá muito trabalho?',
    'É difícil de fazer?',
    'Dá para repetir sempre igual?',
    'Dá lucro?',
    'Como se chama este serviço?',
    'Salvar serviço',
    'Nota geral',
    'Trabalho',
    'Retorno',
  ],
  selos: [
    'Leve e simples',
    'Pesado e difícil',
    'Difícil, mas rápido',
    'Pesado, mas simples',
    'Vender mais',
    'Padronizar',
    'Lucro baixo',
    'Repensar',
    'Nota geral',
    'Trabalho',
    'Retorno',
  ],
  perguntas: ['Meus dados ficam salvos?'],
});

// Lacuna 4 do Verifier da F4: os quatro títulos "Dá muito trabalho?" etc. são os títulos dos passos,
// não as seis perguntas de cada passo.
describe('GuiaPortfolio: o segundo passo descreve os passos da tela', () => {
  it('diz quatro passos, seis perguntas em cada um, e chama os títulos de títulos', () => {
    render(<GuiaPortfolio />);
    const itens = within(topico('Passo a passo')).getAllByRole('listitem');
    const passo2 = textoDe(itens[1]);
    expect(passo2).toMatch(/quatro passos/);
    expect(passo2).toMatch(/seis perguntas de “Sim” ou “Não” em cada um/);
    expect(passo2).toMatch(/títulos dos passos/);
    // os títulos não são apresentados como "as seis perguntas"
    expect(passo2).not.toMatch(/seis perguntas[^.]*“Dá muito trabalho\?”/);
  });
});

describe('GuiaPortfolio: exemplo e ferramenta real', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra no exemplo as notas, os quadrantes e a nota geral dos dois serviços', () => {
    render(<GuiaPortfolio />);
    const exemplo = textoDe(topico('Exemplo com números'));
    expect(exemplo).toContain('17%, 17%, 83% e 67%');
    expect(exemplo).toContain('Leve e simples');
    expect(exemplo).toContain('Vender mais');
    expect(exemplo).toContain('79,2');
    expect(exemplo).toContain('83%, 83%, 17% e 50%');
    expect(exemplo).toContain('Pesado e difícil');
    expect(exemplo).toContain('Padronizar');
    expect(exemplo).toContain('25,0');
  });

  it('com as respostas do exemplo, a ferramenta real dá a mesma nota geral, o mesmo trabalho e retorno', () => {
    render(<PortfolioView />);
    act(() => {
      vi.runAllTimers();
    });

    for (const servico of EXEMPLO_PORTFOLIO.servicos) {
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));
      for (const eixo of ['esforco', 'complexidade', 'padronizacao', 'lucratividade'] as const) {
        const sim = screen.getAllByRole('radio', { name: 'Sim' });
        sim.slice(0, servico.sim[eixo]).forEach((botao) => fireEvent.click(botao));
        fireEvent.click(screen.getByRole('button', { name: /próximo/i }));
      }
      // Resumo da gaveta antes de salvar: as notas que o guia cita
      expect(screen.getByText(`Esforço: ${servico.notas.esforco}%`)).toBeInTheDocument();
      expect(screen.getByText(`Dificuldade: ${servico.notas.complexidade}%`)).toBeInTheDocument();
      expect(screen.getByText(`Repetição: ${servico.notas.padronizacao}%`)).toBeInTheDocument();
      expect(screen.getByText(`Lucro: ${servico.notas.lucratividade}%`)).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: servico.nome } });
      fireEvent.click(screen.getByRole('button', { name: /salvar serviço/i }));
    }

    // A ferramenta mostra a "Nota geral" (0 a 100) com uma casa decimal e vírgula, e "Trabalho" e "Retorno" em %
    const item = (nome: string) => within(screen.getByRole('listitem', { name: nome }));
    for (const servico of EXEMPLO_PORTFOLIO.servicos) {
      expect(item(servico.nome).getByText('Nota geral').nextElementSibling).toHaveTextContent(servico.notaGeral);
      expect(item(servico.nome).getByText('Trabalho').nextElementSibling).toHaveTextContent(servico.trabalho);
      expect(item(servico.nome).getByText('Retorno').nextElementSibling).toHaveTextContent(servico.retorno);
    }

    // Quadrantes: as notas exatas que a ferramenta gravou, na regra dos gráficos
    const gravados: Service[] = JSON.parse(window.localStorage.getItem('portfolio_services') ?? '[]');
    for (const servico of EXEMPLO_PORTFOLIO.servicos) {
      const s = gravados.find((g) => g.nome === servico.nome)!;
      expect(quadranteDe(s.esforco, s.complexidade, 'operacao')).toBe(servico.trabalhoQuadrante);
      expect(quadranteDe(s.padronizacao, s.lucratividade, 'decisao')).toBe(servico.retornoQuadrante);
    }
  });
});

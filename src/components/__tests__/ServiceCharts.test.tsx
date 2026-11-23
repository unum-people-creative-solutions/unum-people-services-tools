import { render, screen, within, fireEvent } from '@testing-library/react';
import { ServiceCharts, quadranteDe } from '../ServiceCharts';
import { describe, it, expect, vi } from 'vitest';
import { Service } from '../../types';

vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '100%', height: '100%' }}>{children}</div>
    ),
  };
});

const servicos: Service[] = [
  { id: '1', nome: 'S1', esforco: 10, complexidade: 10, padronizacao: 10, lucratividade: 10 },
];

const grafico = (titulo: string) => screen.getByRole('region', { name: titulo });

describe('ServiceCharts', () => {
  it('mostra os dois gráficos com os nomes simples, como títulos (RF-F3b-02)', () => {
    render(<ServiceCharts services={servicos} highlightedId={null} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Quanto trabalho dá' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Quanto vale a pena' })).toBeInTheDocument();
    expect(screen.queryByText(/Matriz de/i)).not.toBeInTheDocument();
  });

  it('nomeia os eixos de cada gráfico', () => {
    render(<ServiceCharts services={servicos} highlightedId={null} />);
    const trabalho = within(grafico('Quanto trabalho dá'));
    expect(trabalho.getByText('Esforço')).toBeInTheDocument();
    expect(trabalho.getByText('Dificuldade')).toBeInTheDocument();
    const valePena = within(grafico('Quanto vale a pena'));
    expect(valePena.getByText('Repetição')).toBeInTheDocument();
    expect(valePena.getByText('Lucro')).toBeInTheDocument();
  });

  it('lista os quatro quadrantes de cada gráfico, com os nomes da spec', () => {
    render(<ServiceCharts services={servicos} highlightedId={null} />);
    const trabalho = within(grafico('Quanto trabalho dá'));
    for (const nome of ['Pesado e difícil', 'Difícil, mas rápido', 'Pesado, mas simples', 'Leve e simples']) {
      expect(trabalho.getByText(nome)).toBeInTheDocument();
    }
    const valePena = within(grafico('Quanto vale a pena'));
    for (const nome of ['Vender mais', 'Padronizar', 'Lucro baixo', 'Repensar']) {
      expect(valePena.getByText(nome)).toBeInTheDocument();
    }
  });

  it('deixa a explicação de cada gráfico visível embaixo dele, sem precisar passar o mouse', () => {
    render(<ServiceCharts services={servicos} highlightedId={null} />);
    for (const titulo of ['Quanto trabalho dá', 'Quanto vale a pena']) {
      const secao = grafico(titulo);
      const explicacao = within(secao).getByTestId('explicacao');
      expect(explicacao).toBeVisible();
      expect(explicacao.textContent?.length).toBeGreaterThan(40);
      // vem depois da área do gráfico
      const area = within(secao).getByTestId('area-do-grafico');
      expect(area.compareDocumentPosition(explicacao) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it('não esconde nada atrás do mouse (sem overlay nem ícone de informação)', () => {
    render(<ServiceCharts services={servicos} highlightedId={null} />);
    const antes = document.body.textContent;
    const secao = grafico('Quanto trabalho dá');
    fireEvent.mouseEnter(within(secao).getByRole('heading', { level: 2 }).parentElement!);
    expect(document.body.textContent).toBe(antes);
  });

  it('sem serviços, troca os gráficos vazios pelo estado vazio (RF-F3b-03)', () => {
    render(<ServiceCharts services={[]} highlightedId={null} />);
    expect(screen.getByText('Adicione o primeiro serviço para ver os gráficos.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Quanto trabalho dá' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Quanto vale a pena' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('area-do-grafico')).not.toBeInTheDocument();
  });

  it('com serviços, não mostra o estado vazio', () => {
    render(<ServiceCharts services={servicos} highlightedId={null} />);
    expect(screen.queryByText('Adicione o primeiro serviço para ver os gráficos.')).not.toBeInTheDocument();
  });
});

// Corte dos quadrantes: 50% ou mais conta como alto (guia do portfólio, RF-17)
describe('quadranteDe', () => {
  it.each([
    [50, 50, 'operacao', 'Pesado e difícil'],
    [49, 50, 'operacao', 'Difícil, mas rápido'],
    [50, 49, 'operacao', 'Pesado, mas simples'],
    [49, 49, 'operacao', 'Leve e simples'],
    [50, 50, 'decisao', 'Vender mais'],
    [49, 50, 'decisao', 'Padronizar'],
    [50, 49, 'decisao', 'Lucro baixo'],
    [49, 49, 'decisao', 'Repensar'],
  ] as const)('(%i, %i) no gráfico %s é %s', (x, y, grafico, esperado) => {
    expect(quadranteDe(x, y, grafico)).toBe(esperado);
  });
});

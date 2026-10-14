import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceCharts, quadranteDe } from '../ServiceCharts';
import { describe, it, expect, vi } from 'vitest';
import { Service } from '../../types';

// Mock ResponsiveContainer and other Recharts components if necessary
// But usually simple render test works if we just check for titles
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: '100%', height: '100%' }}>{children}</div>,
  };
});

const mockServices: Service[] = [
  { id: '1', nome: 'S1', esforco: 10, complexidade: 10, padronizacao: 10, lucratividade: 10 }
];

describe('ServiceCharts', () => {
  it('deve renderizar os títulos das matrizes', () => {
    render(<ServiceCharts services={mockServices} highlightedId={null} />);
    expect(screen.getByText(/Matriz de Operação/i)).toBeInTheDocument();
    expect(screen.getByText(/Matriz de Decisão/i)).toBeInTheDocument();
  });

  it('deve mostrar o overlay de informações ao passar o mouse no ícone', async () => {
    render(<ServiceCharts services={mockServices} highlightedId={null} />);
    
    const infoIcons = screen.getAllByRole('heading', { level: 3 });
    // The hover is on the parent div of the heading
    const container = infoIcons[0].parentElement!;
    
    fireEvent.mouseEnter(container);
    
    expect(screen.getByText(/Analisa o esforço vs complexidade técnica/i)).toBeInTheDocument();
    
    fireEvent.mouseLeave(container);
    expect(screen.queryByText(/Analisa o esforço vs complexidade técnica/i)).not.toBeInTheDocument();
  });
});

// Corte dos quadrantes: 50% ou mais conta como alto (guia do portfólio, RF-17)
describe('quadranteDe', () => {
  it.each([
    [50, 50, 'operacao', 'Crítico'],
    [49, 50, 'operacao', 'Especialista'],
    [50, 49, 'operacao', 'Operacional'],
    [49, 49, 'operacao', 'Eficiente'],
    [50, 50, 'decisao', 'Estrela'],
    [49, 50, 'decisao', 'Oportunidade'],
    [50, 49, 'decisao', 'Escala'],
    [49, 49, 'decisao', 'Revisar'],
  ] as const)('(%i, %i) na matriz %s é %s', (x, y, matriz, esperado) => {
    expect(quadranteDe(x, y, matriz)).toBe(esperado);
  });
});

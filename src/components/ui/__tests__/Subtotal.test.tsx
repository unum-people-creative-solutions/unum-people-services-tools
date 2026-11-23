import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Subtotal } from '../Subtotal';

describe('Subtotal', () => {
  it('mostra cada linha com rótulo e valor', () => {
    render(
      <Subtotal
        linhas={[
          { rotulo: 'Horas que você vende', valor: '140,8 h' },
          { rotulo: 'Conta fixa por hora', valor: 'R$ 31,25' },
        ]}
      />,
    );
    expect(screen.getByText('Horas que você vende')).toBeInTheDocument();
    expect(screen.getByText('140,8 h')).toBeInTheDocument();
    expect(screen.getByText('Conta fixa por hora')).toBeInTheDocument();
    expect(screen.getByText('R$ 31,25')).toBeInTheDocument();
  });

  it('liga cada rótulo ao seu valor (lista de definição)', () => {
    render(<Subtotal linhas={[{ rotulo: 'Total por mês', valor: 'R$ 4.400,00' }]} />);
    expect(screen.getByRole('term')).toHaveTextContent('Total por mês');
    expect(screen.getByRole('definition')).toHaveTextContent('R$ 4.400,00');
  });
});

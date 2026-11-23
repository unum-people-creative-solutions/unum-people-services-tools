import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Recolhivel } from '../Recolhivel';

describe('Recolhivel', () => {
  it('é um details fechado por padrão, com o título no summary', () => {
    render(<Recolhivel titulo="Como funciona esta conta"><p>guia</p></Recolhivel>);
    const grupo = screen.getByRole('group');
    expect(grupo.tagName).toBe('DETAILS');
    expect(grupo).not.toHaveAttribute('open');
    expect(screen.getByText('Como funciona esta conta').closest('summary')).not.toBeNull();
  });

  it('o conteúdo continua no HTML mesmo fechado (para o Google)', () => {
    render(<Recolhivel titulo="Guia"><p>texto do guia</p></Recolhivel>);
    expect(screen.getByText('texto do guia')).toBeInTheDocument();
  });

  it('abre quando aberto=true e passa a abrir se o valor muda para true', () => {
    const { rerender } = render(<Recolhivel titulo="Outras contas" aberto={false}><p>x</p></Recolhivel>);
    expect(screen.getByRole('group')).not.toHaveAttribute('open');
    rerender(<Recolhivel titulo="Outras contas" aberto><p>x</p></Recolhivel>);
    expect(screen.getByRole('group')).toHaveAttribute('open');
  });
});

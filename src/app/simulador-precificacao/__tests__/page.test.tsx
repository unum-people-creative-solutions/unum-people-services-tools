import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Page from '../page';

describe('página do Simulador de Precificação', () => {
  it('monta o simulador com o guia, mesmo antes de carregar os dados', () => {
    render(<Page />);
    expect(screen.getByText('Precificação e Margem')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Guia do Simulador de Precificação/ })).toBeInTheDocument();
  });
});

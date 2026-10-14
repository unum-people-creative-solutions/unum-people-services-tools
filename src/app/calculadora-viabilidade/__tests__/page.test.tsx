import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Page from '../page';

describe('página da Calculadora de Viabilidade', () => {
  it('monta a calculadora com o guia', () => {
    render(<Page />);
    expect(screen.getByText('O QUE VOCÊ DESEJA DESCOBRIR?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Guia da Calculadora de Viabilidade/ })).toBeInTheDocument();
  });
});

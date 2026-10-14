import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Page from '../page';

describe('página do Mapeamento de Portfólio', () => {
  it('monta a ferramenta com o guia, mesmo antes de carregar os dados', () => {
    render(<Page />);
    expect(screen.getByText('Mapeamento Estratégico')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Guia do Mapeamento Estratégico de Portfólio/ })).toBeInTheDocument();
  });
});

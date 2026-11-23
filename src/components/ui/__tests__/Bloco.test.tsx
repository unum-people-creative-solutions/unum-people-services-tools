import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Bloco } from '../Bloco';

describe('Bloco', () => {
  it('é uma região nomeada pelo título, com número, frase de apoio e conteúdo', () => {
    render(
      <Bloco numero={1} titulo="Contas fixas do mês" apoio="O que você paga todo mês, vendendo ou não.">
        <p>conteúdo</p>
      </Bloco>,
    );
    const regiao = screen.getByRole('region', { name: 'Contas fixas do mês' });
    expect(regiao).toContainElement(screen.getByRole('heading', { level: 2, name: 'Contas fixas do mês' }));
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('O que você paga todo mês, vendendo ou não.')).toBeInTheDocument();
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('sem número nem apoio, ainda mostra título e conteúdo', () => {
    render(<Bloco titulo="Sozinho"><p>x</p></Bloco>);
    expect(screen.getByRole('heading', { name: 'Sozinho' })).toBeInTheDocument();
  });
});

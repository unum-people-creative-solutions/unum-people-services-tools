import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Convite } from '../Convite';

describe('Convite', () => {
  it('é uma linha de texto com um link', () => {
    render(
      <Convite
        texto="Já sabe o seu preço?"
        link="Mostre numa página com botão de WhatsApp →"
        href="https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=quanto-cobrar"
      />,
    );
    expect(screen.getByText(/Já sabe o seu preço\?/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Mostre numa página com botão de WhatsApp →' });
    expect(link).toHaveAttribute(
      'href',
      'https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=quanto-cobrar',
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});

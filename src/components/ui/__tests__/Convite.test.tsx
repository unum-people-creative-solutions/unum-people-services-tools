import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

  it('avisa o clique no link pelo onClick opcional', () => {
    const aoClicar = vi.fn();
    render(<Convite texto="Vai anunciar?" link="Faça uma página →" href="https://unumpeople.app/" onClick={aoClicar} />);
    const link = screen.getByRole('link', { name: 'Faça uma página →' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it('sem onClick o link continua funcionando', () => {
    render(<Convite texto="Vai anunciar?" link="Faça uma página →" href="https://unumpeople.app/" />);
    expect(screen.getByRole('link', { name: 'Faça uma página →' })).toHaveAttribute('href', 'https://unumpeople.app/');
  });
});

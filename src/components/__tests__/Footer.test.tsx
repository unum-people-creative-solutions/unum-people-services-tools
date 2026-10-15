import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';
import { describe, it, expect, vi } from 'vitest';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('Footer', () => {
  it('deve renderizar o texto de direitos autorais', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 Unum People/i)).toBeInTheDocument();
  });

  it('mostra a logo texto à esquerda e só o símbolo à direita', () => {
    render(<Footer />);
    expect(screen.getByRole('img', { name: 'Unum People' })).toHaveAttribute('src', '/images/logo_texto.png');
    expect(screen.getByRole('img', { name: 'Símbolo Unum People' })).toHaveAttribute('src', '/images/logo_simbolo.png');
    expect(screen.queryByRole('heading', { name: 'Unum People' })).not.toBeInTheDocument();
  });

  it('deve conter links para a Unum People', () => {
    render(<Footer />);
    const links = screen.getAllByRole('link');
    const unumLink = links.find(link => link.getAttribute('href') === 'https://unumpeople.com.br/');
    expect(unumLink).toBeDefined();
  });

  it('liga as páginas institucionais', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Sobre' })).toHaveAttribute('href', 'https://unumpeople.com.br/sobre');
    expect(screen.getByRole('link', { name: 'Contato' })).toHaveAttribute('href', 'https://unumpeople.com.br/contato');
    expect(screen.getByRole('link', { name: 'Termos' })).toHaveAttribute('href', 'https://unumpeople.com.br/termos');
    expect(screen.getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacidade');
  });
});

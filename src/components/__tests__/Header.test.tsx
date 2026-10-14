import { render, screen, fireEvent, within } from '@testing-library/react';
import { Header } from '../Header';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const rota = vi.hoisted(() => ({ atual: '/' }));
vi.mock('next/navigation', () => ({
  usePathname: () => rota.atual,
}));

describe('Header', () => {
  beforeEach(() => {
    rota.atual = '/';
  });

  it('liga as três ferramentas em uma navegação própria', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation', { name: 'Ferramentas' });
    expect(within(nav).getByRole('link', { name: 'Portfólio' })).toHaveAttribute('href', '/portfolio-analises');
    expect(within(nav).getByRole('link', { name: 'Precificação' })).toHaveAttribute('href', '/simulador-precificacao');
    expect(within(nav).getByRole('link', { name: 'Viabilidade' })).toHaveAttribute('href', '/calculadora-viabilidade');
  });

  it('marca só a ferramenta da rota atual', () => {
    rota.atual = '/simulador-precificacao';
    render(<Header />);
    const nav = screen.getByRole('navigation', { name: 'Ferramentas' });
    expect(within(nav).getByRole('link', { name: 'Precificação' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Portfólio' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Viabilidade' })).not.toHaveAttribute('aria-current');
  });

  it('não marca nenhuma ferramenta fora delas', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation', { name: 'Ferramentas' });
    within(nav).getAllByRole('link').forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current');
    });
  });

  it('deve renderizar o nome da ferramenta se fornecido', () => {
    render(<Header toolName="Teste Tool" />);
    expect(screen.getByText('Teste Tool')).toBeInTheDocument();
  });

  it('deve chamar onOpenHelp quando o botão de ajuda for clicado', () => {
    const onOpenHelp = vi.fn();
    render(<Header onOpenHelp={onOpenHelp} />);
    
    const helpButton = screen.getByRole('button', { name: /ajuda/i });
    fireEvent.click(helpButton);
    
    expect(onOpenHelp).toHaveBeenCalledTimes(1);
  });
});

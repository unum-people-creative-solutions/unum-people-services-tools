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

  it.each([
    ['/portfolio-analises', 'Portfólio'],
    ['/simulador-precificacao', 'Precificação'],
    ['/calculadora-viabilidade', 'Viabilidade'],
  ])('em %s, marca só "%s"', (caminho, atual) => {
    rota.atual = caminho;
    render(<Header />);
    const nav = screen.getByRole('navigation', { name: 'Ferramentas' });
    const marcado = within(nav).getByRole('link', { name: atual });
    expect(marcado).toHaveAttribute('aria-current', 'page');
    within(nav)
      .getAllByRole('link')
      .filter((link) => link !== marcado)
      .forEach((link) => expect(link).not.toHaveAttribute('aria-current'));
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

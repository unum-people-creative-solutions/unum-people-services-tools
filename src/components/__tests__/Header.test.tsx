import { render, screen, within } from '@testing-library/react';
import { Header } from '../Header';
import { describe, it, expect } from 'vitest';

describe('Header (RF-F2-05 e RF-F2-07)', () => {
  it('mostra a marca "Unum People Tools" como link para a home', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    const marca = screen.getByRole('link', { name: 'Unum People Tools' });
    expect(banner).toContainElement(marca);
    expect(marca).toHaveAttribute('href', '/');
  });

  it('a marca leva o símbolo oficial como única imagem, decorativa', () => {
    render(<Header />);
    const marca = screen.getByRole('link', { name: 'Unum People Tools' });
    const imagens = marca.querySelectorAll('img');
    expect(imagens).toHaveLength(1);
    expect(decodeURIComponent(imagens[0].getAttribute('src') ?? '')).toContain('logo_simbolo.png');
    expect(imagens[0]).toHaveAttribute('alt', '');
    expect(imagens[0]).toHaveAttribute('aria-hidden', 'true');
  });

  it('não tem mais a barra de abas Portfólio / Precificação / Viabilidade', () => {
    render(<Header />);
    expect(screen.queryByRole('navigation', { name: 'Ferramentas' })).not.toBeInTheDocument();
    for (const aba of ['Portfólio', 'Precificação', 'Viabilidade']) {
      expect(screen.queryByRole('link', { name: aba })).not.toBeInTheDocument();
    }
  });

  it('na home e na privacidade não mostra "Todas as ferramentas"', () => {
    render(<Header />);
    expect(screen.queryByRole('link', { name: /Todas as ferramentas/ })).not.toBeInTheDocument();
  });

  it('nas páginas de ferramenta, mostra "Todas as ferramentas" levando para a home, depois do cabeçalho', () => {
    render(<Header ferramenta />);
    const link = screen.getByRole('link', { name: 'Todas as ferramentas' });
    expect(link).toHaveAttribute('href', '/');
    const banner = screen.getByRole('banner');
    expect(banner).not.toContainElement(link);
    expect(Boolean(banner.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });

  it('largura da ferramenta: sem a prop é "estreita" (render igual ao das outras ferramentas) e "larga" muda o contêiner do link', () => {
    const padrao = render(<Header ferramenta />).container.innerHTML;
    const estreita = render(<Header ferramenta larguraDaFerramenta="estreita" />).container.innerHTML;
    const larga = render(<Header ferramenta larguraDaFerramenta="larga" />);
    expect(estreita).toBe(padrao);
    expect(larga.container.innerHTML).not.toBe(padrao);
    // o link é o mesmo, só muda a largura do contêiner dele
    expect(within(larga.container).getByRole('link', { name: 'Todas as ferramentas' })).toHaveAttribute('href', '/');
  });

  it('não leva mais o botão Ajuda nem o nome da ferramenta (a ajuda mora no miolo da ferramenta)', () => {
    render(<Header ferramenta />);
    expect(screen.queryByRole('button', { name: /ajuda/i })).not.toBeInTheDocument();
  });
});

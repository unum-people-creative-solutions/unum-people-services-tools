import { render, screen, within } from '@testing-library/react';
import { Footer } from '../Footer';
import { describe, it, expect } from 'vitest';

describe('Footer (RF-F2-06)', () => {
  it('abre com o aviso de que os dados ficam no aparelho', () => {
    render(<Footer />);
    expect(screen.getByText('Seus dados ficam neste aparelho.')).toBeInTheDocument();
  });

  it('liga Privacidade, Sobre a Unum People, Contato e Termos, nesta ordem', () => {
    render(<Footer />);
    const nav = screen.getByRole('navigation', { name: 'Rodapé' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Privacidade', 'Sobre a Unum People', 'Contato', 'Termos']);
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/privacidade',
      'https://unumpeople.com.br/sobre',
      'https://unumpeople.com.br/contato',
      'https://unumpeople.com.br/termos',
    ]);
  });

  it('fecha com "© 2026 Unum People"', () => {
    render(<Footer />);
    expect(screen.getByText('© 2026 Unum People')).toBeInTheDocument();
  });

  it('a ordem é aviso, links, direitos autorais', () => {
    render(<Footer />);
    const aviso = screen.getByText('Seus dados ficam neste aparelho.');
    const nav = screen.getByRole('navigation', { name: 'Rodapé' });
    const direitos = screen.getByText('© 2026 Unum People');
    const depois = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(depois(aviso, nav)).toBe(true);
    expect(depois(nav, direitos)).toBe(true);
  });

  it('não tem mais o P2P nem as logos', () => {
    render(<Footer />);
    expect(screen.queryByText(/People to People/)).not.toBeInTheDocument();
    expect(screen.queryByText(/P2P/)).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

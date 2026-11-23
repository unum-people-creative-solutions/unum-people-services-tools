import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../page';
import PrivacyPage from '../privacidade/page';
import PortfolioPage from '../portfolio-analises/page';
import ViabilidadePage from '../calculadora-viabilidade/page';
import PrecificacaoPage from '../simulador-precificacao/page';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// CA-F2-02: cabeçalho e rodapé em todas as páginas (5)
const paginas = [
  ['home', Home, false],
  ['privacidade', PrivacyPage, false],
  ['Portfólio', PortfolioPage, true],
  ['Viabilidade', ViabilidadePage, true],
  ['Precificação', PrecificacaoPage, true],
] as const;

describe.each(paginas)('página %s', (_nome, Pagina, ehFerramenta) => {
  it('tem o cabeçalho com a marca ligada à home e sem as abas antigas', () => {
    render(<Pagina />);
    const banner = screen.getAllByRole('banner')[0];
    expect(within(banner).getByRole('link', { name: 'Unum People Tools' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('navigation', { name: 'Ferramentas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Portfólio' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Precificação' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Viabilidade' })).not.toBeInTheDocument();
  });

  it('tem o rodapé com os textos e links de RF-F2-06 e sem "P2P"', () => {
    render(<Pagina />);
    const rodape = screen.getByRole('contentinfo');
    expect(within(rodape).getByText('Seus dados ficam neste aparelho.')).toBeInTheDocument();
    expect(within(rodape).getByRole('link', { name: 'Privacidade' })).toHaveAttribute('href', '/privacidade');
    expect(within(rodape).getByRole('link', { name: 'Sobre a Unum People' })).toHaveAttribute('href', 'https://unumpeople.com.br/sobre');
    expect(within(rodape).getByRole('link', { name: 'Contato' })).toHaveAttribute('href', 'https://unumpeople.com.br/contato');
    expect(within(rodape).getByRole('link', { name: 'Termos' })).toHaveAttribute('href', 'https://unumpeople.com.br/termos');
    expect(within(rodape).getByText('© 2026 Unum People')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('P2P');
  });

  it(ehFerramenta ? 'mostra "Todas as ferramentas" para a home' : 'não mostra "Todas as ferramentas"', () => {
    render(<Pagina />);
    if (ehFerramenta) {
      expect(screen.getByRole('link', { name: 'Todas as ferramentas' })).toHaveAttribute('href', '/');
    } else {
      expect(screen.queryByRole('link', { name: 'Todas as ferramentas' })).not.toBeInTheDocument();
    }
  });
});

describe('ferramentas "Vale a pena anunciar?" e "Quais serviços compensam"', () => {
  // F3a: "Vale a pena anunciar?" não tem mais o botão Ajuda provisório (RF-F3a-02)
  it('Viabilidade não tem o botão Ajuda provisório', () => {
    render(<ViabilidadePage />);
    expect(screen.queryByRole('button', { name: 'Ajuda' })).not.toBeInTheDocument();
    expect(within(screen.getAllByRole('banner')[0]).queryByRole('button')).not.toBeInTheDocument();
  });

  // F3b: sai o botão "Ajuda" provisório (a ajuda fica sempre visível na tela)
  it('Portfólio não tem mais o botão Ajuda, nem no miolo nem no cabeçalho', () => {
    render(<PortfolioPage />);
    expect(screen.queryByRole('button', { name: 'Ajuda' })).not.toBeInTheDocument();
    expect(within(screen.getAllByRole('banner')[0]).queryByRole('button')).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import PrivacyPage from '../page';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/privacidade',
}));

describe('Política de Privacidade', () => {
  it('tem a seção de anúncios com o conteúdo obrigatório do AdSense', () => {
    render(<PrivacyPage />);

    const titulo = screen.getByRole('heading', { name: 'Anúncios e cookies' });
    const secao = titulo.closest('#anuncios');
    expect(secao).not.toBeNull();

    const texto = secao!.textContent ?? '';
    expect(texto).toMatch(/exibe anúncios do Google AdSense/i);
    expect(texto).toMatch(
      /fornecedores terceiros, incluindo o Google, usam cookies para exibir anúncios com base em visitas anteriores do usuário a este site ou a outros sites/i,
    );
    expect(texto).toMatch(
      /permite que o Google e os parceiros dele exibam anúncios para você com base nas suas visitas a este site e\/ou a outros sites na internet/i,
    );
    expect(texto).toMatch(/desativar a publicidade personalizada/i);
    expect(texto).toMatch(/outras redes de anúncios certificadas pelo Google/i);
  });

  it('liga as páginas de recusa e de explicação do Google', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('link', { name: 'Configurações de anúncios do Google' })).toHaveAttribute(
      'href',
      'https://adssettings.google.com',
    );
    expect(screen.getByRole('link', { name: 'www.aboutads.info' })).toHaveAttribute(
      'href',
      'https://www.aboutads.info',
    );
    expect(screen.getByRole('link', { name: 'Como o Google usa cookies em publicidade' })).toHaveAttribute(
      'href',
      'https://policies.google.com/technologies/ads',
    );
    expect(screen.getByRole('link', { name: 'lista de redes certificadas' })).toHaveAttribute(
      'href',
      'https://support.google.com/adsense/answer/94149',
    );
  });

  it('mostra a data da nova versão', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('Última atualização: Outubro de 2026')).toBeInTheDocument();
  });
});

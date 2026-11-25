import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home, { metadata } from '../page';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Home: Gerador de QR code (RF-QR-03)', () => {
  it('tem a seção "Vender no WhatsApp" antes de "Contas do negócio"', () => {
    render(<Home />);
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(titulos.indexOf('Vender no WhatsApp')).toBeGreaterThanOrEqual(0);
    expect(titulos.indexOf('Vender no WhatsApp')).toBeLessThan(titulos.indexOf('Contas do negócio'));
  });

  it('a seção traz o cartão do gerador, com a frase e o link', () => {
    render(<Home />);
    const secao = screen.getByRole('region', { name: 'Vender no WhatsApp' });
    const links = within(secao).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/gerador-qr-code');
    expect(links[0]).toHaveTextContent('Gerador de QR code');
    expect(links[0]).toHaveTextContent('Crie o QR do seu Pix, WhatsApp, Instagram ou Wi-Fi. Grátis e não expira.');
  });

  it('a descrição da home cita o QR code', () => {
    expect(metadata.description).toBe(
      'Ferramentas grátis para MEI e pequenos negócios: QR code, quanto cobrar, se vale a pena anunciar e quais serviços compensam. Sem cadastro.',
    );
  });
});

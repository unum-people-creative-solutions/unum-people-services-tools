import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from '../page';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Home: Gerador de link do WhatsApp (RF-LW-03)', () => {
  it('"Vender no WhatsApp" traz o cartão do link depois do QR code, com a frase e o link', () => {
    render(<Home />);
    const secao = screen.getByRole('region', { name: 'Vender no WhatsApp' });
    const links = within(secao).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/gerador-qr-code', '/gerador-link-whatsapp']);
    expect(links[1]).toHaveTextContent('Link do WhatsApp com mensagem');
    expect(links[1]).toHaveTextContent(
      'Crie o link para o cliente te chamar com a mensagem já escrita. Grátis e não expira.',
    );
  });

  it('o cartão é um link só, com o nome acessível do cartão inteiro', () => {
    render(<Home />);
    expect(
      screen.getByRole('link', {
        name: /Link do WhatsApp com mensagem.*Crie o link para o cliente te chamar com a mensagem já escrita\. Grátis e não expira\./,
      }),
    ).toHaveAttribute('href', '/gerador-link-whatsapp');
  });
});

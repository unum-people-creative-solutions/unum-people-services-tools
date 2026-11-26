import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Page, { metadata } from '../page';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('página do Gerador de link do WhatsApp (RF-LW-01, RF-LW-02)', () => {
  it('usa o título e a descrição da spec, sem repetir o sufixo do site', () => {
    expect(metadata.title).toEqual({
      absolute: 'Gerador de link do WhatsApp com mensagem, grátis | Unum People Tools',
    });
    expect(metadata.description).toBe(
      'Crie grátis o link do seu WhatsApp com a mensagem já escrita. Não expira, sem cadastro e sem anúncio. Com QR code e prévia da conversa.',
    );
  });

  it('mostra o h1 e a frase do topo', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: 'Gerador de link do WhatsApp' })).toBeInTheDocument();
    expect(
      screen.getByText('Com a mensagem já escrita. O link é do próprio WhatsApp: não expira. Sem cadastro e sem anúncio.'),
    ).toBeInTheDocument();
  });

  it('tem o cabeçalho de ferramenta (volta para todas as ferramentas) e o rodapé', () => {
    render(<Page />);
    expect(screen.getByRole('link', { name: /Todas as ferramentas/ })).toHaveAttribute('href', '/');
    expect(screen.getByText('Seus dados ficam neste aparelho.')).toBeInTheDocument();
  });

  it('tem os dois blocos numerados', () => {
    render(<Page />);
    expect(screen.getByRole('region', { name: 'Seu número do WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'O que o cliente vai mandar' })).toBeInTheDocument();
  });
});

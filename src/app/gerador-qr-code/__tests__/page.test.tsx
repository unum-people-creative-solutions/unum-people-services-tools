import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Page, { metadata } from '../page';
import { metadata as metadataDoLayout } from '../layout';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const TITULO = 'Gerador de QR Code grátis: Pix, WhatsApp, Instagram e Wi-Fi | Unum People Tools';
const DESCRICAO =
  'Crie grátis o QR code do seu Pix, WhatsApp, Instagram, Wi-Fi e mais. Nunca expira, sem cadastro e sem anúncio. Pronto no celular.';

describe('página do Gerador de QR code (RF-QR-01, RF-QR-02)', () => {
  it('usa o título e a descrição da spec, sem repetir o sufixo do site', () => {
    expect(metadata.title).toEqual({ absolute: TITULO });
    expect(metadata.description).toBe(DESCRICAO);
  });

  it('o layout da rota não contradiz a página', () => {
    expect(metadataDoLayout.title).toEqual({ absolute: TITULO });
    expect(metadataDoLayout.description).toBe(DESCRICAO);
  });

  it('mostra o h1 e a frase da faixa do topo', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: 'Gerador de QR code grátis' })).toBeInTheDocument();
    expect(
      screen.getByText('Nunca expira. Sem cadastro e sem anúncio. Fica pronto aqui no seu celular.'),
    ).toBeInTheDocument();
  });

  it('tem o cabeçalho de ferramenta (volta para todas as ferramentas) e o rodapé', () => {
    render(<Page />);
    expect(screen.getByRole('link', { name: /Todas as ferramentas/ })).toHaveAttribute('href', '/');
    expect(screen.getByText('Seus dados ficam neste aparelho.')).toBeInTheDocument();
  });
});

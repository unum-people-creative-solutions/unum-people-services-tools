import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Page from '../page';
import { desligarMedicao, enviados, ligarMedicao } from '@/test/medicao';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const abrir = (titulo: string) => {
  const detalhes = screen.getByText(titulo).closest('details') as HTMLDetailsElement;
  detalhes.setAttribute('open', '');
  fireEvent(detalhes, new Event('toggle'));
};

describe('Guia e convite do Gerador de QR code (RF-QR-30, RF-QR-31)', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;

  beforeEach(() => {
    window.localStorage.clear();
    sendBeacon = ligarMedicao();
  });
  afterEach(() => {
    desligarMedicao();
    vi.restoreAllMocks();
  });

  it('a página traz o guia num recolhível fechado', () => {
    render(<Page />);
    const detalhes = screen.getByText('Como usar o seu QR code').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    expect(detalhes).toHaveTextContent('Como usar o QR code no seu negócio');
    expect(detalhes).toHaveTextContent('Onde colocar o QR code');
  });

  it('abrir o guia marca "guia" uma vez', () => {
    render(<Page />);
    abrir('Como usar o seu QR code');
    abrir('Como usar o seu QR code');
    expect(enviados(sendBeacon).filter((e) => e.e === 'guia')).toEqual([{ f: 'qr-code', e: 'guia' }]);
  });

  it('o convite tem o texto e o link da spec, com o mesmo destino das outras ferramentas', () => {
    render(<Page />);
    expect(
      screen.getByText(/Ainda não tem uma página do seu negócio\? Crie a sua e coloque o link no QR code\./),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar minha página' })).toHaveAttribute(
      'href',
      'https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=qr-code',
    );
  });

  it('clicar no convite marca "convite" uma vez só', () => {
    render(<Page />);
    const link = screen.getByRole('link', { name: 'Criar minha página' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    fireEvent.click(link);
    expect(enviados(sendBeacon).filter((e) => e.e === 'convite')).toEqual([{ f: 'qr-code', e: 'convite' }]);
  });
});

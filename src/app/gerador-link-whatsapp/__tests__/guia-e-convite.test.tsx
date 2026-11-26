import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Page from '../page';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

beforeEach(() => {
  window.localStorage.clear();
});

describe('Guia e convite do Gerador de link do WhatsApp (RF-LW-23, RF-LW-24)', () => {
  it('a página traz o guia num recolhível fechado', () => {
    render(<Page />);
    const detalhes = screen.getByText('Como usar o seu link').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    expect(detalhes).toHaveTextContent('Como usar o link do WhatsApp no seu negócio');
    expect(detalhes).toHaveTextContent('Mensagem que funciona');
    expect(detalhes).toHaveTextContent('O link expira?');
  });

  it('o h2 do guia e as 4 perguntas estão na página', () => {
    render(<Page />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Como usar o link do WhatsApp no seu negócio' }),
    ).toBeInTheDocument();
    for (const pergunta of ['O link expira?', 'Por que o link não é curto?', 'E se eu trocar de número?', 'Precisa de cadastro?']) {
      expect(screen.getByText(pergunta)).toBeInTheDocument();
    }
  });

  it('o convite tem o texto e o link da spec, com o mesmo destino das outras ferramentas', () => {
    render(<Page />);
    expect(
      screen.getByText(/Quer uma página com o seu WhatsApp, os serviços e o endereço\? Crie a sua\./),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar minha página' })).toHaveAttribute(
      'href',
      'https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=link-whatsapp',
    );
  });
});

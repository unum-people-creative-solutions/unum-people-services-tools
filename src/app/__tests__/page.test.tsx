import { render, screen } from '@testing-library/react';
import Home from '../page';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Home', () => {
  it('não exibe anúncio (tela de navegação)', () => {
    const { container } = render(<Home />);
    expect(container.querySelectorAll('ins')).toHaveLength(0);
    expect(screen.queryByText(/AdSense|Publicidade/i)).not.toBeInTheDocument();
  });

  it('não exibe ferramenta "Em breve"', () => {
    render(<Home />);
    expect(screen.queryByText(/Em breve/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Mapeador de Benchmark de Aquisição')).not.toBeInTheDocument();
  });

  it('apresenta para quem são as ferramentas e quem as faz', () => {
    render(<Home />);
    expect(screen.getByText(/profissionais autônomos e pequenos negócios de serviço/i)).toBeInTheDocument();
    expect(screen.getByText(/Quem faz é a Unum People/)).toBeInTheDocument();
    expect(screen.getByText(/ficam no seu navegador/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Conheça a Unum People' })).toHaveAttribute(
      'href',
      'https://unumpeople.com.br/sobre',
    );
  });
});

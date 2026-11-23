import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Home from '../page';
import { desligarMedicao, enviados, ligarMedicao } from '../../test/medicao';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Home — medição de uso', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;

  beforeEach(() => {
    sendBeacon = ligarMedicao();
  });
  afterEach(() => {
    desligarMedicao();
    vi.restoreAllMocks();
  });

  it('marca a visita da home uma vez, mesmo re-renderizando', () => {
    const { rerender } = render(<Home />);
    rerender(<Home />);
    expect(enviados(sendBeacon)).toEqual([{ f: 'home', e: 'visita' }]);
  });

  it('marca "convite" no clique do link, uma vez só', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: 'Faça uma página com o seu WhatsApp →' });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    fireEvent.click(link);
    expect(enviados(sendBeacon)).toEqual([
      { f: 'home', e: 'visita' },
      { f: 'home', e: 'convite' },
    ]);
  });

  it('clicar nas ferramentas não marca nada além da visita', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: /Quanto cobrar pelo serviço/ });
    link.addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(link);
    expect(enviados(sendBeacon)).toEqual([{ f: 'home', e: 'visita' }]);
  });

  it('sem NEXT_PUBLIC_TOOLS_USO_URL nada é enviado', () => {
    vi.stubEnv('NEXT_PUBLIC_TOOLS_USO_URL', '');
    render(<Home />);
    fireEvent.click(screen.getByRole('link', { name: 'Faça uma página com o seu WhatsApp →' }));
    expect(sendBeacon).not.toHaveBeenCalled();
  });
});

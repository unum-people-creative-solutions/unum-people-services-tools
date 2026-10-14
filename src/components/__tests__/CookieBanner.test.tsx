import { render, screen, fireEvent, act } from '@testing-library/react';
import { CookieBanner } from '../CookieBanner';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CookieBanner', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  it('deve aparecer após o timer quando não há consentimento no localStorage', async () => {
    render(<CookieBanner />);
    
    // Inicialmente não deve estar visível (timer de 1500ms)
    expect(screen.queryByText(/utilizamos cookies/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText(/utilizamos cookies/i)).toBeInTheDocument();
  });

  it('não deve aparecer se o usuário já aceitou', () => {
    window.localStorage.setItem('unum_cookie_consent', 'true');
    render(<CookieBanner />);
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByText(/utilizamos cookies/i)).not.toBeInTheDocument();
  });

  it('deve desaparecer e salvar no localStorage ao clicar em aceitar', () => {
    render(<CookieBanner />);
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    const acceptButton = screen.getByRole('button', { name: /aceitar e continuar/i });
    fireEvent.click(acceptButton);

    expect(screen.queryByText(/utilizamos cookies/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem('unum_cookie_consent')).toBe('true');
  });

  it('cita os anúncios do Google e leva à seção de anúncios da política', () => {
    render(<CookieBanner />);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText(/anúncios do Google/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute(
      'href',
      '/privacidade#anuncios',
    );
  });
});

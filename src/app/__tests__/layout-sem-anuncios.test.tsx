import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RootLayout, { metadata } from '../layout';

vi.mock('next/font/google', () => ({
  Poppins: () => ({ variable: 'font-poppins' }),
}));

describe('layout sem anúncios', () => {
  it('não declara a conta do AdSense nos metadados', () => {
    expect(JSON.stringify(metadata)).not.toMatch(/adsense|ca-pub-/i);
    expect(metadata.other ?? {}).not.toHaveProperty('google-adsense-account');
  });

  it('não carrega script de anúncio nem tem bloco de anúncio', () => {
    const html = renderToStaticMarkup(<RootLayout>{null}</RootLayout>);
    expect(html).not.toMatch(/adsbygoogle|googlesyndication|ca-pub-|google-adsense-account/i);
  });

  describe('aviso de cookies', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      window.localStorage.clear();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('não aparece, mesmo sem consentimento gravado e depois de 5 s', () => {
      render(<RootLayout><p>CONTEUDO</p></RootLayout>, { container: document.documentElement });
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('CONTEUDO')).toBeInTheDocument();
      expect(screen.queryByText(/Privacidade e Cookies/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Aceitar e Continuar/i })).not.toBeInTheDocument();
    });
  });
});

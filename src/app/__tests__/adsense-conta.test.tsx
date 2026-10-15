import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout, { metadata } from '../layout';
import { AdUnit } from '../../components/AdUnit';

vi.mock('next/font/google', () => ({
  Poppins: () => ({ variable: 'font-poppins' }),
}));

// Conta do AdSense da empresa (pessoa jurídica), criada em 2026-10-15 no lugar
// da conta de pessoa física, que não podia mudar de tipo.
const PUBLISHER = 'pub-6348382549206741';

describe('conta do AdSense', () => {
  it('a meta tag de verificação aponta para a conta da empresa', () => {
    expect(metadata.other).toEqual({ 'google-adsense-account': `ca-${PUBLISHER}` });
  });

  it('o script do AdSense carrega com a conta da empresa', () => {
    const html = renderToStaticMarkup(<RootLayout>{null}</RootLayout>);
    const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]*adsbygoogle\.js[^"]*)"/g)].map((m) => m[1]);
    expect(srcs).toEqual([
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${PUBLISHER}`,
    ]);
  });

  it('o bloco de anúncio usa a conta da empresa', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { container } = render(<AdUnit slot="789012" />);
    expect(container.querySelector('ins.adsbygoogle')).toHaveAttribute('data-ad-client', `ca-${PUBLISHER}`);

    vi.unstubAllEnvs();
  });

  it('o ads.txt autoriza só a conta da empresa', () => {
    const adsTxt = readFileSync(path.resolve(__dirname, '../../../public/ads.txt'), 'utf-8');
    expect(adsTxt.trim().split('\n')).toEqual([`google.com, ${PUBLISHER}, DIRECT, f08c47fec0942fa0`]);
  });
});

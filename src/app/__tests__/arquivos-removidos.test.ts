import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const raiz = path.resolve(__dirname, '../../..');

describe('arquivos de anúncio e de aviso de cookies', () => {
  it.each([
    'public/ads.txt',
    'scripts/verificar-adsense.sh',
    'src/components/AdUnit.tsx',
    'src/components/CookieBanner.tsx',
  ])('%s não existe mais', (arquivo) => {
    expect(existsSync(path.join(raiz, arquivo))).toBe(false);
  });
});

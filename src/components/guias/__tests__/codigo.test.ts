import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const RAIZ = path.resolve(__dirname, '../../../..');

const arquivos = (pasta: string): string[] =>
  readdirSync(pasta).flatMap((nome) => {
    const caminho = path.join(pasta, nome);
    if (nome === '__tests__' || nome === 'node_modules') return [];
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });

describe('código dos guias e do sitemap', () => {
  it('CA-F4-07: sem data-guia nem AdSense nos componentes e nas páginas', () => {
    for (const arquivo of [...arquivos(path.join(RAIZ, 'src/components')), ...arquivos(path.join(RAIZ, 'src/app'))]) {
      const fonte = readFileSync(arquivo, 'utf8');
      expect(fonte, arquivo).not.toMatch(/data-guia/);
      expect(fonte, arquivo).not.toMatch(/adsense/i);
    }
  });

  it('RF-F4-10: o componente QuemFez saiu', () => {
    for (const arquivo of arquivos(path.join(RAIZ, 'src/components/guias'))) {
      expect(readFileSync(arquivo, 'utf8'), arquivo).not.toMatch(/QuemFez/);
    }
  });

  it('RF-F4-09: o visual dos guias usa os tokens ui-*, sem font-black nem brand-* antigos', () => {
    const fonte = readFileSync(path.join(RAIZ, 'src/components/guias/Guia.tsx'), 'utf8');
    expect(fonte).toMatch(/text-ui-ink/);
    expect(fonte).not.toMatch(/font-black/);
    expect(fonte).not.toMatch(/(?<!ui-)brand-/);
  });

  it('RF-F4-11: o sitemap traz lastmod de 23/11/2026 na home e nas três ferramentas', () => {
    const sitemap = readFileSync(path.join(RAIZ, 'public/sitemap.xml'), 'utf8');
    // a privacidade também mudou em 23/11 (F1)
    for (const caminho of ['', 'calculadora-viabilidade', 'simulador-precificacao', 'portfolio-analises', 'privacidade']) {
      const url = new RegExp(
        `<loc>https://tools\\.unumpeople\\.com\\.br/${caminho}</loc>\\s*<lastmod>2026-11-23</lastmod>`,
      );
      expect(sitemap, caminho || 'home').toMatch(url);
    }
  });
});

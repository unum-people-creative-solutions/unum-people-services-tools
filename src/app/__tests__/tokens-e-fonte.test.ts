import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';

const poppinsMock = vi.hoisted(() => vi.fn(() => ({ variable: 'font-poppins' })));
vi.mock('next/font/google', () => ({ Poppins: poppinsMock }));

const css = readFileSync(resolve(__dirname, '../globals.css'), 'utf8');

// valor declarado de `--nome: valor;` (primeira ocorrência), em minúsculas
const token = (nome: string) => {
  const m = css.match(new RegExp(`${nome}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim().toLowerCase() : undefined;
};

describe('tokens (RF-F2-01)', () => {
  it.each([
    ['--ui-bg', '#ffffff'],
    ['--ui-surface', '#f7f8fc'],
    ['--ui-canvas', '#0a0b1a'],
    ['--ui-ink', '#14142b'],
    ['--ui-muted', '#63668a'],
    ['--ui-muted-on-canvas', '#a9adcb'],
    ['--ui-line', '#e4e5ef'],
    ['--ui-line-strong', '#8a8db0'],
    ['--ui-brand-blue', '#0a1c82'],
    ['--ui-brand-purple', '#6b00d7'],
    ['--ui-brand-orange', '#ff3d00'],
    ['--ui-ok', '#0b6b3a'],
    ['--ui-ok-bg', '#e9f6ef'],
    ['--ui-atencao', '#8a5a00'],
    ['--ui-atencao-bg', '#fff4dc'],
    ['--ui-erro', '#b42318'],
    ['--ui-erro-bg', '#fdecea'],
  ])('%s vale %s', (nome, valor) => {
    expect(token(nome)).toBe(valor);
  });

  it('mantém os tokens brand-* das telas que só mudam na F3', () => {
    expect(token('--brand-blue')).toBe('#0a1c82');
    expect(token('--brand-purple')).toBe('#6b00d7');
    expect(token('--brand-orange')).toBe('#ff3d00');
    expect(token('--brand-grey')).toBe('#6e7191');
    expect(css).toContain('--color-brand-blue');
  });

  it('expõe os tokens ui ao Tailwind (@theme)', () => {
    const tema = css.slice(css.indexOf('@theme'));
    for (const nome of ['ui-canvas', 'ui-ink', 'ui-muted', 'ui-line-strong', 'ui-brand-blue', 'ui-ok', 'ui-erro-bg']) {
      expect(tema).toContain(`--color-${nome}`);
    }
  });
});

describe('fonte (RF-F2-02)', () => {
  it('carrega a Poppins nos pesos 400, 500, 600 e 700', async () => {
    await import('../layout');
    expect(poppinsMock).toHaveBeenCalled();
    const config = (poppinsMock.mock.calls as unknown as Array<[{ weight: string[] }]>)[0][0];
    expect([...config.weight].sort()).toEqual(['400', '500', '600', '700']);
  });
});

// Conferência visual da F2 (23/11/2026): com a variável da Poppins só no <body>,
// o `--font-sans: var(--font-poppins)` do Tailwind (definido em :root) não resolvia
// e a página caía na fonte do sistema. A variável precisa estar no <html>.
describe('Poppins aplicada de fato (RF-F2-02)', () => {
  it('a variável da fonte fica no <html>, onde o --font-sans do tema é resolvido', () => {
    const layout = readFileSync(resolve(__dirname, '../layout.tsx'), 'utf8');
    const html = layout.match(/<html[^>]*>/)?.[0] ?? '';
    expect(html).toContain('poppins.variable');
  });
});

import { describe, it, expect } from 'vitest';
import { lerQr } from '@/test/qr';
import { criarMatriz } from '../matriz';
import { CORES_DO_QR, contrasteComBranco, svgDoQr } from '../desenho';

const TEXTO = 'https://www.seunegocio.com.br/cardapio';

/** Lê o `d` do único <path> de módulos e devolve os retângulos "M x y h n v1 h-n z". */
function retangulosDoPath(svg: string): { x: number; y: number; n: number }[] {
  const paths = [...svg.matchAll(/<path [^>]*\bd="([^"]*)"/g)];
  expect(paths).toHaveLength(1);
  return [...paths[0][1].matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    n: Number(m[3]),
  }));
}

describe('svgDoQr (T09)', () => {
  const matriz = criarMatriz(TEXTO, { comLogo: false });
  const N = matriz.tamanho;

  it('tem margem de 4 módulos: viewBox maior em 8 e nenhum módulo na margem', () => {
    const svg = svgDoQr(matriz, { cor: '#000000' });
    expect(svg).toContain(`viewBox="0 0 ${N + 8} ${N + 8}"`);
    const retangulos = retangulosDoPath(svg);
    expect(Math.min(...retangulos.map((r) => r.x))).toBe(4);
    expect(Math.min(...retangulos.map((r) => r.y))).toBe(4);
    expect(Math.max(...retangulos.map((r) => r.x + r.n))).toBe(N + 4);
    expect(Math.max(...retangulos.map((r) => r.y))).toBe(N + 3);
  });

  it('tem fundo branco e os módulos na cor pedida, num path só', () => {
    const svg = svgDoQr(matriz, { cor: '#0a1c82' });
    expect(svg).toMatch(/<rect [^>]*fill="#ffffff"/);
    expect(svg).toMatch(/<path [^>]*fill="#0a1c82"/);
    expect(svg).not.toContain('#000000');
  });

  it('os módulos do SVG são exatamente os da matriz, e o QR desenhado é lido', () => {
    const svg = svgDoQr(matriz, { cor: '#000000' });
    const escuros = new Set<string>();
    for (const { x, y, n } of retangulosDoPath(svg)) {
      for (let i = 0; i < n; i++) escuros.add(`${y - 4},${x - 4 + i}`);
    }
    const esperados = new Set<string>();
    for (let l = 0; l < N; l++) for (let c = 0; c < N; c++) if (matriz.escuro(l, c)) esperados.add(`${l},${c}`);
    expect(escuros).toEqual(esperados);
    expect(lerQr({ tamanho: N, escuro: (l, c) => escuros.has(`${l},${c}`) })).toBe(TEXTO);
  });

  it('com frase, o texto aparece embaixo, centralizado e na cor do QR; a altura cresce', () => {
    const svg = svgDoQr(matriz, { cor: '#4b0f9e', frase: 'Pague com Pix' });
    expect(svg).toMatch(/<text [^>]*text-anchor="middle"[^>]*fill="#4b0f9e"[^>]*>Pague com Pix<\/text>/);
    const altura = Number(/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(svg)?.[1]);
    expect(altura).toBeGreaterThan(N + 8);
    const y = Number(/<text [^>]*\by="([\d.]+)"/.exec(svg)?.[1]);
    expect(y).toBeGreaterThan(N + 8 - 1);
    expect(y).toBeLessThan(altura);
  });

  it('sem frase não há <text>, e frase só com espaços também não', () => {
    expect(svgDoQr(matriz, { cor: '#000000' })).not.toContain('<text');
    expect(svgDoQr(matriz, { cor: '#000000', frase: '   ' })).not.toContain('<text');
  });

  it('escapa caracteres especiais da frase', () => {
    const svg = svgDoQr(matriz, { cor: '#000000', frase: 'Café & Cia <b>"oi"</b>' });
    expect(svg).toContain('Café &amp; Cia &lt;b&gt;&quot;oi&quot;&lt;/b&gt;');
    expect(svg).not.toContain('<b>');
  });

  it('com logo, põe um quadrado branco de 22% + 1 módulo no centro e a <image> dentro dele', () => {
    const logo = 'data:image/png;base64,iVBORw0KGgo=';
    const m = criarMatriz(TEXTO, { comLogo: true });
    const svg = svgDoQr(m, { cor: '#000000', logo });
    const caixa = 0.22 * m.tamanho + 1;
    const centro = (m.tamanho + 8) / 2;

    const rect = /<rect data-logo-fundo="" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#ffffff"\/>/.exec(svg);
    expect(rect).not.toBeNull();
    const [x, y, w, h] = rect!.slice(1).map(Number);
    expect(w).toBeCloseTo(caixa, 2);
    expect(h).toBeCloseTo(caixa, 2);
    expect(x + w / 2).toBeCloseTo(centro, 2);
    expect(y + h / 2).toBeCloseTo(centro, 2);

    const imagem = /<image [^>]*href="([^"]*)"[^>]*x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*preserveAspectRatio="xMidYMid meet"/.exec(svg);
    expect(imagem).not.toBeNull();
    expect(imagem![1]).toBe(logo);
    const [ix, iy, iw, ih] = imagem!.slice(2).map(Number);
    expect(iw).toBeCloseTo(0.22 * m.tamanho, 2);
    expect(ih).toBeCloseTo(0.22 * m.tamanho, 2);
    expect(ix).toBeGreaterThanOrEqual(x);
    expect(iy).toBeGreaterThanOrEqual(y);
    expect(ix + iw).toBeLessThanOrEqual(x + w + 1e-9);
    expect(iy + ih).toBeLessThanOrEqual(y + h + 1e-9);
  });

  it('não desenha logo que não seja uma imagem em data URL', () => {
    const svg = svgDoQr(criarMatriz(TEXTO, { comLogo: true }), {
      cor: '#000000',
      logo: 'https://exemplo.com/logo.png',
    });
    expect(svg).not.toContain('<image');
  });

  it('é um SVG completo para baixar', () => {
    const svg = svgDoQr(matriz, { cor: '#000000' });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
  });
});

describe('contrasteComBranco e CORES_DO_QR (T10, RF-QR-33)', () => {
  it('preto sobre branco é 21:1', () => {
    expect(contrasteComBranco('#000000')).toBeCloseTo(21, 5);
  });

  it('branco sobre branco é 1:1', () => {
    expect(contrasteComBranco('#ffffff')).toBeCloseTo(1, 5);
  });

  it('#000000 é aceito e #ffcc00 é recusado pelo mínimo de 4,5:1', () => {
    expect(contrasteComBranco('#000000')).toBeGreaterThanOrEqual(4.5);
    expect(contrasteComBranco('#ffcc00')).toBeLessThan(4.5);
  });

  it('aceita maiúsculas e a forma curta #rgb', () => {
    expect(contrasteComBranco('#0A1C82')).toBeCloseTo(contrasteComBranco('#0a1c82'), 10);
    expect(contrasteComBranco('#000')).toBeCloseTo(21, 5);
  });

  it('valor que não é cor conta como contraste mínimo (1), para ser recusado', () => {
    expect(contrasteComBranco('azul')).toBe(1);
    expect(contrasteComBranco('')).toBe(1);
  });

  it('as 8 cores da paleta, na ordem, com nome e todas com contraste suficiente', () => {
    expect(CORES_DO_QR.map((c) => [c.nome, c.hex])).toEqual([
      ['Preto', '#000000'],
      ['Azul-marinho', '#0a1c82'],
      ['Azul', '#0b4f8a'],
      ['Roxo', '#4b0f9e'],
      ['Verde', '#0b5d3b'],
      ['Vinho', '#7a1335'],
      ['Marrom', '#5a3a1a'],
      ['Grafite', '#2f3542'],
    ]);
    for (const { hex } of CORES_DO_QR) expect(contrasteComBranco(hex)).toBeGreaterThanOrEqual(4.5);
  });
});

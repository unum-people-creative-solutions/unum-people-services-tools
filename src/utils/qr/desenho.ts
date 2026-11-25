// Desenho do QR em SVG (DT-QR-04, DT-QR-13): margem de 4 módulos, fundo branco,
// módulos num path só, logo no centro e frase embaixo. Sem canvas: serve também ao teste.

import type { MatrizQr } from './matriz';

/** Margem branca ao redor do QR, em módulos (ISO/IEC 18004). */
export const MARGEM_EM_MODULOS = 4;
/** Lado do quadrado do logo, como fração do lado do QR. */
export const FRACAO_DO_LOGO = 0.22;
/** Contraste mínimo da cor do QR sobre o branco (WCAG). */
export const CONTRASTE_MINIMO = 4.5;

export interface CorDoQr {
  nome: string;
  hex: string;
}

/** As 8 cores do RF-QR-33, a primeira é o padrão. */
export const CORES_DO_QR: readonly CorDoQr[] = [
  { nome: 'Preto', hex: '#000000' },
  { nome: 'Azul-marinho', hex: '#0a1c82' },
  { nome: 'Azul', hex: '#0b4f8a' },
  { nome: 'Roxo', hex: '#4b0f9e' },
  { nome: 'Verde', hex: '#0b5d3b' },
  { nome: 'Vinho', hex: '#7a1335' },
  { nome: 'Marrom', hex: '#5a3a1a' },
  { nome: 'Grafite', hex: '#2f3542' },
];

/**
 * Razão de contraste WCAG entre a cor e o branco (1 a 21).
 * Aceita `#rrggbb` e `#rgb`; qualquer outra coisa conta como 1, para ser recusada.
 */
export function contrasteComBranco(hex: string): number {
  const curto = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  const longo = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  const partes = longo
    ? longo.slice(1).map((p) => parseInt(p, 16))
    : curto
      ? curto.slice(1).map((p) => parseInt(p + p, 16))
      : null;
  if (!partes) return 1;

  const [r, g, b] = partes.map((canal) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (luminancia + 0.05);
}

/**
 * Quadrado do logo, em módulos, nas coordenadas da matriz (0 a tamanho, sem a margem):
 * `lado` é o do logo (22% do QR); o fundo branco tem 1 módulo de folga no total.
 */
export function geometriaDoLogo(tamanho: number): {
  lado: number;
  x: number;
  y: number;
  ladoDoFundo: number;
  xDoFundo: number;
  yDoFundo: number;
} {
  const lado = FRACAO_DO_LOGO * tamanho;
  const ladoDoFundo = lado + 1;
  return {
    lado,
    x: (tamanho - lado) / 2,
    y: (tamanho - lado) / 2,
    ladoDoFundo,
    xDoFundo: (tamanho - ladoDoFundo) / 2,
    yDoFundo: (tamanho - ladoDoFundo) / 2,
  };
}

const PILHA_DE_FONTES = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

function numero(valor: number): string {
  return String(Number(valor.toFixed(3)));
}

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function caminhoDosModulos(matriz: MatrizQr): string {
  const comandos: string[] = [];
  for (let linha = 0; linha < matriz.tamanho; linha++) {
    let coluna = 0;
    while (coluna < matriz.tamanho) {
      if (!matriz.escuro(linha, coluna)) {
        coluna++;
        continue;
      }
      let fim = coluna;
      while (fim < matriz.tamanho && matriz.escuro(linha, fim)) fim++;
      const n = fim - coluna;
      comandos.push(`M${coluna + MARGEM_EM_MODULOS} ${linha + MARGEM_EM_MODULOS}h${n}v1h-${n}z`);
      coluna = fim;
    }
  }
  return comandos.join('');
}

/**
 * SVG do QR, em unidades de módulo. `logo` é um data URL de imagem (`data:image/…`);
 * qualquer outro valor é ignorado. `frase` entra embaixo, centralizada, na cor do QR.
 */
export function svgDoQr(
  matriz: MatrizQr,
  opcoes: { cor: string; frase?: string; logo?: string },
): string {
  const lado = matriz.tamanho + 2 * MARGEM_EM_MODULOS;
  const frase = opcoes.frase?.trim() ?? '';
  const cor = escaparXml(opcoes.cor);

  const fonte = frase ? Math.min(2.2, (lado * 0.9) / (Array.from(frase).length * 0.6)) : 0;
  const altura = frase ? lado + fonte * 2.4 : lado;

  const partes = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${numero(lado)} ${numero(altura)}" shape-rendering="crispEdges">`,
    `<rect width="${numero(lado)}" height="${numero(altura)}" fill="#ffffff"/>`,
    `<path fill="${cor}" d="${caminhoDosModulos(matriz)}"/>`,
  ];

  if (opcoes.logo && /^data:image\//i.test(opcoes.logo)) {
    const g = geometriaDoLogo(matriz.tamanho);
    const m = MARGEM_EM_MODULOS;
    partes.push(
      `<rect data-logo-fundo="" x="${numero(g.xDoFundo + m)}" y="${numero(g.yDoFundo + m)}" width="${numero(g.ladoDoFundo)}" height="${numero(g.ladoDoFundo)}" fill="#ffffff"/>`,
      `<image href="${escaparXml(opcoes.logo)}" x="${numero(g.x + m)}" y="${numero(g.y + m)}" width="${numero(g.lado)}" height="${numero(g.lado)}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }

  if (frase) {
    partes.push(
      `<text x="${numero(lado / 2)}" y="${numero(lado + fonte * 1.5)}" text-anchor="middle" font-family="${escaparXml(PILHA_DE_FONTES)}" font-size="${numero(fonte)}" font-weight="600" fill="${cor}">${escaparXml(frase)}</text>`,
    );
  }

  partes.push('</svg>');
  return partes.join('');
}

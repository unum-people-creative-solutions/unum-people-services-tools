// Do texto do QR ao que a tela e os arquivos usam: a matriz (para o PNG) e o SVG (para a prévia e o download).

import { criarMatriz, type MatrizQr } from './matriz';
import { svgDoQr } from './desenho';

export interface OpcoesDoQr {
  cor: string;
  /** F2: frase embaixo do QR. */
  frase?: string;
  /** F2: logo como data URL; com logo a correção de erro sobe para H. */
  logo?: string;
}

export type QrGerado =
  | { ok: true; matriz: MatrizQr; svg: string }
  | { ok: false; erro: string };

export const ERRO_QR_GRANDE_DEMAIS = 'Esse conteúdo é grande demais para caber num QR code. Escreva menos.';

/** Cria a matriz e o SVG; conteúdo que não cabe num QR vira `{ ok: false }` em vez de quebrar a tela. */
export function gerarQr(texto: string, opcoes: OpcoesDoQr): QrGerado {
  try {
    const matriz = criarMatriz(texto, { comLogo: Boolean(opcoes.logo) });
    return { ok: true, matriz, svg: svgDoQr(matriz, opcoes) };
  } catch {
    return { ok: false, erro: ERRO_QR_GRANDE_DEMAIS };
  }
}

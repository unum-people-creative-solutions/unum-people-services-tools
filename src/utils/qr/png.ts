// PNG do QR desenhado direto no canvas 2D (DT-QR-09): módulos, logo e texto. Nunca SVG → <img> → canvas,
// porque a imagem SVG não carrega a fonte do site. A função de desenho é pura (recebe o contexto) e serve
// também à plaquinha da F2, que desenha o QR dentro de uma folha maior (`x`, `y`, `lado`).

import { MARGEM_EM_MODULOS, PILHA_DE_FONTES, geometriaDoLogo, medidasDoQr } from './desenho';
import type { MatrizQr } from './matriz';

/** Lado do PNG do QR sozinho (RF-QR-26). */
export const LADO_DO_PNG = 1024;

/** O que o desenho usa do `CanvasRenderingContext2D`. */
export type ContextoDeDesenho = Pick<
  CanvasRenderingContext2D,
  'fillStyle' | 'fillRect' | 'fillText' | 'drawImage' | 'font' | 'textAlign' | 'textBaseline'
>;

export interface LogoParaDesenhar {
  imagem: CanvasImageSource;
  /** Tamanho natural da imagem, para caber no quadrado sem distorcer. */
  largura: number;
  altura: number;
}

export interface OpcoesDoPng {
  cor: string;
  /** Lado do QR (com a margem) em pixels. Padrão: 1024. */
  lado?: number;
  /** Canto de cima à esquerda do desenho no canvas. Padrão: 0. */
  x?: number;
  y?: number;
  frase?: string;
  logo?: LogoParaDesenhar;
}

/** Tamanho do canvas para o QR sozinho: com a frase, a altura cresce. */
export function medidasDoPng(
  matriz: MatrizQr,
  { lado = LADO_DO_PNG, frase }: Pick<OpcoesDoPng, 'lado' | 'frase'>,
): { largura: number; altura: number } {
  const medidas = medidasDoQr(matriz.tamanho, frase);
  return { largura: lado, altura: Math.round((lado * medidas.altura) / medidas.lado) };
}

/** Desenha o QR (fundo branco, margem, módulos, logo e frase) a partir de (x, y). */
export function desenharQrNoCanvas(ctx: ContextoDeDesenho, matriz: MatrizQr, opcoes: OpcoesDoPng): void {
  const { cor, lado = LADO_DO_PNG, x = 0, y = 0, frase, logo } = opcoes;
  const medidas = medidasDoQr(matriz.tamanho, frase);
  const escala = lado / medidas.lado;
  // Os cantos de cada módulo são arredondados, e os vizinhos dividem o mesmo canto: não sobra fresta.
  const px = (modulos: number) => Math.round(modulos * escala);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, lado, px(medidas.altura));

  ctx.fillStyle = cor;
  for (let linha = 0; linha < matriz.tamanho; linha++) {
    let coluna = 0;
    while (coluna < matriz.tamanho) {
      if (!matriz.escuro(linha, coluna)) {
        coluna++;
        continue;
      }
      let fim = coluna;
      while (fim < matriz.tamanho && matriz.escuro(linha, fim)) fim++;
      const esquerda = px(coluna + MARGEM_EM_MODULOS);
      const topo = px(linha + MARGEM_EM_MODULOS);
      ctx.fillRect(
        x + esquerda,
        y + topo,
        px(fim + MARGEM_EM_MODULOS) - esquerda,
        px(linha + 1 + MARGEM_EM_MODULOS) - topo,
      );
      coluna = fim;
    }
  }

  if (logo && logo.largura > 0 && logo.altura > 0) {
    const g = geometriaDoLogo(matriz.tamanho);
    const m = MARGEM_EM_MODULOS;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      x + px(g.xDoFundo + m),
      y + px(g.yDoFundo + m),
      px(g.ladoDoFundo),
      px(g.ladoDoFundo),
    );
    // contido no quadrado do logo, sem distorcer
    const quadrado = g.lado * escala;
    const razao = Math.min(quadrado / logo.largura, quadrado / logo.altura);
    const largura = logo.largura * razao;
    const altura = logo.altura * razao;
    ctx.drawImage(
      logo.imagem,
      x + (g.x + m) * escala + (quadrado - largura) / 2,
      y + (g.y + m) * escala + (quadrado - altura) / 2,
      largura,
      altura,
    );
  }

  if (medidas.frase) {
    ctx.fillStyle = cor;
    ctx.font = `600 ${medidas.fonte * escala}px ${PILHA_DE_FONTES}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(medidas.frase, x + lado / 2, y + (medidas.lado + medidas.fonte * 1.5) * escala);
  }
}

/** PNG do QR sozinho. Rejeita se o navegador não tiver canvas ou não devolver a imagem. */
export async function gerarPng(matriz: MatrizQr, opcoes: OpcoesDoPng): Promise<Blob> {
  // Com texto, espera as fontes do site; sem isso o canvas desenharia com a fonte de reserva.
  if (opcoes.frase && typeof document !== 'undefined' && document.fonts?.ready) await document.fonts.ready;

  const { largura, altura } = medidasDoPng(matriz, opcoes);
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador não tem canvas 2D.');

  desenharQrNoCanvas(ctx, matriz, { ...opcoes, lado: opcoes.lado ?? LADO_DO_PNG });
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('O canvas não devolveu a imagem.'))), 'image/png');
  });
}

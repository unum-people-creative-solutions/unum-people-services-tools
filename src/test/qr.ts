// Só para testes: lê o QR a partir da matriz de módulos, sem canvas.
import jsQR from 'jsqr';

export interface MatrizLegivel {
  tamanho: number;
  escuro(linha: number, coluna: number): boolean;
}

const PIXELS_POR_MODULO = 4;
const MARGEM_EM_MODULOS = 4;

/**
 * Monta os pixels RGBA da matriz (4 px por módulo, margem branca de 4 módulos) e
 * decodifica com o jsqr. `taparCentro` pinta de branco o quadrado central de
 * `taparCentro` do lado do QR mais 1 módulo de folga, como faz o logo.
 * Devolve o texto lido ou null.
 */
export function lerQr(
  matriz: MatrizLegivel,
  opcoes: { taparCentro?: number } = {},
): string | null {
  const { tamanho } = matriz;
  const lado = (tamanho + 2 * MARGEM_EM_MODULOS) * PIXELS_POR_MODULO;
  const pixels = new Uint8ClampedArray(lado * lado * 4);
  pixels.fill(255);

  for (let linha = 0; linha < tamanho; linha++) {
    for (let coluna = 0; coluna < tamanho; coluna++) {
      if (!matriz.escuro(linha, coluna)) continue;
      pintarModulo(pixels, lado, linha + MARGEM_EM_MODULOS, coluna + MARGEM_EM_MODULOS);
    }
  }

  if (opcoes.taparCentro && opcoes.taparCentro > 0) {
    const ladoDoTampo = opcoes.taparCentro * tamanho + 1; // em módulos
    const inicio = MARGEM_EM_MODULOS + (tamanho - ladoDoTampo) / 2;
    const de = Math.floor(inicio * PIXELS_POR_MODULO);
    const ate = Math.ceil((inicio + ladoDoTampo) * PIXELS_POR_MODULO);
    for (let y = de; y < ate; y++) {
      for (let x = de; x < ate; x++) {
        const i = (y * lado + x) * 4;
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 255;
      }
    }
  }

  const lido = jsQR(pixels, lado, lado);
  return lido ? lido.data : null;
}

function pintarModulo(pixels: Uint8ClampedArray, lado: number, linha: number, coluna: number) {
  for (let dy = 0; dy < PIXELS_POR_MODULO; dy++) {
    for (let dx = 0; dx < PIXELS_POR_MODULO; dx++) {
      const y = linha * PIXELS_POR_MODULO + dy;
      const x = coluna * PIXELS_POR_MODULO + dx;
      const i = (y * lado + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
    }
  }
}

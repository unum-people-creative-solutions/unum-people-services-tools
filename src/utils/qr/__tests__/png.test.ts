import { describe, it, expect, vi, afterEach } from 'vitest';
import jsQR from 'jsqr';
import { criarMatriz } from '../matriz';
import { MARGEM_EM_MODULOS } from '../desenho';
import { LADO_DO_PNG, desenharQrNoCanvas, gerarPng, medidasDoPng, type ContextoDeDesenho } from '../png';

const TEXTO = 'https://www.seunegocio.com.br/cardapio';

/** Contexto 2D de mentira que pinta os retângulos num buffer RGBA e guarda as outras chamadas. */
function contextoRaster(largura: number, altura: number) {
  const pixels = new Uint8ClampedArray(largura * altura * 4);
  const chamadas: { nome: string; args: unknown[] }[] = [];
  const ctx = {
    fillStyle: '#000000' as string | CanvasGradient | CanvasPattern,
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillRect(x: number, y: number, w: number, h: number) {
      const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(this.fillStyle));
      if (!m) throw new Error(`cor inesperada: ${String(this.fillStyle)}`);
      const [r, g, b] = [m[1], m[2], m[3]].map((p) => parseInt(p, 16));
      chamadas.push({ nome: 'fillRect', args: [x, y, w, h, String(this.fillStyle)] });
      for (let j = Math.max(0, y); j < Math.min(altura, y + h); j++) {
        for (let i = Math.max(0, x); i < Math.min(largura, x + w); i++) {
          const k = (j * largura + i) * 4;
          pixels[k] = r;
          pixels[k + 1] = g;
          pixels[k + 2] = b;
          pixels[k + 3] = 255;
        }
      }
    },
    fillText(...args: unknown[]) {
      chamadas.push({ nome: 'fillText', args: [...args, this.font, this.textAlign, String(this.fillStyle)] });
    },
    drawImage(...args: unknown[]) {
      chamadas.push({ nome: 'drawImage', args });
    },
  };
  return { ctx: ctx as unknown as ContextoDeDesenho, pixels, chamadas };
}

describe('medidasDoPng (DT-QR-09)', () => {
  const matriz = criarMatriz(TEXTO, { comLogo: false });

  it('sem frase, o PNG é quadrado de 1024 px', () => {
    expect(LADO_DO_PNG).toBe(1024);
    expect(medidasDoPng(matriz, {})).toEqual({ largura: 1024, altura: 1024 });
  });

  it('com frase, a altura cresce e a largura continua', () => {
    const { largura, altura } = medidasDoPng(matriz, { frase: 'Aponte a câmera' });
    expect(largura).toBe(1024);
    expect(altura).toBeGreaterThan(1024);
  });

  it('aceita outro lado', () => {
    expect(medidasDoPng(matriz, { lado: 500 })).toEqual({ largura: 500, altura: 500 });
  });
});

describe('desenharQrNoCanvas', () => {
  it('desenha o QR no canvas e o que está desenhado é lido de volta', () => {
    const matriz = criarMatriz(TEXTO, { comLogo: false });
    const { largura, altura } = medidasDoPng(matriz, {});
    const { ctx, pixels } = contextoRaster(largura, altura);
    desenharQrNoCanvas(ctx, matriz, { cor: '#000000' });
    expect(jsQR(pixels, largura, altura)?.data).toBe(TEXTO);
  });

  it('lê também com uma cor da paleta', () => {
    const matriz = criarMatriz(TEXTO, { comLogo: false });
    const { largura, altura } = medidasDoPng(matriz, {});
    const { ctx, pixels } = contextoRaster(largura, altura);
    desenharQrNoCanvas(ctx, matriz, { cor: '#0a1c82' });
    expect(jsQR(pixels, largura, altura)?.data).toBe(TEXTO);
  });

  it('tem fundo branco e margem de 4 módulos em branco', () => {
    const matriz = criarMatriz(TEXTO, { comLogo: false });
    const { largura, altura } = medidasDoPng(matriz, {});
    const { ctx, pixels } = contextoRaster(largura, altura);
    desenharQrNoCanvas(ctx, matriz, { cor: '#000000' });
    const escala = largura / (matriz.tamanho + 2 * MARGEM_EM_MODULOS);
    const margem = Math.floor(MARGEM_EM_MODULOS * escala) - 1;
    for (let i = 0; i < margem; i++) {
      for (const [x, y] of [
        [i, i],
        [largura - 1 - i, 10],
        [10, altura - 1 - i],
      ]) {
        const k = (y * largura + x) * 4;
        expect([pixels[k], pixels[k + 1], pixels[k + 2], pixels[k + 3]]).toEqual([255, 255, 255, 255]);
      }
    }
    // O canto do primeiro módulo (o localizador do QR é escuro) começa depois da margem.
    const k = (Math.round(MARGEM_EM_MODULOS * escala) + 2) * (largura + 1) * 4;
    expect(pixels[k]).toBe(0);
  });

  it('desenha na posição e no tamanho pedidos (para a plaquinha da F2)', () => {
    const matriz = criarMatriz(TEXTO, { comLogo: false });
    const { ctx, pixels } = contextoRaster(1000, 1000);
    desenharQrNoCanvas(ctx, matriz, { cor: '#000000', lado: 400, x: 300, y: 200 });
    // recorta a área do QR para ler
    const recorte = new Uint8ClampedArray(400 * 400 * 4);
    for (let j = 0; j < 400; j++) {
      for (let i = 0; i < 400; i++) {
        const de = ((j + 200) * 1000 + (i + 300)) * 4;
        recorte.set(pixels.subarray(de, de + 4), (j * 400 + i) * 4);
      }
    }
    expect(jsQR(recorte, 400, 400)?.data).toBe(TEXTO);
  });

  it('com logo (nível H), cobre o centro de branco e desenha a imagem contida, sem distorcer', () => {
    const matriz = criarMatriz(TEXTO, { comLogo: true });
    const { ctx, chamadas } = contextoRaster(1024, 1024);
    const imagem = {} as CanvasImageSource;
    desenharQrNoCanvas(ctx, matriz, { cor: '#000000', logo: { imagem, largura: 200, altura: 100 } });
    const desenhos = chamadas.filter((c) => c.nome === 'drawImage');
    expect(desenhos).toHaveLength(1);
    const [img, x, y, w, h] = desenhos[0].args as [CanvasImageSource, number, number, number, number];
    expect(img).toBe(imagem);
    expect(w / h).toBeCloseTo(2, 1); // proporção do logo mantida
    const escala = 1024 / (matriz.tamanho + 8);
    const ladoDoLogo = 0.22 * matriz.tamanho * escala;
    expect(w).toBeCloseTo(ladoDoLogo, 0); // o lado maior ocupa o quadrado de 22%
    expect(x + w / 2).toBeCloseTo(512, 0);
    expect(y + h / 2).toBeCloseTo(512, 0);
  });

  it('com frase, escreve a frase centralizada, na cor do QR, embaixo', () => {
    const matriz = criarMatriz(TEXTO, { comLogo: false });
    const { largura, altura } = medidasDoPng(matriz, { frase: 'Aponte a câmera' });
    const { ctx, chamadas } = contextoRaster(largura, altura);
    desenharQrNoCanvas(ctx, matriz, { cor: '#0a1c82', frase: 'Aponte a câmera' });
    const textos = chamadas.filter((c) => c.nome === 'fillText');
    expect(textos).toHaveLength(1);
    const [frase, x, y, fonte, alinhamento, cor] = textos[0].args as [string, number, number, string, string, string];
    expect(frase).toBe('Aponte a câmera');
    expect(x).toBe(largura / 2);
    expect(y).toBeGreaterThan(1024);
    expect(y).toBeLessThan(altura);
    expect(fonte).toMatch(/^600 [\d.]+px /);
    expect(alinhamento).toBe('center');
    expect(cor).toBe('#0a1c82');
  });
});

describe('gerarPng', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const matriz = criarMatriz(TEXTO, { comLogo: false });

  it('desenha num canvas de 1024 px e devolve o Blob image/png', async () => {
    const tamanhos: number[][] = [];
    const ctx = contextoRaster(1024, 1024).ctx;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb, tipo) {
      tamanhos.push([this.width, this.height]);
      cb(new Blob(['png'], { type: tipo }));
    });
    const blob = await gerarPng(matriz, { cor: '#000000' });
    expect(tamanhos).toEqual([[1024, 1024]]);
    expect(blob.type).toBe('image/png');
  });

  it('falha quando o canvas não existe', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(gerarPng(matriz, { cor: '#000000' })).rejects.toThrow();
  });

  it('falha quando o canvas não devolve a imagem', async () => {
    const ctx = contextoRaster(1024, 1024).ctx;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(null));
    await expect(gerarPng(matriz, { cor: '#000000' })).rejects.toThrow();
  });
});

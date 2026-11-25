import { describe, it, expect, vi, afterEach } from 'vitest';
import jsQR from 'jsqr';
import { criarMatriz } from '../matriz';
import { TIPOS, linhaDeApoio, chamadaDoTipo, montarConteudo, type TipoId } from '../conteudos';
import { EXEMPLOS } from './exemplos';
import {
  PAPEIS,
  QR_MINIMO_MM,
  RODAPE_DA_PLAQUINHA,
  dadosDaPlaquinha,
  desenharPlaquinhaNoCanvas,
  gerarPngDaPlaquinha,
  ladoDoQrEmMm,
  quebrarEmLinhas,
  type ContextoDaPlaquinha,
} from '../plaquinha';
import { nomeDoArquivoDaPlaquinha } from '../arquivo';

const TEXTO = 'https://www.seunegocio.com.br/cardapio';

interface Texto {
  texto: string;
  x: number;
  y: number;
  fonte: string;
  cor: string;
}

/** Contexto 2D de mentira: pinta os retângulos num RGBA, mede texto por 0,55 × tamanho da fonte e guarda os textos. */
function contextoRaster(largura: number, altura: number) {
  const pixels = new Uint8ClampedArray(largura * altura * 4);
  const textos: Texto[] = [];
  const retangulos: { x: number; y: number; w: number; h: number; cor: string }[] = [];
  const imagens: unknown[][] = [];
  const ctx = {
    fillStyle: '#000000' as string | CanvasGradient | CanvasPattern,
    font: '',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillRect(x: number, y: number, w: number, h: number) {
      const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(this.fillStyle));
      if (!m) throw new Error(`cor inesperada: ${String(this.fillStyle)}`);
      const [r, g, b] = [m[1], m[2], m[3]].map((p) => parseInt(p, 16));
      retangulos.push({ x, y, w, h, cor: String(this.fillStyle) });
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
    fillText(texto: string, x: number, y: number) {
      textos.push({ texto, x, y, fonte: this.font, cor: String(this.fillStyle) });
    },
    drawImage(...args: unknown[]) {
      imagens.push(args);
    },
    measureText(texto: string) {
      const px = Number(/([\d.]+)px/.exec(this.font)?.[1] ?? 10);
      return { width: Array.from(texto).length * px * 0.55 } as TextMetrics;
    },
  };
  return { ctx: ctx as unknown as ContextoDaPlaquinha, pixels, textos, retangulos, imagens };
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'fonts');
});

describe('PAPEIS (RF-QR-36)', () => {
  it('A6 e A4 a 300 DPI', () => {
    expect(PAPEIS.A6).toMatchObject({ largura: 1240, altura: 1748, larguraMm: 105, alturaMm: 148 });
    expect(PAPEIS.A4).toMatchObject({ largura: 2480, altura: 3508, larguraMm: 210, alturaMm: 297 });
  });
});

describe('dadosDaPlaquinha (RF-QR-37)', () => {
  it.each(TIPOS.map((t) => [t.id, t.nome] as const))('%s: chamada e linhas de apoio do tipo', (id: TipoId) => {
    const campos = EXEMPLOS[id];
    const dados = dadosDaPlaquinha(id, EXEMPLOS, '', '#000000');
    expect(dados.chamada).toBe(chamadaDoTipo(id, campos as never));
    expect(dados.apoio).toEqual(linhaDeApoio(id, campos as never));
  });

  it('o Pix leva a chave como foi digitada e o aviso em negrito', () => {
    const dados = dadosDaPlaquinha('pix', EXEMPLOS, '', '#000000');
    expect(dados.chamada).toBe('Pague com Pix');
    expect(dados.apoio).toEqual([
      { texto: `Chave Pix: ${EXEMPLOS.pix.chave}` },
      { texto: 'Confira o nome antes de pagar.', negrito: true },
    ]);
  });

  it('o nome do negócio vem aparado e em caixa alta; vazio fica vazio', () => {
    expect(dadosDaPlaquinha('pix', EXEMPLOS, '  Doces da Maria ', '#000000').nomeDoNegocio).toBe('DOCES DA MARIA');
    expect(dadosDaPlaquinha('pix', EXEMPLOS, '   ', '#000000').nomeDoNegocio).toBe('');
  });

  it('guarda a cor', () => {
    expect(dadosDaPlaquinha('pix', EXEMPLOS, '', '#7a1335').cor).toBe('#7a1335');
  });
});

describe('quebrarEmLinhas', () => {
  const medir = (t: string) => Array.from(t).length * 10;

  it('quebra nas palavras sem passar do limite', () => {
    expect(quebrarEmLinhas(medir, 'Fale com a gente por e-mail', 120)).toEqual(['Fale com a', 'gente por', 'e-mail']);
  });

  it('texto curto fica numa linha', () => {
    expect(quebrarEmLinhas(medir, 'Pague com Pix', 500)).toEqual(['Pague com Pix']);
  });

  it('palavra maior que a linha (chave aleatória) quebra por letras', () => {
    const chave = '123e4567-e12b-12d1-a456-426655440000';
    const linhas = quebrarEmLinhas(medir, `Chave Pix: ${chave}`, 200);
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) expect(medir(l)).toBeLessThanOrEqual(200);
    expect(linhas.join('').replace(/ /g, '')).toBe(`ChavePix:${chave}`);
  });

  it('texto vazio não tem linhas', () => {
    expect(quebrarEmLinhas(medir, '   ', 100)).toEqual([]);
  });
});

describe('ladoDoQrEmMm: o QR impresso nunca é menor que 3 cm', () => {
  it.each(['A6', 'A4'] as const)('%s, do menor ao maior QR', (papel) => {
    expect(QR_MINIMO_MM).toBe(30);
    for (const tamanho of [21, 29, 41, 53, 77, 101, 133, 177]) {
      expect(ladoDoQrEmMm(tamanho, papel)).toBeGreaterThanOrEqual(QR_MINIMO_MM);
    }
  });

  it('na A6 um QR comum mede cerca de 5 cm de módulos (62% da largura com a margem)', () => {
    const mm = ladoDoQrEmMm(criarMatriz(TEXTO, { comLogo: false }).tamanho, 'A6');
    expect(mm).toBeGreaterThan(45);
    expect(mm).toBeLessThan(65);
  });
});

describe('desenharPlaquinhaNoCanvas (RF-QR-36, DT-QR-09)', () => {
  const matriz = criarMatriz(TEXTO, { comLogo: false });

  const desenhar = (papel: 'A6' | 'A4', dados = dadosDaPlaquinha('pix', EXEMPLOS, 'Doces da Maria', '#0a1c82')) => {
    const { largura, altura } = PAPEIS[papel];
    const r = contextoRaster(largura, altura);
    desenharPlaquinhaNoCanvas(r.ctx, matriz, dados, papel);
    return { ...r, largura, altura };
  };

  it.each(['A6', 'A4'] as const)('%s: o QR desenhado na folha é lido de volta igual ao conteúdo', (papel) => {
    const { pixels, largura, altura } = desenhar(papel);
    expect(jsQR(pixels, largura, altura)?.data).toBe(TEXTO);
  });

  it('o fundo da folha é branco até as bordas', () => {
    const { pixels, largura, altura } = desenhar('A6');
    for (const [x, y] of [
      [0, 0],
      [largura - 1, 0],
      [0, altura - 1],
      [largura - 1, altura - 1],
    ]) {
      const k = (y * largura + x) * 4;
      expect([pixels[k], pixels[k + 1], pixels[k + 2], pixels[k + 3]]).toEqual([255, 255, 255, 255]);
    }
  });

  it('escreve, de cima para baixo: nome, chamada, (QR), apoio e rodapé, centralizados', () => {
    const { textos, largura, altura, retangulos } = desenhar('A6');
    const ordem = textos.map((t) => t.texto);
    expect(ordem[0]).toBe('DOCES DA MARIA');
    expect(ordem[1]).toBe('Pague com Pix');
    expect(ordem[ordem.length - 1]).toBe(RODAPE_DA_PLAQUINHA);
    expect(ordem).toContain('Confira o nome antes de pagar.');
    expect(ordem.some((t) => t.startsWith('Chave Pix:'))).toBe(true);

    const ys = textos.map((t) => t.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    for (const t of textos) {
      expect(t.x).toBe(largura / 2);
      expect(t.y).toBeGreaterThan(0);
      expect(t.y).toBeLessThan(altura);
    }

    // o QR fica entre a chamada e o apoio
    const topoDoQr = Math.min(...retangulos.filter((r) => r.cor === '#0a1c82' && r.h < 100).map((r) => r.y));
    const yChamada = textos[1].y;
    const yApoio = textos.find((t) => t.texto.startsWith('Chave Pix:'))!.y;
    expect(topoDoQr).toBeGreaterThan(yChamada);
    expect(yApoio).toBeGreaterThan(topoDoQr);
  });

  it('a chamada tem a cor do QR, em peso 700, e é a maior letra da folha', () => {
    const { textos, largura } = desenhar('A6');
    const chamada = textos.find((t) => t.texto === 'Pague com Pix')!;
    expect(chamada.cor).toBe('#0a1c82');
    expect(chamada.fonte).toMatch(/^700 /);
    const tamanhos = textos.map((t) => Number(/([\d.]+)px/.exec(t.fonte)![1]));
    expect(Number(/([\d.]+)px/.exec(chamada.fonte)![1])).toBe(Math.max(...tamanhos));
    expect(Math.max(...tamanhos)).toBeLessThan(largura / 5);
  });

  it('a linha em negrito sai em peso 700 e as outras não', () => {
    const { textos } = desenhar('A6');
    expect(textos.find((t) => t.texto === 'Confira o nome antes de pagar.')!.fonte).toMatch(/^700 /);
    expect(textos.find((t) => t.texto.startsWith('Chave Pix:'))!.fonte).not.toMatch(/^700 /);
  });

  it('o rodapé é em cinza (ui-muted) e sem nome do negócio o primeiro texto é a chamada', () => {
    const { textos } = desenhar('A6', dadosDaPlaquinha('pix', EXEMPLOS, '', '#000000'));
    expect(textos[0].texto).toBe('Pague com Pix');
    expect(textos[textos.length - 1].cor).toBe('#63668a');
  });

  it('nenhum texto passa da largura útil da folha (a chave longa quebra em linhas)', () => {
    const { textos, largura, ctx } = desenhar('A6');
    expect(textos.some((t) => t.texto.startsWith('Chave Pix:'))).toBe(true);
    for (const t of textos) {
      (ctx as unknown as { font: string }).font = t.fonte;
      expect(ctx.measureText(t.texto).width).toBeLessThanOrEqual(largura * 0.84 + 0.5);
    }
  });

  it('A4 é a mesma composição em escala (as proporções não mudam)', () => {
    const a6 = desenhar('A6');
    const a4 = desenhar('A4');
    expect(a4.textos.map((t) => t.texto)).toEqual(a6.textos.map((t) => t.texto));
    const razao = a4.largura / a6.largura;
    a6.textos.forEach((t, i) => {
      expect(a4.textos[i].y / a4.altura).toBeCloseTo(t.y / a6.altura, 1);
    });
    expect(razao).toBe(2);
  });

  it('com logo, a imagem entra no QR da folha', () => {
    const r = contextoRaster(PAPEIS.A6.largura, PAPEIS.A6.altura);
    const comLogo = criarMatriz(TEXTO, { comLogo: true });
    const imagem = {} as CanvasImageSource;
    desenharPlaquinhaNoCanvas(
      r.ctx,
      comLogo,
      dadosDaPlaquinha('pix', EXEMPLOS, '', '#000000'),
      'A6',
      { imagem, largura: 100, altura: 100 },
    );
    expect(r.imagens).toHaveLength(1);
    expect(r.imagens[0][0]).toBe(imagem);
  });

  it('linha de apoio vazia (Avaliar no Google): não escreve linha de apoio', () => {
    const { textos } = desenhar('A6', dadosDaPlaquinha('avaliacao', EXEMPLOS, '', '#000000'));
    // a chamada pode quebrar em linhas; depois dela vem direto o rodapé
    expect(textos.map((t) => t.texto).join(' ')).toBe(`Avalie a gente no Google ${RODAPE_DA_PLAQUINHA}`);
  });
});

describe('gerarPngDaPlaquinha (T23)', () => {
  const conteudo = montarConteudo('pix', EXEMPLOS.pix);
  const matriz = criarMatriz(conteudo.ok ? conteudo.texto : '', { comLogo: false });
  const dados = dadosDaPlaquinha('pix', EXEMPLOS, '', '#000000');

  function prepararCanvas() {
    const tamanhos: number[][] = [];
    const ctx = contextoRaster(10, 10).ctx;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb, tipo) {
      tamanhos.push([this.width, this.height]);
      cb(new Blob(['png'], { type: tipo }));
    });
    return tamanhos;
  }

  it('A6 gera 1240×1748 e A4 gera 2480×3508, image/png', async () => {
    const tamanhos = prepararCanvas();
    const a6 = await gerarPngDaPlaquinha(matriz, dados, 'A6');
    const a4 = await gerarPngDaPlaquinha(matriz, dados, 'A4');
    expect(tamanhos).toEqual([
      [1240, 1748],
      [2480, 3508],
    ]);
    expect(a6.type).toBe('image/png');
    expect(a4.type).toBe('image/png');
  });

  it('espera as fontes (document.fonts.ready) antes de desenhar', async () => {
    const passos: string[] = [];
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: new Promise<void>((resolver) => setTimeout(() => (passos.push('fontes'), resolver()), 10)) },
    });
    const ctx = contextoRaster(10, 10).ctx;
    vi.spyOn(ctx as unknown as { fillRect: () => void }, 'fillRect').mockImplementation(() => {
      if (!passos.includes('desenho')) passos.push('desenho');
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb, tipo) => cb(new Blob(['x'], { type: tipo })));
    await gerarPngDaPlaquinha(matriz, dados, 'A6');
    expect(passos).toEqual(['fontes', 'desenho']);
  });

  it('falha quando o canvas não existe ou não devolve a imagem', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(gerarPngDaPlaquinha(matriz, dados, 'A6')).rejects.toThrow();
    vi.restoreAllMocks();
    const ctx = contextoRaster(10, 10).ctx;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(null));
    await expect(gerarPngDaPlaquinha(matriz, dados, 'A6')).rejects.toThrow();
  });
});

describe('nomeDoArquivoDaPlaquinha', () => {
  it('plaquinha-{tipo}.png', () => {
    expect(nomeDoArquivoDaPlaquinha('pix')).toBe('plaquinha-pix.png');
    expect(nomeDoArquivoDaPlaquinha('como-chegar')).toBe('plaquinha-como-chegar.png');
  });
});

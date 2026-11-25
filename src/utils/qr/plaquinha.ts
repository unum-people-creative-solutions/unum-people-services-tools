// Plaquinha para imprimir (RF-QR-36, RF-QR-37, DT-QR-09, DT-QR-10): o que vai na folha e o PNG a 300 DPI,
// desenhado direto no canvas 2D. A prévia na tela e a folha de impressão usam as mesmas medidas (`MEDIDAS`),
// em fração da largura da folha, então A6 e A4 são a mesma composição em escala.

import type { CamposPorTipo, LinhaDeApoio, TipoId } from './conteudos';
import { chamadaDoTipo, linhaDeApoio } from './conteudos';
import { PILHA_DE_FONTES } from './desenho';
import type { TamanhoDaPlaquinha } from './estado';
import type { MatrizQr } from './matriz';
import { desenharQrNoCanvas, type ContextoDeDesenho, type LogoParaDesenhar } from './png';

export { PILHA_DE_FONTES };

export interface Papel {
  /** Pixels a 300 DPI. */
  largura: number;
  altura: number;
  larguraMm: number;
  alturaMm: number;
}

export const PAPEIS: Record<TamanhoDaPlaquinha, Papel> = {
  A6: { largura: 1240, altura: 1748, larguraMm: 105, alturaMm: 148 },
  A4: { largura: 2480, altura: 3508, larguraMm: 210, alturaMm: 297 },
};

export const RODAPE_DA_PLAQUINHA = 'Aponte a câmera do celular para o código.';

/** Menor lado do QR impresso, em milímetros (guia da tela: "no mínimo 3 cm"). */
export const QR_MINIMO_MM = 30;

/** Cores do texto: `ui-ink` e `ui-muted` da vitrine. A chamada usa a cor do QR. */
export const COR_DO_TEXTO = '#14142b';
export const COR_DO_RODAPE = '#63668a';

/** Medidas como fração da largura da folha (blueprint §3). Tudo escala junto de A6 para A4. */
export const MEDIDAS = {
  margem: 0.08,
  /** Largura do QR com a margem branca de 4 módulos. */
  qr: 0.62,
  nome: { fonte: 0.036, linha: 1.25, letras: 0.1 },
  chamada: { fonte: 0.085, linha: 1.15 },
  apoio: { fonte: 0.042, linha: 1.35 },
  rodape: { fonte: 0.034, linha: 1.4 },
  espaco: { nomeChamada: 0.02, chamadaQr: 0.03, qrApoio: 0.025, entreApoios: 0.01, corpoRodape: 0.04 },
} as const;

/** Largura em que o texto pode correr: a folha menos as duas margens. */
export const LARGURA_UTIL = 1 - 2 * MEDIDAS.margem;

export interface DadosDaPlaquinha {
  /** Em caixa alta; vazio quando não há nome. */
  nomeDoNegocio: string;
  chamada: string;
  apoio: LinhaDeApoio[];
  /** Cor do QR e da chamada. */
  cor: string;
}

export const LIMITE_DO_NOME_DO_NEGOCIO = 40;

/** O que a plaquinha mostra, a partir do tipo, dos campos, do nome do negócio e da cor. */
export function dadosDaPlaquinha(
  tipo: TipoId,
  campos: CamposPorTipo,
  nomeDoNegocio: string,
  cor: string,
): DadosDaPlaquinha {
  return {
    nomeDoNegocio: nomeDoNegocio.trim().toUpperCase(),
    chamada: chamadaDoTipo(tipo, campos[tipo] as never),
    apoio: linhaDeApoio(tipo, campos[tipo] as never),
    cor,
  };
}

/** Lado do QR impresso (só os módulos, sem a margem branca), em milímetros. */
export function ladoDoQrEmMm(tamanhoDaMatriz: number, tamanho: TamanhoDaPlaquinha): number {
  return MEDIDAS.qr * PAPEIS[tamanho].larguraMm * (tamanhoDaMatriz / (tamanhoDaMatriz + 8));
}

/** Quebra o texto em linhas que cabem em `largura`: por palavras e, se uma palavra não cabe, por letras. */
export function quebrarEmLinhas(medir: (texto: string) => number, texto: string, largura: number): string[] {
  const linhas: string[] = [];
  let atual = '';
  const fechar = () => {
    if (atual) linhas.push(atual);
    atual = '';
  };

  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const candidata = atual ? `${atual} ${palavra}` : palavra;
    if (medir(candidata) <= largura) {
      atual = candidata;
      continue;
    }
    fechar();
    if (medir(palavra) <= largura) {
      atual = palavra;
      continue;
    }
    // palavra maior que a linha (chave aleatória do Pix): quebra por letras
    for (const letra of Array.from(palavra)) {
      if (atual && medir(atual + letra) > largura) fechar();
      atual += letra;
    }
  }
  fechar();
  return linhas;
}

/** O desenho usa, além do `ContextoDeDesenho`, a medida de texto. */
export type ContextoDaPlaquinha = ContextoDeDesenho & Pick<CanvasRenderingContext2D, 'measureText'>;

interface Bloco {
  linhas: string[];
  px: number;
  linhaPx: number;
  peso: 400 | 700;
  cor: string;
  letrasPx: number;
  /** Espaço antes do bloco, em pixels. */
  antes: number;
}

/**
 * Desenha a folha inteira em (0, 0): fundo branco, nome, chamada, QR, linhas de apoio e rodapé.
 * O corpo (nome até apoio) fica centrado na vertical entre a margem de cima e o rodapé.
 */
export function desenharPlaquinhaNoCanvas(
  ctx: ContextoDaPlaquinha,
  matriz: MatrizQr,
  dados: DadosDaPlaquinha,
  tamanho: TamanhoDaPlaquinha,
  logo?: LogoParaDesenhar,
): void {
  const { largura: L, altura: H } = PAPEIS[tamanho];
  const u = (fracao: number) => fracao * L;
  const comLetras = ctx as ContextoDaPlaquinha & { letterSpacing?: string };

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, L, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const medirCom = (peso: number, px: number, letrasPx: number) => (texto: string) => {
    ctx.font = `${peso} ${px}px ${PILHA_DE_FONTES}`;
    comLetras.letterSpacing = `${letrasPx}px`;
    return ctx.measureText(texto).width;
  };

  const bloco = (
    texto: string,
    m: { fonte: number; linha: number },
    peso: 400 | 700,
    cor: string,
    antes: number,
    letras = 0,
  ): Bloco => {
    const px = u(m.fonte);
    const letrasPx = px * letras;
    return {
      linhas: quebrarEmLinhas(medirCom(peso, px, letrasPx), texto, u(LARGURA_UTIL)),
      px,
      linhaPx: px * m.linha,
      peso,
      cor,
      letrasPx,
      antes,
    };
  };

  const alturaDe = (b: Bloco) => b.antes + b.linhas.length * b.linhaPx;
  const lado = Math.round(u(MEDIDAS.qr));

  // Corpo: nome, chamada, QR e apoios, nesta ordem. `null` marca o lugar do QR.
  const corpo: (Bloco | null)[] = [];
  if (dados.nomeDoNegocio) corpo.push(bloco(dados.nomeDoNegocio, MEDIDAS.nome, 400, COR_DO_TEXTO, 0, MEDIDAS.nome.letras));
  corpo.push(
    bloco(dados.chamada, MEDIDAS.chamada, 700, dados.cor, dados.nomeDoNegocio ? u(MEDIDAS.espaco.nomeChamada) : 0),
  );
  corpo.push(null);
  dados.apoio.forEach((linha, i) => {
    corpo.push(
      bloco(
        linha.texto,
        MEDIDAS.apoio,
        linha.negrito ? 700 : 400,
        COR_DO_TEXTO,
        i === 0 ? u(MEDIDAS.espaco.qrApoio) : u(MEDIDAS.espaco.entreApoios),
      ),
    );
  });
  // O espaço entre a chamada e o QR entra no QR.
  const alturaDoCorpo = corpo.reduce<number>(
    (soma, b) => soma + (b ? alturaDe(b) : u(MEDIDAS.espaco.chamadaQr) + lado),
    0,
  );

  const rodape = bloco(RODAPE_DA_PLAQUINHA, MEDIDAS.rodape, 400, COR_DO_RODAPE, 0);
  const alturaDoRodape = alturaDe(rodape);
  const margem = u(MEDIDAS.margem);
  const topo = margem;
  const fundo = H - margem - alturaDoRodape - u(MEDIDAS.espaco.corpoRodape);
  let y = topo + Math.max(0, (fundo - topo - alturaDoCorpo) / 2);

  const escrever = (b: Bloco, yDoBloco: number) => {
    ctx.font = `${b.peso} ${b.px}px ${PILHA_DE_FONTES}`;
    comLetras.letterSpacing = `${b.letrasPx}px`;
    ctx.fillStyle = b.cor;
    b.linhas.forEach((linha, i) => ctx.fillText(linha, L / 2, yDoBloco + (i + 0.5) * b.linhaPx));
  };

  for (const b of corpo) {
    if (b) {
      y += b.antes;
      escrever(b, y);
      y += b.linhas.length * b.linhaPx;
    } else {
      y += u(MEDIDAS.espaco.chamadaQr);
      desenharQrNoCanvas(ctx, matriz, {
        cor: dados.cor,
        lado,
        x: Math.round((L - lado) / 2),
        y: Math.round(y),
        logo,
      });
      y += lado;
    }
  }

  escrever(rodape, H - margem - alturaDoRodape);
  comLetras.letterSpacing = '0px';
}

/** PNG da plaquinha a 300 DPI. Espera as fontes (RT-QR-4). Rejeita se o canvas não existe ou não devolve a imagem. */
export async function gerarPngDaPlaquinha(
  matriz: MatrizQr,
  dados: DadosDaPlaquinha,
  tamanho: TamanhoDaPlaquinha,
  logo?: LogoParaDesenhar,
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts?.ready) await document.fonts.ready;

  const { largura, altura } = PAPEIS[tamanho];
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Este navegador não tem canvas 2D.');

  desenharPlaquinhaNoCanvas(ctx, matriz, dados, tamanho, logo);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('O canvas não devolveu a imagem.'))), 'image/png');
  });
}

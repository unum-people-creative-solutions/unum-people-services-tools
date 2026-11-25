// O que o gerador guarda no aparelho (RF-QR-28, DT-QR-11): o tipo, os campos de todos os tipos e, para a
// F2, a cor, a frase, o nome do negócio e o tamanho da plaquinha. O logo NUNCA é guardado.
// Toda leitura e escrita fica dentro de try/catch: armazenamento bloqueado ou cheio não pode derrubar a tela.

import { TIPOS, REDES, TIPOS_DE_CHAVE_PIX, camposVazios, type CamposPorTipo } from './conteudos';
import { COR_PADRAO, estadoVazio, type EstadoQr } from './estado';

export const CHAVE_DO_QR = 'tools-qr-code:v1';

const ehObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

/** Valores aceitos em campos que são uma escolha de lista. */
const ESCOLHAS: Record<string, readonly string[]> = {
  'pix.tipoChave': TIPOS_DE_CHAVE_PIX.map((t) => t.id),
  'redes.rede': REDES.map((r) => r.id),
};

/** Campos de um tipo: só entra o que tem o mesmo tipo de valor do campo vazio; o resto fica vazio. */
function lerCampos(guardados: unknown): CamposPorTipo {
  const campos = camposVazios();
  if (!ehObjeto(guardados)) return campos;

  for (const tipo of Object.keys(campos) as (keyof CamposPorTipo)[]) {
    const doTipo = guardados[tipo];
    if (!ehObjeto(doTipo)) continue;
    const destino = campos[tipo] as Record<string, unknown>;
    for (const campo of Object.keys(destino)) {
      const valor = doTipo[campo];
      if (typeof valor !== typeof destino[campo]) continue;
      const escolhas = ESCOLHAS[`${tipo}.${campo}`];
      if (escolhas && !escolhas.includes(valor as string)) continue;
      destino[campo] = valor;
    }
  }
  return campos;
}

/** O estado guardado no texto, ou `null` se não há nada aproveitável (a página abre vazia). */
export function lerEstadoDoTexto(texto: string | null): EstadoQr | null {
  if (!texto) return null;
  let guardado: unknown;
  try {
    guardado = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!ehObjeto(guardado)) return null;

  const vazio = estadoVazio();
  return {
    tipo: TIPOS.find((t) => t.id === guardado.tipo)?.id ?? null,
    campos: lerCampos(guardado.campos),
    cor: typeof guardado.cor === 'string' && /^#[0-9a-f]{6}$/i.test(guardado.cor) ? guardado.cor : COR_PADRAO,
    frase: typeof guardado.frase === 'string' ? guardado.frase : vazio.frase,
    nomeDoNegocio: typeof guardado.nomeDoNegocio === 'string' ? guardado.nomeDoNegocio : vazio.nomeDoNegocio,
    tamanho: guardado.tamanho === 'A4' || guardado.tamanho === 'A6' ? guardado.tamanho : vazio.tamanho,
  };
}

/** O texto guardado, ou `null` se não há ou o navegador não deixa ler. */
export function lerTextoGuardado(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_DO_QR);
  } catch {
    return null;
  }
}

export function lerEstado(): EstadoQr | null {
  return lerEstadoDoTexto(lerTextoGuardado());
}

export function gravarEstado(estado: EstadoQr): void {
  try {
    window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify(estado));
  } catch {
    // Cota cheia ou armazenamento bloqueado: a pessoa segue usando a página, só não volta com os dados.
  }
}

export function apagarEstado(): void {
  try {
    window.localStorage.removeItem(CHAVE_DO_QR);
  } catch {
    // ver `gravarEstado`
  }
}

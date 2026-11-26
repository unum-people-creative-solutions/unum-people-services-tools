// O que o gerador de link do WhatsApp guarda no aparelho (RF-LW-21, DT-LW-07): só o número e a mensagem,
// como foram digitados. Toda leitura e escrita fica dentro de try/catch: armazenamento bloqueado ou cheio
// não pode derrubar a tela. Mesmo padrão de `utils/qr/armazenamento.ts`.

import { LIMITE_DA_MENSAGEM } from './mensagens';

export const CHAVE_DO_LINK = 'tools-link-whatsapp:v1';

export interface LinkGuardado {
  numero: string;
  mensagem: string;
}

/** O estado guardado no texto, ou `null` se não há nada aproveitável (a página abre vazia). */
export function lerLinkDoTexto(texto: string | null): LinkGuardado | null {
  if (!texto) return null;
  let guardado: unknown;
  try {
    guardado = JSON.parse(texto);
  } catch {
    return null;
  }
  if (typeof guardado !== 'object' || guardado === null || Array.isArray(guardado)) return null;

  const { numero, mensagem } = guardado as Record<string, unknown>;
  // Só entra o que é texto; sem nenhum dos dois, não há o que restaurar.
  if (typeof numero !== 'string' && typeof mensagem !== 'string') return null;
  return {
    numero: typeof numero === 'string' ? numero : '',
    mensagem: typeof mensagem === 'string' ? mensagem.slice(0, LIMITE_DA_MENSAGEM) : '',
  };
}

/** O texto guardado, ou `null` se não há ou o navegador não deixa ler. */
export function lerTextoDoLink(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_DO_LINK);
  } catch {
    return null;
  }
}

export function lerLink(): LinkGuardado | null {
  return lerLinkDoTexto(lerTextoDoLink());
}

export function gravarLink({ numero, mensagem }: LinkGuardado): void {
  try {
    window.localStorage.setItem(CHAVE_DO_LINK, JSON.stringify({ numero, mensagem }));
  } catch {
    // Cota cheia ou armazenamento bloqueado: a pessoa segue usando a página, só não volta com os dados.
  }
}

export function apagarLink(): void {
  try {
    window.localStorage.removeItem(CHAVE_DO_LINK);
  } catch {
    // ver `gravarLink`
  }
}

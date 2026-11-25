// O que a tela do gerador guarda (e o que o `localStorage` guarda, em UI-005).
// Cor, frase, nome do negócio e tamanho já têm lugar aqui para a F2 usar sem mexer no formato.
// O logo NUNCA entra neste estado: fica só na memória da página (DT-QR-11).

import { camposVazios, chamadaDoTipo, montarConteudo, type CamposPorTipo, type ResultadoConteudo, type TipoId } from './conteudos';

export type TamanhoDaPlaquinha = 'A6' | 'A4';

export interface EstadoQr {
  /** `null` = a pessoa ainda não escolheu o tipo. */
  tipo: TipoId | null;
  /** Campos de TODOS os tipos: trocar de tipo não apaga nada. */
  campos: CamposPorTipo;
  /** F2: cor dos módulos (`#rrggbb`). */
  cor: string;
  /** F2: frase embaixo do QR; vazia = sem frase. */
  frase: string;
  /** F2: nome do negócio na plaquinha. */
  nomeDoNegocio: string;
  /** F2: tamanho da plaquinha. */
  tamanho: TamanhoDaPlaquinha;
}

export const COR_PADRAO = '#000000';

export function estadoVazio(): EstadoQr {
  return {
    tipo: null,
    campos: camposVazios(),
    cor: COR_PADRAO,
    frase: '',
    nomeDoNegocio: '',
    tamanho: 'A6',
  };
}

/** Conteúdo do QR do tipo escolhido, ou `null` se ainda não há tipo. */
export function conteudoDe(estado: EstadoQr): ResultadoConteudo | null {
  if (!estado.tipo) return null;
  return montarConteudo(estado.tipo, estado.campos[estado.tipo]);
}

/** Chamada do tipo escolhido (a frase sugerida), ou `null` se ainda não há tipo. */
export function chamadaDoEstado(estado: EstadoQr): string | null {
  if (!estado.tipo) return null;
  return chamadaDoTipo(estado.tipo, estado.campos[estado.tipo]);
}

/**
 * A frase embaixo do QR nasce com a chamada do tipo (RF-QR-35). Se a pessoa não mexeu nela e a
 * mudança (outro tipo, outra rede) troca a chamada, a frase acompanha. Frase escrita pela pessoa
 * não é tocada.
 */
export function acompanharChamada(antes: EstadoQr, depois: EstadoQr): EstadoQr {
  if (depois.frase !== antes.frase || antes.frase === '') return depois;
  if (antes.frase !== chamadaDoEstado(antes)) return depois;
  const nova = chamadaDoEstado(depois);
  return nova === null ? depois : { ...depois, frase: nova };
}

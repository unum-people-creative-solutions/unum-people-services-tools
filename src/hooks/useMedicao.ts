'use client';

import { useCallback, useRef, useState } from 'react';

export type Ferramenta = 'home' | 'quanto-cobrar' | 'vale-anunciar' | 'servicos-compensam' | 'qr-code';
export type EventoDeUso = 'visita' | 'comecou' | 'resultado' | 'convite' | 'guia' | 'planilha' | 'baixou';

/** Única origem que a API de medição aceita (`TOOLS_ORIGENS` da Lambda de jornada). */
export const ORIGEM_DA_MEDICAO = 'https://tools.unumpeople.com.br';

/** Igualdade exata (sem `includes`, `endsWith` nem regex): origens parecidas não medem. */
export function origemPodeMedir(origem: string): boolean {
  return origem === ORIGEM_DA_MEDICAO;
}

/**
 * Medição de uso: uma soma por dia no servidor, sem saber quem usou (privacidade, "O que contamos").
 * Cada evento é enviado uma vez por carregamento da página: o controle é um Set na memória do
 * componente. Nunca grava em localStorage nem em sessionStorage.
 *
 * `resultado` só conta depois de `comecou` na mesma carga da página: quem volta com dados salvos e só
 * olha o resultado não conta nenhum dos dois, e o funil nunca tem mais "viram o resultado" do que
 * "começaram". Por isso o hook devolve `comecou` (estado): a View reavalia a condição do resultado
 * quando ele muda, e o resultado já visível é marcado logo depois do `comecou`.
 *
 * A origem da página também é conferida: a API só aceita `ORIGEM_DA_MEDICAO`, e em qualquer outro
 * endereço (prévia de PR, `*.vercel.app`, `next dev`) o envio só geraria recusa no log. Fora dela nada
 * sai, mas `comecou` continua valendo, porque a interface depende dele.
 */
export function useMedicao(ferramenta: Ferramenta) {
  const jaEnviados = useRef<Set<EventoDeUso>>(new Set());
  const [comecou, setComecou] = useState(false);

  const marcar = useCallback(
    (evento: EventoDeUso) => {
      if (jaEnviados.current.has(evento)) return;
      // O resultado de quem ainda não começou nada nesta carga não conta (ver o comentário do hook).
      if (evento === 'resultado' && !jaEnviados.current.has('comecou')) return;
      jaEnviados.current.add(evento);
      if (evento === 'comecou') setComecou(true);

      // Lida na hora do envio (o Next a troca pelo valor no build; os testes a definem a cada caso).
      const url = process.env.NEXT_PUBLIC_TOOLS_USO_URL;
      if (!url) return;
      if (typeof window === 'undefined' || !origemPodeMedir(window.location.origin)) return;

      // O silêncio dos catch abaixo é intencional: é medição, não ação do usuário. Se o envio falhar
      // (bloqueador de rastreio, sem rede, navegador antigo), não há nada a mostrar nem a refazer, e
      // um erro aqui nunca pode atrapalhar a conta que a pessoa veio fazer. Perder uma contagem é aceito.
      try {
        const corpo = JSON.stringify({ f: ferramenta, e: evento });
        if (
          typeof navigator !== 'undefined' &&
          typeof navigator.sendBeacon === 'function' &&
          navigator.sendBeacon(url, new Blob([corpo], { type: 'text/plain' }))
        ) {
          return;
        }
        // Sem sendBeacon (ou ele recusou): text/plain com no-cors não gera preflight de CORS.
        fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          keepalive: true,
          headers: { 'Content-Type': 'text/plain' },
          body: corpo,
        }).catch(() => undefined);
      } catch {
        // ver o comentário acima
      }
    },
    [ferramenta],
  );

  return { marcar, comecou };
}

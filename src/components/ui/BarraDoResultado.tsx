'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface BarraDoResultadoProps {
  /** Ex.: "Preço mínimo". */
  rotulo: string;
  /** O mesmo valor do cartão de resultado, já formatado (ou "Falta pouco"). */
  valor: string;
  /** Id do elemento do cartão de resultado... */
  alvoId?: string;
  /** ...ou um ref para ele. */
  alvo?: React.RefObject<HTMLElement | null>;
}

/**
 * Barra fixa no rodapé da tela: rótulo, valor e "Ver resultado". Some enquanto o
 * alvo está visível (IntersectionObserver); o botão rola até ele.
 */
export function BarraDoResultado({ rotulo, valor, alvoId, alvo }: BarraDoResultadoProps) {
  const [alvoVisivel, setAlvoVisivel] = React.useState(false);

  const acharAlvo = () => alvo?.current ?? (alvoId ? document.getElementById(alvoId) : null);

  React.useEffect(() => {
    const elemento = alvo?.current ?? (alvoId ? document.getElementById(alvoId) : null);
    if (!elemento || typeof IntersectionObserver === 'undefined') return;
    const observador = new IntersectionObserver((entradas) => {
      const ultima = entradas[entradas.length - 1];
      if (ultima) setAlvoVisivel(ultima.isIntersecting);
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [alvo, alvoId]);

  if (alvoVisivel) return null;

  const rolar = () => {
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    acharAlvo()?.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-ui-canvas text-white">
      <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3 px-5 py-3.5">
        <span className="flex flex-col">
          <span className="text-xs text-ui-muted-on-canvas">{rotulo}</span>
          <strong className="text-xl font-bold [font-variant-numeric:tabular-nums]">{valor}</strong>
        </span>
        <button
          type="button"
          onClick={rolar}
          className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4d7cff]"
        >
          Ver resultado
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

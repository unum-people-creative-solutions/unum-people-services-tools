'use client';

import { useEffect, useState } from 'react';
import type { MatrizQr } from '../utils/qr/matriz';
import { gerarPng, type LogoParaDesenhar, type OpcoesDoPng } from '../utils/qr/png';

/** Espera depois da última mudança antes de gerar o PNG (a pessoa digita, o PNG não precisa acompanhar cada letra). */
export const ATRASO_DO_PNG_MS = 150;

export type OpcoesDoPngPronto = Omit<OpcoesDoPng, 'lado' | 'x' | 'y'>;

export type PngPronto =
  | { situacao: 'preparando'; arquivo: null }
  | { situacao: 'pronto'; arquivo: File }
  | { situacao: 'falhou'; arquivo: null };

type Resultado = { matriz: MatrizQr; cor: string; frase?: string; logo?: LogoParaDesenhar; arquivo: File | null };

/**
 * Gera o PNG do QR assim que ele fica pronto e de novo a cada mudança (com atraso curto), para que o
 * botão "Compartilhar" chame `navigator.share` com o File já em mãos. O Safari do iPhone recusa o
 * compartilhamento quando há uma espera entre o toque e a chamada (RT-QR-1).
 *
 * O PNG é regenerado quando muda a matriz, a cor, a frase ou o logo (o objeto do logo precisa ser o mesmo
 * entre renders enquanto ele não muda).
 */
export function usePngPronto(matriz: MatrizQr, desenho: OpcoesDoPngPronto, nomeDoArquivo: string): PngPronto {
  const { cor, frase, logo } = desenho;
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    let atual = true;
    const espera = setTimeout(() => {
      gerarPng(matriz, { cor, frase, logo })
        .then((png) => new File([png], nomeDoArquivo, { type: 'image/png' }))
        .catch(() => null)
        .then((arquivo) => {
          // Um PNG de um desenho que já mudou não toma o lugar do mais novo.
          if (atual) setResultado({ matriz, cor, frase, logo, arquivo });
        });
    }, ATRASO_DO_PNG_MS);
    return () => {
      atual = false;
      clearTimeout(espera);
    };
  }, [matriz, cor, frase, logo, nomeDoArquivo]);

  // O resultado só vale para o desenho de que veio; a qualquer mudança, volta a "preparando".
  const vale =
    resultado !== null &&
    resultado.matriz === matriz &&
    resultado.cor === cor &&
    resultado.frase === frase &&
    resultado.logo === logo;
  if (!resultado || !vale) return { situacao: 'preparando', arquivo: null };
  if (!resultado.arquivo) return { situacao: 'falhou', arquivo: null };
  return { situacao: 'pronto', arquivo: resultado.arquivo };
}

'use client';

import React from 'react';
import { Botao } from '../ui/Botao';
import { Recolhivel } from '../ui/Recolhivel';
import { TIPOS, type TipoId } from '../../utils/qr/conteudos';
import type { MatrizQr } from '../../utils/qr/matriz';
import { baixarArquivo, nomeDoArquivoDoQr } from '../../utils/qr/arquivo';
import { gerarPng } from '../../utils/qr/png';
import { usePngPronto, type OpcoesDoPngPronto } from '../../hooks/usePngPronto';

export const ERRO_AO_COMPARTILHAR = 'Não deu para compartilhar. Use Baixar imagem.';
export const ERRO_AO_BAIXAR_A_IMAGEM = 'Não deu para baixar a imagem. Tente de novo.';

interface AcoesDoQrProps {
  tipo: TipoId;
  matriz: MatrizQr;
  /** SVG igual ao da prévia. */
  svg: string;
  /** O que o PNG desenha além da matriz: cor, e na F2 frase e logo. */
  desenho: OpcoesDoPngPronto;
  /** Compartilhou, baixou o PNG ou baixou o SVG (medição `baixou`). */
  aoBaixar: () => void;
}

/** O suporte a compartilhar não muda durante a visita: não há o que assinar. */
const semAssinatura = () => () => undefined;

/** Pergunta ao navegador se ele compartilha arquivo de imagem (RF-QR-25). */
function podeCompartilharArquivo(): boolean {
  try {
    if (typeof navigator.canShare !== 'function') return false;
    const arquivoDeTeste = new File([''], 'qr-code.png', { type: 'image/png' });
    return navigator.canShare({ files: [arquivoDeTeste] });
  } catch {
    return false;
  }
}

/** Passo 3, ações: Compartilhar (só onde existe), Baixar imagem e, em "Mais formatos", o SVG. */
export function AcoesDoQr({ tipo, matriz, svg, desenho, aoBaixar }: AcoesDoQrProps) {
  // No servidor não há `navigator`: lá vale `false`, e o navegador confere depois de montar.
  const podeCompartilhar = React.useSyncExternalStore(semAssinatura, podeCompartilharArquivo, () => false);
  const [ocupado, setOcupado] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  // O PNG é feito antes do toque: o compartilhamento do iPhone exige o File em mãos dentro do gesto (RT-QR-1).
  const nomeDoPng = nomeDoArquivoDoQr(tipo, 'png');
  const nomeDoTipo = TIPOS.find((t) => t.id === tipo)?.nome ?? '';
  const png = usePngPronto(matriz, desenho, nomeDoPng);
  const preparando = png.situacao === 'preparando';
  // PNG que não saiu: o erro aparece já (o botão de baixar tenta de novo); nada fica em silêncio.
  const mensagemDeErro = erro ?? (podeCompartilhar && png.situacao === 'falhou' ? ERRO_AO_COMPARTILHAR : null);

  const executar = async (acao: () => Promise<void>, mensagemDeErro: string) => {
    setErro(null);
    setOcupado(true);
    try {
      await acao();
    } catch (e) {
      // Cancelar o compartilhamento não é falha.
      if ((e as { name?: string } | null)?.name === 'AbortError') return;
      setErro(mensagemDeErro);
    } finally {
      setOcupado(false);
    }
  };

  // Sem `await` antes de `share`: o navegador conta o toque do usuário só até a primeira espera.
  const compartilhar = () => {
    if (!png.arquivo) return;
    setErro(null);
    setOcupado(true);
    let promessa: Promise<void>;
    try {
      promessa = navigator.share({ files: [png.arquivo], title: `QR code de ${nomeDoTipo}` });
    } catch (e) {
      promessa = Promise.reject(e);
    }
    promessa
      .then(aoBaixar)
      .catch((e) => {
        // Cancelar o compartilhamento não é falha.
        if ((e as { name?: string } | null)?.name !== 'AbortError') setErro(ERRO_AO_COMPARTILHAR);
      })
      .finally(() => setOcupado(false));
  };

  const baixarImagem = () =>
    executar(async () => {
      // Se o PNG antecipado falhou, tenta de novo agora; o erro dessa tentativa aparece na tela.
      baixarArquivo(png.arquivo ?? (await gerarPng(matriz, desenho)), nomeDoPng);
      aoBaixar();
    }, ERRO_AO_BAIXAR_A_IMAGEM);

  const baixarSvg = () =>
    executar(async () => {
      baixarArquivo(new Blob([svg], { type: 'image/svg+xml' }), nomeDoArquivoDoQr(tipo, 'svg'));
      aoBaixar();
    }, ERRO_AO_BAIXAR_A_IMAGEM);

  return (
    <div className="flex flex-col gap-3">
      {podeCompartilhar && (
        <Botao className="w-full" disabled={ocupado || !png.arquivo} onClick={compartilhar}>
          {preparando ? 'Preparando para compartilhar…' : 'Compartilhar'}
        </Botao>
      )}
      <Botao
        variante={podeCompartilhar ? 'contorno' : 'principal'}
        className="w-full"
        disabled={ocupado || preparando}
        onClick={baixarImagem}
      >
        Baixar imagem
      </Botao>
      {mensagemDeErro && (
        <p role="alert" className="m-0 text-sm font-medium leading-[1.45] text-ui-erro">
          {mensagemDeErro}
        </p>
      )}
      <Recolhivel titulo="Mais formatos" variante="linha">
        <Botao variante="contorno" className="w-full" disabled={ocupado} onClick={baixarSvg}>
          Baixar SVG (para gráfica)
        </Botao>
      </Recolhivel>
    </div>
  );
}

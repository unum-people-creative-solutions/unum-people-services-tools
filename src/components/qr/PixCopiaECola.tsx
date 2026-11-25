'use client';

import React from 'react';
import { Botao } from '../ui/Botao';

export const AVISO_DO_PIX =
  'Teste antes de imprimir: leia o QR com o app do seu banco e confira se aparece o seu nome. O nome que o cliente vê vem do banco, não do QR code.';

export const DICA_DO_CPF =
  'Dica: a chave aleatória não mostra o seu CPF no balcão. Você cria uma no app do banco.';

/** Aviso fixo do Pix (RF-QR-22). */
export function AvisoDoPix() {
  return (
    <p className="m-0 rounded-lg bg-ui-atencao-bg p-3.5 text-sm leading-[1.5] text-ui-ink">{AVISO_DO_PIX}</p>
  );
}

type Situacao = 'parado' | 'copiado' | 'falhou';

/**
 * Pix copia e cola (RF-QR-21). O pai deve usar o código como `key`: ao mudar o código, o
 * aviso de "copiado" de antes some.
 */
export function PixCopiaECola({ codigo }: { codigo: string }) {
  const idTitulo = React.useId();
  const [situacao, setSituacao] = React.useState<Situacao>('parado');

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setSituacao('copiado');
    } catch {
      setSituacao('falhou');
    }
  };

  return (
    <section
      aria-labelledby={idTitulo}
      className="flex flex-col gap-3 rounded-xl border border-ui-line bg-ui-bg p-5"
    >
      <h2 id={idTitulo} className="m-0 text-lg font-semibold text-ui-ink">
        Pix copia e cola
      </h2>
      <p className="m-0 select-all break-all rounded-lg bg-ui-surface p-3 font-mono text-[13px] leading-[1.45] text-ui-ink">
        {codigo}
      </p>
      <Botao variante="contorno" onClick={copiar}>
        Copiar código
      </Botao>
      {situacao === 'copiado' && (
        <p role="status" className="m-0 text-sm font-medium text-ui-ok">
          Código copiado.
        </p>
      )}
      {situacao === 'falhou' && (
        <p role="alert" className="m-0 text-sm font-medium text-ui-erro">
          Não deu para copiar. Toque e segure no código para copiar.
        </p>
      )}
    </section>
  );
}

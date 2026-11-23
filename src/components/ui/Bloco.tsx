import React from 'react';

interface BlocoProps {
  /** Número do passo (sequência real). Omitido, não mostra a pastilha. */
  numero?: number;
  titulo: string;
  /** Frase de apoio embaixo do título. */
  apoio?: string;
  children: React.ReactNode;
}

export function Bloco({ numero, titulo, apoio, children }: BlocoProps) {
  const idTitulo = React.useId();

  return (
    <section
      aria-labelledby={idTitulo}
      className="flex flex-col gap-[18px] rounded-xl border border-ui-line bg-ui-bg p-5"
    >
      <div className="flex items-start gap-3">
        {numero !== undefined && (
          <span
            aria-hidden="true"
            className="flex size-7 flex-none items-center justify-center rounded-lg bg-ui-brand-blue text-sm font-semibold text-white"
          >
            {numero}
          </span>
        )}
        <div className="flex flex-1 flex-col gap-0.5">
          <h2 id={idTitulo} className="m-0 text-lg font-semibold tracking-[-0.01em] text-ui-ink">
            {titulo}
          </h2>
          {apoio && <p className="m-0 text-sm leading-[1.45] text-ui-muted">{apoio}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

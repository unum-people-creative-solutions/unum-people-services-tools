import React from 'react';
import clsx from 'clsx';

export type Estado = 'falta' | 'saudavel' | 'sobra-pouco' | 'prejuizo';

interface EstadoDoResultadoProps {
  estado: Estado;
  /** A frase do estado, logo depois do selo. */
  frase?: React.ReactNode;
  /** Linhas extras (ex.: "Sobra no bolso R$ 81,25"), depois da frase. */
  children?: React.ReactNode;
}

const selo: Record<Exclude<Estado, 'falta'>, { texto: string; caixa: string; selo: string }> = {
  saudavel: { texto: 'Saudável', caixa: 'bg-ui-ok-bg', selo: 'bg-ui-ok' },
  'sobra-pouco': { texto: 'Sobra pouco', caixa: 'bg-ui-atencao-bg', selo: 'bg-ui-atencao' },
  prejuizo: { texto: 'Prejuízo', caixa: 'bg-ui-erro-bg', selo: 'bg-ui-erro' },
};

/** O estado vem escrito no selo, nunca só na cor. */
export function EstadoDoResultado({ estado, frase, children }: EstadoDoResultadoProps) {
  if (estado === 'falta') {
    return (
      <div
        role="status"
        className="flex flex-col gap-1.5 rounded-[10px] border border-dashed border-[#c9cbe0] bg-ui-bg p-3.5"
      >
        <strong className="text-[15px] font-semibold text-ui-ink">Falta pouco</strong>
        {frase && <span className="text-sm leading-[1.45] text-ui-muted">{frase}</span>}
        {children}
      </div>
    );
  }

  const visual = selo[estado];
  return (
    <div role="status" className={clsx('flex flex-col gap-2 rounded-[10px] p-3.5', visual.caixa)}>
      <span
        className={clsx(
          'self-start rounded-full px-2.5 py-[3px] text-[13px] font-semibold text-white',
          visual.selo,
        )}
      >
        {visual.texto}
      </span>
      {frase && <span className="text-sm leading-[1.45] text-ui-ink">{frase}</span>}
      {children}
    </div>
  );
}

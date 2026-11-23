import React from 'react';
import clsx from 'clsx';

interface RecolhivelProps {
  titulo: string;
  /** Aberto de início. Se mudar para `true` depois (dados carregados), abre. */
  aberto?: boolean;
  /** `simples` (sem moldura), `linha` (filete em cima) ou `cartao` (moldura própria). */
  variante?: 'simples' | 'linha' | 'cartao';
  children: React.ReactNode;
}

const porVariante = {
  simples: '',
  linha: 'border-t border-ui-line pt-3.5',
  cartao: 'rounded-xl border border-ui-line bg-ui-bg px-5 py-1',
} as const;

export function Recolhivel({ titulo, aberto, variante = 'simples', children }: RecolhivelProps) {
  return (
    <details open={aberto} className={clsx(porVariante[variante])}>
      <summary
        className={clsx(
          'flex cursor-pointer items-center text-[15px] font-medium text-ui-brand-blue',
          variante === 'cartao' ? 'min-h-[52px] text-base font-semibold text-ui-ink' : 'min-h-11',
        )}
      >
        {titulo}
      </summary>
      <div className="pb-3 pt-1">{children}</div>
    </details>
  );
}

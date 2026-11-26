'use client';

import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

interface CampoDoNumeroProps {
  valor: string;
  onChange: (valor: string) => void;
  onBlur: () => void;
  /** Motivo de o número não servir (RF-LW-07); só vem preenchido quando já é hora de mostrar. */
  erro?: string;
  /** Número formatado quando ele é aceito (RF-LW-06). */
  entendido?: string;
}

/** Bloco 1 (RF-LW-04): o número com DDD, com o erro ou a confirmação embaixo do campo. */
export function CampoDoNumero({ valor, onChange, onBlur, erro, entendido }: CampoDoNumeroProps) {
  const id = React.useId();
  const idDoTexto = `${id}-texto`;
  const temTexto = Boolean(erro || entendido);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium text-ui-ink">
        Número com DDD
      </label>
      <div
        className={clsx(
          'flex items-center gap-2 rounded-lg bg-ui-bg px-3.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ui-brand-blue',
          erro ? 'border-2 border-ui-erro' : 'border border-ui-line-strong',
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="tel"
          autoComplete="tel-national"
          value={valor}
          placeholder="(11) 98765-4321"
          aria-invalid={erro ? true : undefined}
          aria-describedby={temTexto ? idDoTexto : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="h-12 min-w-0 flex-1 border-0 bg-transparent text-base text-ui-ink outline-none placeholder:text-ui-muted"
        />
      </div>
      {erro && (
        <p id={idDoTexto} className="m-0 text-[13px] font-medium leading-[1.45] text-ui-erro">
          {erro}
        </p>
      )}
      {!erro && entendido && (
        <p id={idDoTexto} className="m-0 flex items-start gap-1.5 text-[14px] font-medium leading-[1.45] text-ui-ok">
          <Check size={16} aria-hidden="true" className="mt-0.5 flex-none" />
          <span>O cliente vai chamar {entendido}</span>
        </p>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import clsx from 'clsx';
import { LIMITE_DA_MENSAGEM, MENSAGENS_PRONTAS } from '../../utils/linkWhatsapp/mensagens';

interface MensagemDoClienteProps {
  valor: string;
  onChange: (valor: string) => void;
}

/** Bloco 2 (RF-LW-09, RF-LW-10): mensagens prontas, o campo da mensagem e o contador. */
export function MensagemDoCliente({ valor, onChange }: MensagemDoClienteProps) {
  const id = React.useId();
  const idDoContador = `${id}-contador`;
  const campo = React.useRef<HTMLTextAreaElement>(null);
  const [pedidosDeFoco, setPedidosDeFoco] = React.useState(0);

  // Depois de tocar num atalho o foco vai para o fim do texto novo. Fica num efeito porque o valor
  // só chega ao campo depois da renderização.
  React.useEffect(() => {
    if (pedidosDeFoco === 0 || !campo.current) return;
    const fim = campo.current.value.length;
    campo.current.focus();
    campo.current.setSelectionRange(fim, fim);
  }, [pedidosDeFoco]);

  const escolher = (texto: string) => {
    onChange(texto);
    setPedidosDeFoco((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <span id={`${id}-prontas`} className="text-[15px] font-medium text-ui-ink">
          Mensagens prontas
        </span>
        <div role="group" aria-labelledby={`${id}-prontas`} className="flex flex-wrap gap-2">
          {MENSAGENS_PRONTAS.map(({ rotulo, texto }) => {
            const marcado = valor === texto;
            return (
              <button
                key={rotulo}
                type="button"
                aria-pressed={marcado}
                onClick={() => escolher(texto)}
                className={clsx(
                  'inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] px-4 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand-blue',
                  marcado
                    ? 'border-ui-brand-blue bg-ui-brand-blue text-white'
                    : 'border-ui-line-strong bg-ui-bg text-ui-ink hover:border-ui-brand-blue',
                )}
              >
                {rotulo}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-[15px] font-medium text-ui-ink">
          Mensagem (opcional)
        </label>
        <div className="flex items-start rounded-lg border border-ui-line-strong bg-ui-bg px-3.5 py-2.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ui-brand-blue">
          <textarea
            ref={campo}
            id={id}
            rows={4}
            maxLength={LIMITE_DA_MENSAGEM}
            value={valor}
            aria-describedby={idDoContador}
            onChange={(e) => onChange(e.target.value)}
            className="min-w-0 flex-1 resize-y border-0 bg-transparent text-base text-ui-ink outline-none"
          />
        </div>
        <p id={idDoContador} className="m-0 text-right text-[13px] leading-[1.45] text-ui-muted">
          {valor.length} de {LIMITE_DA_MENSAGEM}
        </p>
      </div>
    </div>
  );
}

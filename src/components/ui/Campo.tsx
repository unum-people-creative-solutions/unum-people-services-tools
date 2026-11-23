'use client';

import React from 'react';
import clsx from 'clsx';
import { formatarNumero, lerNumero } from '../../utils/numeros';

interface Base {
  rotulo: string;
  /** Ajuda sempre visível embaixo do rótulo, ligada por aria-describedby. */
  ajuda?: string;
  /** Mensagem de erro (liga aria-invalid e aria-describedby). */
  erro?: string;
  /** `grande` = 52 px, usado no campo do resultado. */
  tamanho?: 'normal' | 'grande';
  id?: string;
}

interface CampoProps extends Base {
  valor: number;
  onChange: (valor: number) => void;
  /** Texto fixo antes do número, ex.: "R$". Com "R$", o número mostra 2 casas. */
  prefixo?: string;
  /** Texto fixo depois do número, ex.: "%". */
  sufixo?: string;
}

interface CampoTextoProps extends Base {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}

const caixa = (erro: boolean, tamanho: 'normal' | 'grande') =>
  clsx(
    'flex items-center gap-2 rounded-lg bg-ui-bg px-3.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ui-brand-blue',
    tamanho === 'grande' ? 'h-[52px]' : 'h-12',
    erro ? 'border-2 border-ui-erro' : 'border border-ui-line-strong',
  );

const entrada = (tamanho: 'normal' | 'grande') =>
  clsx(
    'min-w-0 flex-1 border-0 bg-transparent text-ui-ink outline-none [font-variant-numeric:tabular-nums]',
    tamanho === 'grande' ? 'text-lg font-semibold' : 'text-base',
  );

function Estrutura({
  id,
  rotulo,
  ajuda,
  erro,
  children,
}: Pick<Base, 'rotulo' | 'ajuda' | 'erro'> & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium text-ui-ink">
        {rotulo}
      </label>
      {ajuda && (
        <p id={`${id}-ajuda`} className="m-0 text-[13px] leading-[1.45] text-ui-muted">
          {ajuda}
        </p>
      )}
      {children}
      {erro && (
        <p id={`${id}-erro`} className="m-0 text-[13px] font-medium leading-[1.45] text-ui-erro">
          {erro}
        </p>
      )}
    </div>
  );
}

const descricao = (id: string, ajuda?: string, erro?: string) => {
  const ids = [ajuda && `${id}-ajuda`, erro && `${id}-erro`].filter(Boolean).join(' ');
  return ids || undefined;
};

/**
 * Campo numérico controlado em pt-BR. Sem foco mostra o número formatado
 * ("3.000,00" com prefixo R$, "2,5" nos demais); em foco aceita a digitação
 * com vírgula e devolve o número em `onChange`.
 */
export function Campo({
  rotulo,
  ajuda,
  erro,
  tamanho = 'normal',
  id: idExterno,
  valor,
  onChange,
  prefixo,
  sufixo,
}: CampoProps) {
  const idGerado = React.useId();
  const id = idExterno ?? idGerado;
  // null = sem foco: mostra o valor formatado; texto = o que está sendo digitado
  const [digitando, setDigitando] = React.useState<string | null>(null);

  const formatado = formatarNumero(valor, prefixo === 'R$' ? 2 : undefined);

  return (
    <Estrutura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <div className={caixa(Boolean(erro), tamanho)}>
        {prefixo && (
          <span aria-hidden="true" className="text-[15px] text-ui-muted">
            {prefixo}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={digitando ?? formatado}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao(id, ajuda, erro)}
          onFocus={() => setDigitando(valor === 0 ? '' : String(valor).replace('.', ','))}
          onChange={(e) => {
            setDigitando(e.target.value);
            onChange(lerNumero(e.target.value));
          }}
          onBlur={() => setDigitando(null)}
          className={entrada(tamanho)}
        />
        {sufixo && (
          <span aria-hidden="true" className="text-[15px] text-ui-muted">
            {sufixo}
          </span>
        )}
      </div>
    </Estrutura>
  );
}

/** Campo de texto livre (ex.: nome do serviço), com o mesmo visual do `Campo`. */
export function CampoTexto({
  rotulo,
  ajuda,
  erro,
  tamanho = 'normal',
  id: idExterno,
  valor,
  onChange,
  placeholder,
}: CampoTextoProps) {
  const idGerado = React.useId();
  const id = idExterno ?? idGerado;

  return (
    <Estrutura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <div className={caixa(Boolean(erro), tamanho)}>
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={valor}
          placeholder={placeholder}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao(id, ajuda, erro)}
          onChange={(e) => onChange(e.target.value)}
          className={entrada(tamanho)}
        />
      </div>
    </Estrutura>
  );
}

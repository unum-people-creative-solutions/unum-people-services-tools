'use client';

import React from 'react';
import clsx from 'clsx';

// Campos do gerador de QR code. Mesmo visual do `Campo` (tokens `ui-*`), mas com o que o
// gerador precisa e o `Campo` não tem: texto livre com onBlur, aviso embaixo, lista e caixa.

interface Base {
  rotulo: string;
  /** Ajuda sempre visível embaixo do rótulo, ligada por aria-describedby. */
  ajuda?: string;
  /** Erro embaixo do campo (liga aria-invalid e aria-describedby). */
  erro?: string;
  /** Aviso embaixo do campo que não impede o QR (ex.: texto cortado no Pix). */
  aviso?: string;
}

interface CampoTextoQrProps extends Base {
  valor: string;
  onChange: (valor: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  /** Texto fixo antes do valor, ex.: "R$". */
  prefixo?: string;
  disabled?: boolean;
  /** Limite de caracteres do campo. */
  maxLength?: number;
}

interface CampoAreaQrProps extends Base {
  valor: string;
  onChange: (valor: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** Texto embaixo da área, ex.: o contador de caracteres. */
  rodape?: string;
}

interface CampoListaQrProps extends Base {
  valor: string;
  onChange: (valor: string) => void;
  onBlur?: () => void;
  opcoes: readonly { id: string; nome: string }[];
}

const caixa = (erro: boolean, desligado = false) =>
  clsx(
    'flex items-center gap-2 rounded-lg bg-ui-bg px-3.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ui-brand-blue',
    erro ? 'border-2 border-ui-erro' : 'border border-ui-line-strong',
    desligado && 'opacity-50',
  );

const entrada = 'min-w-0 flex-1 border-0 bg-transparent text-base text-ui-ink outline-none placeholder:text-ui-muted';

function Estrutura({
  id,
  rotulo,
  ajuda,
  aviso,
  erro,
  rodape,
  children,
}: Base & { id: string; rodape?: string; children: React.ReactNode }) {
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
      {rodape && (
        <p id={`${id}-rodape`} className="m-0 text-[13px] leading-[1.45] text-ui-muted">
          {rodape}
        </p>
      )}
      {aviso && (
        <p id={`${id}-aviso`} className="m-0 text-[13px] leading-[1.45] text-ui-atencao">
          {aviso}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className="m-0 text-[13px] font-medium leading-[1.45] text-ui-erro">
          {erro}
        </p>
      )}
    </div>
  );
}

const descricao = (id: string, { ajuda, aviso, erro }: Base, rodape?: string) =>
  [ajuda && `${id}-ajuda`, rodape && `${id}-rodape`, aviso && `${id}-aviso`, erro && `${id}-erro`]
    .filter(Boolean)
    .join(' ') || undefined;

export function CampoTextoQr(props: CampoTextoQrProps) {
  const id = React.useId();
  const { valor, onChange, onBlur, placeholder, inputMode, prefixo, disabled, maxLength } = props;
  return (
    <Estrutura id={id} {...props}>
      <div className={caixa(Boolean(props.erro), disabled)}>
        {prefixo && (
          <span aria-hidden="true" className="text-[15px] text-ui-muted">
            {prefixo}
          </span>
        )}
        <input
          id={id}
          type="text"
          autoComplete="off"
          inputMode={inputMode}
          value={valor}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={props.erro ? true : undefined}
          aria-describedby={descricao(id, props)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={clsx(entrada, 'h-12')}
        />
      </div>
    </Estrutura>
  );
}

export function CampoAreaQr(props: CampoAreaQrProps) {
  const id = React.useId();
  const { valor, onChange, onBlur, placeholder, rodape } = props;
  return (
    <Estrutura id={id} {...props}>
      <div className={clsx(caixa(Boolean(props.erro)), 'items-start py-2.5')}>
        <textarea
          id={id}
          rows={4}
          value={valor}
          placeholder={placeholder}
          aria-invalid={props.erro ? true : undefined}
          aria-describedby={descricao(id, props, rodape)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={clsx(entrada, 'resize-y')}
        />
      </div>
    </Estrutura>
  );
}

export function CampoListaQr(props: CampoListaQrProps) {
  const id = React.useId();
  const { valor, onChange, onBlur, opcoes } = props;
  return (
    <Estrutura id={id} {...props}>
      <div className={caixa(Boolean(props.erro))}>
        <select
          id={id}
          value={valor}
          aria-invalid={props.erro ? true : undefined}
          aria-describedby={descricao(id, props)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={clsx(entrada, 'h-12')}
        >
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
      </div>
    </Estrutura>
  );
}

interface CaixaQrProps {
  rotulo: string;
  marcada: boolean;
  onChange: (marcada: boolean) => void;
}

/** Caixa de marcar com área de toque de 44 px. */
export function CaixaQr({ rotulo, marcada, onChange }: CaixaQrProps) {
  const id = React.useId();
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium text-ui-ink">
      <input
        id={id}
        type="checkbox"
        checked={marcada}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-ui-brand-blue"
      />
      {rotulo}
    </label>
  );
}

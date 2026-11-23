import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variante = 'principal' | 'contorno' | 'link';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `principal` (pílula cheia), `contorno` ou `link`. Padrão: `principal`. */
  variante?: Variante;
}

const base =
  'inline-flex items-center justify-center font-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand-blue disabled:cursor-not-allowed disabled:opacity-50';

const porVariante: Record<Variante, string> = {
  principal:
    'min-h-12 rounded-full bg-ui-brand-blue px-[22px] text-base font-semibold text-white hover:bg-ui-brand-purple',
  contorno:
    'min-h-12 rounded-full border-[1.5px] border-ui-brand-blue bg-ui-bg px-[22px] text-base font-semibold text-ui-brand-blue hover:border-ui-brand-purple hover:text-ui-brand-purple',
  link: 'min-h-11 self-start px-1 text-sm font-medium text-ui-muted underline hover:text-ui-ink',
};

export function Botao({ variante = 'principal', type = 'button', className, ...resto }: BotaoProps) {
  return <button type={type} className={clsx(base, porVariante[variante], className)} {...resto} />;
}

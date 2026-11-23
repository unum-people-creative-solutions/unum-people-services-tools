import clsx from 'clsx';

interface Linha {
  rotulo: string;
  valor: string;
}

interface SubtotalProps {
  linhas: Linha[];
  /** Total isolado: valor maior, em negrito. Use com uma linha só. */
  destaque?: boolean;
}

export function Subtotal({ linhas, destaque = false }: SubtotalProps) {
  return (
    <dl className="m-0 flex flex-col gap-1.5 rounded-lg bg-ui-surface px-3.5 py-3 text-sm text-ui-muted">
      {linhas.map((linha) => (
        <div key={linha.rotulo} className="flex items-baseline justify-between gap-3">
          <dt>{linha.rotulo}</dt>
          <dd
            className={clsx(
              'm-0 whitespace-nowrap [font-variant-numeric:tabular-nums]',
              destaque ? 'text-lg font-bold text-ui-ink' : 'font-semibold text-ui-ink',
            )}
          >
            {linha.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}

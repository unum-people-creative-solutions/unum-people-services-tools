import React from 'react';

// Peças comuns dos guias das ferramentas (spec f4-guias). Server Components: o texto sai
// no HTML do servidor, sem depender de JavaScript. Visual no padrão da F2 (tokens `ui-*`).

export const brl = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const porcentagem = (valor: number, casas = 0) =>
  `${valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

export function Guia({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="guia-titulo" className="mb-4 mt-2 max-w-[62ch]">
      <h2 id="guia-titulo" className="m-0 mb-6 text-lg font-semibold text-ui-ink text-balance">
        {titulo}
      </h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

export function Topico({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="m-0 mb-2 text-lg font-semibold text-ui-ink text-balance">{titulo}</h3>
      <div className="flex flex-col gap-3 text-base leading-relaxed text-ui-ink">{children}</div>
    </div>
  );
}

export function Lista({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 list-disc space-y-2 pl-5">{children}</ul>;
}

export function ListaNumerada({ children }: { children: React.ReactNode }) {
  return <ol className="m-0 list-decimal space-y-2 pl-5">{children}</ol>;
}

export function Perguntas({ itens }: { itens: { pergunta: string; resposta: React.ReactNode }[] }) {
  return (
    <dl className="m-0 flex flex-col gap-4">
      {itens.map((item) => (
        <div key={item.pergunta}>
          <dt className="font-semibold text-ui-ink">{item.pergunta}</dt>
          <dd className="m-0 mt-1">{item.resposta}</dd>
        </div>
      ))}
    </dl>
  );
}

export const classeDoLink = 'font-semibold text-ui-brand-blue underline hover:text-ui-brand-purple';

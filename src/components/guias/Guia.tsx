import React from 'react';

// Peças comuns dos guias das ferramentas (spec adsense-aprovacao, RF-13/RF-14).
// Server Components: o texto sai no HTML do servidor, sem depender de JavaScript.

export const brl = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const porcentagem = (valor: number, casas = 0) =>
  `${valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

export function Guia({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section data-guia aria-labelledby="guia-titulo" className="mt-16 mb-12 max-w-3xl mx-auto">
      <h2
        id="guia-titulo"
        className="text-2xl md:text-3xl font-black text-brand-blue tracking-tighter mb-10 text-balance"
      >
        {titulo}
      </h2>
      <div className="space-y-12">{children}</div>
    </section>
  );
}

export function Topico({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg md:text-xl font-bold text-brand-blue mb-4 text-balance">{titulo}</h3>
      <div className="space-y-4 text-brand-grey leading-relaxed">{children}</div>
    </div>
  );
}

export function Lista({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-2">{children}</ul>;
}

export function Perguntas({ itens }: { itens: { pergunta: string; resposta: React.ReactNode }[] }) {
  return (
    <dl className="space-y-6">
      {itens.map((item) => (
        <div key={item.pergunta}>
          <dt className="font-bold text-brand-dark">{item.pergunta}</dt>
          <dd className="mt-1">{item.resposta}</dd>
        </div>
      ))}
    </dl>
  );
}

export function QuemFez() {
  return (
    <Topico titulo="Quem fez">
      <p>
        As ferramentas são gratuitas e feitas pela Unum People, que cria páginas com WhatsApp e CRM para
        profissionais autônomos e pequenos negócios. Não é preciso cadastro para usar, e os números que
        você digita não saem do seu navegador. As contas são exatamente as descritas neste guia, então
        dá para conferir qualquer resultado à mão.
      </p>
      <p>
        <a href="https://unumpeople.com.br/sobre" className="text-brand-blue font-bold hover:underline">
          Conheça a Unum People
        </a>
      </p>
    </Topico>
  );
}

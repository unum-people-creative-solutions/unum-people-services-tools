import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { BarChart3, ChevronRight, CircleDollarSign, Megaphone } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Convite } from '../components/ui/Convite';

export const metadata: Metadata = {
  title: { absolute: 'Unum People Tools — ferramentas grátis para o seu negócio crescer' },
  description:
    'Calculadoras grátis para MEI e pequenos negócios: quanto cobrar, se vale a pena anunciar e quais serviços compensam. Sem cadastro.',
};

const contasDoNegocio = [
  {
    nome: 'Quanto cobrar pelo serviço',
    frase: 'Descubra o menor preço sem prejuízo e quanto sobra no bolso.',
    href: '/simulador-precificacao',
    icone: CircleDollarSign,
  },
  {
    nome: 'Vale a pena anunciar?',
    frase: 'Veja quantas vendas pagam o anúncio antes de gastar.',
    href: '/calculadora-viabilidade',
    icone: Megaphone,
  },
  {
    nome: 'Quais serviços compensam',
    frase: 'Compare o que dá lucro com o que dá trabalho demais.',
    href: '/portfolio-analises',
    icone: BarChart3,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-ui-surface text-ui-ink">
      <Header />

      <main className="flex-1">
        <section className="bg-ui-canvas">
          <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-3 px-5 pb-9 pt-6 md:pb-14 md:pt-10">
            <h1 className="m-0 text-4xl font-bold leading-[1.1] tracking-[-0.035em] text-white md:text-[52px]">
              Unum People{' '}
              <span className="bg-[linear-gradient(90deg,#4d7cff_0%,#b06cff_55%,#ff7a45_100%)] bg-clip-text text-transparent">
                Tools
              </span>
            </h1>
            <p className="m-0 text-lg leading-[1.45] text-white md:text-xl">
              Ferramentas grátis para o seu negócio crescer.
            </p>
            <p className="m-0 text-sm leading-normal text-ui-muted-on-canvas">
              Sem cadastro. O que você digita fica neste aparelho.
            </p>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-5 pb-2 pt-7 md:pt-10">
          <section aria-labelledby="g-contas" className="flex flex-col gap-3">
            <h2 id="g-contas" className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-ui-muted">
              Contas do negócio
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {contasDoNegocio.map(({ nome, frase, href, icone: Icone }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-11 items-center gap-3.5 rounded-xl border border-ui-line bg-ui-bg p-4 text-ui-ink no-underline shadow-[0_1px_2px_rgb(20_20_43/0.06)] hover:border-ui-line-strong"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 flex-none items-center justify-center rounded-[10px] bg-[#eef0fb] text-ui-brand-blue"
                  >
                    <Icone size={22} strokeWidth={2} />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="text-base font-semibold tracking-[-0.01em]">{nome}</span>
                    <span className="text-sm leading-[1.45] text-ui-muted">{frase}</span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" className="flex-none text-ui-line-strong" />
                </Link>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2.5 rounded-xl border border-ui-line bg-ui-bg p-5">
            <h2 className="m-0 text-base font-semibold">Feitas para quem toca o próprio negócio</h2>
            <p className="m-0 text-sm leading-[1.55] text-ui-muted">
              Contas simples, explicadas passo a passo, para MEI, autônomos e pequenos negócios. Funcionam no celular e não pedem cadastro.
            </p>
          </section>

          <Convite
            texto="Quer que seus clientes achem você?"
            link="Faça uma página com o seu WhatsApp →"
            href="https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=home"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

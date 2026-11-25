import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ShieldCheck, Lock, Eye, FileText, BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade | Unum People',
  description: 'Transparência e proteção de dados de acordo com a LGPD.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      <Header />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto py-12">
          <header className="mb-12">
            <h1 className="text-3xl md:text-5xl font-black text-brand-blue uppercase tracking-tighter mb-4">
              Política de Privacidade
            </h1>
            <p className="text-brand-grey font-medium uppercase tracking-widest text-xs">
              Última atualização: 25 de novembro de 2026
            </p>
          </header>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 prose prose-slate max-w-none">
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <ShieldCheck size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">Em poucas palavras</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                As ferramentas da Unum People funcionam no seu navegador. O que você digita fica guardado neste aparelho e não é enviado para nós. Este site não tem anúncios e não usa cookies de rastreamento. Contamos só quantas vezes as ferramentas são usadas, sem saber quem usou.
              </p>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <Lock size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">O que fica guardado no seu aparelho</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                Para você não perder o que já preencheu, algumas ferramentas guardam os dados no próprio navegador:
              </p>
              <ul className="list-disc pl-5 text-brand-grey space-y-2 mt-4">
                <li>os serviços que você cadastra em &quot;Quais serviços compensam&quot;;</li>
                <li>o último QR code que você criou, com o que digitou (inclusive a chave Pix). O logo não fica guardado. Para apagar, use o botão &quot;Apagar o que eu digitei&quot; no gerador;</li>
                <li>os custos e valores do simulador de preço.</li>
              </ul>
              <p className="text-brand-grey leading-relaxed mt-4">
                A calculadora de anúncios não guarda nada: ao fechar a página, os números somem.
              </p>
              <p className="text-brand-grey leading-relaxed">
                Esses dados ficam só neste aparelho e neste navegador. Para apagar, limpe os dados de navegação do seu navegador.
              </p>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <BarChart3 size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">O que contamos</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                Para saber se as ferramentas ajudam, contamos quantas vezes cada uma é aberta, usada até o resultado, quantas vezes alguém baixa, compartilha ou imprime um QR code e quantas vezes alguém clica nos links para a Unum People. É só uma soma por dia: não guardamos quem foi, nem o seu endereço IP, nem o que você digitou, e não usamos cookies.
              </p>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <Eye size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">O que a hospedagem registra</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                Como qualquer site, a empresa que hospeda estas páginas (Netlify) registra dados técnicos de acesso, como endereço IP, navegador e página visitada, para manter o site no ar e seguro. Não usamos esses registros para identificar você nem para publicidade.
              </p>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <FileText size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">Seus direitos</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                Pela Lei Geral de Proteção de Dados (LGPD), você pode pedir informação, correção ou exclusão de dados pessoais. Como as ferramentas não enviam o que você digita, quase sempre basta limpar os dados do navegador. Para qualquer dúvida, escreva para{' '}
                <a href="mailto:contato@unumpeople.com.br" className="text-brand-blue font-bold hover:underline">contato@unumpeople.com.br</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ShieldCheck, Lock, Eye, FileText, Megaphone } from 'lucide-react';

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
              Última atualização: Outubro de 2026
            </p>
          </header>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 prose prose-slate max-w-none">
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <ShieldCheck size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">Nosso Compromisso</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                A Unum People Creative Solutions valoriza a sua privacidade. Esta política descreve como tratamos as informações coletadas em nossas ferramentas estratégicas, em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
              </p>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <Lock size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">Coleta de Dados</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                Nossas ferramentas de análise (como o Mapeamento de Portfólio) operam prioritariamente com <strong>armazenamento local (Local Storage)</strong>. Isso significa que os dados dos serviços inseridos ficam armazenados no seu navegador e não em nossos servidores, garantindo que você tenha controle total sobre sua estratégia.
              </p>
              <ul className="list-disc pl-5 text-brand-grey space-y-2 mt-4">
                <li>Dados de navegação anônimos para melhoria da ferramenta.</li>
                <li>Preferências de interface.</li>
                <li>Dados de portfólio (armazenados localmente no seu dispositivo).</li>
              </ul>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <Eye size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">Uso das Informações</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                As informações coletadas são utilizadas exclusivamente para:
              </p>
              <ul className="list-disc pl-5 text-brand-grey space-y-2 mt-4">
                <li>Prover as funcionalidades da ferramenta.</li>
                <li>Analisar o uso técnico para correções de bugs.</li>
                <li>Melhorar a experiência do usuário.</li>
              </ul>
            </section>

            <section id="anuncios" className="mb-10 scroll-mt-28">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <Megaphone size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">Anúncios e cookies</h2>
              </div>
              <div className="space-y-4 text-brand-grey leading-relaxed">
                <p>
                  Este site exibe anúncios do Google AdSense. Fornecedores terceiros, incluindo o Google, usam cookies para exibir anúncios com base em visitas anteriores do usuário a este site ou a outros sites.
                </p>
                <p>
                  O uso de cookies de publicidade permite que o Google e os parceiros dele exibam anúncios para você com base nas suas visitas a este site e/ou a outros sites na internet.
                </p>
                <p>
                  Você pode desativar a publicidade personalizada nas{' '}
                  <a href="https://adssettings.google.com" className="text-brand-blue font-bold hover:underline">Configurações de anúncios do Google</a>.
                  Também pode recusar o uso de cookies de publicidade personalizada de outros fornecedores em{' '}
                  <a href="https://www.aboutads.info" className="text-brand-blue font-bold hover:underline">www.aboutads.info</a>.
                </p>
                <p>
                  Outras redes de anúncios certificadas pelo Google também podem exibir anúncios aqui, com cookies próprios. A{' '}
                  <a href="https://support.google.com/adsense/answer/94149" className="text-brand-blue font-bold hover:underline">lista de redes certificadas</a>{' '}
                  fica na Central de Ajuda do Google AdSense, e cada rede explica no próprio site como recusar os cookies dela.
                </p>
                <p>
                  Para entender o que o Google faz com essas informações, veja{' '}
                  <a href="https://policies.google.com/technologies/ads" className="text-brand-blue font-bold hover:underline">Como o Google usa cookies em publicidade</a>.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4 text-brand-blue">
                <FileText size={24} />
                <h2 className="text-2xl font-bold m-0 text-brand-blue">Seus Direitos</h2>
              </div>
              <p className="text-brand-grey leading-relaxed">
                Como titular dos dados, você tem direito a solicitar acesso, correção ou exclusão de quaisquer dados pessoais que possamos ter. Como utilizamos armazenamento local, você mesmo pode excluir seus dados limpando o cache/dados de navegação do seu browser.
              </p>
            </section>

            <footer className="mt-12 pt-8 border-t border-gray-100 text-sm text-brand-grey italic">
              Dúvidas sobre privacidade? Entre em contato pelo e-mail: <a href="mailto:contato@unumpeople.com.br" className="text-brand-blue font-bold not-italic hover:underline">contato@unumpeople.com.br</a>
            </footer>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

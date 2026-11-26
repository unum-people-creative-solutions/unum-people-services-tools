'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Bloco } from '../../components/ui/Bloco';
import { CampoDoNumero } from '../../components/linkWhatsapp/CampoDoNumero';
import { MensagemDoCliente } from '../../components/linkWhatsapp/MensagemDoCliente';
import { PreviaDaMensagem } from '../../components/linkWhatsapp/PreviaDaMensagem';
import { CartaoDoLink } from '../../components/linkWhatsapp/CartaoDoLink';
import { useLinkWhatsapp } from '../../hooks/useLinkWhatsapp';
import { formatarTelefone, linkDoWhatsapp, motivoDoNumero, normalizarCelular } from '../../utils/whatsapp';

export default function LinkWhatsappView({ children }: { children?: React.ReactNode }) {
  const { numero, mensagem, mudarNumero, mudarMensagem } = useLinkWhatsapp();
  // O erro do número só aparece depois que a pessoa sai do campo com ele errado (RF-LW-07); a partir daí
  // acompanha a digitação.
  const [jaHouveErro, setJaHouveErro] = React.useState(false);

  const nacional = normalizarCelular(numero);
  const motivo = motivoDoNumero(numero);
  const link = nacional ? linkDoWhatsapp(nacional, mensagem) : null;

  return (
    <div className="flex min-h-screen flex-col bg-ui-surface text-ui-ink">
      <Header ferramenta larguraDaFerramenta="larga" />

      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-5 px-5 pb-10 pt-2">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-ui-ink">
            Gerador de link do WhatsApp
          </h1>
          <p className="m-0 text-base leading-normal text-ui-muted">
            Com a mensagem já escrita. O link é do próprio WhatsApp: não expira. Sem cadastro e sem anúncio.
          </p>
        </div>

        {/* Sem `sticky` (DT-LW-13): uma coluna no celular; de `md` em diante, duas (blueprint §2). */}
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 md:items-start md:gap-6">
          <div className="flex min-w-0 flex-col gap-5">
            <Bloco numero={1} titulo="Seu número do WhatsApp">
              <CampoDoNumero
                valor={numero}
                onChange={mudarNumero}
                onBlur={() => {
                  if (motivo !== null) setJaHouveErro(true);
                }}
                erro={jaHouveErro && motivo !== null ? motivo : undefined}
                entendido={nacional ? formatarTelefone(nacional) : undefined}
              />
            </Bloco>

            <Bloco numero={2} titulo="O que o cliente vai mandar">
              <MensagemDoCliente valor={mensagem} onChange={mudarMensagem} />
              <PreviaDaMensagem mensagem={mensagem} />
            </Bloco>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            {/* Outro link, outro cartão: o erro e o "Link copiado" de um não passam para o outro. */}
            <CartaoDoLink key={link ?? 'sem-link'} link={link} aoLevar={() => undefined} />
          </div>
        </div>

        {children}
      </main>

      <Footer />
    </div>
  );
}

'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Bloco } from '../../components/ui/Bloco';
import { Botao } from '../../components/ui/Botao';
import { Convite } from '../../components/ui/Convite';
import { Recolhivel } from '../../components/ui/Recolhivel';
import { CampoDoNumero } from '../../components/linkWhatsapp/CampoDoNumero';
import { MensagemDoCliente } from '../../components/linkWhatsapp/MensagemDoCliente';
import { PreviaDaMensagem } from '../../components/linkWhatsapp/PreviaDaMensagem';
import { CartaoDoLink } from '../../components/linkWhatsapp/CartaoDoLink';
import { QrDoLink } from '../../components/linkWhatsapp/QrDoLink';
import { OndeColocar } from '../../components/linkWhatsapp/OndeColocar';
import { useLinkWhatsapp } from '../../hooks/useLinkWhatsapp';
import { useMedicao } from '../../hooks/useMedicao';
import { formatarTelefone, linkDoWhatsapp, motivoDoNumero, normalizarCelular } from '../../utils/whatsapp';

export default function LinkWhatsappView({ children }: { children?: React.ReactNode }) {
  const { numero, mensagem, mudarNumero, mudarMensagem, apagar } = useLinkWhatsapp();
  const { marcar, comecou } = useMedicao('link-whatsapp');
  // O erro do número só aparece depois que a pessoa sai do campo com ele errado (RF-LW-07); a partir daí
  // acompanha a digitação.
  const [jaHouveErro, setJaHouveErro] = React.useState(false);
  const [confirmando, setConfirmando] = React.useState(false);
  const [apagou, setApagou] = React.useState(false);

  const nacional = normalizarCelular(numero);
  const motivo = motivoDoNumero(numero);
  const link = nacional ? linkDoWhatsapp(nacional, mensagem) : null;

  React.useEffect(() => {
    marcar('visita');
  }, [marcar]);

  // O primeiro link válido. Quem só voltou e olha o link restaurado não conta (o hook exige "comecou" antes).
  const temLink = link !== null;
  React.useEffect(() => {
    if (temLink && comecou) marcar('resultado');
  }, [temLink, comecou, marcar]);

  // Número, mensagem ou atalho: qualquer toque da pessoa começa (restaurar do aparelho não passa por aqui).
  const digitarNumero = (novo: string) => {
    setApagou(false);
    marcar('comecou');
    mudarNumero(novo);
  };
  const digitarMensagem = (nova: string) => {
    setApagou(false);
    marcar('comecou');
    mudarMensagem(nova);
  };
  const apagarTudo = () => {
    apagar();
    setJaHouveErro(false);
    setConfirmando(false);
    setApagou(true);
  };

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
                onChange={digitarNumero}
                onBlur={() => {
                  if (motivo !== null) setJaHouveErro(true);
                }}
                erro={jaHouveErro && motivo !== null ? motivo : undefined}
                entendido={nacional ? formatarTelefone(nacional) : undefined}
              />
            </Bloco>

            <Bloco numero={2} titulo="O que o cliente vai mandar">
              <MensagemDoCliente valor={mensagem} onChange={digitarMensagem} />
              <PreviaDaMensagem mensagem={mensagem} />
            </Bloco>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            {/* Outro link, outro cartão: o erro e o "Link copiado" de um não passam para o outro. */}
            <CartaoDoLink key={link ?? 'sem-link'} link={link} aoLevar={() => marcar('baixou')} />
            {link && <QrDoLink link={link} numero={numero} mensagem={mensagem} aoBaixar={() => marcar('baixou')} />}
          </div>
        </div>

        {link && <OndeColocar />}

        <section aria-label="Apagar dados" className="flex flex-col gap-3">
          {confirmando ? (
            <div className="flex max-w-[640px] flex-col gap-3 rounded-lg bg-ui-bg p-3.5">
              <p className="m-0 text-[15px] font-medium text-ui-ink">Apagar tudo o que você digitou neste aparelho?</p>
              <div className="flex gap-3">
                <Botao onClick={apagarTudo}>Sim, apagar</Botao>
                <Botao variante="contorno" autoFocus onClick={() => setConfirmando(false)}>
                  Cancelar
                </Botao>
              </div>
            </div>
          ) : (
            <Botao variante="link" onClick={() => setConfirmando(true)}>
              Apagar o que eu digitei
            </Botao>
          )}
          {apagou && (
            <p role="status" className="m-0 text-sm font-medium text-ui-ok">
              Pronto, apagamos tudo.
            </p>
          )}
        </section>

        {children && (
          <Recolhivel titulo="Como usar o seu link" variante="cartao" onAbrir={() => marcar('guia')}>
            <div>{children}</div>
          </Recolhivel>
        )}

        <Convite
          texto="Quer uma página com o seu WhatsApp, os serviços e o endereço? Crie a sua."
          link="Criar minha página"
          href="https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=link-whatsapp"
          onClick={() => marcar('convite')}
        />
      </main>

      <Footer />
    </div>
  );
}

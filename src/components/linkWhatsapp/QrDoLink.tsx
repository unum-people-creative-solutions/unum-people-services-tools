'use client';

import React from 'react';
import Link from 'next/link';
import { AcoesDoQr } from '../qr/AcoesDoQr';
import { PreviaDoQr } from '../qr/PreviaDoQr';
import { gerarQr } from '../../utils/qr/gerar';
import { levarParaOQr } from '../../utils/linkWhatsapp/paraOQr';

/** O QR da tela é preto e sem logo: quem quer cor, logo ou plaquinha usa o atalho (D-LW-5). */
const COR_DO_QR = '#000000';

interface QrDoLinkProps {
  /** O link do WhatsApp que o QR guarda. */
  link: string;
  /** O que a pessoa digitou, para levar ao gerador de QR code. */
  numero: string;
  mensagem: string;
  /** Compartilhou ou baixou o QR (medição `baixou`). */
  aoBaixar: () => void;
}

/** QR code do link (RF-LW-18) e o atalho para o gerador de QR code (RF-LW-19). */
export function QrDoLink({ link, numero, mensagem, aoBaixar }: QrDoLinkProps) {
  const idDoTitulo = React.useId();
  const qr = React.useMemo(() => gerarQr(link, { cor: COR_DO_QR }), [link]);

  return (
    <section aria-labelledby={idDoTitulo} className="flex flex-col gap-3">
      <h2 id={idDoTitulo} className="m-0 text-lg font-semibold text-ui-ink">
        QR code do seu link
      </h2>

      <PreviaDoQr nomeDoTipo="WhatsApp" svg={qr.ok ? qr.svg : null} alerta={qr.ok ? undefined : qr.erro}>
        {qr.ok && (
          <AcoesDoQr
            tipo="whatsapp"
            matriz={qr.matriz}
            svg={qr.svg}
            desenho={{ cor: COR_DO_QR }}
            aoBaixar={aoBaixar}
          />
        )}
      </PreviaDoQr>

      <p className="m-0 text-sm leading-[1.5] text-ui-muted">
        Quer cor, logo ou plaquinha?{' '}
        <Link
          href="/gerador-qr-code"
          // O número e a mensagem vão pelo aparelho, nunca pelo endereço (DT-LW-06).
          onClick={() => levarParaOQr(numero, mensagem)}
          className="font-semibold text-ui-brand-blue no-underline hover:text-ui-brand-purple"
        >
          Abrir no gerador de QR code
        </Link>
      </p>
    </section>
  );
}

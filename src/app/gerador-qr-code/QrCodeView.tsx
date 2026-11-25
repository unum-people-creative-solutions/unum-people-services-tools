'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function QrCodeView({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ui-surface text-ui-ink">
      <Header ferramenta />

      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-5 px-5 pb-10 pt-2">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-ui-ink">
            Gerador de QR code grátis
          </h1>
          <p className="m-0 text-base leading-normal text-ui-muted">
            Nunca expira. Sem cadastro e sem anúncio. Fica pronto aqui no seu celular.
          </p>
        </div>

        {children}
      </main>

      <Footer />
    </div>
  );
}

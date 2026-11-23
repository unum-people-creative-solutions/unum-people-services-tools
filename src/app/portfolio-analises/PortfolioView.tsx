'use client';

import React, { useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { useMedicao } from '../../hooks/useMedicao';
import { ServiceCharts } from '../../components/ServiceCharts';
import { ServiceList } from '../../components/ServiceList';
import { ServiceDrawer } from '../../components/ServiceDrawer';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Botao } from '../../components/ui/Botao';
import { Recolhivel } from '../../components/ui/Recolhivel';
import { Convite } from '../../components/ui/Convite';
import type { Service } from '../../types';

export default function PortfolioView({ children }: { children?: React.ReactNode }) {
  const { services, addService, updateService, removeService, isLoaded } = useServices();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Serviço aberto para edição; null = a gaveta cadastra um serviço novo.
  const [editando, setEditando] = useState<Service | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { marcar, comecou } = useMedicao('servicos-compensam');
  React.useEffect(() => {
    marcar('visita');
  }, [marcar]);
  // O resultado são os gráficos e a lista, que só existem com ao menos um serviço.
  const temResultado = isLoaded && services.length > 0;
  React.useEffect(() => {
    if (temResultado && comecou) marcar('resultado');
  }, [temResultado, comecou, marcar]);

  const abrirNovo = () => {
    setEditando(null);
    setIsDrawerOpen(true);
  };

  const abrirEdicao = (service: Service) => {
    setEditando(service);
    setIsDrawerOpen(true);
  };

  return (
    // O onChange dos campos da gaveta sobe até aqui: a primeira mudança marca "comecou".
    <div className="flex min-h-screen flex-col bg-ui-surface text-ui-ink" onChange={() => marcar('comecou')}>
      <Header ferramenta />

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-5 px-5 pb-10 pt-2">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-ui-ink">
            Quais serviços compensam
          </h1>
          <p className="m-0 text-base leading-normal text-ui-muted">
            Responda algumas perguntas sobre cada serviço e veja o que dá lucro e o que dá trabalho demais.
          </p>
        </div>

        <Botao onClick={abrirNovo} className="self-start">
          Adicionar serviço
        </Botao>

        {isLoaded ? (
          <>
            <ServiceCharts services={services} highlightedId={highlightedId} />
            <ServiceList
              services={services}
              onEdit={abrirEdicao}
              onRemove={removeService}
              onHover={setHighlightedId}
              onBaixar={() => marcar('planilha')}
            />
          </>
        ) : (
          <p className="m-0 py-10 text-center text-sm text-ui-muted">Carregando seus serviços…</p>
        )}

        {children && (
          <Recolhivel titulo="Como funciona esta conta" variante="cartao" onAbrir={() => marcar('guia')}>
            <div>{children}</div>
          </Recolhivel>
        )}

        <Convite
          texto="Já sabe o que vender mais?"
          link="Mostre esses serviços numa página com o seu WhatsApp →"
          href="https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=servicos-compensam"
          onClick={() => marcar('convite')}
        />
      </main>

      <Footer />

      <ServiceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={editando ? updateService : addService}
        service={editando}
      />
    </div>
  );
}

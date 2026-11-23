'use client';

import React from 'react';
import { Convite } from './ui/Convite';
import { useMedicao } from '../hooks/useMedicao';

// A home é um Server Component: estas duas peças levam a medição (que precisa do navegador) até ela.

/** Marca a visita da home. Não desenha nada. */
export function VisitaDaHome() {
  const { marcar } = useMedicao('home');
  React.useEffect(() => {
    marcar('visita');
  }, [marcar]);
  return null;
}

/** O convite da home, que marca o clique no link. */
export function ConviteDaHome() {
  const { marcar } = useMedicao('home');
  return (
    <Convite
      texto="Quer que seus clientes achem você?"
      link="Faça uma página com o seu WhatsApp →"
      href="https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=home"
      onClick={() => marcar('convite')}
    />
  );
}

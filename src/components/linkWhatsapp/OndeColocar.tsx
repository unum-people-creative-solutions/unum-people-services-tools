import React from 'react';
import { Recolhivel } from '../ui/Recolhivel';

const ITENS = [
  'Bio do Instagram: toque em Editar perfil, depois em Links e em Adicionar link externo. Cole o link.',
  'Perfil do Google: no seu perfil, toque em Editar perfil, depois em Contato e em Chat. Escolha WhatsApp e cole o link.',
  'Status do WhatsApp: escreva uma frase e cole o link. Quem vê o status toca no link e abre a conversa com você.',
  'Anúncio e cartão: use o link como destino do anúncio. No cartão e no balcão, use o QR code.',
];

/** Onde a pessoa cola o link (RF-LW-20). Fechado ao abrir. */
export function OndeColocar() {
  return (
    <Recolhivel titulo="Onde colocar o seu link" variante="cartao">
      <ul className="m-0 flex list-disc flex-col gap-2 py-2 pl-5 text-[15px] leading-[1.5] text-ui-ink">
        {ITENS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Recolhivel>
  );
}

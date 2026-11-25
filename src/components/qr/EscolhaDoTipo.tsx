'use client';

import React from 'react';
import clsx from 'clsx';
import {
  AtSign,
  Check,
  Contact,
  Link2,
  type LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Type,
  Wallet,
  Wifi,
} from 'lucide-react';
import { TIPOS, type TipoDeQr, type TipoId } from '../../utils/qr/conteudos';

const ICONES: Record<TipoId, LucideIcon> = {
  pix: Wallet,
  whatsapp: MessageCircle,
  redes: AtSign,
  link: Link2,
  wifi: Wifi,
  avaliacao: Star,
  'como-chegar': MapPin,
  contato: Contact,
  email: Mail,
  ligacao: Phone,
  texto: Type,
};

export const TITULO_DO_PASSO_1 = 'Para que é o seu QR code?';

interface EscolhaDoTipoProps {
  /** Tipo marcado, ou `null` se a pessoa ainda não escolheu. */
  tipo: TipoId | null;
  onEscolher: (tipo: TipoId) => void;
}

function Cartao({ item, marcado, onEscolher }: { item: TipoDeQr; marcado: boolean; onEscolher: () => void }) {
  const Icone = ICONES[item.id];
  return (
    <label
      className={clsx(
        'relative flex min-h-[84px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-center text-[13px] font-semibold sm:text-sm leading-[1.2] text-ui-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ui-brand-blue',
        marcado
          ? 'border-2 border-ui-brand-blue bg-ui-brand-blue/[0.06]'
          : 'border border-ui-line bg-ui-bg hover:border-ui-line-strong',
      )}
    >
      <input
        type="radio"
        name="tipo-de-qr"
        value={item.id}
        checked={marcado}
        onChange={onEscolher}
        // Tocar no tipo que já está marcado não dispara o onChange do navegador.
        onClick={() => {
          if (marcado) onEscolher();
        }}
        className="sr-only"
      />
      <Icone size={24} aria-hidden="true" className="flex-none text-ui-brand-blue" />
      <span className="[overflow-wrap:anywhere]">{item.nome}</span>
      {marcado && <Check size={16} aria-hidden="true" className="absolute right-1.5 top-1.5 text-ui-brand-blue" />}
    </label>
  );
}

/** Passo 1 (RF-QR-04 e RF-QR-05): os 11 tipos à vista, numa grade de 3 colunas que não recolhe depois da escolha. */
export function EscolhaDoTipo({ tipo, onEscolher }: EscolhaDoTipoProps) {
  return (
    <div role="radiogroup" aria-label={TITULO_DO_PASSO_1} className="grid grid-cols-3 gap-2">
      {TIPOS.map((t) => (
        <Cartao key={t.id} item={t} marcado={t.id === tipo} onEscolher={() => onEscolher(t.id)} />
      ))}
    </div>
  );
}

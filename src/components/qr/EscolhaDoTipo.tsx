'use client';

import React from 'react';
import clsx from 'clsx';
import {
  AtSign,
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
import { Botao } from '../ui/Botao';
import { Recolhivel } from '../ui/Recolhivel';
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
  /** `true`: mostra a grade. `false`: só a linha "QR code para: …" e o botão "Trocar". */
  aberta: boolean;
  onEscolher: (tipo: TipoId) => void;
  onTrocar: () => void;
}

function Cartao({ item, marcado, onEscolher }: { item: TipoDeQr; marcado: boolean; onEscolher: () => void }) {
  const Icone = ICONES[item.id];
  return (
    <label
      className={clsx(
        'flex min-h-16 cursor-pointer items-center gap-2.5 rounded-xl bg-ui-bg px-3.5 py-2.5 text-[15px] font-semibold leading-[1.25] text-ui-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ui-brand-blue',
        marcado ? 'border-2 border-ui-brand-blue' : 'border border-ui-line hover:border-ui-line-strong',
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
      <Icone size={20} aria-hidden="true" className="flex-none text-ui-brand-blue" />
      {item.nome}
    </label>
  );
}

/** Passo 1 (RF-QR-04 e RF-QR-05): os 6 tipos mais usados e, em "Mais opções", os outros 5. */
export function EscolhaDoTipo({ tipo, aberta, onEscolher, onTrocar }: EscolhaDoTipoProps) {
  const atual = TIPOS.find((t) => t.id === tipo);

  if (!aberta && atual) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-ui-surface px-4 py-2">
        <p className="m-0 text-base font-semibold text-ui-ink">{`QR code para: ${atual.nome}`}</p>
        <Botao variante="contorno" onClick={onTrocar}>
          Trocar
        </Botao>
      </div>
    );
  }

  const grade = (grupo: TipoDeQr['grupo']) => (
    <div className="grid grid-cols-2 gap-3">
      {TIPOS.filter((t) => t.grupo === grupo).map((t) => (
        <Cartao key={t.id} item={t} marcado={t.id === tipo} onEscolher={() => onEscolher(t.id)} />
      ))}
    </div>
  );

  return (
    <div role="radiogroup" aria-label={TITULO_DO_PASSO_1} className="flex flex-col gap-3">
      {grade('mais-usados')}
      <Recolhivel titulo="Mais opções" variante="linha" aberto={atual?.grupo === 'mais-opcoes'}>
        <div className="pt-2">{grade('mais-opcoes')}</div>
      </Recolhivel>
    </div>
  );
}

'use client';

import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { Recolhivel } from '../ui/Recolhivel';
import { CONTRASTE_MINIMO, CORES_DO_QR, contrasteComBranco } from '../../utils/qr/desenho';

export const ERRO_COR_CLARA = 'Essa cor é clara demais: o celular pode não ler. Escolha uma mais escura.';

interface CaraDoNegocioProps {
  /** Cor atual do QR (`#rrggbb`). */
  cor: string;
  /** Chamada só com cores que passam no contraste. */
  onCor: (cor: string) => void;
}

/** Grupo "Cor do QR code" (RF-QR-33): 8 cores escuras e "Outra cor", que só vale com contraste de 4,5:1. */
function SeletorDeCor({ cor, onCor }: CaraDoNegocioProps) {
  const idDoSeletor = React.useId();
  const [erro, setErro] = React.useState<string | null>(null);

  const escolher = (nova: string) => {
    setErro(null);
    onCor(nova);
  };

  const outraCor = (nova: string) => {
    // Cor clara é recusada e o QR mantém a anterior: a prévia nunca mente.
    if (contrasteComBranco(nova) < CONTRASTE_MINIMO) {
      setErro(ERRO_COR_CLARA);
      return;
    }
    escolher(nova);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* fieldset (role "group"): o passo 1 já é o único radiogroup da tela. */}
      <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
        <legend className="mb-3 p-0 text-[15px] font-medium text-ui-ink">Cor do QR code</legend>
        <div className="flex flex-wrap gap-2">
          {CORES_DO_QR.map((opcao) => {
            const marcada = opcao.hex.toLowerCase() === cor.toLowerCase();
            return (
              <label
                key={opcao.hex}
                title={opcao.nome}
                className={clsx(
                  'flex size-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ui-brand-blue',
                  marcada ? 'ring-2 ring-ui-brand-blue ring-offset-2' : 'ring-1 ring-ui-line-strong',
                )}
                style={{ backgroundColor: opcao.hex }}
              >
                <input
                  type="radio"
                  name="cor-do-qr"
                  value={opcao.hex}
                  checked={marcada}
                  onChange={() => escolher(opcao.hex)}
                  className="sr-only"
                />
                <span className="sr-only">{opcao.nome}</span>
                {marcada && <Check size={20} aria-hidden="true" className="text-white" />}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <label htmlFor={idDoSeletor} className="text-[15px] font-medium text-ui-ink">
          Outra cor
        </label>
        <input
          id={idDoSeletor}
          type="color"
          value={cor}
          onChange={(e) => outraCor(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-ui-line-strong bg-ui-bg p-1"
        />
      </div>
      {erro && (
        <p role="alert" className="m-0 text-[13px] font-medium leading-[1.45] text-ui-erro">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Recolhível "Deixar com a cara do negócio" (RF-QR-32): cor, e depois logo e frase. */
export function CaraDoNegocio({ cor, onCor }: CaraDoNegocioProps) {
  return (
    <Recolhivel titulo="Deixar com a cara do negócio" variante="cartao">
      <div className="flex flex-col gap-[18px] pb-3">
        <SeletorDeCor cor={cor} onCor={onCor} />
      </div>
    </Recolhivel>
  );
}

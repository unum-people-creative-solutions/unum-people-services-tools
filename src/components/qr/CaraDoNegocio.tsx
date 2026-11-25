'use client';

import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { Botao } from '../ui/Botao';
import { Recolhivel } from '../ui/Recolhivel';
import { CampoTextoQr, CaixaQr } from './CamposDoQr';
import { ErroDoLogo, ERRO_LOGO_LEITURA, ehAndroid, lerLogo, type LogoLido } from '../../utils/qr/logo';
import { CONTRASTE_MINIMO, CORES_DO_QR, contrasteComBranco } from '../../utils/qr/desenho';

export const ERRO_COR_CLARA = 'Essa cor é clara demais: o celular pode não ler. Escolha uma mais escura.';

export const LIMITE_DA_FRASE = 40;

interface SeletorDeCorProps {
  /** Cor atual do QR (`#rrggbb`). */
  cor: string;
  /** Chamada só com cores que passam no contraste. */
  onCor: (cor: string) => void;
}

interface CaraDoNegocioProps extends SeletorDeCorProps {
  /** Logo no centro, ou `null`. Vive só na memória da página. */
  logo: LogoLido | null;
  onLogo: (logo: LogoLido | null) => void;
  /** Frase embaixo do QR; vazia = sem frase. */
  frase: string;
  onFrase: (frase: string) => void;
  /** Chamada do tipo escolhido: a frase nasce com ela. */
  chamada: string;
}

/** Grupo "Cor do QR code" (RF-QR-33): 8 cores escuras e "Outra cor", que só vale com contraste de 4,5:1. */
function SeletorDeCor({ cor, onCor }: SeletorDeCorProps) {
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

/** O userAgent não muda durante a visita: não há o que assinar. */
const semAssinatura = () => () => undefined;

/** "Colocar o logo no centro" / "Tirar o logo" (RF-QR-34). */
function SeletorDeLogo({ logo, onLogo }: Pick<CaraDoNegocioProps, 'logo' | 'onLogo'>) {
  const campo = React.useRef<HTMLInputElement>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  // O suporte não muda durante a visita: no servidor vale `false` e o navegador confere depois de montar.
  const android = React.useSyncExternalStore(semAssinatura, ehAndroid, () => false);

  const escolhido = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    setErro(null);
    try {
      onLogo(await lerLogo(arquivo));
    } catch (e) {
      setErro(e instanceof ErroDoLogo ? e.message : ERRO_LOGO_LEITURA);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={campo}
        type="file"
        aria-label="Escolher a imagem do logo"
        // Sem `accept` no Android: o seletor de fotos de lá perde a leitura do arquivo (DT-QR-12).
        accept={android ? undefined : 'image/*'}
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          // Permite escolher o mesmo arquivo de novo depois de um erro.
          const entrada = e.target;
          void escolhido(arquivo).finally(() => {
            entrada.value = '';
          });
        }}
      />
      {logo ? (
        <Botao
          variante="contorno"
          onClick={() => {
            setErro(null);
            onLogo(null);
          }}
        >
          Tirar o logo
        </Botao>
      ) : (
        <Botao variante="contorno" onClick={() => campo.current?.click()}>
          Colocar o logo no centro
        </Botao>
      )}
      {erro && (
        <p role="alert" className="m-0 text-[13px] font-medium leading-[1.45] text-ui-erro">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Caixa "Colocar uma frase embaixo" e o campo "Frase" (RF-QR-35). */
function FraseEmbaixo({ frase, onFrase, chamada }: Pick<CaraDoNegocioProps, 'frase' | 'onFrase' | 'chamada'>) {
  // Apagar o texto de dentro do campo não pode fechá-lo: a caixa fica marcada enquanto a pessoa a quer.
  const [aberta, setAberta] = React.useState(false);
  const marcada = aberta || frase !== '';

  return (
    <div className="flex flex-col gap-2">
      <CaixaQr
        rotulo="Colocar uma frase embaixo"
        marcada={marcada}
        onChange={(liga) => {
          setAberta(liga);
          onFrase(liga ? chamada : '');
        }}
      />
      {marcada && (
        <CampoTextoQr
          rotulo="Frase"
          valor={frase}
          maxLength={LIMITE_DA_FRASE}
          onChange={(texto) => {
            setAberta(true);
            onFrase(texto.slice(0, LIMITE_DA_FRASE));
          }}
        />
      )}
    </div>
  );
}

/** Recolhível "Deixar com a cara do negócio" (RF-QR-32): cor, logo e frase. */
export function CaraDoNegocio({ cor, onCor, logo, onLogo, frase, onFrase, chamada }: CaraDoNegocioProps) {
  return (
    <Recolhivel titulo="Deixar com a cara do negócio" variante="cartao">
      <div className="flex flex-col gap-[18px] pb-3">
        <SeletorDeCor cor={cor} onCor={onCor} />
        <SeletorDeLogo logo={logo} onLogo={onLogo} />
        <FraseEmbaixo frase={frase} onFrase={onFrase} chamada={chamada} />
      </div>
    </Recolhivel>
  );
}

'use client';

import React from 'react';
import clsx from 'clsx';
import { Botao } from '../ui/Botao';
import { Bloco } from '../ui/Bloco';
import { CampoTextoQr } from './CamposDoQr';
import { Plaquinha } from './Plaquinha';
import type { TipoId } from '../../utils/qr/conteudos';
import type { TamanhoDaPlaquinha } from '../../utils/qr/estado';
import type { MatrizQr } from '../../utils/qr/matriz';
import { baixarArquivo, nomeDoArquivoDaPlaquinha } from '../../utils/qr/arquivo';
import type { LogoParaDesenhar } from '../../utils/qr/png';
import {
  LIMITE_DO_NOME_DO_NEGOCIO,
  PAPEIS,
  gerarPngDaPlaquinha,
  type DadosDaPlaquinha,
} from '../../utils/qr/plaquinha';

export const ERRO_AO_BAIXAR_A_PLAQUINHA = 'Não deu para baixar a plaquinha. Tente de novo.';
export const ERRO_AO_IMPRIMIR_A_PLAQUINHA = 'Não deu para imprimir a plaquinha. Use Baixar plaquinha.';

const TAMANHOS: readonly { id: TamanhoDaPlaquinha; nome: string }[] = [
  { id: 'A6', nome: 'Balcão (A6)' },
  { id: 'A4', nome: 'Cartaz (A4)' },
];

interface DadosDeEntrada {
  tipo: TipoId;
  matriz: MatrizQr;
  /** SVG do QR com cor e logo e sem frase (a plaquinha não leva a frase do QR). */
  svg: string;
  dados: DadosDaPlaquinha;
  tamanho: TamanhoDaPlaquinha;
  logo?: LogoParaDesenhar;
}

interface SecaoDaPlaquinhaProps extends DadosDeEntrada {
  nomeDoNegocio: string;
  onNomeDoNegocio: (nome: string) => void;
  onTamanho: (tamanho: TamanhoDaPlaquinha) => void;
  /** Baixou o PNG ou mandou imprimir (medição `baixou`, RF-QR-38). */
  aoBaixar: () => void;
}

/** Seção "Plaquinha para imprimir" (RF-QR-36): nome, tamanho, prévia em escala, Imprimir e Baixar. */
export function SecaoDaPlaquinha({
  tipo,
  matriz,
  svg,
  dados,
  tamanho,
  logo,
  nomeDoNegocio,
  onNomeDoNegocio,
  onTamanho,
  aoBaixar,
}: SecaoDaPlaquinhaProps) {
  const [ocupado, setOcupado] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  const imprimir = () => {
    setErro(null);
    try {
      window.print();
    } catch {
      setErro(ERRO_AO_IMPRIMIR_A_PLAQUINHA);
      return;
    }
    aoBaixar();
  };

  const baixar = async () => {
    setErro(null);
    setOcupado(true);
    try {
      baixarArquivo(await gerarPngDaPlaquinha(matriz, dados, tamanho, logo), nomeDoArquivoDaPlaquinha(tipo));
      aoBaixar();
    } catch {
      setErro(ERRO_AO_BAIXAR_A_PLAQUINHA);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Bloco titulo="Plaquinha para imprimir">
      <CampoTextoQr
        rotulo="Nome do negócio (opcional)"
        valor={nomeDoNegocio}
        maxLength={LIMITE_DO_NOME_DO_NEGOCIO}
        onChange={(nome) => onNomeDoNegocio(nome.slice(0, LIMITE_DO_NOME_DO_NEGOCIO))}
      />

      <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-[15px] font-medium text-ui-ink">Tamanho</legend>
        <div className="grid grid-cols-2 gap-3">
          {TAMANHOS.map((opcao) => {
            const marcado = opcao.id === tamanho;
            return (
              <label
                key={opcao.id}
                className={clsx(
                  'flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-ui-bg px-3 text-center text-[15px] font-semibold text-ui-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ui-brand-blue',
                  marcado ? 'border-2 border-ui-brand-blue' : 'border border-ui-line hover:border-ui-line-strong',
                )}
              >
                <input
                  type="radio"
                  name="tamanho-da-plaquinha"
                  value={opcao.id}
                  checked={marcado}
                  onChange={() => onTamanho(opcao.id)}
                  className="sr-only"
                />
                {opcao.nome}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-lg border border-ui-line shadow-[0_12px_32px_-8px_rgb(20_20_43/0.14)]">
        <Plaquinha tamanho={tamanho} dados={dados} svg={svg} rotulo="Prévia da plaquinha" />
      </div>

      <div className="flex flex-col gap-3">
        <Botao className="w-full" onClick={imprimir}>
          Imprimir plaquinha
        </Botao>
        <Botao variante="contorno" className="w-full" disabled={ocupado} onClick={baixar}>
          Baixar plaquinha
        </Botao>
        {erro && (
          <p role="alert" className="m-0 text-sm font-medium leading-[1.45] text-ui-erro">
            {erro}
          </p>
        )}
      </div>
    </Bloco>
  );
}

interface PlaquinhaParaImprimirProps {
  dados: DadosDaPlaquinha;
  svg: string;
  tamanho: TamanhoDaPlaquinha;
}

/**
 * Contêiner só de impressão (DT-QR-10): fora da tela principal, que some em `@media print`. Só a folha
 * sai no papel, no tamanho escolhido e sem margem de página. Na tela ele não existe (`hidden`).
 */
export function PlaquinhaParaImprimir({ dados, svg, tamanho }: PlaquinhaParaImprimirProps) {
  const { larguraMm, alturaMm } = PAPEIS[tamanho];
  return (
    <div aria-hidden="true" className="hidden print:block">
      <style>{`@page { size: ${tamanho}; margin: 0; }`}</style>
      {/* Meio milímetro a menos que a folha: altura exata faz alguns navegadores abrirem uma 2ª página em branco. */}
      <div style={{ width: `${larguraMm}mm`, height: `${alturaMm - 0.5}mm`, overflow: 'hidden' }}>
        <Plaquinha tamanho={tamanho} dados={dados} svg={svg} />
      </div>
    </div>
  );
}

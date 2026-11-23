'use client';

import React from 'react';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { Service } from '../types';
import { exportToCSV } from '../utils/csv';
import { formatarNumero } from '../utils/numeros';
import { Bloco } from './ui/Bloco';
import { Botao } from './ui/Botao';

interface ServiceListProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onRemove: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Avisa o clique em "Baixar planilha (CSV)" (medição de uso). */
  onBaixar?: () => void;
}

// Trabalho = média de esforço e dificuldade; Retorno = média de repetição e lucro;
// Nota geral (0 a 100) = média de (100 − Trabalho) e Retorno.
const trabalhoDe = (s: Service) => (s.esforco + s.complexidade) / 2;
const retornoDe = (s: Service) => (s.padronizacao + s.lucratividade) / 2;
const notaGeralDe = (s: Service) => (100 - trabalhoDe(s) + retornoDe(s)) / 2;

const corDaNota = (nota: number) => {
  if (nota >= 70) return 'bg-ui-ok-bg text-ui-ok';
  if (nota >= 40) return 'bg-ui-surface text-ui-brand-blue';
  return 'bg-ui-erro-bg text-ui-erro';
};

const botaoDeLinha =
  'inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ui-muted hover:bg-ui-surface hover:text-ui-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand-blue';

function Medida({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <dt className="text-[13px] text-ui-muted">{rotulo}</dt>
      <dd className="m-0 flex items-center gap-2">
        <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-ui-line">
          <span className={`block h-full ${cor}`} style={{ width: `${valor}%` }} />
        </span>
        <span className="text-sm font-semibold text-ui-ink [font-variant-numeric:tabular-nums]">
          {formatarNumero(valor, 0)}%
        </span>
      </dd>
    </div>
  );
}

export function ServiceList({ services, onEdit, onRemove, onHover, onBaixar }: ServiceListProps) {
  const [confirmandoId, setConfirmandoId] = React.useState<string | null>(null);
  const botoesApagar = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const devolverFocoA = React.useRef<string | null>(null);

  // Depois de cancelar, o botão de apagar volta a existir neste render: o foco volta para ele.
  React.useEffect(() => {
    if (devolverFocoA.current) {
      botoesApagar.current[devolverFocoA.current]?.focus();
      devolverFocoA.current = null;
    }
  });

  if (services.length === 0) return null;

  const ordenados = [...services].sort((a, b) => notaGeralDe(b) - notaGeralDe(a));

  const cancelar = (id: string) => {
    devolverFocoA.current = id;
    setConfirmandoId(null);
  };

  return (
    <Bloco
      titulo="Seus serviços, do que mais compensa ao que menos compensa"
      apoio="A nota geral vai de 0 a 100: quanto maior, mais o serviço compensa."
    >
      <Botao
        variante="contorno"
        onClick={() => {
          onBaixar?.();
          exportToCSV(services);
        }}
        className="gap-2 self-start"
      >
        <Download size={18} aria-hidden="true" />
        Baixar planilha (CSV)
      </Botao>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {ordenados.map((servico) => {
          const nota = notaGeralDe(servico);
          const confirmando = confirmandoId === servico.id;

          return (
            <li
              key={servico.id}
              aria-label={servico.nome}
              onMouseEnter={() => onHover(servico.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(servico.id)}
              onBlur={() => onHover(null)}
              className="flex flex-col gap-3 rounded-[10px] border border-ui-line bg-ui-bg p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <strong className="min-w-0 break-words text-base font-semibold text-ui-ink">{servico.nome}</strong>
                <dl className="m-0 flex flex-none flex-col items-end gap-0.5">
                  <dt className="text-[13px] text-ui-muted">Nota geral</dt>
                  <dd
                    className={`m-0 rounded-full px-2.5 py-0.5 text-sm font-bold [font-variant-numeric:tabular-nums] ${corDaNota(nota)}`}
                  >
                    {formatarNumero(nota, 1)}
                  </dd>
                </dl>
              </div>

              <dl className="m-0 flex gap-4">
                <Medida rotulo="Trabalho" valor={trabalhoDe(servico)} cor="bg-ui-atencao" />
                <Medida rotulo="Retorno" valor={retornoDe(servico)} cor="bg-ui-ok" />
              </dl>

              {confirmando ? (
                <div className="flex flex-col gap-3 rounded-lg bg-ui-surface p-3.5">
                  <p className="m-0 text-[15px] font-medium text-ui-ink">Apagar &quot;{servico.nome}&quot;?</p>
                  <div className="flex gap-3">
                    <Botao
                      onClick={() => {
                        setConfirmandoId(null);
                        onRemove(servico.id);
                      }}
                    >
                      Apagar
                    </Botao>
                    <Botao variante="contorno" autoFocus onClick={() => cancelar(servico.id)}>
                      Cancelar
                    </Botao>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1 border-t border-ui-line pt-2">
                  <button
                    type="button"
                    aria-label={`Editar ${servico.nome}`}
                    onClick={() => onEdit(servico)}
                    className={botaoDeLinha}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    aria-label={`Apagar ${servico.nome}`}
                    ref={(el) => {
                      botoesApagar.current[servico.id] = el;
                    }}
                    onClick={() => setConfirmandoId(servico.id)}
                    className={botaoDeLinha}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Apagar
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Bloco>
  );
}

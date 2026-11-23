'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { QUESTIONS, Service, StepKey } from '../types';
import { formatarNumero } from '../utils/numeros';
import { Botao } from './ui/Botao';
import { CampoTexto } from './ui/Campo';

interface ServiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  /** Serviço que está sendo editado. Sem ele, a gaveta cadastra um serviço novo. */
  service?: Service | null;
}

// Os títulos dos passos são perguntas (RF-F3b-07). `nota` é o nome do grupo no resumo final.
const STEPS: { key: StepKey; titulo: string; nota: string }[] = [
  { key: 'esforco', titulo: 'Dá muito trabalho?', nota: 'Esforço' },
  { key: 'complexidade', titulo: 'É difícil de fazer?', nota: 'Dificuldade' },
  { key: 'padronizacao', titulo: 'Dá para repetir sempre igual?', nota: 'Repetição' },
  { key: 'lucratividade', titulo: 'Dá lucro?', nota: 'Lucro' },
];

const TITULO_DO_NOME = 'Como se chama este serviço?';
const TOTAL_DE_PASSOS = STEPS.length + 1;

const SELETOR_FOCAVEL =
  'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Ids das 24 perguntas, na ordem dos passos: é a ordem do campo `respostas` do serviço.
const IDS_DAS_PERGUNTAS = STEPS.flatMap(({ key }) => QUESTIONS[key].map((q) => q.id));

const temRespostas = (service: Service): service is Service & { respostas: boolean[] } =>
  Array.isArray(service.respostas) && service.respostas.length === IDS_DAS_PERGUNTAS.length;

// Serviço com `respostas` abre com as respostas reais. Serviço antigo guarda só a nota de cada grupo
// (respostas "sim" ÷ 6): as respostas são remontadas a partir da nota (as primeiras N perguntas viram "sim").
const montarRespostas = (service: Service): Record<string, boolean> => {
  const respostas: Record<string, boolean> = {};
  if (temRespostas(service)) {
    IDS_DAS_PERGUNTAS.forEach((id, i) => {
      respostas[id] = service.respostas[i];
    });
    return respostas;
  }
  for (const { key } of STEPS) {
    const sims = Math.round((service[key] / 100) * QUESTIONS[key].length);
    QUESTIONS[key].forEach((q, i) => {
      respostas[q.id] = i < sims;
    });
  }
  return respostas;
};

const opcao =
  'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-ui-line-strong bg-ui-bg px-3 text-[15px] font-medium text-ui-ink has-[:checked]:border-ui-brand-blue has-[:checked]:bg-ui-brand-blue has-[:checked]:text-white has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ui-brand-blue';

function Conteudo({ onClose, onSave, service }: Omit<ServiceDrawerProps, 'isOpen'>) {
  const editando = Boolean(service);
  const remontado = service ? !temRespostas(service) : false;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>(() => (service ? montarRespostas(service) : {}));
  const [nome, setNome] = useState(service?.nome ?? '');

  const dialogoRef = useRef<HTMLDivElement>(null);
  const rolagemRef = useRef<HTMLDivElement>(null);
  const tituloDoPassoRef = useRef<HTMLHeadingElement>(null);
  const primeiroRender = useRef(true);
  const idDoTitulo = React.useId();

  // Ao abrir: foco para dentro; ao fechar: devolve o foco a quem abriu. Esc fecha e Tab fica preso.
  useEffect(() => {
    const abridor = document.activeElement as HTMLElement | null;
    const dialogo = dialogoRef.current;
    dialogo?.focus();

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogo) return;

      const focaveis = Array.from(dialogo.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL));
      if (focaveis.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const ativo = document.activeElement;
      const dentro = dialogo.contains(ativo);

      if (e.shiftKey && (ativo === primeiro || ativo === dialogo || !dentro)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (ativo === ultimo || !dentro)) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
      abridor?.focus?.();
    };
    // onClose pode mudar a cada render do pai; o efeito vale para a abertura inteira.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A cada passo novo: volta ao topo e leva o foco ao título, para quem usa leitor de tela.
  useEffect(() => {
    if (primeiroRender.current) {
      primeiroRender.current = false;
      return;
    }
    rolagemRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    tituloDoPassoRef.current?.focus();
  }, [currentStep]);

  const calculateScore = (stepKey: StepKey) => {
    const yesCount = QUESTIONS[stepKey].filter((q) => answers[q.id]).length;
    return (yesCount / 6) * 100;
  };

  const isFinalStep = currentStep === STEPS.length;
  const nomeValido = nome.trim().length > 0;

  const handleSave = () => {
    if (!nomeValido) return;

    onSave({
      id: service?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      esforco: calculateScore('esforco'),
      complexidade: calculateScore('complexidade'),
      padronizacao: calculateScore('padronizacao'),
      lucratividade: calculateScore('lucratividade'),
      respostas: IDS_DAS_PERGUNTAS.map((id) => answers[id] === true),
    });
    onClose();
  };

  const tituloDoPasso = isFinalStep ? TITULO_DO_NOME : STEPS[currentStep].titulo;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* O fundo escurece a tela, mas de propósito não fecha a gaveta ao clicar (não perde o que foi respondido). */}
      <div aria-hidden="true" className="fixed inset-0 bg-black/40" />

      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDoTitulo}
        tabIndex={-1}
        className="animate-in slide-in-from-right relative flex h-full w-full max-w-md flex-col bg-ui-bg text-ui-ink shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ui-line px-5 py-3">
          <div className="flex flex-col">
            <h2 id={idDoTitulo} className="m-0 text-lg font-semibold text-ui-ink">
              {editando ? 'Editar serviço' : 'Adicionar serviço'}
            </h2>
            <span className="text-[13px] text-ui-muted">
              Passo {currentStep + 1} de {TOTAL_DE_PASSOS}
            </span>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full text-ui-muted hover:bg-ui-surface hover:text-ui-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand-blue"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <div ref={rolagemRef} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          <div aria-hidden="true" className="flex gap-1.5">
            {Array.from({ length: TOTAL_DE_PASSOS }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= currentStep ? 'bg-ui-brand-blue' : 'bg-ui-line'}`}
              />
            ))}
          </div>

          <h3
            ref={tituloDoPassoRef}
            tabIndex={-1}
            className="m-0 text-[22px] font-bold leading-tight tracking-[-0.02em] text-ui-ink outline-none"
          >
            {tituloDoPasso}
          </h3>

          {remontado && currentStep === 0 && (
            <p className="m-0 rounded-lg bg-ui-atencao-bg p-3 text-[13px] leading-[1.45] text-ui-ink">
              Este serviço guarda só a nota de cada grupo. As respostas abaixo foram remontadas a partir da nota:
              confira e ajuste.
            </p>
          )}

          {!isFinalStep ? (
            <>
              <p className="m-0 text-sm leading-[1.45] text-ui-muted">Pergunta sem resposta conta como &quot;não&quot;.</p>
              {QUESTIONS[STEPS[currentStep].key].map((q) => (
                <fieldset key={q.id} className="m-0 flex flex-col gap-2.5 rounded-[10px] border border-ui-line bg-ui-surface p-3.5">
                  <legend className="float-left w-full p-0 text-[15px] font-medium leading-[1.4] text-ui-ink">
                    {q.text}
                  </legend>
                  <div className="flex w-full gap-2 [clear:both]">
                    <label className={opcao}>
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === true}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: true }))}
                        className="sr-only"
                      />
                      Sim
                    </label>
                    <label className={opcao}>
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === false}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: false }))}
                        className="sr-only"
                      />
                      Não
                    </label>
                  </div>
                </fieldset>
              ))}
            </>
          ) : (
            <>
              <CampoTexto
                rotulo="Nome do serviço"
                placeholder="Ex.: Instalação de fachada"
                valor={nome}
                onChange={setNome}
              />

              <div className="rounded-lg bg-ui-surface p-3.5">
                <h4 className="m-0 mb-2 text-sm font-semibold text-ui-ink">Resumo da pontuação</h4>
                <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 text-sm text-ui-muted">
                  {STEPS.map((s) => (
                    <li key={s.key}>
                      {s.nota}: {formatarNumero(calculateScore(s.key), 0)}%
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-ui-line bg-ui-bg px-5 py-4">
          {currentStep > 0 && (
            <Botao variante="contorno" onClick={() => setCurrentStep(currentStep - 1)} className="flex-1">
              Anterior
            </Botao>
          )}
          {!isFinalStep ? (
            <Botao onClick={() => setCurrentStep(currentStep + 1)} className="flex-[2]">
              Próximo
            </Botao>
          ) : (
            <Botao onClick={handleSave} disabled={!nomeValido} className="flex-[2]">
              Salvar serviço
            </Botao>
          )}
        </div>
      </div>
    </div>
  );
}

export function ServiceDrawer({ isOpen, onClose, onSave, service }: ServiceDrawerProps) {
  if (!isOpen) return null;
  // Montar de novo a cada abertura (ou a cada serviço editado) zera o formulário.
  return <Conteudo key={service?.id ?? 'novo'} onClose={onClose} onSave={onSave} service={service} />;
}

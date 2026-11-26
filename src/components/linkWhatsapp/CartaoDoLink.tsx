'use client';

import React from 'react';
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import { Botao } from '../ui/Botao';

export const ERRO_AO_COPIAR = 'Não deu para copiar. Toque e segure o link acima para copiar.';
export const ERRO_AO_COMPARTILHAR_O_LINK = 'Não deu para compartilhar. Use Copiar link.';

/** Quanto tempo o botão fica dizendo "Link copiado" (RF-LW-15). */
export const TEMPO_DO_LINK_COPIADO_MS = 2000;

interface CartaoDoLinkProps {
  /** O link pronto, ou `null` quando ainda não há número válido. */
  link: string | null;
  /** Levou o link: copiou, compartilhou ou foi testar (medição `baixou`). */
  aoLevar: () => void;
}

/** O suporte a compartilhar não muda durante a visita: não há o que assinar. */
const semAssinatura = () => () => undefined;
const podeCompartilhar = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

const classeDoBotaoComoLink =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-ui-brand-blue bg-ui-bg px-[22px] text-base font-semibold text-ui-brand-blue no-underline hover:border-ui-brand-purple hover:text-ui-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand-blue';

/**
 * Cartão do resultado (RF-LW-12 a RF-LW-17): o link, "Copiar link", "Compartilhar link" (só onde o
 * navegador compartilha) e "Testar o link". Toda falha aparece num `alert`.
 *
 * O erro e o "Link copiado" valem para um link só: quem usa este componente o recria (`key`) quando o
 * link muda.
 */
export function CartaoDoLink({ link, aoLevar }: CartaoDoLinkProps) {
  const idDoTitulo = React.useId();
  const idDoCampo = React.useId();
  const compartilhaNoAparelho = React.useSyncExternalStore(semAssinatura, podeCompartilhar, () => false);
  const [copiado, setCopiado] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!copiado) return;
    const espera = setTimeout(() => setCopiado(false), TEMPO_DO_LINK_COPIADO_MS);
    return () => clearTimeout(espera);
  }, [copiado]);

  if (link === null) {
    return (
      <section
        aria-labelledby={idDoTitulo}
        className="flex flex-col gap-3 rounded-xl border-2 border-ui-brand-blue bg-ui-bg p-5 shadow-[0_12px_32px_-8px_rgb(20_20_43/0.14)]"
      >
        <h2 id={idDoTitulo} className="m-0 text-lg font-semibold text-ui-ink">
          Seu link do WhatsApp
        </h2>
        <p className="m-0 text-[15px] leading-[1.45] text-ui-muted">Digite o seu número para ver o link.</p>
      </section>
    );
  }

  const copiar = async () => {
    setErro(null);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Safari antigo e navegador embutido podem negar, ou nem ter a área de transferência.
      setCopiado(false);
      setErro(ERRO_AO_COPIAR);
      return;
    }
    setCopiado(true);
    aoLevar();
  };

  // Sem `await` antes de `share`: o navegador conta o toque da pessoa só até a primeira espera.
  const compartilhar = () => {
    setErro(null);
    let promessa: Promise<void>;
    try {
      promessa = navigator.share({ url: link });
    } catch (e) {
      promessa = Promise.reject(e);
    }
    promessa.then(aoLevar).catch((e) => {
      // Cancelar o compartilhamento não é falha.
      if ((e as { name?: string } | null)?.name !== 'AbortError') setErro(ERRO_AO_COMPARTILHAR_O_LINK);
    });
  };

  return (
    <section
      aria-labelledby={idDoTitulo}
      className="flex flex-col gap-4 rounded-xl border-2 border-ui-brand-blue bg-ui-bg p-5 shadow-[0_12px_32px_-8px_rgb(20_20_43/0.14)]"
    >
      <h2 id={idDoTitulo} className="m-0 text-lg font-semibold text-ui-ink">
        Seu link está pronto
      </h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idDoCampo} className="text-[13px] font-medium text-ui-muted">
          Seu link
        </label>
        <input
          id={idDoCampo}
          type="text"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="h-12 w-full min-w-0 rounded-lg border border-ui-line-strong bg-ui-surface px-3.5 text-[15px] text-ui-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ui-brand-blue"
        />
      </div>

      <div className="flex flex-col gap-3">
        <Botao className="w-full gap-2" onClick={copiar}>
          {copiado ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copiado ? 'Link copiado' : 'Copiar link'}
        </Botao>
        {compartilhaNoAparelho && (
          <Botao variante="contorno" className="w-full gap-2" onClick={compartilhar}>
            <Share2 size={18} aria-hidden="true" />
            Compartilhar link
          </Botao>
        )}
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={aoLevar}
          className={classeDoBotaoComoLink}
        >
          Testar o link
          <ExternalLink size={18} aria-hidden="true" />
        </a>
      </div>

      {/* Fica sempre na página: leitor de tela só anuncia mudança numa região que já existia. */}
      <p role="status" className="sr-only">
        {copiado ? 'Link copiado.' : ''}
      </p>
      {erro && (
        <p role="alert" className="m-0 text-sm font-medium leading-[1.45] text-ui-erro">
          {erro}
        </p>
      )}
    </section>
  );
}

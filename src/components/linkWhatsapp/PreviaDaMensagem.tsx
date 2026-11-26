import React from 'react';

interface PreviaDaMensagemProps {
  mensagem: string;
}

/**
 * Prévia da mensagem (RF-LW-11): imita a conversa sem copiar a marca (blueprint §3). Fundo e balão
 * são cores fixas da prévia, não da marca da Unum.
 */
export function PreviaDaMensagem({ mensagem }: PreviaDaMensagemProps) {
  const temTexto = mensagem.trim() !== '';

  return (
    <section aria-label="Prévia da mensagem" className="flex flex-col gap-2">
      <h3 className="m-0 text-[15px] font-medium text-ui-ink">Como chega para você</h3>
      <div className="flex min-h-[88px] flex-col justify-center rounded-lg bg-[#EFEAE2] p-3.5">
        {temTexto ? (
          <p
            // Estilo em linha: é o que mantém as quebras de linha da mensagem, e assim dá para conferir no teste.
            style={{ whiteSpace: 'pre-wrap' }}
            className="m-0 ml-auto max-w-[85%] break-words rounded-lg rounded-tr-none bg-[#D9FDD3] px-3 py-2 text-[15px] leading-[1.45] text-ui-ink">
            {mensagem}
          </p>
        ) : (
          <p className="m-0 text-center text-[15px] leading-[1.45] text-ui-muted">
            Sem mensagem, a conversa abre em branco.
          </p>
        )}
      </div>
      <p className="m-0 text-[13px] leading-[1.45] text-ui-muted">O cliente ainda toca em enviar e pode mudar o texto.</p>
    </section>
  );
}

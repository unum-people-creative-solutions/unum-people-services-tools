import React from 'react';

interface PreviaDoQrProps {
  /** Nome do tipo, para o nome acessível da imagem. */
  nomeDoTipo: string;
  /** SVG do QR (vem só de `svgDoQr`); `null` quando ainda não há conteúdo válido. */
  svg: string | null;
  /** Aviso que impede o QR por um motivo que não é de campo (ex.: conteúdo grande demais). */
  alerta?: string;
  /** Botões de ação: só aparecem com o QR pronto. */
  children?: React.ReactNode;
}

/** Passo 3 (RF-QR-23): o QR ao vivo e, embaixo, as ações. Sem conteúdo válido, só a mensagem. */
export function PreviaDoQr({ nomeDoTipo, svg, alerta, children }: PreviaDoQrProps) {
  const idTitulo = React.useId();

  return (
    <section
      aria-labelledby={idTitulo}
      className="flex flex-col gap-4 rounded-xl border-2 border-ui-brand-blue bg-ui-bg p-5 shadow-[0_12px_32px_-8px_rgb(20_20_43/0.14)]"
    >
      <h2 id={idTitulo} className="m-0 text-lg font-semibold text-ui-ink">
        {svg ? 'Seu QR code está pronto' : 'Seu QR code'}
      </h2>

      {svg ? (
        <>
          {/* O SVG vem só de `svgDoQr`, que escapa tudo o que a pessoa digitou. */}
          <div
            role="img"
            aria-label={`QR code de ${nomeDoTipo}`}
            className="mx-auto w-full max-w-[280px] overflow-hidden rounded-lg border border-ui-line [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {children}
          <p className="m-0 text-center text-sm leading-[1.45] text-ui-muted">
            Aponte a câmera de outro celular para testar.
          </p>
        </>
      ) : (
        <div className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center rounded-lg border-2 border-dashed border-ui-line-strong bg-ui-surface p-5 text-center">
          {alerta ? (
            <p role="alert" className="m-0 text-[15px] font-medium leading-[1.45] text-ui-erro">
              {alerta}
            </p>
          ) : (
            <p className="m-0 text-[15px] leading-[1.45] text-ui-muted">
              Preencha os campos acima para ver o seu QR code.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

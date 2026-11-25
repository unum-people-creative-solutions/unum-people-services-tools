'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Bloco } from '../../components/ui/Bloco';
import { EscolhaDoTipo, TITULO_DO_PASSO_1 } from '../../components/qr/EscolhaDoTipo';
import { FormularioDoTipo } from '../../components/qr/FormularioDoTipo';
import { PreviaDoQr } from '../../components/qr/PreviaDoQr';
import { AvisoDoPix, PixCopiaECola } from '../../components/qr/PixCopiaECola';
import { useQrCode } from '../../hooks/useQrCode';
import { avisosDoPix, TIPOS, type TipoId } from '../../utils/qr/conteudos';
import { errosVisiveis } from '../../utils/qr/erros';
import { conteudoDe } from '../../utils/qr/estado';
import { gerarQr } from '../../utils/qr/gerar';

export default function QrCodeView({ children }: { children?: React.ReactNode }) {
  const { estado, escolherTipo, mudarCampos } = useQrCode();
  const [trocando, setTrocando] = React.useState(false);
  // Campos de que a pessoa já saiu, por tipo ("pix.chave"): é o que libera o erro do campo.
  const [tocados, setTocados] = React.useState<ReadonlySet<string>>(new Set());
  const [pedidosDeFoco, setPedidosDeFoco] = React.useState(0);
  const formulario = React.useRef<HTMLDivElement>(null);

  const { tipo } = estado;

  // O foco vai para o primeiro campo do tipo só quando a pessoa escolhe (restaurar não mexe no foco).
  React.useEffect(() => {
    if (pedidosDeFoco === 0) return;
    formulario.current?.querySelector<HTMLElement>('input:not([disabled]), select, textarea')?.focus();
  }, [pedidosDeFoco]);

  const escolher = (novo: TipoId) => {
    escolherTipo(novo);
    setTrocando(false);
    setPedidosDeFoco((n) => n + 1);
  };

  const conteudo = conteudoDe(estado);
  const tocadosDoTipo = new Set([...tocados].filter((c) => c.startsWith(`${tipo}.`)).map((c) => c.slice(`${tipo}.`.length)));
  const erros = tipo && conteudo && !conteudo.ok ? errosVisiveis(tipo, estado.campos[tipo], conteudo.erros, tocadosDoTipo) : {};
  const avisos = tipo === 'pix' ? avisosDoPix(estado.campos.pix) : {};

  const nomeDoTipo = TIPOS.find((t) => t.id === tipo)?.nome ?? '';
  const textoDoQr = conteudo?.ok ? conteudo.texto : null;
  const { cor, frase } = estado;
  const qr = React.useMemo(
    () => (textoDoQr === null ? null : gerarQr(textoDoQr, { cor, frase })),
    [textoDoQr, cor, frase],
  );

  return (
    <div className="flex min-h-screen flex-col bg-ui-surface text-ui-ink">
      <Header ferramenta />

      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-5 px-5 pb-10 pt-2">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-ui-ink">
            Gerador de QR code grátis
          </h1>
          <p className="m-0 text-base leading-normal text-ui-muted">
            Nunca expira. Sem cadastro e sem anúncio. Fica pronto aqui no seu celular.
          </p>
        </div>

        {/* No celular, tudo em uma coluna na ordem da tela; de md em diante, duas colunas (blueprint §2). */}
        <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-6">
          <div className="flex flex-col gap-5">
            <Bloco numero={1} titulo={TITULO_DO_PASSO_1}>
              <EscolhaDoTipo
                tipo={tipo}
                aberta={tipo === null || trocando}
                onEscolher={escolher}
                onTrocar={() => setTrocando(true)}
              />
            </Bloco>

            {tipo && (
              <Bloco numero={2} titulo="Preencha os dados">
                <div ref={formulario} className="flex flex-col gap-[18px]">
                  <FormularioDoTipo
                    key={tipo}
                    tipo={tipo}
                    campos={estado.campos}
                    erros={erros}
                    avisos={avisos}
                    onChange={mudarCampos}
                    onBlur={(campo) => setTocados((atual) => new Set(atual).add(`${tipo}.${campo}`))}
                  />
                </div>
              </Bloco>
            )}
          </div>

          {tipo && (
            <div className="flex flex-col gap-5 md:sticky md:top-4">
              <PreviaDoQr
                nomeDoTipo={nomeDoTipo}
                svg={qr?.ok ? qr.svg : null}
                alerta={qr && !qr.ok ? qr.erro : undefined}
              />
              {tipo === 'pix' && textoDoQr && qr?.ok && <PixCopiaECola key={textoDoQr} codigo={textoDoQr} />}
              {tipo === 'pix' && <AvisoDoPix />}
            </div>
          )}
        </div>

        {children}
      </main>

      <Footer />
    </div>
  );
}

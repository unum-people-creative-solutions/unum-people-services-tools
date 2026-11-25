'use client';

import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Botao } from '../../components/ui/Botao';
import { Bloco } from '../../components/ui/Bloco';
import { EscolhaDoTipo, TITULO_DO_PASSO_1 } from '../../components/qr/EscolhaDoTipo';
import { FormularioDoTipo } from '../../components/qr/FormularioDoTipo';
import { AcoesDoQr } from '../../components/qr/AcoesDoQr';
import { PreviaDoQr } from '../../components/qr/PreviaDoQr';
import { AvisoDoPix, PixCopiaECola } from '../../components/qr/PixCopiaECola';
import { useMedicao } from '../../hooks/useMedicao';
import { useQrCode } from '../../hooks/useQrCode';
import { avisosDoPix, TIPOS, type TipoId } from '../../utils/qr/conteudos';
import { errosVisiveis } from '../../utils/qr/erros';
import { conteudoDe } from '../../utils/qr/estado';
import { gerarQr } from '../../utils/qr/gerar';

export default function QrCodeView({ children }: { children?: React.ReactNode }) {
  const { estado, escolherTipo, mudarCampos, apagar } = useQrCode();
  const { marcar, comecou } = useMedicao('qr-code');
  const [trocando, setTrocando] = React.useState(false);
  // Campos de que a pessoa já saiu, por tipo ("pix.chave"): é o que libera o erro do campo.
  const [tocados, setTocados] = React.useState<ReadonlySet<string>>(new Set());
  const [pedidosDeFoco, setPedidosDeFoco] = React.useState(0);
  const [confirmando, setConfirmando] = React.useState(false);
  const [apagou, setApagou] = React.useState(false);
  const formulario = React.useRef<HTMLDivElement>(null);

  const { tipo } = estado;

  // O foco vai para o primeiro campo do tipo só quando a pessoa escolhe (restaurar não mexe no foco).
  React.useEffect(() => {
    if (pedidosDeFoco === 0) return;
    formulario.current?.querySelector<HTMLElement>('input:not([disabled]), select, textarea')?.focus();
  }, [pedidosDeFoco]);

  React.useEffect(() => {
    marcar('visita');
  }, [marcar]);

  const escolher = (novo: TipoId) => {
    escolherTipo(novo);
    setTrocando(false);
    setApagou(false);
    setPedidosDeFoco((n) => n + 1);
    marcar('comecou');
  };

  const apagarTudo = () => {
    apagar();
    setTocados(new Set());
    setTrocando(false);
    setConfirmando(false);
    setApagou(true);
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

  // O primeiro QR válido. Quem só voltou e olha o QR restaurado não conta (o hook exige "comecou" antes).
  const temQr = qr?.ok === true;
  React.useEffect(() => {
    if (temQr && comecou) marcar('resultado');
  }, [temQr, comecou, marcar]);

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
              >
                {qr?.ok && (
                  <AcoesDoQr
                    // Outro tipo, outro arquivo: o erro de uma ação não passa de um QR para o outro.
                    key={tipo}
                    tipo={tipo}
                    matriz={qr.matriz}
                    svg={qr.svg}
                    desenho={{ cor, frase }}
                    aoBaixar={() => marcar('baixou')}
                  />
                )}
              </PreviaDoQr>
              {tipo === 'pix' && textoDoQr && qr?.ok && <PixCopiaECola key={textoDoQr} codigo={textoDoQr} />}
              {tipo === 'pix' && <AvisoDoPix />}
            </div>
          )}
        </div>

        <section aria-label="Apagar dados" className="flex flex-col gap-3">
          {confirmando ? (
            <div className="flex max-w-[640px] flex-col gap-3 rounded-lg bg-ui-bg p-3.5">
              <p className="m-0 text-[15px] font-medium text-ui-ink">Apagar tudo o que você digitou neste aparelho?</p>
              <div className="flex gap-3">
                <Botao onClick={apagarTudo}>Sim, apagar</Botao>
                <Botao variante="contorno" autoFocus onClick={() => setConfirmando(false)}>
                  Cancelar
                </Botao>
              </div>
            </div>
          ) : (
            <Botao variante="link" onClick={() => setConfirmando(true)}>
              Apagar o que eu digitei
            </Botao>
          )}
          {apagou && (
            <p role="status" className="m-0 text-sm font-medium text-ui-ok">
              Pronto, apagamos tudo.
            </p>
          )}
        </section>

        {children}
      </main>

      <Footer />
    </div>
  );
}

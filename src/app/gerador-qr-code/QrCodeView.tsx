'use client';

import React from 'react';
import clsx from 'clsx';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Botao } from '../../components/ui/Botao';
import { Bloco } from '../../components/ui/Bloco';
import { Convite } from '../../components/ui/Convite';
import { Recolhivel } from '../../components/ui/Recolhivel';
import { EscolhaDoTipo, TITULO_DO_PASSO_1 } from '../../components/qr/EscolhaDoTipo';
import { FormularioDoTipo } from '../../components/qr/FormularioDoTipo';
import { CaraDoNegocio } from '../../components/qr/CaraDoNegocio';
import { PlaquinhaParaImprimir, SecaoDaPlaquinha } from '../../components/qr/SecaoDaPlaquinha';
import { AcoesDoQr } from '../../components/qr/AcoesDoQr';
import { PreviaDoQr } from '../../components/qr/PreviaDoQr';
import { AvisoDoPix, PixCopiaECola } from '../../components/qr/PixCopiaECola';
import { useMedicao } from '../../hooks/useMedicao';
import { useQrCode } from '../../hooks/useQrCode';
import { avisosDoPix, TIPOS, type TipoId } from '../../utils/qr/conteudos';
import { errosVisiveis } from '../../utils/qr/erros';
import { chamadaDoEstado, conteudoDe } from '../../utils/qr/estado';
import type { LogoLido } from '../../utils/qr/logo';
import { svgDoQr } from '../../utils/qr/desenho';
import { gerarQr } from '../../utils/qr/gerar';
import { dadosDaPlaquinha as montarDadosDaPlaquinha } from '../../utils/qr/plaquinha';

export default function QrCodeView({ children }: { children?: React.ReactNode }) {
  const { estado, escolherTipo, mudarCampos, mudarAparencia, apagar } = useQrCode();
  const { marcar, comecou } = useMedicao('qr-code');
  // Campos de que a pessoa já saiu, por tipo ("pix.chave"): é o que libera o erro do campo.
  const [tocados, setTocados] = React.useState<ReadonlySet<string>>(new Set());
  const [pedidosDeFoco, setPedidosDeFoco] = React.useState(0);
  const [confirmando, setConfirmando] = React.useState(false);
  const [apagou, setApagou] = React.useState(false);
  // Cada "Apagar" recomeça os controles da cara do negócio (inclusive o aviso de cor recusada).
  const [apagados, setApagados] = React.useState(0);
  // O logo nunca entra no estado guardado (DT-QR-11): fica só na memória da página.
  const [logo, setLogo] = React.useState<LogoLido | null>(null);
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
    setApagou(false);
    setPedidosDeFoco((n) => n + 1);
    marcar('comecou');
  };

  const apagarTudo = () => {
    apagar();
    setTocados(new Set());
    setConfirmando(false);
    setApagou(true);
    setApagados((n) => n + 1);
    setLogo(null);
  };

  const conteudo = conteudoDe(estado);
  const tocadosDoTipo = new Set([...tocados].filter((c) => c.startsWith(`${tipo}.`)).map((c) => c.slice(`${tipo}.`.length)));
  const erros = tipo && conteudo && !conteudo.ok ? errosVisiveis(tipo, estado.campos[tipo], conteudo.erros, tocadosDoTipo) : {};
  const avisos = tipo === 'pix' ? avisosDoPix(estado.campos.pix) : {};

  const nomeDoTipo = TIPOS.find((t) => t.id === tipo)?.nome ?? '';
  const textoDoQr = conteudo?.ok ? conteudo.texto : null;
  const { cor, frase } = estado;
  const qr = React.useMemo(
    () => (textoDoQr === null ? null : gerarQr(textoDoQr, { cor, frase, logo: logo?.dataUrl })),
    [textoDoQr, cor, frase, logo],
  );

  // Plaquinha (RF-QR-36): só existe com QR válido. O QR dela leva cor e logo, mas não a frase embaixo.
  const matrizDoQr = qr?.ok ? qr.matriz : null;
  const svgDaPlaquinha = React.useMemo(
    () => (matrizDoQr ? svgDoQr(matrizDoQr, { cor, logo: logo?.dataUrl }) : null),
    [matrizDoQr, cor, logo],
  );
  const dadosDaPlaquinha =
    tipo && matrizDoQr ? montarDadosDaPlaquinha(tipo, estado.campos, estado.nomeDoNegocio, cor) : null;

  // O primeiro QR válido. Quem só voltou e olha o QR restaurado não conta (o hook exige "comecou" antes).
  const temQr = qr?.ok === true;
  React.useEffect(() => {
    if (temQr && comecou) marcar('resultado');
  }, [temQr, comecou, marcar]);

  return (
    <>
      {/* Com a plaquinha na página, na impressão só ela sai (contêiner `PlaquinhaParaImprimir`, DT-QR-10). */}
      <div className={clsx('flex min-h-screen flex-col bg-ui-surface text-ui-ink', dadosDaPlaquinha && 'print:hidden')}>
        <Header ferramenta larguraDaFerramenta="larga" />

        <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-5 px-5 pb-10 pt-2">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-ui-ink">
              Gerador de QR code grátis
            </h1>
            <p className="m-0 text-base leading-normal text-ui-muted">
              Nunca expira. Sem cadastro e sem anúncio. Fica pronto aqui no seu celular.
            </p>
          </div>

          {/*
            Uma grade só, com os blocos soltos: no celular eles seguem a ordem da tela (blueprint §1: QR logo depois
            dos campos, depois "cara do negócio" e plaquinha). De md em diante são duas colunas (blueprint §2):
            passos e "cara do negócio" à esquerda, o cartão do QR (preso no topo) e a plaquinha à direita.
          */}
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 md:items-start md:gap-6">
            <div className="min-w-0 md:col-start-1 md:row-start-1">
              <Bloco numero={1} titulo={TITULO_DO_PASSO_1}>
                <EscolhaDoTipo tipo={tipo} onEscolher={escolher} />
              </Bloco>
            </div>

            {tipo && (
              <div className="min-w-0 md:col-start-1 md:row-start-2">
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
              </div>
            )}

            {/*
              O cartão fica preso dentro de um invólucro que ocupa só as linhas 1–3. Um `sticky` direto na grade
              ficaria preso até o fim dela e cobriria a plaquinha da linha 4 no computador.
            */}
            {tipo && (
              <div className="min-w-0 md:col-start-2 md:row-span-3 md:row-start-1 md:self-stretch">
                <div className="flex min-w-0 flex-col gap-5 md:sticky md:top-4">
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
                        desenho={{ cor, frase, logo: logo ?? undefined }}
                        aoBaixar={() => marcar('baixou')}
                      />
                    )}
                  </PreviaDoQr>
                  {tipo === 'pix' && textoDoQr && qr?.ok && <PixCopiaECola key={textoDoQr} codigo={textoDoQr} />}
                  {tipo === 'pix' && <AvisoDoPix />}
                </div>
              </div>
            )}

            {tipo && (
              <div className="min-w-0 md:col-start-1 md:row-start-3">
                <CaraDoNegocio
                  key={apagados}
                  cor={cor}
                  onCor={(nova) => mudarAparencia({ cor: nova })}
                  logo={logo}
                  onLogo={setLogo}
                  frase={frase}
                  onFrase={(nova) => mudarAparencia({ frase: nova })}
                  chamada={chamadaDoEstado(estado) ?? ''}
                />
              </div>
            )}

            {tipo && qr?.ok && svgDaPlaquinha && dadosDaPlaquinha && (
              <div className="min-w-0 md:col-start-2 md:row-start-4">
                <SecaoDaPlaquinha
                  // Outro tipo, outro arquivo: o erro de uma ação não passa de um QR para o outro.
                  key={tipo}
                  tipo={tipo}
                  matriz={qr.matriz}
                  svg={svgDaPlaquinha}
                  dados={dadosDaPlaquinha}
                  tamanho={estado.tamanho}
                  logo={logo ?? undefined}
                  nomeDoNegocio={estado.nomeDoNegocio}
                  onNomeDoNegocio={(nome) => mudarAparencia({ nomeDoNegocio: nome })}
                  onTamanho={(tamanho) => mudarAparencia({ tamanho })}
                  aoBaixar={() => marcar('baixou')}
                />
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

          {children && (
            <Recolhivel titulo="Como usar o seu QR code" variante="cartao" onAbrir={() => marcar('guia')}>
              <div>{children}</div>
            </Recolhivel>
          )}

          <Convite
            texto="Ainda não tem uma página do seu negócio? Crie a sua e coloque o link no QR code."
            link="Criar minha página"
            href="https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=qr-code"
            onClick={() => marcar('convite')}
          />
        </main>

        <Footer />
      </div>
      {dadosDaPlaquinha && svgDaPlaquinha && (
        <PlaquinhaParaImprimir dados={dadosDaPlaquinha} svg={svgDaPlaquinha} tamanho={estado.tamanho} />
      )}
    </>
  );
}

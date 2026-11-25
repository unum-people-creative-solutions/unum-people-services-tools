import React from 'react';
import {
  COR_DO_RODAPE,
  COR_DO_TEXTO,
  MEDIDAS,
  PAPEIS,
  PILHA_DE_FONTES,
  RODAPE_DA_PLAQUINHA,
  type DadosDaPlaquinha,
} from '../../utils/qr/plaquinha';
import type { TamanhoDaPlaquinha } from '../../utils/qr/estado';

interface PlaquinhaProps {
  tamanho: TamanhoDaPlaquinha;
  dados: DadosDaPlaquinha;
  /** SVG do QR (só de `svgDoQr`: escapa tudo o que a pessoa digitou), com cor e logo e sem frase. */
  svg: string;
  /** Nome acessível. Com ele a folha vira uma imagem (`role="img"`); sem ele (cópia de impressão), não. */
  rotulo?: string;
}

/** Em unidades `cqw`: 1% da largura da folha, que é o contêiner. Tudo escala junto de A6 para A4. */
const cqw = (fracao: number) => `${(fracao * 100).toFixed(3)}cqw`;

/**
 * A plaquinha em HTML (blueprint §3), em escala: a folha é o contêiner e todas as medidas são frações da
 * sua largura (`MEDIDAS`, as mesmas do PNG desenhado no canvas). Serve à prévia na tela e à impressão.
 */
export function Plaquinha({ tamanho, dados, svg, rotulo }: PlaquinhaProps) {
  const { largura, altura } = PAPEIS[tamanho];
  const { nome, chamada, rodape, espaco } = MEDIDAS;

  return (
    <div
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      style={{
        aspectRatio: `${largura} / ${altura}`,
        containerType: 'inline-size',
        width: '100%',
        backgroundColor: '#ffffff',
        fontFamily: PILHA_DE_FONTES,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
          padding: cqw(MEDIDAS.margem),
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 0,
          }}
        >
          {dados.nomeDoNegocio && (
            <p
              style={{
                margin: 0,
                fontSize: cqw(nome.fonte),
                lineHeight: nome.linha,
                letterSpacing: `${nome.letras}em`,
                color: COR_DO_TEXTO,
                overflowWrap: 'anywhere',
              }}
            >
              {dados.nomeDoNegocio}
            </p>
          )}
          <p
            style={{
              margin: 0,
              marginTop: dados.nomeDoNegocio ? cqw(espaco.nomeChamada) : 0,
              fontSize: cqw(chamada.fonte),
              lineHeight: chamada.linha,
              fontWeight: 700,
              color: dados.cor,
              overflowWrap: 'anywhere',
            }}
          >
            {dados.chamada}
          </p>
          {/* O SVG vem só de `svgDoQr`, que escapa tudo o que a pessoa digitou. */}
          <div
            className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            style={{ width: cqw(MEDIDAS.qr), marginTop: cqw(espaco.chamadaQr) }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {dados.apoio.map((linha, i) => (
            <p
              key={`${i}-${linha.texto}`}
              style={{
                margin: 0,
                marginTop: cqw(i === 0 ? espaco.qrApoio : espaco.entreApoios),
                fontSize: cqw(MEDIDAS.apoio.fonte),
                lineHeight: MEDIDAS.apoio.linha,
                fontWeight: linha.negrito ? 700 : 400,
                color: COR_DO_TEXTO,
                overflowWrap: 'anywhere',
              }}
            >
              {linha.texto}
            </p>
          ))}
        </div>
        <p
          style={{
            margin: 0,
            marginTop: cqw(espaco.corpoRodape),
            fontSize: cqw(rodape.fonte),
            lineHeight: rodape.linha,
            color: COR_DO_RODAPE,
          }}
        >
          {RODAPE_DA_PLAQUINHA}
        </p>
      </div>
    </div>
  );
}

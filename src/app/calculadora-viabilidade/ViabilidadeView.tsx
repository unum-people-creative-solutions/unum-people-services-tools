'use client';

import React from 'react';
import clsx from 'clsx';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Botao } from '../../components/ui/Botao';
import { Campo } from '../../components/ui/Campo';
import { Bloco } from '../../components/ui/Bloco';
import { Subtotal } from '../../components/ui/Subtotal';
import { EstadoDoResultado } from '../../components/ui/EstadoDoResultado';
import { BarraDoResultado } from '../../components/ui/BarraDoResultado';
import { Recolhivel } from '../../components/ui/Recolhivel';
import { Convite } from '../../components/ui/Convite';
import { useMedicao } from '../../hooks/useMedicao';
import { formatarNumero, formatarReais } from '../../utils/numeros';
import { calcular, ENTRADAS_VAZIAS, type Caminho, type Conta, type Entradas, type MotivoDaFalta } from './calculo';

const ID_RESULTADO = 'resultado';

const FRASE_DA_FALTA: Record<MotivoDaFalta, string> = {
  basicos: 'Preencha o preço, o clique e quantos chamam para ver a conta.',
  orcamento: 'Preencha quanto você quer gastar em anúncio para ver a conta.',
  clientes: 'Preencha quantos clientes você quer e quantos compram para ver a conta.',
  custo: 'Corrija o preço e o custo da venda para ver a conta.',
};

const ERRO_DO_CUSTO = 'O gasto por venda é maior que o preço. Confira os dois valores.';

const vendas = (n: number) => `${formatarNumero(n)} ${n === 1 ? 'venda' : 'vendas'}`;
const clientesDe = (n: number) => `${formatarNumero(n)} ${n === 1 ? 'cliente' : 'clientes'}`;
const cercaDe = (n: number) => `cerca de ${formatarNumero(n)}`;

const OPCOES: { caminho: Caminho; titulo: string; apoio: string }[] = [
  { caminho: 'orcamento', titulo: 'Já sei quanto vou gastar', apoio: 'Quantas vendas preciso para o anúncio se pagar?' },
  { caminho: 'clientes', titulo: 'Quero um número de clientes', apoio: 'Quanto preciso investir para chegar lá?' },
];

function Caminhos({ caminho, onChange }: { caminho: Caminho; onChange: (c: Caminho) => void }) {
  const base = React.useId();

  return (
    <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
      <legend className="mb-2.5 p-0 text-[15px] font-medium text-ui-ink">O que você quer descobrir?</legend>
      {OPCOES.map((opcao) => {
        const marcada = opcao.caminho === caminho;
        const idTitulo = `${base}-${opcao.caminho}-titulo`;
        const idApoio = `${base}-${opcao.caminho}-apoio`;
        return (
          <label
            key={opcao.caminho}
            className={clsx(
              'flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-ui-bg px-4 py-3.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-ui-brand-blue',
              marcada ? 'border-2 border-ui-brand-blue' : 'border border-ui-line',
            )}
          >
            <input
              type="radio"
              name="caminho"
              checked={marcada}
              onChange={() => onChange(opcao.caminho)}
              aria-labelledby={idTitulo}
              aria-describedby={idApoio}
              className="mt-[3px] size-[18px] accent-ui-brand-blue"
            />
            <span className="flex flex-col gap-0.5">
              <span id={idTitulo} className="text-base font-semibold text-ui-ink">
                {opcao.titulo}
              </span>
              <span id={idApoio} className="text-sm leading-[1.45] text-ui-muted">
                {opcao.apoio}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

type Selo = { texto: string; caixa: string; selo: string };

const SELOS = {
  ok: { caixa: 'bg-ui-ok-bg', selo: 'bg-ui-ok' },
  atencao: { caixa: 'bg-ui-atencao-bg', selo: 'bg-ui-atencao' },
  erro: { caixa: 'bg-ui-erro-bg', selo: 'bg-ui-erro' },
} as const;

/**
 * Os selos do `EstadoDoResultado` da F2 são fixos ("Saudável", "Sobra pouco", "Prejuízo");
 * aqui o estado vem escrito com as palavras da conta ("Dá para pagar", "Arriscado", "Se paga").
 */
function EstadoDaConta({ texto, tom, frase }: { texto: string; tom: keyof typeof SELOS; frase: string }) {
  const visual: Selo = { texto, ...SELOS[tom] };
  return (
    <div role="status" className={clsx('flex flex-col gap-2 rounded-[10px] p-3.5', visual.caixa)}>
      <span className={clsx('self-start rounded-full px-2.5 py-[3px] text-[13px] font-semibold text-white', visual.selo)}>
        {visual.texto}
      </span>
      <span className="text-sm leading-[1.45] text-ui-ink">{frase}</span>
    </div>
  );
}

function Estado({ conta }: { conta: Conta }) {
  if (conta.tipo === 'falta') {
    return <EstadoDoResultado estado="falta" frase={FRASE_DA_FALTA[conta.motivo]} />;
  }

  if (conta.tipo === 'orcamento') {
    const taxa = `${formatarNumero(conta.taxaExigida, 1)}%`;
    let frase: string;
    if (conta.impossivel) {
      frase =
        'Mesmo vendendo para todas as pessoas que chamarem, o anúncio não se paga. Aumente o preço, reduza o custo ou o gasto com anúncio.';
    } else if (conta.umEmCada <= 1) {
      frase = `Você precisa vender para todas as pessoas que chamarem (${taxa}).`;
    } else {
      frase = `Você precisa vender para 1 em cada ${formatarNumero(conta.umEmCada)} pessoas que chamarem (${taxa}).`;
    }
    return conta.arriscado ? (
      <EstadoDaConta texto="Arriscado" tom="atencao" frase={frase} />
    ) : (
      <EstadoDaConta texto="Dá para pagar" tom="ok" frase={frase} />
    );
  }

  return conta.sePaga ? (
    <EstadoDaConta
      texto="Se paga"
      tom="ok"
      frase={`O anúncio volta ${formatarReais(conta.lucro)} de lucro além do que custou (retorno de ${formatarNumero(conta.retorno, 1)}%).`}
    />
  ) : (
    <EstadoDaConta
      texto="Prejuízo"
      tom="erro"
      frase={`Cada cliente custa mais do que sobra da venda. O anúncio dá prejuízo de ${formatarReais(Math.abs(conta.lucro))}.`}
    />
  );
}

function ContaPassoAPasso({ conta }: { conta: Exclude<Conta, { tipo: 'falta' }> }) {
  if (conta.tipo === 'orcamento') {
    return (
      <Subtotal
        linhas={[
          { rotulo: 'Preço − custo = sobra por venda', valor: formatarReais(conta.sobra) },
          { rotulo: 'Orçamento ÷ sobra por venda = vendas', valor: formatarNumero(conta.vendasExatas, 2) },
          { rotulo: 'Vendas, arredondando para cima', valor: String(conta.vendas) },
          { rotulo: 'Orçamento ÷ preço do clique = cliques', valor: formatarNumero(conta.cliques) },
          { rotulo: 'Cliques × quantos chamam (%) = pessoas', valor: formatarNumero(conta.pessoas) },
          { rotulo: 'Vendas ÷ pessoas que chamam = taxa exigida', valor: `${formatarNumero(conta.taxaExigida, 1)}%` },
        ]}
      />
    );
  }

  return (
    <Subtotal
      linhas={[
        { rotulo: 'Preço − custo = sobra por venda', valor: formatarReais(conta.sobra) },
        { rotulo: 'Clientes × preço do clique ÷ (chamam × compram) = investimento', valor: formatarReais(conta.investimento) },
        { rotulo: 'Investimento ÷ preço do clique = cliques', valor: formatarNumero(conta.cliques) },
        { rotulo: 'Cliques × quantos chamam (%) = pessoas', valor: formatarNumero(conta.pessoas) },
        { rotulo: 'Investimento ÷ clientes = custo de cada cliente', valor: formatarReais(conta.cac) },
        { rotulo: 'Clientes × sobra por venda = sobra total', valor: formatarReais(conta.sobraTotal) },
        { rotulo: 'Sobra total − investimento = lucro', valor: formatarReais(conta.lucro) },
        { rotulo: 'Lucro ÷ investimento = retorno', valor: `${formatarNumero(conta.retorno, 1)}%` },
      ]}
    />
  );
}

export default function ViabilidadeView({ children }: { children?: React.ReactNode }) {
  const [caminho, setCaminho] = React.useState<Caminho>('orcamento');
  const [entradas, setEntradas] = React.useState<Entradas>(ENTRADAS_VAZIAS);
  const [confirmando, setConfirmando] = React.useState(false);

  const mudar = (parcial: Partial<Entradas>) => setEntradas((atual) => ({ ...atual, ...parcial }));
  const conta = calcular(caminho, entradas);

  const { marcar, comecou } = useMedicao('vale-anunciar');
  const temResultado = conta.tipo !== 'falta';
  React.useEffect(() => {
    marcar('visita');
  }, [marcar]);
  React.useEffect(() => {
    if (temResultado && comecou) marcar('resultado');
  }, [temResultado, comecou, marcar]);

  const custoMaiorQueOPreco = entradas.custo > 0 && entradas.custo >= entradas.preco;
  const sobraPorVenda = entradas.preco > 0 && !custoMaiorQueOPreco ? formatarReais(entradas.preco - Math.max(entradas.custo, 0)) : '—';

  let barra: { rotulo: string; valor: string };
  if (caminho === 'orcamento') {
    barra = { rotulo: 'Vendas para se pagar', valor: conta.tipo === 'orcamento' ? vendas(conta.vendas) : 'Falta pouco' };
  } else {
    barra = { rotulo: 'Investimento', valor: conta.tipo === 'clientes' ? formatarReais(conta.investimento) : 'Falta pouco' };
  }

  return (
    // O onChange dos campos sobe até aqui: a primeira mudança de qualquer campo marca "comecou".
    <div className="flex min-h-screen flex-col bg-ui-surface text-ui-ink" onChange={() => marcar('comecou')}>
      <Header ferramenta />

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-5 px-5 pb-28 pt-2">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-ui-ink">
            Vale a pena anunciar?
          </h1>
          <p className="m-0 text-base leading-normal text-ui-muted">
            Antes de gastar com anúncio no Google ou no Instagram, veja quantas vendas pagam a conta.
          </p>
        </div>

        <Caminhos caminho={caminho} onChange={setCaminho} />

        <Bloco numero={1} titulo="Sua venda" apoio="Pense numa venda típica do seu negócio.">
          <Campo
            rotulo="Preço médio de cada venda"
            prefixo="R$"
            valor={entradas.preco}
            onChange={(preco) => mudar({ preco })}
          />
          <Campo
            rotulo="Quanto custa entregar essa venda"
            ajuda="Material, frete, taxa da maquininha. Se deixar em zero, o resultado fica bom demais."
            erro={custoMaiorQueOPreco ? ERRO_DO_CUSTO : undefined}
            prefixo="R$"
            valor={entradas.custo}
            // Custo negativo está fora do domínio: vale como zero (o código antigo aceitava)
            onChange={(custo) => mudar({ custo: Math.max(custo, 0) })}
          />
          <Subtotal linhas={[{ rotulo: 'Sobra por venda, antes do anúncio', valor: sobraPorVenda }]} />
        </Bloco>

        <Bloco numero={2} titulo="Seu anúncio" apoio="Use os números do painel do anúncio, se já tiver.">
          <Campo
            rotulo="Quanto custa cada clique"
            ajuda={'Na sua plataforma de anúncios aparece como "CPC médio".'}
            prefixo="R$"
            valor={entradas.cpc}
            onChange={(cpc) => mudar({ cpc })}
          />
          <Campo
            rotulo="De cada 100 que clicam, quantos chamam você"
            ajuda="No WhatsApp, por formulário ou ligação."
            sufixo="%"
            valor={entradas.chamam}
            onChange={(chamam) => mudar({ chamam })}
          />
          {caminho === 'orcamento' ? (
            <Campo
              rotulo="Quanto você quer gastar em anúncio"
              prefixo="R$"
              valor={entradas.orcamento}
              onChange={(orcamento) => mudar({ orcamento })}
            />
          ) : (
            <>
              <Campo
                rotulo="Quantos clientes novos você quer"
                valor={entradas.clientes}
                onChange={(clientes) => mudar({ clientes: Math.trunc(clientes) })}
              />
              <Campo
                rotulo="De cada 10 que chamam, quantos compram"
                ajuda="Se não souber, pense nos últimos 10 que pediram orçamento."
                sufixo="%"
                valor={entradas.compram}
                onChange={(compram) => mudar({ compram })}
              />
            </>
          )}
        </Bloco>

        <section
          id={ID_RESULTADO}
          aria-labelledby="titulo-resultado"
          className="flex flex-col gap-4 rounded-xl border-2 border-ui-brand-blue bg-ui-bg p-5 shadow-[0_12px_32px_-8px_rgb(20_20_43/0.14)]"
        >
          <h2 id="titulo-resultado" className="m-0 text-lg font-semibold text-ui-ink">
            Seu resultado
          </h2>

          {conta.tipo === 'orcamento' && (
            <>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-ui-muted">Para o anúncio se pagar, você precisa de</span>
                <strong className="text-[34px] font-bold tracking-[-0.035em] text-ui-ink [font-variant-numeric:tabular-nums]">
                  {vendas(conta.vendas)}
                </strong>
              </div>
              <Subtotal
                linhas={[
                  { rotulo: `Cliques com ${formatarReais(conta.orcamento)}`, valor: cercaDe(conta.cliques) },
                  { rotulo: 'Pessoas que chamam', valor: cercaDe(conta.pessoas) },
                ]}
              />
            </>
          )}

          {conta.tipo === 'clientes' && (
            <>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-ui-muted">
                  Para conseguir {clientesDe(conta.clientes)}, invista cerca de
                </span>
                <strong className="text-[34px] font-bold tracking-[-0.035em] text-ui-ink [font-variant-numeric:tabular-nums]">
                  {formatarReais(conta.investimento)}
                </strong>
              </div>
              <Subtotal
                linhas={[
                  { rotulo: 'Cliques', valor: cercaDe(conta.cliques) },
                  { rotulo: 'Pessoas que chamam', valor: cercaDe(conta.pessoas) },
                  { rotulo: 'Cada cliente novo custa', valor: formatarReais(conta.cac) },
                ]}
              />
            </>
          )}

          <Estado conta={conta} />

          {conta.tipo !== 'falta' && (
            <Recolhivel titulo="Ver a conta passo a passo">
              <ContaPassoAPasso conta={conta} />
            </Recolhivel>
          )}

          {confirmando ? (
            <div className="flex flex-col gap-3 rounded-lg bg-ui-surface p-3.5">
              <p className="m-0 text-[15px] font-medium text-ui-ink">Apagar tudo o que você preencheu?</p>
              <div className="flex gap-3">
                <Botao
                  onClick={() => {
                    setEntradas(ENTRADAS_VAZIAS);
                    setCaminho('orcamento');
                    setConfirmando(false);
                  }}
                >
                  Apagar
                </Botao>
                <Botao variante="contorno" autoFocus onClick={() => setConfirmando(false)}>
                  Cancelar
                </Botao>
              </div>
            </div>
          ) : (
            <Botao variante="link" onClick={() => setConfirmando(true)}>
              Começar de novo
            </Botao>
          )}
        </section>

        {children && (
          <Recolhivel titulo="Como funciona esta conta" variante="cartao" onAbrir={() => marcar('guia')}>
            <div>{children}</div>
          </Recolhivel>
        )}

        <Convite
          texto="Vai anunciar?"
          link="Mande os cliques para uma página com o seu WhatsApp →"
          href="https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=vale-anunciar"
          onClick={() => marcar('convite')}
        />
      </main>

      <BarraDoResultado rotulo={barra.rotulo} valor={barra.valor} alvoId={ID_RESULTADO} />

      <Footer />
    </div>
  );
}

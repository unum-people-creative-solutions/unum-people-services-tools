'use client';

import React from 'react';
import { usePricing } from '../../hooks/usePricing';
import { useMedicao } from '../../hooks/useMedicao';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Botao } from '../../components/ui/Botao';
import { Campo, CampoTexto } from '../../components/ui/Campo';
import { Bloco } from '../../components/ui/Bloco';
import { Subtotal } from '../../components/ui/Subtotal';
import { EstadoDoResultado, type Estado } from '../../components/ui/EstadoDoResultado';
import { BarraDoResultado } from '../../components/ui/BarraDoResultado';
import { Recolhivel } from '../../components/ui/Recolhivel';
import { Convite } from '../../components/ui/Convite';
import { formatarNumero, formatarReais } from '../../utils/numeros';

const ID_RESULTADO = 'resultado';

type Precificacao = ReturnType<typeof usePricing>;

// Dados antigos do localStorage podem não trazer todos os campos
const valor = (n: number | undefined) => n || 0;

const algumOutroPreenchido = ({ custosFixos }: Precificacao['data']) =>
  [custosFixos.internet, custosFixos.contador, custosFixos.softwares, custosFixos.equipe, custosFixos.outras].some((n) => valor(n) > 0);

function Simulador({ pricing, marcar, comecou }: { pricing: Precificacao; marcar: ReturnType<typeof useMedicao>['marcar']; comecou: boolean }) {
  const { data, calculations, updateCustosFixos, updateCapacidade, updateServico, reset } = pricing;
  const { custosFixos, capacidade, servico } = data;

  // Decidido uma vez, quando os dados já carregaram: abre sozinho se alguma dessas contas
  // tem valor e depois não fecha na cara de quem está digitando.
  const [outrasAbertas] = React.useState(() => algumOutroPreenchido(data));
  const [confirmando, setConfirmando] = React.useState(false);

  const semHoras = valor(servico.horasEstimadas) <= 0 || calculations.horasFaturaveis <= 0;
  const temPreco = valor(servico.precoDesejado) > 0;
  // O estado segue os valores em centavos, como a tela mostra: cobrar exatamente o
  // preço mínimo exibido (arredondado) não pode aparecer como "perde R$ 0,00".
  const lucroEmCentavos = Math.round(calculations.lucroNominal * 100) / 100;
  const margem = lucroEmCentavos === 0 ? 0 : calculations.margemLucroReal;

  let estado: Estado | null = null;
  let frase: string | undefined;
  if (semHoras) {
    estado = 'falta';
    frase = 'Preencha as horas do serviço para ver o preço mínimo.';
  } else if (temPreco) {
    const sobramDe100 = formatarReais(margem);
    if (lucroEmCentavos < 0) {
      estado = 'prejuizo';
      frase = `Esse preço está abaixo do mínimo. Você perde ${formatarReais(Math.abs(calculations.lucroNominal))} em cada venda.`;
    } else if (margem < 20) {
      estado = 'sobra-pouco';
      frase = `De cada R$ 100, sobram ${sobramDe100}. Tente cobrar um pouco mais ou gastar menos.`;
    } else {
      estado = 'saudavel';
      frase = `De cada R$ 100, sobram ${sobramDe100}.`;
    }
  }

  // O resultado tem número quando não falta nenhuma hora: aí o preço mínimo aparece.
  React.useEffect(() => {
    if (!semHoras && comecou) marcar('resultado');
  }, [semHoras, comecou, marcar]);

  const precoMinimo = formatarReais(calculations.pisoAceitavel);
  const custoDoServico =
    calculations.custoFixoPorHora * valor(servico.horasEstimadas) + calculations.custosVariaveisDiretos;

  return (
    <>
      <Bloco numero={1} titulo="Contas fixas do mês" apoio="O que você paga todo mês, vendendo ou não.">
        <Campo
          rotulo="Aluguel e condomínio"
          prefixo="R$"
          valor={valor(custosFixos.aluguel)}
          onChange={(aluguel) => updateCustosFixos({ aluguel })}
        />
        <Campo
          rotulo="Luz e água"
          prefixo="R$"
          valor={valor(custosFixos.energia)}
          onChange={(energia) => updateCustosFixos({ energia })}
        />
        <Campo
          rotulo="Quanto você tira para viver"
          ajuda="Seu salário (pró-labore). Sem ele, o preço só paga as contas e você trabalha de graça."
          prefixo="R$"
          valor={valor(custosFixos.proLabore)}
          onChange={(proLabore) => updateCustosFixos({ proLabore })}
        />
        <Recolhivel
          titulo="+ Outras contas (internet, contador, programas, funcionários, DAS)"
          variante="linha"
          aberto={outrasAbertas}
        >
          <div className="flex flex-col gap-[18px] pt-2">
            <Campo
              rotulo="Internet e telefone"
              prefixo="R$"
              valor={valor(custosFixos.internet)}
              onChange={(internet) => updateCustosFixos({ internet })}
            />
            <Campo
              rotulo="Contador"
              prefixo="R$"
              valor={valor(custosFixos.contador)}
              onChange={(contador) => updateCustosFixos({ contador })}
            />
            <Campo
              rotulo="Programas e assinaturas"
              prefixo="R$"
              valor={valor(custosFixos.softwares)}
              onChange={(softwares) => updateCustosFixos({ softwares })}
            />
            <Campo
              rotulo="Salários de funcionários"
              prefixo="R$"
              valor={valor(custosFixos.equipe)}
              onChange={(equipe) => updateCustosFixos({ equipe })}
            />
            <Campo
              rotulo="Guia do MEI (DAS) e outras contas"
              ajuda="A guia mensal do MEI e qualquer conta fixa que não esteja acima."
              prefixo="R$"
              valor={valor(custosFixos.outras)}
              onChange={(outras) => updateCustosFixos({ outras })}
            />
          </div>
        </Recolhivel>
        <Subtotal
          destaque
          linhas={[{ rotulo: 'Total por mês', valor: formatarReais(calculations.totalCustosFixos) }]}
        />
      </Bloco>

      <Bloco numero={2} titulo="Seu tempo de trabalho" apoio="Quantas horas você consegue vender no mês.">
        <div className="grid grid-cols-2 gap-3">
          <Campo
            rotulo="Dias por mês"
            valor={valor(capacidade.diasTrabalhados)}
            onChange={(diasTrabalhados) => updateCapacidade({ diasTrabalhados })}
          />
          <Campo
            rotulo="Horas por dia"
            valor={valor(capacidade.horasDiarias)}
            onChange={(horasDiarias) => updateCapacidade({ horasDiarias })}
          />
        </div>
        <Campo
          rotulo="Tempo sem vender"
          ajuda="Orçamento, deslocamento, espera, burocracia. Se não souber, deixe 20%."
          sufixo="%"
          valor={valor(capacidade.percentualOciosidade)}
          onChange={(percentualOciosidade) => updateCapacidade({ percentualOciosidade })}
        />
        <Subtotal
          linhas={[
            { rotulo: 'Horas que você vende', valor: `${formatarNumero(calculations.horasFaturaveis)} h` },
            { rotulo: 'Conta fixa por hora', valor: formatarReais(calculations.custoFixoPorHora) },
          ]}
        />
      </Bloco>

      <Bloco numero={3} titulo="Sobre o serviço" apoio="Um serviço de cada vez. Ex.: manutenção de ar-condicionado.">
        <CampoTexto
          rotulo="Nome do serviço"
          placeholder="Opcional"
          valor={servico.nome ?? ''}
          onChange={(nome) => updateServico({ nome })}
        />
        <div className="grid grid-cols-2 items-start gap-3">
          <Campo
            rotulo="Horas que leva"
            valor={valor(servico.horasEstimadas)}
            onChange={(horasEstimadas) => updateServico({ horasEstimadas })}
          />
          <Campo
            rotulo="Material"
            prefixo="R$"
            valor={valor(servico.materiaisDiretos)}
            onChange={(materiaisDiretos) => updateServico({ materiaisDiretos })}
          />
          <Campo
            rotulo="Transporte e extras"
            prefixo="R$"
            valor={valor(servico.deslocamento)}
            onChange={(deslocamento) => updateServico({ deslocamento })}
          />
        </div>
        {/* Imposto com a largura toda: a ajuda dele não desalinha a grade (conferência visual da F2). */}
        <Campo
          rotulo="Imposto na nota"
          ajuda={'MEI: deixe 0% e coloque a guia mensal (DAS) em "Guia do MEI (DAS) e outras contas".'}
          sufixo="%"
          valor={valor(servico.impostosPercentual)}
          onChange={(impostosPercentual) => updateServico({ impostosPercentual })}
        />
      </Bloco>

      <section
        id={ID_RESULTADO}
        aria-labelledby="titulo-resultado"
        className="flex flex-col gap-4 rounded-xl border-2 border-ui-brand-blue bg-ui-bg p-5 shadow-[0_12px_32px_-8px_rgb(20_20_43/0.14)]"
      >
        <h2 id="titulo-resultado" className="m-0 text-lg font-semibold text-ui-ink">
          Seu resultado
        </h2>

        {!semHoras && (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-ui-muted">Preço mínimo deste serviço</span>
            <strong className="text-[34px] font-bold tracking-[-0.035em] text-ui-ink [font-variant-numeric:tabular-nums]">
              {precoMinimo}
            </strong>
            <span className="text-[13px] leading-[1.45] text-ui-muted">Abaixo disso, cada venda dá prejuízo.</span>
          </div>
        )}

        <Campo
          rotulo="Quanto você quer cobrar?"
          prefixo="R$"
          tamanho="grande"
          valor={valor(servico.precoDesejado)}
          onChange={(precoDesejado) => updateServico({ precoDesejado })}
        />

        {estado && (
          <EstadoDoResultado estado={estado} frase={frase}>
            {(estado === 'saudavel' || estado === 'sobra-pouco') && (
              <dl className="m-0 flex items-baseline justify-between text-[15px] text-ui-ink">
                <dt>Sobra no bolso</dt>
                <dd className="m-0 font-bold [font-variant-numeric:tabular-nums]">
                  {formatarReais(calculations.lucroNominal)}
                </dd>
              </dl>
            )}
          </EstadoDoResultado>
        )}

        {!semHoras && (
          <Recolhivel titulo="Ver a conta passo a passo">
            <Subtotal
              linhas={[
                {
                  rotulo: 'Conta fixa por hora × horas do serviço',
                  valor: formatarReais(calculations.custoFixoPorHora * valor(servico.horasEstimadas)),
                },
                { rotulo: '+ material e transporte', valor: formatarReais(calculations.custosVariaveisDiretos) },
                { rotulo: '= custo do serviço', valor: formatarReais(custoDoServico) },
                { rotulo: '÷ (1 − imposto) = preço mínimo', valor: precoMinimo },
                ...(temPreco
                  ? [{ rotulo: 'preço − imposto − custo = sobra no bolso', valor: formatarReais(calculations.lucroNominal) }]
                  : []),
              ]}
            />
          </Recolhivel>
        )}

        {confirmando ? (
          <div className="flex flex-col gap-3 rounded-lg bg-ui-surface p-3.5">
            <p className="m-0 text-[15px] font-medium text-ui-ink">Apagar tudo o que você preencheu?</p>
            <div className="flex gap-3">
              <Botao
                onClick={() => {
                  reset();
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

      <BarraDoResultado rotulo="Preço mínimo" valor={semHoras ? 'Falta pouco' : precoMinimo} alvoId={ID_RESULTADO} />
    </>
  );
}

export default function PrecificacaoView({ children }: { children?: React.ReactNode }) {
  const pricing = usePricing();
  const { marcar, comecou } = useMedicao('quanto-cobrar');
  React.useEffect(() => {
    marcar('visita');
  }, [marcar]);

  return (
    // O onChange dos campos sobe até aqui: a primeira mudança de qualquer campo marca "comecou".
    <div className="flex min-h-screen flex-col bg-ui-surface text-ui-ink" onChange={() => marcar('comecou')}>
      <Header ferramenta />

      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-5 px-5 pb-28 pt-2">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-ui-ink">
            Quanto cobrar pelo serviço
          </h1>
          <p className="m-0 text-base leading-normal text-ui-muted">
            Responda três blocos e veja o menor preço que não dá prejuízo. Leva uns 3 minutos.
          </p>
        </div>

        {pricing.isLoaded ? (
          <Simulador pricing={pricing} marcar={marcar} comecou={comecou} />
        ) : (
          <p className="m-0 py-10 text-center text-sm text-ui-muted">Carregando a calculadora…</p>
        )}

        {children && (
          <Recolhivel titulo="Como funciona esta conta" variante="cartao" onAbrir={() => marcar('guia')}>
            <div>{children}</div>
          </Recolhivel>
        )}

        <Convite
          texto="Já sabe o seu preço?"
          link="Mostre numa página com botão de WhatsApp →"
          href="https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=quanto-cobrar"
          onClick={() => marcar('convite')}
        />
      </main>

      <Footer />
    </div>
  );
}

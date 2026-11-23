import React from 'react';
import Link from 'next/link';
import { Guia, Topico, Lista, ListaNumerada, Perguntas, brl, porcentagem, classeDoLink } from './Guia';

// Entradas e resultados do exemplo. Os resultados seguem as contas de
// usePricing; o teste do guia alimenta o simulador real com estas entradas
// e confere que ele mostra os mesmos números (spec f4-guias, CA-F4-06).
export const EXEMPLO_PRECIFICACAO = {
  custosFixos: {
    aluguel: 800,
    energia: 150,
    internet: 100,
    contador: 250,
    softwares: 100,
    equipe: 0,
    proLabore: 3000,
  },
  capacidade: {
    diasTrabalhados: 22,
    horasDiarias: 8,
    percentualOciosidade: 20,
  },
  servico: {
    horasEstimadas: 3,
    materiaisDiretos: 40,
    deslocamento: 20,
    impostosPercentual: 6,
    preco: 250,
  },
  resultados: {
    totalCustosFixos: 4400,
    horasFaturaveis: 140.8,
    custoFixoPorHora: 31.25,
    custoBase: 153.75,
    precoMinimo: 163.56,
    imposto: 15,
    lucroLiquido: 81.25,
    margem: 32.5,
  },
  // Preço abaixo do mínimo, para "Como ler o resultado": 150 × 0,94 − 153,75
  abaixoDoMinimo: { preco: 150, prejuizo: 12.75 },
  // Imposto somado ao custo, em vez de tirado do preço: 153,75 × 1,06
  impostoSomado: 162.98,
};

export function GuiaPrecificacao() {
  const e = EXEMPLO_PRECIFICACAO;
  const r = e.resultados;

  return (
    <Guia titulo="Como calcular o preço do seu serviço">
      <Topico titulo="Para que serve">
        <p>
          Esta ferramenta mostra o menor preço que você pode cobrar sem ter prejuízo. Serve para quem vende
          serviço, como técnico, designer ou fotógrafo.
        </p>
        <p>
          Use para montar sua tabela de preços ou conferir se um preço antigo ainda se paga. Quer saber se um anúncio se paga? Veja{' '}
          <Link href="/calculadora-viabilidade" className={classeDoLink}>
            Vale a pena anunciar?
          </Link>
        </p>
      </Topico>

      <Topico titulo="Passo a passo">
        <ListaNumerada>
          <li>
            Em “Contas fixas do mês”, preencha “Aluguel e condomínio”, “Luz e água” e “Quanto você tira para
            viver”. Se tiver mais contas, abra “+ Outras contas”. Se for MEI, ponha a guia mensal em “Guia do
            MEI (DAS) e outras contas”. O “Total por mês” é a soma de tudo.
          </li>
          <li>
            Em “Seu tempo de trabalho”, preencha “Dias por mês”, “Horas por dia” e “Tempo sem vender”. A
            ferramenta multiplica os dias pelas horas e tira o tempo sem vender: são as “Horas que você
            vende”.
          </li>
          <li>
            Ela divide o total das contas por essas horas e mostra a “Conta fixa por hora”. É quanto cada hora custa para manter o negócio.
          </li>
          <li>
            Em “Sobre o serviço”, preencha “Horas que leva”, “Material”, “Transporte e extras” e “Imposto na
            nota”. O custo do serviço é a conta fixa por hora vezes as horas dele, mais material e transporte.
          </li>
          <li>
            O “Preço mínimo deste serviço” é esse custo com o imposto já incluído. O imposto é um pedaço do preço, não um acréscimo ao custo.
          </li>
          <li>
            Em “Quanto você quer cobrar?”, digite o preço que pensa em cobrar. Veja o selo e quanto “Sobra no
            bolso”.
          </li>
        </ListaNumerada>
      </Topico>

      <Topico titulo="Exemplo com números">
        <p>
          Um técnico de ar-condicionado paga {brl(r.totalCustosFixos)} de contas por mês. São{' '}
          {brl(e.custosFixos.aluguel)} de aluguel, {brl(e.custosFixos.energia)} de luz e água,{' '}
          {brl(e.custosFixos.internet)} de internet e {brl(e.custosFixos.contador)} de contador. Ainda
          entram {brl(e.custosFixos.softwares)} de programas e {brl(e.custosFixos.proLabore)} do que ele tira
          para viver.
        </p>
        <p>
          Ele trabalha {e.capacidade.diasTrabalhados} dias por mês, {e.capacidade.horasDiarias} horas por
          dia, e perde {porcentagem(e.capacidade.percentualOciosidade)} do tempo com orçamento e
          deslocamento. Sobram {r.horasFaturaveis.toLocaleString('pt-BR')} horas para vender, e cada hora
          custa {brl(r.custoFixoPorHora)}.
        </p>
        <p>
          Uma manutenção leva {e.servico.horasEstimadas} horas, usa {brl(e.servico.materiaisDiretos)} de
          material e {brl(e.servico.deslocamento)} de transporte. O custo do serviço é de{' '}
          {brl(r.custoBase)}. Com {porcentagem(e.servico.impostosPercentual)} de imposto na nota, o preço
          mínimo é de {brl(r.precoMinimo)}.
        </p>
        <p>
          Cobrando {brl(e.servico.preco)}, o imposto leva {brl(r.imposto)} e sobram {brl(r.lucroLiquido)} no
          bolso. De cada R$ 100, sobram {brl(r.margem)}.
        </p>
      </Topico>

      <Topico titulo="Como ler o resultado">
        <Lista>
          <li>
            <strong>“Falta pouco”:</strong> faltam dados, em geral as horas do serviço.
          </li>
          <li>
            <strong>“Saudável”:</strong> de cada R$ 100 cobrados, sobram R$ 20 ou mais.
          </li>
          <li>
            <strong>“Sobra pouco”:</strong> sobram menos de R$ 20 de cada R$ 100. Falta folga para imprevistos.
          </li>
          <li>
            <strong>“Prejuízo”:</strong> o preço está abaixo do mínimo, e cada venda perde dinheiro.
            No exemplo, cobrar {brl(e.abaixoDoMinimo.preco)} faz o técnico perder{' '}
            {brl(e.abaixoDoMinimo.prejuizo)} por manutenção.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Erros comuns">
        <Lista>
          <li>
            <strong>Deixar “Quanto você tira para viver” de fora.</strong> Sem ele, o preço só paga as contas
            e você trabalha de graça.
          </li>
          <li>
            <strong>Achar que vende todas as horas.</strong> Ninguém vende o mês inteiro. Com 0% em “Tempo
            sem vender”, o preço sai baixo demais.
          </li>
          <li>
            <strong>Somar o imposto ao custo.</strong> Somar {porcentagem(e.servico.impostosPercentual)} a{' '}
            {brl(r.custoBase)} dá {brl(e.impostoSomado)}. Esse preço ainda dá prejuízo, porque o mínimo é{' '}
            {brl(r.precoMinimo)}.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Perguntas frequentes">
        <Perguntas
          itens={[
            {
              pergunta: 'Meus dados ficam salvos?',
              resposta:
                'Ficam só neste aparelho, no navegador. Em outro aparelho, ou se você limpar os dados do navegador, os números somem. Nada do que você digita é enviado para nós.',
            },
            {
              pergunta: 'Sou MEI. O que coloco em “Imposto na nota”?',
              resposta:
                'Deixe 0%. O MEI paga um valor fixo por mês (a guia DAS). Coloque esse valor em “Guia do MEI (DAS) e outras contas”, dentro de “+ Outras contas”.',
            },
            {
              pergunta: 'Quanto coloco em “Tempo sem vender”?',
              resposta:
                'Se não souber, deixe 20%. Para achar o seu número, anote por uma semana quantas horas foram de serviço vendido.',
            },
          ]}
        />
      </Topico>

      <Topico titulo="Aviso">
        <p>
          Os resultados são estimativas feitas com os números que você informa. Eles não substituem a
          orientação de um contador.
        </p>
      </Topico>
    </Guia>
  );
}

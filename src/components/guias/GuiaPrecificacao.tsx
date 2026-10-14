import React from 'react';
import Link from 'next/link';
import { Guia, Topico, Lista, Perguntas, QuemFez, brl, porcentagem } from './Guia';

// Entradas e resultados do exemplo. Os resultados seguem as contas de
// usePricing; o teste do guia alimenta o simulador real com estas entradas
// e confere que ele mostra os mesmos números (spec RF-16).
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
    pisoAceitavel: 163.56,
    imposto: 15,
    lucroLiquido: 81.25,
    margemReal: 32.5,
  },
  // Preço abaixo do piso, para "Como ler o resultado": 150 × 0,94 − 153,75
  abaixoDoPiso: { preco: 150, prejuizo: 12.75, margem: -8.5 },
  // Imposto somado "por fora": 153,75 × 1,06
  impostoPorFora: 162.98,
};

export function GuiaPrecificacao() {
  const e = EXEMPLO_PRECIFICACAO;
  const r = e.resultados;

  return (
    <Guia titulo="Guia do Simulador de Precificação e Margem de Lucro">
      <Topico titulo="Para que serve">
        <p>
          O simulador ajuda a descobrir quanto cobrar por um serviço sem chute. Ele junta três coisas: o
          que custa manter o negócio aberto no mês, quantas horas você consegue de fato vender e o que
          cada serviço consome de tempo, material e imposto. Com isso, mostra o{' '}
          <strong>Piso Aceitável</strong>, o menor preço que não dá prejuízo, e a margem que sobra no
          preço que você quer cobrar.
        </p>
        <p>
          Serve para quem vende serviço por hora ou por trabalho: técnicos, profissionais liberais,
          pequenas oficinas, estúdios e consultórios. É útil tanto para montar a primeira tabela de preços
          quanto para descobrir se um preço antigo ainda se paga depois que os custos subiram.
        </p>
      </Topico>

      <Topico titulo="Como a conta é feita">
        <p>A conta segue seis passos, nesta ordem:</p>
        <Lista>
          <li>
            <strong>Custos fixos do mês:</strong> aluguel, energia, internet, contador, softwares,
            salários da equipe e o seu pró-labore, somados.
          </li>
          <li>
            <strong>Horas faturáveis</strong> = dias úteis × horas por dia × (1 − ociosidade). A ociosidade
            é a parte do tempo que não vira serviço vendido: orçamento, deslocamento, administração,
            espera.
          </li>
          <li>
            <strong>Custo fixo por hora</strong> = custos fixos ÷ horas faturáveis.
          </li>
          <li>
            <strong>Custo base do serviço</strong> = custo fixo por hora × horas do serviço + materiais
            diretos + deslocamento.
          </li>
          <li>
            <strong>Piso Aceitável</strong> = custo base ÷ (1 − alíquota de imposto). O imposto é
            calculado &quot;por dentro&quot;: incide sobre o preço final, como acontece na nota fiscal, e
            não sobre o custo.
          </li>
          <li>
            <strong>Lucro líquido</strong> = preço × (1 − alíquota) − custo base. A{' '}
            <strong>margem real</strong> é o lucro líquido dividido pelo preço.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Exemplo com números">
        <p>
          Um técnico de ar-condicionado tem {brl(r.totalCustosFixos)} de custos fixos por mês:{' '}
          {brl(e.custosFixos.aluguel)} de aluguel, {brl(e.custosFixos.energia)} de energia,{' '}
          {brl(e.custosFixos.internet)} de internet, {brl(e.custosFixos.contador)} de contador,{' '}
          {brl(e.custosFixos.softwares)} de softwares e {brl(e.custosFixos.proLabore)} de pró-labore. Ele
          trabalha {e.capacidade.diasTrabalhados} dias por mês, {e.capacidade.horasDiarias} horas por dia, e
          calcula que {porcentagem(e.capacidade.percentualOciosidade)} do tempo vai em orçamento e
          deslocamento. Sobram {r.horasFaturaveis.toLocaleString('pt-BR')} horas faturáveis, e cada hora
          custa {brl(r.custoFixoPorHora)} só para manter o negócio aberto.
        </p>
        <p>
          Uma manutenção leva {e.servico.horasEstimadas} horas, usa {brl(e.servico.materiaisDiretos)} de
          material e {brl(e.servico.deslocamento)} de deslocamento. O custo base é de {brl(r.custoBase)}{' '}
          ({e.servico.horasEstimadas} × {brl(r.custoFixoPorHora)} + {brl(e.servico.materiaisDiretos)} +{' '}
          {brl(e.servico.deslocamento)}). Com {porcentagem(e.servico.impostosPercentual)} de imposto sobre a
          nota, o Piso Aceitável é de {brl(r.pisoAceitavel)}.
        </p>
        <p>
          Cobrando {brl(e.servico.preco)}, o imposto leva {brl(r.imposto)}, sobram {brl(r.lucroLiquido)} de
          lucro líquido e a margem real é de {porcentagem(r.margemReal, 1)}. É uma margem saudável: dá
          para absorver um atraso, uma peça que quebrou ou um mês mais fraco.
        </p>
      </Topico>

      <Topico titulo="Como ler o resultado">
        <Lista>
          <li>
            <strong>Preço abaixo do piso:</strong> aparece um aviso, e cada serviço vendido nesse preço dá
            prejuízo. No exemplo, cobrar {brl(e.abaixoDoPiso.preco)} deixaria{' '}
            {brl(e.abaixoDoPiso.prejuizo)} de prejuízo por manutenção, uma margem de{' '}
            {porcentagem(e.abaixoDoPiso.margem, 1)}.
          </li>
          <li>
            <strong>Margem entre 0% e 20%:</strong> aparece o aviso de margem apertada. O serviço se paga,
            mas sobra pouco para imprevistos, investimento e crescimento.
          </li>
          <li>
            <strong>Margem acima de 20%:</strong> a faixa que a ferramenta considera saudável.
          </li>
          <li>
            <strong>Custo fixo por hora:</strong> é o número que mais ajuda no dia a dia. Todo serviço
            precisa cobrir, no mínimo, esse valor por hora trabalhada, além do material e do deslocamento.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Erros comuns">
        <Lista>
          <li>
            <strong>Deixar o pró-labore de fora.</strong> Se o seu salário não entra nos custos fixos, o
            preço só paga as contas da empresa, e você trabalha de graça.
          </li>
          <li>
            <strong>Contar todas as horas como vendáveis.</strong> Ninguém fatura todas as horas do mês.
            Com ociosidade zero, o custo por hora fica baixo demais, e o preço também.
          </li>
          <li>
            <strong>Calcular o imposto &quot;por fora&quot;.</strong> Somar{' '}
            {porcentagem(e.servico.impostosPercentual)} ao custo não é o mesmo que reservar{' '}
            {porcentagem(e.servico.impostosPercentual)} do preço. No exemplo, {brl(r.custoBase)} +{' '}
            {porcentagem(e.servico.impostosPercentual)} dá {brl(e.impostoPorFora)}, e esse preço ainda daria
            prejuízo, porque fica abaixo do piso de {brl(r.pisoAceitavel)}.
          </li>
          <li>
            <strong>Esquecer custos que aparecem só às vezes.</strong> Estacionamento, pedágio, peça de
            reposição e taxa de entrega também saem do bolso. Use o campo de deslocamento e extras.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Perguntas frequentes">
        <Perguntas
          itens={[
            {
              pergunta: 'Qual alíquota de imposto devo usar?',
              resposta:
                'A que incide sobre a sua nota fiscal. No MEI, o imposto é um valor fixo por mês: você pode somá-lo aos custos fixos e deixar o campo de imposto em zero. No Simples Nacional, a alíquota depende da atividade e do faturamento. Confirme o seu número com o contador.',
            },
            {
              pergunta: 'Quanto de ociosidade é razoável?',
              resposta:
                'Depende da sua rotina. Anote, por uma ou duas semanas, quantas horas foram de serviço vendido e quantas foram de outras tarefas. O simulador começa com 20%, mas o seu número real é o que vale.',
            },
            {
              pergunta: 'O simulador serve para quem vende produto?',
              resposta:
                'Ele foi pensado para serviço, em que o tempo é o principal custo. Para produto feito por você, use as horas de produção e coloque o custo da mercadoria em materiais diretos.',
            },
            {
              pergunta: 'Preciso refazer a conta todo mês?',
              resposta:
                'Sempre que um custo fixo mudar ou o tempo de um serviço mudar. Um aumento de aluguel ou uma contratação muda o custo de cada hora, e com ele o piso de todos os serviços.',
            },
            {
              pergunta: 'E se eu não tiver um preço em mente?',
              resposta:
                'Comece pelo Piso Aceitável e some a margem que você quer. Depois teste o preço no campo de quanto deseja cobrar e veja se a margem real chega aonde você esperava.',
            },
            {
              pergunta: 'Os dados ficam salvos?',
              resposta: (
                <>
                  Ficam salvos só no seu navegador, para você continuar de onde parou. Em outro aparelho, ou se
                  você limpar os dados do navegador, os números somem. Para avaliar se uma campanha de anúncios
                  se paga com esse preço, use a{' '}
                  <Link href="/calculadora-viabilidade" className="text-brand-blue font-bold hover:underline">
                    Calculadora de Viabilidade
                  </Link>
                  .
                </>
              ),
            },
          ]}
        />
      </Topico>

      <Topico titulo="Aviso">
        <p>
          Os resultados são estimativas feitas com os números que você informa e não substituem a
          orientação de um contador. Regras de imposto mudam e dependem do enquadramento da sua empresa.
          Use o simulador para entender a lógica do seu preço e confirme a parte fiscal com um
          profissional.
        </p>
      </Topico>

      <QuemFez />
    </Guia>
  );
}

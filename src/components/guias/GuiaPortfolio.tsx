import React from 'react';
import Link from 'next/link';
import { Guia, Topico, Lista, Perguntas, QuemFez, porcentagem } from './Guia';

// Respostas e resultados do exemplo. Os resultados seguem as contas de
// ServiceDrawer (nota = "sim" ÷ 6), ServiceCharts (quadrantes com corte em
// 50) e ServiceList (atratividade); o teste do guia cadastra estes serviços
// na ferramenta real e confere a atratividade (spec RF-16).
export const EXEMPLO_PORTFOLIO = {
  servicos: [
    {
      nome: 'Adesivo de vitrine',
      sim: { esforco: 1, complexidade: 1, padronizacao: 5, lucratividade: 4 },
      notas: { esforco: 17, complexidade: 17, padronizacao: 83, lucratividade: 67 },
      operacao: 'Eficiente',
      decisao: 'Estrela',
      leveza: 83.3,
      valor: 75,
      atratividade: 79.2,
    },
    {
      nome: 'Fachada em ACM',
      sim: { esforco: 5, complexidade: 5, padronizacao: 1, lucratividade: 3 },
      notas: { esforco: 83, complexidade: 83, padronizacao: 17, lucratividade: 50 },
      operacao: 'Crítico',
      decisao: 'Oportunidade',
      leveza: 16.7,
      valor: 33.3,
      atratividade: 25,
    },
  ],
};

export function GuiaPortfolio() {
  const [adesivo, fachada] = EXEMPLO_PORTFOLIO.servicos;
  const notas = (s: typeof adesivo) =>
    `${porcentagem(s.notas.esforco)}, ${porcentagem(s.notas.complexidade)}, ${porcentagem(s.notas.padronizacao)} e ${porcentagem(s.notas.lucratividade)}`;

  return (
    <Guia titulo="Guia do Mapeamento Estratégico de Portfólio">
      <Topico titulo="Para que serve">
        <p>
          Nem todo serviço que você vende ajuda o negócio a crescer. Alguns dão muito trabalho e deixam
          pouco lucro; outros se repetem com facilidade e deixam boa margem. O mapeamento compara os seus
          serviços em quatro dimensões (esforço, complexidade, padronização e lucratividade) e mostra em
          quais vale a pena concentrar vendas e divulgação.
        </p>
        <p>
          Serve para quem oferece vários serviços e precisa decidir o que priorizar, o que ajustar e o que
          talvez deixar de oferecer. As perguntas foram escritas a partir da rotina de empresas de
          comunicação visual, com fachadas, adesivos e instalações, mas valem para a maioria dos serviços
          que têm produção e entrega.
        </p>
      </Topico>

      <Topico titulo="Como a conta é feita">
        <p>
          Para cada serviço, você responde 24 perguntas de sim ou não, seis por dimensão. A nota de cada
          dimensão é a parte das respostas &quot;sim&quot;: três de seis dá 50%.
        </p>
        <Lista>
          <li>
            <strong>Esforço:</strong> quanto tempo, gente e deslocamento o serviço consome.
          </li>
          <li>
            <strong>Complexidade:</strong> quanto exige de projeto exclusivo, de especialista e de
            precisão, e quanto custa errar.
          </li>
          <li>
            <strong>Padronização:</strong> quanto o serviço se repete igual, com tabela de preço, material
            e roteiro fixos.
          </li>
          <li>
            <strong>Lucratividade:</strong> quanto sobra, se o preço se sustenta sem desconto e se o
            pós-venda dá pouco problema.
          </li>
        </Lista>
        <p>
          Esforço e complexidade pesam contra quando são altos. Padronização e lucratividade pesam a favor.
          As notas viram dois gráficos, cada um dividido em quatro quadrantes, com corte em 50% (50% ou
          mais conta como alto):
        </p>
        <Lista>
          <li>
            <strong>Matriz de Operação</strong> (esforço × complexidade): Eficiente (os dois baixos),
            Operacional (esforço alto, complexidade baixa), Especialista (complexidade alta, esforço baixo)
            e Crítico (os dois altos).
          </li>
          <li>
            <strong>Matriz de Decisão</strong> (padronização × lucratividade): Estrela (as duas altas),
            Escala (padronização alta, lucratividade baixa), Oportunidade (lucratividade alta,
            padronização baixa) e Revisar (as duas baixas).
          </li>
        </Lista>
        <p>
          O <strong>Score de Atratividade</strong> junta tudo em um número. É a média entre o quanto o
          serviço é leve de operar (100% menos a média de esforço e complexidade) e o quanto ele é bom de
          vender (a média de padronização e lucratividade).
        </p>
      </Topico>

      <Topico titulo="Exemplo com números">
        <p>
          Uma empresa de comunicação visual cadastra dois serviços. O <strong>{adesivo.nome}</strong>{' '}
          recebeu {adesivo.sim.esforco} &quot;sim&quot; em esforço, {adesivo.sim.complexidade} em
          complexidade, {adesivo.sim.padronizacao} em padronização e {adesivo.sim.lucratividade} em
          lucratividade. As notas ficam em {notas(adesivo)}. Ele cai em <strong>{adesivo.operacao}</strong>{' '}
          na Matriz de Operação e em <strong>{adesivo.decisao}</strong> na Matriz de Decisão. A atratividade
          é de {porcentagem(adesivo.atratividade, 1)}: ({porcentagem(adesivo.leveza, 1)} +{' '}
          {porcentagem(adesivo.valor)}) ÷ 2.
        </p>
        <p>
          A <strong>{fachada.nome}</strong> recebeu {fachada.sim.esforco}, {fachada.sim.complexidade},{' '}
          {fachada.sim.padronizacao} e {fachada.sim.lucratividade} respostas &quot;sim&quot;, com notas de{' '}
          {notas(fachada)}. Ela cai em <strong>{fachada.operacao}</strong> e em{' '}
          <strong>{fachada.decisao}</strong>, porque 50% de lucratividade já conta como alto. A
          atratividade é de {porcentagem(fachada.atratividade)}: ({porcentagem(fachada.leveza, 1)} +{' '}
          {porcentagem(fachada.valor, 1)}) ÷ 2.
        </p>
        <p>
          A leitura: o adesivo é o serviço para colocar na frente da divulgação. A fachada dá margem, mas
          prende equipe e especialista a cada pedido. Antes de vender mais fachadas, vale padronizar o que
          der (modelos, medidas, materiais) para que ela consuma menos esforço.
        </p>
      </Topico>

      <Topico titulo="Como ler o resultado">
        <Lista>
          <li>
            <strong>Ranking:</strong> a lista ordena os serviços pelo Score de Atratividade. De 70% para
            cima aparece em verde, de 40% a 70% em azul e abaixo de 40% em vermelho.
          </li>
          <li>
            <strong>Estrela:</strong> o serviço para colocar na frente, na página, no anúncio e na conversa
            com o cliente.
          </li>
          <li>
            <strong>Escala:</strong> vende fácil, mas a margem é baixa. Vale rever preço ou custo antes de
            aumentar o volume.
          </li>
          <li>
            <strong>Oportunidade:</strong> dá margem, mas cada venda é diferente. Padronizar com pacotes,
            tabela e materiais fixos pode transformá-lo em Estrela.
          </li>
          <li>
            <strong>Revisar:</strong> pouca margem e pouca repetição. Veja se vale manter, cobrar mais ou
            oferecer só junto com outro serviço.
          </li>
          <li>
            <strong>Crítico:</strong> consome equipe e especialista ao mesmo tempo. Se também estiver em
            Revisar, é o primeiro candidato a mudar.
          </li>
        </Lista>
        <p>
          Passe o mouse sobre um serviço da lista para destacar o ponto dele nos dois gráficos.
        </p>
      </Topico>

      <Topico titulo="Erros comuns">
        <Lista>
          <li>
            <strong>Responder pelo serviço ideal, e não pelo real.</strong> Pense nos últimos pedidos, não
            no que deveria acontecer quando tudo dá certo.
          </li>
          <li>
            <strong>Juntar serviços diferentes num item só.</strong> Uma instalação pode ser simples numa
            vitrine e complexa numa fachada. Cadastre separado.
          </li>
          <li>
            <strong>Olhar só a lucratividade.</strong> Um serviço com margem alta e esforço enorme pode
            travar a equipe e atrasar todos os outros.
          </li>
          <li>
            <strong>Fazer o mapa uma vez e esquecer.</strong> Preço, equipe e processos mudam. Refaça quando
            mudar o jeito de produzir ou a tabela de preços.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Perguntas frequentes">
        <Perguntas
          itens={[
            {
              pergunta: 'Quantos serviços devo cadastrar?',
              resposta:
                'Todos os que representam uma parte relevante do faturamento. Com três ou mais, a comparação já ajuda a enxergar o que priorizar.',
            },
            {
              pergunta: 'Por que sim ou não, e não uma nota de 0 a 10?',
              resposta:
                'Perguntas de sim ou não são mais fáceis de responder com honestidade e de repetir depois para comparar. A nota sai da contagem das respostas.',
            },
            {
              pergunta: 'Meu serviço não tem instalação. As perguntas servem?',
              resposta:
                'A maior parte serve, porque trata de tempo, equipe, retrabalho e preço. Quando uma pergunta fala de uma situação que não existe no seu serviço, pense no equivalente: atendimento na casa do cliente no lugar de instalação, por exemplo.',
            },
            {
              pergunta: 'Posso levar os resultados para uma planilha?',
              resposta:
                'Sim. O botão Exportar, acima da lista, baixa um arquivo CSV com as notas e o Score de Atratividade de cada serviço.',
            },
            {
              pergunta: 'Os dados ficam salvos?',
              resposta: (
                <>
                  Ficam salvos só no seu navegador, para você voltar depois. Em outro aparelho, ou se você
                  limpar os dados do navegador, a lista some. Para descobrir quanto cobrar por cada serviço, use
                  o{' '}
                  <Link href="/simulador-precificacao" className="text-brand-blue font-bold hover:underline">
                    Simulador de Precificação
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
          O mapeamento organiza a sua percepção sobre os serviços. Ele não mede custo nem lucro de verdade:
          depende das suas respostas. Use o resultado como ponto de partida para conversar com a equipe e
          conferir os números, não como decisão automática.
        </p>
      </Topico>

      <QuemFez />
    </Guia>
  );
}

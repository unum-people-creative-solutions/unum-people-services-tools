import React from 'react';
import { Guia, Topico, Lista, ListaNumerada, Perguntas, porcentagem } from './Guia';

// Respostas e resultados do exemplo. Os resultados seguem as contas de
// ServiceDrawer (nota = "sim" ÷ 6), ServiceCharts (quadrantes com corte em
// 50) e ServiceList (Trabalho, Retorno e Nota geral); o teste do guia cadastra
// estes serviços na ferramenta real e confere os números (spec f4-guias, CA-F4-06).
export const EXEMPLO_PORTFOLIO = {
  servicos: [
    {
      nome: 'Adesivo de vitrine',
      sim: { esforco: 1, complexidade: 1, padronizacao: 5, lucratividade: 4 },
      notas: { esforco: 17, complexidade: 17, padronizacao: 83, lucratividade: 67 },
      trabalho: '17%',
      retorno: '75%',
      notaGeral: '79,2',
      trabalhoQuadrante: 'Leve e simples',
      retornoQuadrante: 'Vender mais',
    },
    {
      nome: 'Fachada em ACM',
      sim: { esforco: 5, complexidade: 5, padronizacao: 1, lucratividade: 3 },
      notas: { esforco: 83, complexidade: 83, padronizacao: 17, lucratividade: 50 },
      trabalho: '83%',
      retorno: '33%',
      notaGeral: '25,0',
      trabalhoQuadrante: 'Pesado e difícil',
      retornoQuadrante: 'Padronizar',
    },
  ],
};

export function GuiaPortfolio() {
  const [adesivo, fachada] = EXEMPLO_PORTFOLIO.servicos;
  const notas = (s: typeof adesivo) =>
    `${porcentagem(s.notas.esforco)}, ${porcentagem(s.notas.complexidade)}, ${porcentagem(s.notas.padronizacao)} e ${porcentagem(s.notas.lucratividade)}`;

  return (
    <Guia titulo="Como descobrir quais serviços compensam">
      <Topico titulo="Para que serve">
        <p>
          Nem todo serviço ajuda o negócio do mesmo jeito. Alguns dão muito trabalho e pouco lucro. Outros se
          repetem com facilidade e deixam bom lucro.
        </p>
        <p>
          Esta ferramenta compara os seus serviços e mostra em quais vale a pena apostar. Serve para quem
          vende mais de um serviço e precisa decidir o que priorizar, ajustar ou deixar de oferecer.
        </p>
      </Topico>

      <Topico titulo="Passo a passo">
        <ListaNumerada>
          <li>Toque em “Adicionar serviço”.</li>
          <li>
            Responda “Sim” ou “Não” a seis perguntas em cada passo: “Dá muito trabalho?”, “É difícil de
            fazer?”, “Dá para repetir sempre igual?” e “Dá lucro?”. Pergunta sem resposta conta como “não”.
          </li>
          <li>
            No último passo, “Como se chama este serviço?”, dê um nome. O “Resumo da pontuação” mostra a nota
            de “Esforço”, “Dificuldade”, “Repetição” e “Lucro”. Cada nota é a parte das respostas “sim”: 3 de
            6 dão 50%. Toque em “Salvar serviço”.
          </li>
          <li>Repita com os outros serviços. Com três ou mais, a comparação ajuda mais.</li>
          <li>
            Veja a lista e os gráficos. Na lista, o “Trabalho” é a média de esforço e dificuldade, e o
            “Retorno” é a média de repetição e lucro. A “Nota geral” é a média entre o quanto o serviço é leve
            (100 menos o trabalho) e o retorno.
          </li>
        </ListaNumerada>
      </Topico>

      <Topico titulo="Exemplo com números">
        <p>
          Uma empresa de comunicação visual cadastra dois serviços. O <strong>{adesivo.nome}</strong> teve{' '}
          {adesivo.sim.esforco} “sim” em esforço, {adesivo.sim.complexidade} em dificuldade,{' '}
          {adesivo.sim.padronizacao} em repetição e {adesivo.sim.lucratividade} em lucro. As notas ficam em{' '}
          {notas(adesivo)}.
        </p>
        <p>
          O “Trabalho” é {adesivo.trabalho}, o “Retorno” é {adesivo.retorno} e a “Nota geral” é{' '}
          {adesivo.notaGeral}. Ele cai em “{adesivo.trabalhoQuadrante}” e em “{adesivo.retornoQuadrante}”.
        </p>
        <p>
          A <strong>{fachada.nome}</strong> teve {fachada.sim.esforco}, {fachada.sim.complexidade},{' '}
          {fachada.sim.padronizacao} e {fachada.sim.lucratividade} “sim”, com notas de {notas(fachada)}. O
          “Trabalho” é {fachada.trabalho}, o “Retorno” é {fachada.retorno} e a “Nota geral” é{' '}
          {fachada.notaGeral}. Ela cai em “{fachada.trabalhoQuadrante}” e em “{fachada.retornoQuadrante}”,
          porque 50% de lucro já conta como alto.
        </p>
        <p>
          A leitura: o adesivo é o serviço para colocar na frente da divulgação. A fachada dá lucro, mas
          prende a equipe. Antes de vender mais fachadas, vale padronizar o que der.
        </p>
      </Topico>

      <Topico titulo="Como ler o resultado">
        <p>
          O gráfico “Quanto trabalho dá” mostra esforço e dificuldade. Cada serviço cai em um destes lugares:
        </p>
        <Lista>
          <li>
            <strong>“Leve e simples”:</strong> pouco esforço e fácil de fazer.
          </li>
          <li>
            <strong>“Difícil, mas rápido”:</strong> difícil de fazer, mas com pouco esforço.
          </li>
          <li>
            <strong>“Pesado, mas simples”:</strong> dá trabalho, mas é simples de fazer.
          </li>
          <li>
            <strong>“Pesado e difícil”:</strong> muito esforço e difícil de fazer.
          </li>
        </Lista>
        <p>O gráfico “Quanto vale a pena” mostra repetição e lucro:</p>
        <Lista>
          <li>
            <strong>“Vender mais”:</strong> se repete igual e dá lucro. Coloque na frente da divulgação.
          </li>
          <li>
            <strong>“Padronizar”:</strong> dá lucro, mas muda a cada venda. Pacotes e preços fixos ajudam.
          </li>
          <li>
            <strong>“Lucro baixo”:</strong> se repete igual, mas deixa pouco. Reveja preço e custo.
          </li>
          <li>
            <strong>“Repensar”:</strong> muda a cada venda e deixa pouco. Veja se vale manter.
          </li>
        </Lista>
        <p>
          Na lista, quanto menor o “Trabalho” e maior o “Retorno”, melhor. A “Nota geral” vai de 0 a 100 e
          ordena os serviços do que mais compensa ao que menos compensa.
        </p>
      </Topico>

      <Topico titulo="Erros comuns">
        <Lista>
          <li>
            <strong>Responder pelo serviço ideal.</strong> Pense nos últimos pedidos, não no que aconteceria
            se tudo desse certo.
          </li>
          <li>
            <strong>Juntar serviços diferentes num só.</strong> Uma instalação pode ser simples numa vitrine
            e difícil numa fachada. Cadastre separado.
          </li>
          <li>
            <strong>Olhar só o lucro.</strong> Um serviço que deixa muito lucro, mas dá trabalho demais,
            pode atrasar todos os outros.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Perguntas frequentes">
        <Perguntas
          itens={[
            {
              pergunta: 'Meus dados ficam salvos?',
              resposta:
                'Ficam só neste aparelho, no navegador, para você voltar depois. Em outro aparelho, ou se você limpar os dados do navegador, a lista some. Nada do que você digita é enviado para nós.',
            },
            {
              pergunta: 'Quantos serviços devo cadastrar?',
              resposta:
                'Os que mais pesam no seu faturamento. Com três ou mais, a comparação já ajuda a ver o que priorizar.',
            },
            {
              pergunta: 'Posso levar o resultado para uma planilha?',
              resposta:
                'Sim. O botão “Baixar planilha (CSV)”, acima da lista, baixa um arquivo com as notas de cada serviço.',
            },
          ]}
        />
      </Topico>

      <Topico titulo="Aviso">
        <p>
          Os resultados são estimativas feitas com as respostas que você dá. Eles não medem o lucro de
          verdade e não substituem um contador.
        </p>
      </Topico>
    </Guia>
  );
}

import React from 'react';
import { Guia, Topico, Lista, ListaNumerada, Perguntas, brl, porcentagem } from './Guia';

// Entradas e resultados do exemplo. Os resultados seguem as contas de
// calculo.ts; o teste do guia alimenta a calculadora real com estas
// entradas e confere que ela mostra os mesmos números (spec f4-guias, CA-F4-06).
export const EXEMPLO_VIABILIDADE = {
  preco: 300,
  custo: 60,
  cpc: 2,
  chamam: 4,
  sobra: 240,
  orcamento: {
    valor: 1600,
    cliques: 800,
    pessoas: 32,
    vendasExatas: 6.67,
    vendasArredondadas: 7,
    taxaExigida: 20.8,
  },
  meta: {
    clientes: 8,
    compram: 25,
    investimento: 1600,
    cac: 200,
    sobraTotal: 1920,
    lucro: 320,
    retorno: 20,
  },
};

export function GuiaViabilidade() {
  const e = EXEMPLO_VIABILIDADE;

  return (
    <Guia titulo="Como saber se vale a pena anunciar">
      <Topico titulo="Para que serve">
        <p>
          Antes de pagar por anúncio no Google ou no Instagram, vale saber quantas vendas o anúncio precisa
          trazer para se pagar. Esta ferramenta responde de dois jeitos.
        </p>
        <p>
          Se você já sabe quanto quer gastar, ela diz quantas vendas são necessárias. Se você quer um número
          de clientes, ela diz quanto precisa investir e quanto cada cliente vai custar.
        </p>
      </Topico>

      <Topico titulo="Passo a passo">
        <ListaNumerada>
          <li>
            Escolha o que você quer descobrir: “Já sei quanto vou gastar” ou “Quero um número de clientes”.
          </li>
          <li>
            Em “Sua venda”, preencha “Preço médio de cada venda” e “Quanto custa entregar essa venda”. Conte
            material, frete e taxa da maquininha. A ferramenta tira o custo do preço e mostra a “Sobra por
            venda, antes do anúncio”.
          </li>
          <li>
            Em “Seu anúncio”, preencha “Quanto custa cada clique” e “De cada 100 que clicam, quantos chamam
            você”. Chamar é mandar mensagem, preencher o formulário ou ligar.
          </li>
          <li>
            Se você escolheu gastar, preencha “Quanto você quer gastar em anúncio”. A ferramenta divide esse
            valor pela sobra por venda e acha as vendas para o anúncio se pagar, sempre arredondando para
            cima. Divide também pelo preço do clique e acha os cliques.
          </li>
          <li>
            Se você escolheu clientes, preencha “Quantos clientes novos você quer” e “De cada 10 que chamam,
            quantos compram”. A ferramenta calcula quantos cliques você precisa e quanto investir.
          </li>
          <li>
            Leia o “Seu resultado”. Para conferir cada conta, abra “Ver a conta passo a passo”.
          </li>
        </ListaNumerada>
      </Topico>

      <Topico titulo="Exemplo com números">
        <p>
          Um serviço de limpeza de estofados cobra {brl(e.preco)} por atendimento e gasta {brl(e.custo)} com
          produto e deslocamento. A sobra por venda é de {brl(e.sobra)}. O clique custa {brl(e.cpc)} e, de
          cada 100 que clicam, {e.chamam} chamam no WhatsApp.
        </p>
        <p>
          Com {brl(e.orcamento.valor)} de anúncio, vêm cerca de {e.orcamento.cliques} cliques e{' '}
          {e.orcamento.pessoas} pessoas chamando. A conta dá {e.orcamento.vendasExatas.toLocaleString('pt-BR')}{' '}
          vendas, e a ferramenta arredonda para {e.orcamento.vendasArredondadas}, porque não existe meia
          venda. Isso é {porcentagem(e.orcamento.taxaExigida, 1)} de quem chama, um pouco acima de 20%. O
          selo é “Arriscado”.
        </p>
        <p>
          Agora o caminho dos clientes: {e.meta.clientes} clientes, com {porcentagem(e.meta.compram)} de quem
          chama comprando. Você investe cerca de {brl(e.meta.investimento)}, com os mesmos{' '}
          {e.orcamento.cliques} cliques e {e.orcamento.pessoas} pessoas. Cada cliente novo custa{' '}
          {brl(e.meta.cac)}.
        </p>
        <p>
          As {e.meta.clientes} vendas deixam {brl(e.meta.sobraTotal)} de sobra, ou {brl(e.meta.lucro)} além do
          que o anúncio custou. É um retorno (ROI) de {porcentagem(e.meta.retorno, 1)}. O selo é “Se paga”.
        </p>
      </Topico>

      <Topico titulo="Como ler o resultado">
        <Lista>
          <li>
            <strong>“Falta pouco”:</strong> falta preencher algum campo.
          </li>
          <li>
            <strong>“Dá para pagar”:</strong> você precisa vender para até 20% de quem chama, ou 1 em cada 5.
           
          </li>
          <li>
            <strong>“Arriscado”:</strong> você precisa vender para mais de 20% de quem chama. Antes de
            gastar, veja se dá para subir o preço, baixar o custo ou conseguir cliques mais baratos.
          </li>
          <li>
            <strong>“Se paga”:</strong> as vendas deixam mais do que o anúncio custou. “Cada cliente novo
            custa” (o custo por cliente, CAC) precisa ser menor que a sobra por venda. No exemplo, {brl(e.meta.cac)}{' '}
            contra {brl(e.sobra)}.
          </li>
          <li>
            <strong>“Prejuízo”:</strong> cada cliente custa mais do que sobra da venda, e o anúncio perde
            dinheiro.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Erros comuns">
        <Lista>
          <li>
            <strong>Deixar o custo da venda em zero.</strong> Aí qualquer anúncio parece bom, mas o anúncio
            é pago com o que sobra, não com o preço cheio.
          </li>
          <li>
            <strong>Chutar quantos chamam.</strong> Use o número da sua plataforma de anúncios. Sem histórico, comece com um
            número baixo e refaça a conta depois das primeiras semanas.
          </li>
          <li>
            <strong>Julgar o anúncio em poucos dias.</strong> Com poucos cliques, o resultado muda muito.
            Espere juntar algumas centenas de cliques.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Perguntas frequentes">
        <Perguntas
          itens={[
            {
              pergunta: 'De onde tiro esse número?',
              resposta:
                'O preço do clique aparece na sua plataforma de anúncios (como “CPC médio”). Para saber quantos chamam, conte as mensagens, formulários e ligações e divida pelos cliques. Sem histórico, a plataforma mostra uma estimativa quando você monta o anúncio.',
            },
            {
              pergunta: 'Meus dados ficam salvos?',
              resposta:
                'Não. A ferramenta não guarda nada: ao fechar ou recarregar a página, os números somem. E nada do que você digita sai do seu aparelho.',
            },
          ]}
        />
      </Topico>

      <Topico titulo="Aviso">
        <p>
          Os resultados são estimativas feitas com os números que você informa e não garantem o resultado do
          anúncio. Eles não substituem a orientação de um contador.
        </p>
      </Topico>
    </Guia>
  );
}

import React from 'react';
import Link from 'next/link';
import { Guia, Topico, Lista, Perguntas, QuemFez, brl, porcentagem } from './Guia';

// Entradas e resultados do exemplo. Os resultados seguem as contas de
// ViabilidadeView; o teste do guia alimenta a calculadora real com estas
// entradas e confere que ela mostra os mesmos números (spec RF-16).
export const EXEMPLO_VIABILIDADE = {
  ticketMedio: 300,
  custoVariavel: 60,
  cpc: 2,
  taxaConversao: 4,
  margem: 240,
  orcamento: {
    valor: 1600,
    cliques: 800,
    oportunidades: 32,
    vendasExatas: 6.67,
    vendasArredondadas: 7,
    taxaExigida: 20.8,
  },
  meta: {
    clientes: 8,
    taxaFechamento: 25,
    orcamentoNecessario: 1600,
    cac: 200,
    margemTotal: 1920,
    roi: 20,
  },
};

export function GuiaViabilidade() {
  const e = EXEMPLO_VIABILIDADE;

  return (
    <Guia titulo="Guia da Calculadora de Viabilidade de Campanha">
      <Topico titulo="Para que serve">
        <p>
          Antes de colocar dinheiro em anúncios no Google ou no Instagram, vale responder uma pergunta
          simples: quantas vendas essa campanha precisa trazer para se pagar? A calculadora responde de
          dois jeitos. Se você já tem um valor para investir, ela diz quantos clientes precisa fechar e
          que parte dos contatos isso representa. Se você tem uma meta de clientes, ela diz quanto precisa
          investir e quanto vai custar cada cliente conquistado.
        </p>
        <p>
          Ela foi pensada para quem vende serviço ou produto com valor parecido em cada venda: prestadores
          de serviço, pequenos comércios, profissionais autônomos. Não exige conhecimento de marketing. Os
          campos pedem números que você já conhece do seu negócio ou que a plataforma de anúncios mostra.
        </p>
      </Topico>

      <Topico titulo="Como a conta é feita">
        <p>
          Tudo começa pela <strong>margem de contribuição</strong>: o preço médio de venda (ticket médio)
          menos o que sai do seu bolso para entregar aquela venda (custo variável, como material, frete,
          comissão e imposto da nota). É o dinheiro que sobra de cada venda para pagar a campanha.
        </p>
        <p>No cenário <strong>Tenho um orçamento</strong>:</p>
        <Lista>
          <li>vendas para empatar = orçamento ÷ margem de contribuição;</li>
          <li>cliques no anúncio = orçamento ÷ custo por clique (CPC);</li>
          <li>oportunidades (leads) = cliques × taxa de conversão da página;</li>
          <li>taxa de fechamento exigida = vendas para empatar ÷ oportunidades.</li>
        </Lista>
        <p>
          Se a taxa de fechamento exigida passa de 20%, a calculadora marca o cenário como arriscado: você
          precisaria fechar negócio com mais de uma em cada cinco pessoas que entrarem em contato.
        </p>
        <p>No cenário <strong>Tenho uma meta</strong>:</p>
        <Lista>
          <li>
            orçamento necessário = clientes desejados × CPC ÷ (taxa de conversão × taxa de fechamento);
          </li>
          <li>custo de aquisição por cliente (CAC) = orçamento ÷ clientes;</li>
          <li>retorno (ROI) = (clientes × margem de contribuição − orçamento) ÷ orçamento.</li>
        </Lista>
        <p>
          O retorno considera só a margem das vendas que a campanha trouxe. Ele não conta vendas futuras
          do mesmo cliente, então é uma estimativa conservadora.
        </p>
      </Topico>

      <Topico titulo="Exemplo com números">
        <p>
          Imagine um serviço de limpeza de estofados que cobra em média {brl(e.ticketMedio)} por
          atendimento e gasta {brl(e.custoVariavel)} com produto e deslocamento. A margem de contribuição
          é de {brl(e.margem)}. Os anúncios custam em média {brl(e.cpc)} por clique, e{' '}
          {porcentagem(e.taxaConversao)} de quem visita a página chama no WhatsApp.
        </p>
        <p>
          Com um orçamento de {brl(e.orcamento.valor)}, a campanha traz {e.orcamento.cliques} cliques e{' '}
          {e.orcamento.oportunidades} oportunidades. Para empatar, são necessárias{' '}
          {e.orcamento.vendasExatas.toLocaleString('pt-BR')} vendas ({brl(e.orcamento.valor)} ÷{' '}
          {brl(e.margem)}), e a calculadora arredonda para {e.orcamento.vendasArredondadas}. A taxa de
          fechamento exigida é de {porcentagem(e.orcamento.taxaExigida, 1)} (
          {e.orcamento.vendasExatas.toLocaleString('pt-BR')} de {e.orcamento.oportunidades}), um pouco
          acima do limite de 20%, então o cenário aparece como arriscado.
        </p>
        <p>
          Agora o mesmo negócio no cenário de meta: {e.meta.clientes} clientes, fechando{' '}
          {porcentagem(e.meta.taxaFechamento)} dos contatos. O orçamento necessário é de{' '}
          {brl(e.meta.orcamentoNecessario)}, com os mesmos {e.orcamento.cliques} cliques e{' '}
          {e.orcamento.oportunidades} oportunidades. Cada cliente custa {brl(e.meta.cac)}, e a campanha dá
          um retorno de {porcentagem(e.meta.roi)}: as {e.meta.clientes} vendas deixam{' '}
          {brl(e.meta.margemTotal)} de margem para {brl(e.meta.orcamentoNecessario)} investidos.
        </p>
        <p>
          As duas respostas contam a mesma história. Com esse orçamento, o negócio só ganha dinheiro se
          fechar mais de {porcentagem(e.orcamento.taxaExigida, 1)} dos contatos. Fechando{' '}
          {porcentagem(e.meta.taxaFechamento)}, sobra {porcentagem(e.meta.roi)} de retorno. Fechando 15%, a
          campanha dá prejuízo.
        </p>
      </Topico>

      <Topico titulo="Como ler o resultado">
        <Lista>
          <li>
            <strong>Cenário viável</strong> (verde): a taxa de fechamento exigida é de até 20%. Mesmo
            assim, compare com a sua taxa real. Se você costuma fechar 10% dos contatos e a calculadora
            pede 15%, a conta não fecha.
          </li>
          <li>
            <strong>Cenário arriscado</strong> (vermelho): a taxa exigida passa de 20%. Antes de investir,
            veja o que dá para mudar: subir o preço, baixar o custo variável, melhorar a página para que
            mais visitantes chamem, ou buscar cliques mais baratos.
          </li>
          <li>
            <strong>CAC</strong>: quanto cada cliente custou em anúncio. Para a campanha valer a pena, ele
            precisa ser menor do que a margem de contribuição de uma venda. No exemplo, {brl(e.meta.cac)}{' '}
            contra {brl(e.margem)}.
          </li>
          <li>
            <strong>ROI</strong>: um retorno de 20% quer dizer que, para cada R$ 100 investidos, voltam
            R$ 120 de margem. Retorno negativo é prejuízo.
          </li>
        </Lista>
        <p>
          O botão <strong>Raio-X</strong>, abaixo do diagnóstico, mostra a conta passo a passo com os seus
          números, para você conferir de onde veio cada resultado.
        </p>
      </Topico>

      <Topico titulo="Erros comuns">
        <Lista>
          <li>
            <strong>Usar o preço em vez da margem.</strong> A campanha é paga com o que sobra da venda, não
            com o valor cheio. Deixar o custo variável em zero faz qualquer campanha parecer boa.
          </li>
          <li>
            <strong>Chutar a taxa de conversão.</strong> Use o número real da sua página ou do seu perfil.
            Sem histórico, comece com uma estimativa baixa e refaça a conta depois das primeiras semanas de
            campanha.
          </li>
          <li>
            <strong>Achar que todo contato vira cliente.</strong> A taxa de fechamento real costuma ser bem
            menor do que parece. Conte quantas conversas do último mês viraram venda.
          </li>
          <li>
            <strong>Julgar a campanha em poucos dias.</strong> Com poucos cliques, o resultado varia muito
            de uma semana para outra. Espere juntar algumas centenas de cliques antes de concluir.
          </li>
        </Lista>
      </Topico>

      <Topico titulo="Perguntas frequentes">
        <Perguntas
          itens={[
            {
              pergunta: 'Onde encontro o custo por clique?',
              resposta:
                'No painel da plataforma de anúncios (Google Ads ou Meta), na coluna de CPC médio das campanhas anteriores. Se você nunca anunciou, a própria plataforma mostra uma estimativa quando você monta a campanha.',
            },
            {
              pergunta: 'O que conta como oportunidade?',
              resposta:
                'Qualquer pessoa que deu um passo concreto: chamou no WhatsApp, preencheu um formulário ou ligou. Visita sem contato não conta.',
            },
            {
              pergunta: 'Por que a calculadora arredonda as vendas para cima?',
              resposta:
                'Porque não existe meia venda. Se a conta pede 6,67, você precisa de 7 para não ter prejuízo. A taxa de fechamento exigida usa o número exato, sem arredondar.',
            },
            {
              pergunta: 'O limite de 20% vale para todo negócio?',
              resposta:
                'Não. É a referência da ferramenta para separar cenários tranquilos de arriscados. Se o seu histórico mostra que você fecha mais do que isso, use o seu número para decidir.',
            },
            {
              pergunta: 'A calculadora considera o imposto?',
              resposta: (
                <>
                  Só se você incluir o imposto da nota no custo variável. Para chegar ao preço com imposto e
                  custos fixos, use o{' '}
                  <Link href="/simulador-precificacao" className="text-brand-blue font-bold hover:underline">
                    Simulador de Precificação
                  </Link>
                  .
                </>
              ),
            },
            {
              pergunta: 'Os números que digito ficam salvos?',
              resposta:
                'Não. A calculadora não guarda nada: ao fechar ou recarregar a página, os números somem. Nada do que você digita é enviado para os nossos servidores.',
            },
          ]}
        />
      </Topico>

      <Topico titulo="Aviso">
        <p>
          Os resultados são estimativas feitas com os números que você informa. Servem para planejar, não
          garantem o resultado da campanha, que depende também do anúncio, da página, da época do ano e da
          concorrência. Para decisões com impacto financeiro grande, converse com um contador ou consultor
          de sua confiança.
        </p>
      </Topico>

      <QuemFez />
    </Guia>
  );
}

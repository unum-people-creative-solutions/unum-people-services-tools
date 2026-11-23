// Conta da calculadora "Vale a pena anunciar?". Mesmas fórmulas da versão anterior
// (ViabilidadeView); só saiu da tela para poder ser testada isolada.

export type Caminho = 'orcamento' | 'clientes';

export interface Entradas {
  /** Preço médio de cada venda, em R$. */
  preco: number;
  /** Quanto custa entregar cada venda, em R$. */
  custo: number;
  /** Custo de cada clique, em R$. */
  cpc: number;
  /** De cada 100 cliques, quantos chamam (%). */
  chamam: number;
  /** Quanto quer gastar em anúncio, em R$ (caminho "orcamento"). */
  orcamento: number;
  /** Quantos clientes novos quer (caminho "clientes"). */
  clientes: number;
  /** De quem chama, quantos compram (%) (caminho "clientes"). */
  compram: number;
}

export const ENTRADAS_VAZIAS: Entradas = {
  preco: 0,
  custo: 0,
  cpc: 0,
  chamam: 0,
  orcamento: 0,
  clientes: 0,
  compram: 0,
};

/** Acima disso, exigir tanto de quem chama é "Arriscado". */
export const LIMITE_TAXA_EXIGIDA = 20;

// Taxas e centavos viram frações sem representação exata em ponto flutuante
// (500 ÷ 1,5 × 0,03 dá 9,999…), e o Math.floor/ceil mostrava 9 onde a conta
// exata dá 10. Arredondar para 6 casas antes de truncar tira esse ruído.
export const semRuido = (valor: number) => Math.round(valor * 1e6) / 1e6;

export type MotivoDaFalta = 'basicos' | 'orcamento' | 'clientes' | 'custo';

export type Conta =
  | { tipo: 'falta'; motivo: MotivoDaFalta }
  | {
      tipo: 'orcamento';
      sobra: number;
      orcamento: number;
      /** Vendas exatas (orçamento ÷ sobra), sem arredondar. */
      vendasExatas: number;
      /** Vendas para o anúncio se pagar, arredondadas para cima. */
      vendas: number;
      cliques: number;
      pessoas: number;
      /** % de quem chama que precisa comprar. */
      taxaExigida: number;
      /** "1 em cada K" pessoas que chamam. */
      umEmCada: number;
      arriscado: boolean;
      /** Taxa exigida acima de 100%: nem vendendo para todos que chamam o anúncio se paga. */
      impossivel: boolean;
    }
  | {
      tipo: 'clientes';
      sobra: number;
      clientes: number;
      investimento: number;
      cliques: number;
      pessoas: number;
      cac: number;
      /** Sobra de todas as vendas, antes do anúncio. */
      sobraTotal: number;
      /** Sobra total menos o investimento. */
      lucro: number;
      /** Retorno em % (lucro ÷ investimento × 100). */
      retorno: number;
      sePaga: boolean;
    };

const positivo = (n: number) => n > 0;

export function calcular(caminho: Caminho, entradas: Entradas): Conta {
  const { preco, custo, cpc, chamam, orcamento, clientes, compram } = entradas;

  if (!positivo(preco) || !positivo(cpc) || !positivo(chamam)) return { tipo: 'falta', motivo: 'basicos' };
  if (custo > 0 && custo >= preco) return { tipo: 'falta', motivo: 'custo' };
  // Custo negativo não faz sentido: vale como zero
  const sobra = preco - Math.max(custo, 0);
  const txChamam = chamam / 100;

  if (caminho === 'orcamento') {
    if (!positivo(orcamento)) return { tipo: 'falta', motivo: 'orcamento' };

    const vendasExatas = orcamento / sobra;
    const cliques = orcamento / cpc;
    const pessoas = cliques * txChamam;
    const taxaExigida = pessoas > 0 ? (vendasExatas / pessoas) * 100 : 0;

    return {
      tipo: 'orcamento',
      sobra,
      orcamento,
      vendasExatas,
      vendas: Math.ceil(semRuido(vendasExatas)),
      cliques: Math.floor(semRuido(cliques)),
      pessoas: Math.floor(semRuido(pessoas)),
      taxaExigida,
      umEmCada: Math.ceil(semRuido(100 / taxaExigida)),
      arriscado: semRuido(taxaExigida) > LIMITE_TAXA_EXIGIDA,
      impossivel: semRuido(taxaExigida) > 100,
    };
  }

  if (!positivo(clientes) || !positivo(compram)) return { tipo: 'falta', motivo: 'clientes' };

  const txCompram = compram / 100;
  const investimento = (clientes * cpc) / (txChamam * txCompram);
  const cliques = investimento / cpc;
  const pessoas = cliques * txChamam;
  const sobraTotal = clientes * sobra;
  // `+ 0` troca -0 por 0: o retorno exatamente zero não pode aparecer como "-0,0%"
  const lucro = semRuido(sobraTotal - investimento) + 0;
  const retorno = (lucro / investimento) * 100 + 0;

  return {
    tipo: 'clientes',
    sobra,
    clientes,
    investimento,
    cliques: Math.floor(semRuido(cliques)),
    pessoas: Math.floor(semRuido(pessoas)),
    cac: investimento / clientes,
    sobraTotal,
    lucro,
    retorno,
    sePaga: retorno >= 0,
  };
}

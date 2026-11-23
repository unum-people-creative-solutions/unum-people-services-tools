// Utilitários de número em pt-BR (vírgula decimal, ponto de milhar).

const NBSP = / /g;

/** "R$ 1.234,50" (espaço comum depois do R$). Valor inválido vira "R$ 0,00". */
export function formatarReais(n: number): string {
  const valor = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(valor)
    .replace(NBSP, ' ');
}

/**
 * Número em pt-BR. Sem `casas`, mostra até 2 casas sem zeros sobrando
 * ("2,5", "22"). Com `casas`, fixa a quantidade ("800,00").
 */
export function formatarNumero(n: number, casas?: number): string {
  const valor = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas ?? 0,
    maximumFractionDigits: casas ?? 2,
  })
    .format(valor)
    .replace(NBSP, ' ');
}

/**
 * Lê o que a pessoa digitou: "2,5", "1.234,56", "R$ 40,00", "6%".
 * Aceita vírgula ou ponto decimal; ponto sozinho só é milhar quando
 * forma grupos de 3 dígitos ("1.234"). Texto sem número vira 0.
 */
export function lerNumero(texto: string): number {
  const limpo = texto.replace(/[^\d.,-]/g, '');
  const negativo = limpo.startsWith('-');
  let corpo = limpo.replace(/-/g, '');

  if (corpo.includes(',')) {
    // vírgula é o decimal; pontos são milhar
    const [inteiro, ...resto] = corpo.split(',');
    corpo = `${inteiro.replace(/\./g, '')}.${resto.join('')}`;
  } else if (/^\d{1,3}(\.\d{3})+$/.test(corpo)) {
    corpo = corpo.replace(/\./g, '');
  }

  const numero = parseFloat(corpo);
  if (!Number.isFinite(numero)) return 0;
  return negativo ? -numero : numero;
}

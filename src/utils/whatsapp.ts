// Número brasileiro do WhatsApp/telefone (RF-QR-07, DT-QR-16). Tudo no navegador.

/**
 * Devolve o número nacional (DDD + número, 10 ou 11 dígitos) ou null.
 * `exigirCelular` aceita só 11 dígitos.
 */
export function normalizarCelular(
  texto: string,
  opcoes: { exigirCelular?: boolean } = {},
): string | null {
  let digitos = texto.replace(/\D/g, '');
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2);
  }
  if (digitos.startsWith('0')) digitos = digitos.slice(1);
  if (digitos.startsWith('0')) return null; // DDD não começa com 0

  if (digitos.length === 11 && digitos[2] === '9') return digitos;
  if (digitos.length === 10 && !opcoes.exigirCelular) return digitos;
  return null;
}

/** "(11) 98765-4321" ou "(11) 3456-7890". */
export function formatarTelefone(nacional: string): string {
  const ddd = nacional.slice(0, 2);
  const resto = nacional.slice(2);
  const corte = resto.length - 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/** `https://wa.me/55{nacional}` e, com mensagem, `?text=…`. */
export function linkDoWhatsapp(nacional: string, mensagem?: string): string {
  const base = `https://wa.me/55${nacional}`;
  const texto = mensagem?.trim();
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

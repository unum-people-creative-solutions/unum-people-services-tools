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

/**
 * Por que o texto não é um número aceito, em português para a pessoa (RF-LW-07), ou `null` quando
 * `normalizarCelular` o aceita. Segue a mesma ordem de `normalizarCelular`: tira o 55 do início
 * (12 ou 13 dígitos) e o 0 de discagem, e só então conta os dígitos.
 */
export function motivoDoNumero(texto: string): string | null {
  let digitos = texto.replace(/\D/g, '');
  if (digitos === '') return 'Digite o seu número com DDD.';
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2);
  }
  if (digitos.startsWith('0')) digitos = digitos.slice(1);
  if (digitos.startsWith('0')) return 'Confira o DDD: ele não começa com 0.';

  if (digitos.length < 10) return 'Falta número. Digite o DDD e o número. Exemplo: (11) 98765-4321';
  if (digitos.length > 11) return 'Tem dígito a mais. Digite só o DDD e o número.';
  if (digitos.length === 11 && digitos[2] !== '9') return 'Celular com 11 dígitos tem 9 depois do DDD. Confira o número.';
  return null;
}

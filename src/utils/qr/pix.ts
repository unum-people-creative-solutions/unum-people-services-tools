// Pix estático (BR Code) montado no navegador: nada disto sai do aparelho.
// Fonte: Manual de Padrões para Iniciação do Pix 2.10.0 (§2.5.1, §2.6) — DT-QR-05 a 07.

import { normalizarCelular } from '../whatsapp';

export type TipoChavePix = 'cpf' | 'cnpj' | 'celular' | 'email' | 'aleatoria';

export type ResultadoChave = { ok: true; chave: string } | { ok: false; erro: string };

export type ResultadoValor = { ok: true; valor: string | null } | { ok: false; erro: string };

export const LIMITE_NOME_PIX = 25;
export const LIMITE_CIDADE_PIX = 15;

export const ERROS_CHAVE_PIX: Record<TipoChavePix, string> = {
  cpf: 'Esse CPF não existe. Confira os números.',
  cnpj: 'Esse CNPJ não existe. Confira os números.',
  celular: 'Digite o celular com DDD. Exemplo: (11) 98765-4321',
  email: 'Confira o e-mail da chave.',
  aleatoria:
    'A chave aleatória tem 32 letras e números, separados por traços. Copie do app do seu banco.',
};

export const ERRO_VALOR_PIX = 'Digite o valor em reais. Exemplo: 25,00';

/** CRC16-CCITT-FFFF (polinômio 0x1021, início 0xFFFF): 4 hexadecimais maiúsculos. */
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= (texto.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function cpfValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos) || /^(\d)\1{10}$/.test(digitos)) return false;
  for (const tamanho of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(digitos[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(digitos[tamanho])) return false;
  }
  return true;
}

const PESOS_CNPJ_13 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_14 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function digitoDoCnpj(caracteres: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) soma += (caracteres.charCodeAt(i) - 48) * pesos[i];
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function cnpjValido(cnpj: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false;
  const dv1 = digitoDoCnpj(cnpj, PESOS_CNPJ_13);
  const dv2 = digitoDoCnpj(cnpj, PESOS_CNPJ_14);
  return cnpj[12] === String(dv1) && cnpj[13] === String(dv2);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ASCII_IMPRIMIVEL = /^[\x20-\x7E]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Confere a chave pelo tipo e devolve a chave no formato que vai dentro do BR Code. */
export function conferirChavePix(tipo: TipoChavePix, valor: string): ResultadoChave {
  const erro: ResultadoChave = { ok: false, erro: ERROS_CHAVE_PIX[tipo] };

  switch (tipo) {
    case 'cpf': {
      const digitos = valor.replace(/\D/g, '');
      return cpfValido(digitos) ? { ok: true, chave: digitos } : erro;
    }
    case 'cnpj': {
      const cnpj = valor.replace(/[.\-/\s]/g, '').toUpperCase();
      return cnpjValido(cnpj) ? { ok: true, chave: cnpj } : erro;
    }
    case 'celular': {
      const nacional = normalizarCelular(valor, { exigirCelular: true });
      return nacional ? { ok: true, chave: `+55${nacional}` } : erro;
    }
    case 'email': {
      const email = valor.trim();
      const valido = email.length <= 77 && ASCII_IMPRIMIVEL.test(email) && EMAIL.test(email);
      return valido ? { ok: true, chave: email.toLowerCase() } : erro;
    }
    case 'aleatoria': {
      const uuid = valor.trim();
      return UUID.test(uuid) ? { ok: true, chave: uuid.toLowerCase() } : erro;
    }
  }
}

/** Nome/cidade do Pix: sem acentos, só ASCII imprimível, espaços únicos, cortado em `limite`. */
export function limparTextoPix(
  texto: string,
  limite: number,
): { texto: string; cortado: boolean } {
  const limpo = texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/ {2,}/g, ' ')
    .trim();
  if (limpo.length <= limite) return { texto: limpo, cortado: false };
  return { texto: limpo.slice(0, limite).trim(), cortado: true };
}

const VALOR_BR = /^(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/;
const VALOR_MAXIMO_EM_CENTAVOS = 99999999999; // 999999999,99

/** Valor opcional em reais ("25", "25,5", "1.250,00") → "1250.00" (campo 54). */
export function converterValor(texto: string): ResultadoValor {
  const entrada = texto.trim();
  if (entrada === '') return { ok: true, valor: null };
  if (!VALOR_BR.test(entrada)) return { ok: false, erro: ERRO_VALOR_PIX };

  const [inteiro, decimais = ''] = entrada.replace(/\./g, '').split(',');
  const centavos = Number(inteiro) * 100 + Number(decimais.padEnd(2, '0'));
  if (centavos <= 0 || centavos > VALOR_MAXIMO_EM_CENTAVOS) {
    return { ok: false, erro: ERRO_VALOR_PIX };
  }
  const reais = String(centavos).padStart(3, '0');
  return { ok: true, valor: `${reais.slice(0, -2)}.${reais.slice(-2)}` };
}

function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`;
}

/**
 * BR Code estático (RF-QR-20). `chave`, `nome` e `cidade` já vêm conferidos e limpos
 * (`conferirChavePix`, `limparTextoPix`); `valor` já vem como "25.50" (`converterValor`).
 */
export function montarBrCode(dados: {
  chave: string;
  nome: string;
  cidade: string;
  valor?: string | null;
}): string {
  const conta = campo('26', campo('00', 'br.gov.bcb.pix') + campo('01', dados.chave));
  const corpo =
    campo('00', '01') +
    conta +
    campo('52', '0000') +
    campo('53', '986') +
    (dados.valor ? campo('54', dados.valor) : '') +
    campo('58', 'BR') +
    campo('59', dados.nome) +
    campo('60', dados.cidade) +
    campo('62', campo('05', '***')) +
    '6304';
  return corpo + crc16(corpo);
}

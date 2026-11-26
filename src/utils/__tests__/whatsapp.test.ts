import { describe, it, expect } from 'vitest';
import { normalizarCelular, formatarTelefone, linkDoWhatsapp, motivoDoNumero } from '../whatsapp';

describe('normalizarCelular (RF-QR-07)', () => {
  it('aceita celular com máscara e devolve só os dígitos nacionais', () => {
    expect(normalizarCelular('(11) 98765-4321')).toBe('11987654321');
  });

  it('tira o 55 do início quando sobram 13 dígitos (celular)', () => {
    expect(normalizarCelular('+55 (11) 98765-4321')).toBe('11987654321');
  });

  it('tira o 55 do início quando sobram 12 dígitos (fixo)', () => {
    expect(normalizarCelular('55 11 3456-7890')).toBe('1134567890');
  });

  it('não tira o 55 quando o número já tem 11 dígitos e o DDD é 55', () => {
    expect(normalizarCelular('55 98765-4321')).toBe('55987654321');
  });

  it('tira um 0 do início', () => {
    expect(normalizarCelular('011 98765-4321')).toBe('11987654321');
    expect(normalizarCelular('011 3456-7890')).toBe('1134567890');
  });

  it('aceita fixo com 10 dígitos', () => {
    expect(normalizarCelular('(11) 3456-7890')).toBe('1134567890');
  });

  it('recusa 11 dígitos com o 3º dígito diferente de 9', () => {
    expect(normalizarCelular('11 87654-3210')).toBeNull();
  });

  it('recusa tamanhos que não são 10 nem 11 dígitos', () => {
    expect(normalizarCelular('98765-4321')).toBeNull();
    expect(normalizarCelular('119876543210')).toBeNull();
    expect(normalizarCelular('')).toBeNull();
    expect(normalizarCelular('abc')).toBeNull();
  });

  it('recusa DDD que começa com 0 depois de tirar o 0 inicial', () => {
    expect(normalizarCelular('0011 98765-4321')).toBeNull();
  });

  it('com exigirCelular, aceita só 11 dígitos', () => {
    expect(normalizarCelular('(11) 98765-4321', { exigirCelular: true })).toBe('11987654321');
    expect(normalizarCelular('(11) 3456-7890', { exigirCelular: true })).toBeNull();
  });
});

describe('formatarTelefone', () => {
  it('formata celular', () => {
    expect(formatarTelefone('11987654321')).toBe('(11) 98765-4321');
  });

  it('formata fixo', () => {
    expect(formatarTelefone('1134567890')).toBe('(11) 3456-7890');
  });
});

describe('linkDoWhatsapp', () => {
  it('monta o link sem mensagem', () => {
    expect(linkDoWhatsapp('11987654321')).toBe('https://wa.me/5511987654321');
  });

  it('com mensagem, acrescenta text com encodeURIComponent', () => {
    expect(linkDoWhatsapp('11987654321', 'Olá! Vim pelo QR code e quero saber mais.')).toBe(
      'https://wa.me/5511987654321?text=Ol%C3%A1!%20Vim%20pelo%20QR%20code%20e%20quero%20saber%20mais.',
    );
  });

  it('escapa & ? # da mensagem (encodeURIComponent, não encodeURI)', () => {
    const link = linkDoWhatsapp('11987654321', 'Pão & café? Mesa #5');
    expect(link).toBe('https://wa.me/5511987654321?text=P%C3%A3o%20%26%20caf%C3%A9%3F%20Mesa%20%235');
    expect(link).toContain('%26');
    expect(link).toContain('%3F');
    expect(link).toContain('%23');
    expect(new URL(link).searchParams.get('text')).toBe('Pão & café? Mesa #5');
  });

  it('mensagem vazia ou só espaços não gera text', () => {
    expect(linkDoWhatsapp('11987654321', '')).toBe('https://wa.me/5511987654321');
    expect(linkDoWhatsapp('11987654321', '   ')).toBe('https://wa.me/5511987654321');
  });
});

describe('motivoDoNumero (RF-LW-07)', () => {
  it.each([
    ['', 'Digite o seu número com DDD.'],
    ['   ', 'Digite o seu número com DDD.'],
    ['abc', 'Digite o seu número com DDD.'],
    ['1198765', 'Falta número. Digite o DDD e o número. Exemplo: (11) 98765-4321'],
    ['119876543210', 'Tem dígito a mais. Digite só o DDD e o número.'],
    ['11887654321', 'Celular com 11 dígitos tem 9 depois do DDD. Confira o número.'],
    ['0011987654321', 'Confira o DDD: ele não começa com 0.'],
  ])('%j devolve o texto da spec', (texto, esperado) => {
    expect(motivoDoNumero(texto)).toBe(esperado);
  });

  it.each(['(11) 98765-4321', '+55 11 98765-4321', '011 98765-4321', '(11) 3456-7890', '55 11 3456-7890'])(
    '%j é aceito: devolve null',
    (texto) => {
      expect(motivoDoNumero(texto)).toBeNull();
    },
  );

  it('depois de tirar o 55 e o 0, conta os dígitos que sobram', () => {
    // 13 dígitos com 55: sobram 11 e o 3º não é 9
    expect(motivoDoNumero('55 11 88765-4321')).toBe('Celular com 11 dígitos tem 9 depois do DDD. Confira o número.');
    // 14 dígitos: nem o 55 sai, e passa de 11
    expect(motivoDoNumero('5511987654321 9')).toBe('Tem dígito a mais. Digite só o DDD e o número.');
    // só o zero de discagem
    expect(motivoDoNumero('0')).toBe('Falta número. Digite o DDD e o número. Exemplo: (11) 98765-4321');
  });

  it('é null exatamente quando normalizarCelular aceita (nunca diverge)', () => {
    const entradas = [
      '', '0', '00', '55', '5511', '1', '11', '119', '1198765432', '11987654321', '119876543210', '1198765432100',
      '11887654321', '55 98765-4321', '5511987654321', '551198765432', '55119876543210', '0119876543', '011987654321',
      '0011987654321', '00', '000', '(11) 3456-7890', '+55 (11) 3456-7890', '55 55 98765-4321', '5555987654321',
    ];
    for (const e of entradas) {
      expect(motivoDoNumero(e) === null, e).toBe(normalizarCelular(e) !== null);
    }
  });
});

describe('ida e volta do link (RF-LW-14)', () => {
  const mensagem = 'Olá! Quero 2 pães 🍞\nPara amanhã';

  it('o número vai no caminho com 55 e a mensagem volta igual, com acento, emoji e quebra de linha', () => {
    const link = linkDoWhatsapp(normalizarCelular('(11) 98765-4321')!, mensagem);
    const url = new URL(link);
    expect(url.pathname).toBe('/5511987654321');
    expect(url.searchParams.get('text')).toBe(mensagem);
  });

  it('volta sem os espaços das pontas', () => {
    expect(new URL(linkDoWhatsapp('11987654321', `  ${mensagem}\n `)).searchParams.get('text')).toBe(mensagem);
  });

  it('mensagem só com espaços ou quebras: o link sai sem "?"', () => {
    expect(linkDoWhatsapp('11987654321', ' \n  ')).not.toContain('?');
  });
});

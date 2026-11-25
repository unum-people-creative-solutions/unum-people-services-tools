import { describe, it, expect } from 'vitest';
import { crc16, conferirChavePix, limparTextoPix, converterValor, montarBrCode } from '../pix';

const BR_CODE_OFICIAL =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D';

describe('crc16 (CCITT-FFFF)', () => {
  it('bate com o valor de referência da variante CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('devolve 4 hexadecimais maiúsculos, com zeros à esquerda', () => {
    expect(crc16('')).toBe('FFFF');
    expect(crc16('A')).toMatch(/^[0-9A-F]{4}$/);
  });
});

describe('montarBrCode (RF-QR-20, T04)', () => {
  it('gera exatamente o exemplo oficial do Manual do Pix (CRC 1D3D)', () => {
    expect(
      montarBrCode({
        chave: '123e4567-e12b-12d1-a456-426655440000',
        nome: 'Fulano de Tal',
        cidade: 'BRASILIA',
      }),
    ).toBe(BR_CODE_OFICIAL);
  });

  it('com valor, acrescenta o campo 54 antes do 58 e recalcula o CRC', () => {
    const codigo = montarBrCode({
      chave: '123e4567-e12b-12d1-a456-426655440000',
      nome: 'Fulano de Tal',
      cidade: 'BRASILIA',
      valor: '25.50',
    });
    expect(codigo).toContain('5303986540525.505802BR');
    const corpo = codigo.slice(0, -4);
    expect(corpo.endsWith('6304')).toBe(true);
    expect(codigo.slice(-4)).toBe(crc16(corpo));
    expect(codigo.slice(-4)).not.toBe('1D3D');
  });

  it('o tamanho de cada campo tem 2 dígitos (chave de e-mail)', () => {
    const codigo = montarBrCode({ chave: 'a@b.co', nome: 'Ana', cidade: 'Recife' });
    // 26: 00 14 br.gov.bcb.pix (18) + 01 06 a@b.co (10) = 28
    expect(codigo).toContain('2628' + '0014br.gov.bcb.pix' + '0106a@b.co');
    expect(codigo).toContain('5903Ana');
    expect(codigo).toContain('6006Recife');
  });
});

describe('conferirChavePix (RF-QR-17, T05)', () => {
  describe('CPF', () => {
    it('aceita um CPF válido e devolve só os dígitos', () => {
      expect(conferirChavePix('cpf', '529.982.247-25')).toEqual({ ok: true, chave: '52998224725' });
    });

    it('recusa dígito verificador errado e sequências repetidas', () => {
      const erro = { ok: false, erro: 'Esse CPF não existe. Confira os números.' };
      expect(conferirChavePix('cpf', '529.982.247-26')).toEqual(erro);
      expect(conferirChavePix('cpf', '111.111.111-11')).toEqual(erro);
      expect(conferirChavePix('cpf', '1234')).toEqual(erro);
    });
  });

  describe('CNPJ', () => {
    it('aceita CNPJ numérico válido, sem pontuação', () => {
      expect(conferirChavePix('cnpj', '11.222.333/0001-81')).toEqual({ ok: true, chave: '11222333000181' });
    });

    it('aceita o CNPJ alfanumérico oficial 12ABC34501DE35, também em minúsculas', () => {
      expect(conferirChavePix('cnpj', '12ABC34501DE35')).toEqual({ ok: true, chave: '12ABC34501DE35' });
      expect(conferirChavePix('cnpj', '12.abc.345/01de-35')).toEqual({ ok: true, chave: '12ABC34501DE35' });
    });

    it('recusa verificador errado, verificador em letra e tamanho errado', () => {
      const erro = { ok: false, erro: 'Esse CNPJ não existe. Confira os números.' };
      expect(conferirChavePix('cnpj', '11.222.333/0001-82')).toEqual(erro);
      expect(conferirChavePix('cnpj', '12ABC34501DE36')).toEqual(erro);
      expect(conferirChavePix('cnpj', '12ABC34501DEAB')).toEqual(erro);
      expect(conferirChavePix('cnpj', '1122233300018')).toEqual(erro);
      expect(conferirChavePix('cnpj', '00000000000000')).toEqual(erro);
    });
  });

  describe('celular', () => {
    it('vira +55 com o número nacional', () => {
      expect(conferirChavePix('celular', '(11) 98765-4321')).toEqual({ ok: true, chave: '+5511987654321' });
    });

    it('exige 11 dígitos', () => {
      const erro = { ok: false, erro: 'Digite o celular com DDD. Exemplo: (11) 98765-4321' };
      expect(conferirChavePix('celular', '(11) 3456-7890')).toEqual(erro);
      expect(conferirChavePix('celular', '')).toEqual(erro);
    });
  });

  describe('e-mail', () => {
    it('passa para minúsculas', () => {
      expect(conferirChavePix('email', ' Contato@SeuNegocio.com.br ')).toEqual({
        ok: true,
        chave: 'contato@seunegocio.com.br',
      });
    });

    it('recusa formato inválido, não ASCII e mais de 77 caracteres', () => {
      const erro = { ok: false, erro: 'Confira o e-mail da chave.' };
      expect(conferirChavePix('email', 'semarroba.com')).toEqual(erro);
      expect(conferirChavePix('email', 'joão@exemplo.com')).toEqual(erro);
      expect(conferirChavePix('email', `${'a'.repeat(70)}@exemplo.com`)).toEqual(erro);
    });

    it.each(['a?b@x.com', 'a&b@x.com', 'a#b@x.com', 'a/b@x.com', 'a b@x.com'])(
      'recusa e-mail com ? & # espaço ou / (%s)',
      (email) => {
        expect(conferirChavePix('email', email)).toEqual({ ok: false, erro: 'Confira o e-mail da chave.' });
      },
    );

    it('aceita exatamente 77 caracteres', () => {
      const email = `${'a'.repeat(77 - '@exemplo.com'.length)}@exemplo.com`;
      expect(email).toHaveLength(77);
      expect(conferirChavePix('email', email)).toEqual({ ok: true, chave: email });
    });
  });

  describe('chave aleatória', () => {
    it('grava o UUID em minúsculas', () => {
      expect(conferirChavePix('aleatoria', '123E4567-E12B-12D1-A456-426655440000')).toEqual({
        ok: true,
        chave: '123e4567-e12b-12d1-a456-426655440000',
      });
    });

    it('recusa o que não é UUID', () => {
      const erro = {
        ok: false,
        erro: 'A chave aleatória tem 32 letras e números, separados por traços. Copie do app do seu banco.',
      };
      expect(conferirChavePix('aleatoria', '123e4567e12b12d1a456426655440000')).toEqual(erro);
      expect(conferirChavePix('aleatoria', '123e4567-e12b-12d1-a456-42665544000g')).toEqual(erro);
    });
  });
});

describe('limparTextoPix (RF-QR-18, T06)', () => {
  it('tira acentos, corta em 15 e avisa que cortou', () => {
    expect(limparTextoPix('São João da Boa Vista', 15)).toEqual({ texto: 'Sao Joao da Boa', cortado: true });
  });

  it('não corta quando cabe', () => {
    expect(limparTextoPix('Maria da Silva', 25)).toEqual({ texto: 'Maria da Silva', cortado: false });
  });

  it('apara e junta espaços repetidos, sem contar como corte', () => {
    expect(limparTextoPix('  Ana   Paula  ', 25)).toEqual({ texto: 'Ana Paula', cortado: false });
  });

  it('descarta o que não é ASCII imprimível', () => {
    expect(limparTextoPix('Café ☕ do Zé\tLtda', 25)).toEqual({ texto: 'Cafe do Ze Ltda', cortado: false });
  });

  it('não deixa espaço sobrando no fim do corte', () => {
    expect(limparTextoPix('Padaria Pao Quente Ltda', 12)).toEqual({ texto: 'Padaria Pao', cortado: true });
  });

  it('vazio fica vazio', () => {
    expect(limparTextoPix('   ', 25)).toEqual({ texto: '', cortado: false });
  });
});

describe('converterValor (RF-QR-19)', () => {
  it.each([
    ['25', '25.00'],
    ['25,5', '25.50'],
    ['25,50', '25.50'],
    ['1.250,00', '1250.00'],
    ['0,01', '0.01'],
    ['999.999.999,99', '999999999.99'],
  ])('aceita "%s" e devolve %s', (entrada, saida) => {
    expect(converterValor(entrada)).toEqual({ ok: true, valor: saida });
  });

  it('vazio é opcional', () => {
    expect(converterValor('')).toEqual({ ok: true, valor: null });
    expect(converterValor('   ')).toEqual({ ok: true, valor: null });
  });

  it.each(['0', '0,00', '-5', 'abc', '25,555', '1.25', '1.000.000.000,00', '25,'])(
    'recusa "%s"',
    (entrada) => {
      expect(converterValor(entrada)).toEqual({
        ok: false,
        erro: 'Digite o valor em reais. Exemplo: 25,00',
      });
    },
  );
});

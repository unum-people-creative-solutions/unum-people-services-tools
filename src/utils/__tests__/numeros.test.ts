import { describe, it, expect } from 'vitest';
import { formatarReais, formatarNumero, lerNumero } from '../numeros';

describe('formatarReais', () => {
  it('usa vírgula decimal, ponto de milhar e espaço comum depois de R$', () => {
    expect(formatarReais(1234.5)).toBe('R$ 1.234,50');
    expect(formatarReais(0)).toBe('R$ 0,00');
    expect(formatarReais(163.5636)).toBe('R$ 163,56');
    expect(formatarReais(4400)).toBe('R$ 4.400,00');
  });

  it('valor inválido vira R$ 0,00', () => {
    expect(formatarReais(Number.NaN)).toBe('R$ 0,00');
    expect(formatarReais(Number.POSITIVE_INFINITY)).toBe('R$ 0,00');
  });
});

describe('formatarNumero', () => {
  it('mostra até 2 casas com vírgula, sem zeros sobrando', () => {
    expect(formatarNumero(2.5)).toBe('2,5');
    expect(formatarNumero(22)).toBe('22');
    expect(formatarNumero(140.8)).toBe('140,8');
    expect(formatarNumero(1234.567)).toBe('1.234,57');
  });

  it('com casas fixas, completa com zeros', () => {
    expect(formatarNumero(800, 2)).toBe('800,00');
    expect(formatarNumero(3000, 2)).toBe('3.000,00');
  });
});

describe('lerNumero', () => {
  it.each([
    ['2,5', 2.5],
    ['2.5', 2.5],
    ['1.234,56', 1234.56],
    ['1.234', 1234],
    ['1.234.567,8', 1234567.8],
    ['R$ 40,00', 40],
    ['R$ 1.234,50', 1234.5],
    ['6%', 6],
    ['6,5 %', 6.5],
    ['22', 22],
    ['0,5', 0.5],
    [',5', 0.5],
    ['2,', 2],
    ['-3,5', -3.5],
  ])('"%s" vira %d', (texto, esperado) => {
    expect(lerNumero(texto)).toBe(esperado);
  });

  it.each([[''], ['   '], ['abc'], ['R$'], ['%']])('"%s" vira 0', (texto) => {
    expect(lerNumero(texto)).toBe(0);
  });
});

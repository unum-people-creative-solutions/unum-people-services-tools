import { describe, it, expect } from 'vitest';
import { calcular, ENTRADAS_VAZIAS, type Entradas } from '../calculo';

const base: Entradas = { ...ENTRADAS_VAZIAS, preco: 300, custo: 60, cpc: 2, chamam: 6 };

describe('calcular: cenário de orçamento', () => {
  it('300 / 60 / 2 / 6% / R$ 600: 3 vendas, 300 cliques, 18 pessoas', () => {
    const conta = calcular('orcamento', { ...base, orcamento: 600 });
    expect(conta).toMatchObject({ tipo: 'orcamento', sobra: 240, vendas: 3, cliques: 300, pessoas: 18, arriscado: false });
  });

  it('exatamente 20% de taxa exigida ainda não é arriscado', () => {
    // sobra 100 → 10 vendas; 1.000 cliques × 5% = 50 pessoas; 10 ÷ 50 = 20%
    const conta = calcular('orcamento', { preco: 200, custo: 100, cpc: 1, chamam: 5, orcamento: 1000, clientes: 0, compram: 0 });
    expect(conta).toMatchObject({ tipo: 'orcamento', vendas: 10, pessoas: 50, taxaExigida: 20, arriscado: false });
  });

  it('acima de 20% é arriscado', () => {
    const conta = calcular('orcamento', { ...base, chamam: 4, orcamento: 600 });
    expect(conta).toMatchObject({ tipo: 'orcamento', pessoas: 12, arriscado: true });
  });

  it('arredonda pelo valor exato, sem ruído de ponto flutuante', () => {
    // 500 ÷ 1,5 × 0,03 = 10 (em ponto flutuante: 9,999…)
    expect(calcular('orcamento', { ...base, cpc: 1.5, chamam: 3, orcamento: 500 })).toMatchObject({ pessoas: 10 });
    // 64,35 − 4,35 = 60 (59,999…) e 600 ÷ 60 = 10
    expect(calcular('orcamento', { ...base, preco: 64.35, custo: 4.35, cpc: 1, chamam: 10, orcamento: 600 })).toMatchObject({ vendas: 10 });
    // 110 ÷ 1,1 = 100 (99,999…)
    expect(calcular('orcamento', { ...base, cpc: 1.1, chamam: 10, orcamento: 110 })).toMatchObject({ cliques: 100 });
  });
});

describe('calcular: arredondamento fixado', () => {
  it('vendas arredondam sempre para cima, mesmo com fração menor que 0,5', () => {
    // 1.000 ÷ 240 = 4,17 → 5 (round daria 4)
    const conta = calcular('orcamento', { ...base, orcamento: 1000 });
    expect(conta).toMatchObject({ tipo: 'orcamento', vendas: 5 });
    expect(conta.tipo === 'orcamento' && conta.vendasExatas).toBeCloseTo(4.1667, 4);
  });

  it('cliques e pessoas arredondam sempre para baixo, mesmo com fração a partir de 0,5', () => {
    // 700 ÷ 1,5 = 466,67 cliques → 466 (round daria 467); × 7% = 32,67 pessoas → 32 (round daria 33)
    const conta = calcular('orcamento', { ...base, cpc: 1.5, chamam: 7, orcamento: 700 });
    expect(conta).toMatchObject({ tipo: 'orcamento', cliques: 466, pessoas: 32 });
  });

  it('no caminho dos clientes, cliques e pessoas também arredondam para baixo', () => {
    // 5 × 2 ÷ (0,06 × 0,3) = 555,56 → 277,78 cliques → 277; × 6% = 16,67 pessoas → 16
    const conta = calcular('clientes', { ...base, clientes: 5, compram: 30 });
    expect(conta).toMatchObject({ tipo: 'clientes', cliques: 277, pessoas: 16 });
  });
});

describe('calcular: taxa exigida a partir de 100%', () => {
  // sobra 100; orçamento 100 → 1 venda; 100 cliques (R$ 1 cada)
  const cem = { ...ENTRADAS_VAZIAS, preco: 200, custo: 100, cpc: 1, orcamento: 100 };

  it('exatamente 100%: 1 pessoa chama e 1 venda paga, arriscado e sem "impossível"', () => {
    const conta = calcular('orcamento', { ...cem, chamam: 1 });
    expect(conta).toMatchObject({ tipo: 'orcamento', vendas: 1, pessoas: 1, taxaExigida: 100, arriscado: true, impossivel: false });
  });

  it('acima de 100%: nem vendendo para todos o anúncio se paga', () => {
    // 0,5% chamam = 0,5 pessoa; 1 ÷ 0,5 = 200%
    const conta = calcular('orcamento', { ...cem, chamam: 0.5 });
    expect(conta).toMatchObject({ tipo: 'orcamento', taxaExigida: 200, arriscado: true, impossivel: true });
  });

  it('logo acima de 100% (125%) já é impossível', () => {
    // 0,8% de 100 cliques = 0,8 pessoa; 1 ÷ 0,8 = 125%
    expect(calcular('orcamento', { ...cem, chamam: 0.8 })).toMatchObject({ taxaExigida: 125, impossivel: true });
  });

  it('abaixo de 100% não é impossível', () => {
    expect(calcular('orcamento', { ...cem, chamam: 2 })).toMatchObject({ taxaExigida: 50, impossivel: false });
  });
});

describe('calcular: ruído de ponto flutuante', () => {
  it('taxa exata de 20% que sai 20,000000000000004 em ponto flutuante não é arriscada', () => {
    const entradas = { ...ENTRADAS_VAZIAS, preco: 100, custo: 0, cpc: 3, chamam: 15, orcamento: 250 };
    const conta = calcular('orcamento', entradas);
    if (conta.tipo !== 'orcamento') throw new Error('esperava o cenário de orçamento');
    // a conta crua passa de 20 só por ruído: sem semRuido o limite falharia
    expect(conta.taxaExigida).toBeGreaterThan(20);
    expect(conta.taxaExigida).toBeLessThan(20.000001);
    expect(conta.arriscado).toBe(false);
  });

  it('lucro de ruído negativo (-5,7e-14) vira zero positivo, não "prejuízo"', () => {
    const entradas = { ...ENTRADAS_VAZIAS, preco: 100, custo: 0, cpc: 0.7, chamam: 1, clientes: 5, compram: 70 };
    const conta = calcular('clientes', entradas);
    if (conta.tipo !== 'clientes') throw new Error('esperava o cenário de clientes');
    expect(Object.is(conta.lucro, 0)).toBe(true);
    expect(Object.is(conta.retorno, 0)).toBe(true);
    expect(conta.sePaga).toBe(true);
  });
});

describe('calcular: custo negativo', () => {
  it('vale como zero (fora do domínio, mas não aumenta a sobra)', () => {
    const conta = calcular('orcamento', { ...base, custo: -50, orcamento: 600 });
    expect(conta).toMatchObject({ tipo: 'orcamento', sobra: 300, vendas: 2 });
  });
});

describe('calcular: cenário de clientes', () => {
  const clientes: Entradas = { ...base, clientes: 5, compram: 30 };

  it('300 / 60 / 2 / 6% / 5 clientes / 30%: investimento, cliques, pessoas, CAC e retorno', () => {
    // 5 × 2 ÷ (0,06 × 0,3) = 555,5556; ÷ 2 = 277,78 cliques; × 0,06 = 16,67 pessoas
    // CAC = 555,5556 ÷ 5 = 111,11; sobra total = 5 × 240 = 1.200; lucro = 644,44; retorno = 116,0%
    const conta = calcular('clientes', clientes);
    expect(conta.tipo).toBe('clientes');
    if (conta.tipo !== 'clientes') return;
    expect(conta.investimento).toBeCloseTo(555.5556, 4);
    expect(conta.cliques).toBe(277);
    expect(conta.pessoas).toBe(16);
    expect(conta.cac).toBeCloseTo(111.1111, 4);
    expect(conta.lucro).toBeCloseTo(644.4444, 4);
    expect(conta.retorno).toBeCloseTo(116, 4);
    expect(conta.sePaga).toBe(true);
  });

  it('retorno exatamente 0 se paga', () => {
    // sobra 40; 5 × 2 ÷ (0,1 × 0,5) = 200 = 5 × 40
    const conta = calcular('clientes', { preco: 100, custo: 60, cpc: 2, chamam: 10, orcamento: 0, clientes: 5, compram: 50 });
    expect(conta).toMatchObject({ tipo: 'clientes', retorno: 0, sePaga: true });
  });

  it('retorno negativo é prejuízo', () => {
    const conta = calcular('clientes', { preco: 100, custo: 70, cpc: 2, chamam: 10, orcamento: 0, clientes: 5, compram: 50 });
    expect(conta).toMatchObject({ tipo: 'clientes', sePaga: false });
  });
});

describe('calcular: falta pouco', () => {
  it('campos em zero', () => {
    expect(calcular('orcamento', ENTRADAS_VAZIAS)).toEqual({ tipo: 'falta', motivo: 'basicos' });
    expect(calcular('orcamento', base)).toEqual({ tipo: 'falta', motivo: 'orcamento' });
    expect(calcular('clientes', base)).toEqual({ tipo: 'falta', motivo: 'clientes' });
    expect(calcular('clientes', { ...base, clientes: 5 })).toEqual({ tipo: 'falta', motivo: 'clientes' });
    expect(calcular('clientes', { ...base, compram: 30 })).toEqual({ tipo: 'falta', motivo: 'clientes' });
  });

  it('custo maior ou igual ao preço', () => {
    expect(calcular('orcamento', { ...base, custo: 300, orcamento: 600 })).toEqual({ tipo: 'falta', motivo: 'custo' });
    expect(calcular('orcamento', { ...base, custo: 400, orcamento: 600 })).toEqual({ tipo: 'falta', motivo: 'custo' });
  });
});

import { describe, it, expect } from 'vitest';
import { lerQr } from '@/test/qr';
import { TIPOS, montarConteudo } from '../conteudos';
import { criarMatriz } from '../matriz';
import { EXEMPLOS } from './exemplos';

function conteudoDe(id: (typeof TIPOS)[number]['id']): string {
  const r = montarConteudo(id, EXEMPLOS[id] as never);
  if (!r.ok) throw new Error(`exemplo inválido em ${id}: ${JSON.stringify(r.erros)}`);
  return r.texto;
}

describe('leitura garantida (RF-QR-24, T08)', () => {
  it.each(TIPOS.map((t) => [t.id]))('tipo %s: o texto lido é igual ao conteúdo, sem logo', (id) => {
    const texto = conteudoDe(id);
    expect(lerQr(criarMatriz(texto, { comLogo: false }))).toBe(texto);
  });

  it.each(TIPOS.map((t) => [t.id]))(
    'tipo %s: com logo (centro tapado em 22% + 1 módulo) a leitura continua igual',
    (id) => {
      const texto = conteudoDe(id);
      expect(lerQr(criarMatriz(texto, { comLogo: true }), { taparCentro: 0.22 })).toBe(texto);
    },
  );

  it('texto de 300 caracteres com acentos, com e sem logo', () => {
    const texto = 'Promoção de açaí: 2 por 1! '.repeat(12).slice(0, 300);
    expect(texto).toHaveLength(300);
    expect(lerQr(criarMatriz(texto, { comLogo: false }))).toBe(texto);
    expect(lerQr(criarMatriz(texto, { comLogo: true }), { taparCentro: 0.22 })).toBe(texto);
  });

  it('o Pix com valor também é lido', () => {
    const r = montarConteudo('pix', { ...EXEMPLOS.pix, valor: '1.250,50' });
    if (!r.ok) throw new Error('Pix inválido');
    expect(lerQr(criarMatriz(r.texto, { comLogo: true }), { taparCentro: 0.22 })).toBe(r.texto);
  });
});

describe('criarMatriz (DT-QR-03)', () => {
  it('usa correção M sem logo e H com logo', () => {
    const texto = 'https://www.seunegocio.com.br/cardapio';
    expect(criarMatriz(texto, { comLogo: false }).nivel).toBe('M');
    expect(criarMatriz(texto, { comLogo: true }).nivel).toBe('H');
  });

  it('a matriz é quadrada, com tamanho 17 + 4 × versão e acesso por (linha, coluna)', () => {
    const m = criarMatriz('https://www.seunegocio.com.br/cardapio', { comLogo: false });
    expect((m.tamanho - 17) % 4).toBe(0);
    // o canto superior esquerdo tem o localizador: módulo escuro em (0,0) e (0,6), claro em (1,1)
    expect([m.escuro(0, 0), m.escuro(0, 6), m.escuro(1, 1)]).toEqual([true, true, false]);
  });

  it('com logo a leitura NÃO aguenta o centro tapado em M (prova que o H faz diferença)', () => {
    const texto = 'https://www.seunegocio.com.br/cardapio?mesa=12&origem=qr-code';
    const m = criarMatriz(texto, { comLogo: false });
    // tapar 45% do lado (≈ 20% da área) estoura os ~15% do M
    expect(lerQr(m, { taparCentro: 0.45 })).toBeNull();
  });
});

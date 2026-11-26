import { describe, it, expect } from 'vitest';
import { LIMITE_DA_MENSAGEM, MENSAGENS_PRONTAS } from '../mensagens';

describe('mensagens prontas (RF-LW-09)', () => {
  it('são 5, com o rótulo e o texto da spec, nesta ordem', () => {
    expect(MENSAGENS_PRONTAS).toEqual([
      { rotulo: 'Fazer um pedido', texto: 'Olá! Quero fazer um pedido.' },
      { rotulo: 'Agendar um horário', texto: 'Olá! Quero agendar um horário. Quais dias você tem livres?' },
      { rotulo: 'Pedir orçamento', texto: 'Olá! Quero um orçamento.' },
      { rotulo: 'Saber o preço', texto: 'Olá! Quanto custa?' },
      { rotulo: 'Vi seu anúncio', texto: 'Olá! Vi seu anúncio e quero saber mais.' },
    ]);
  });

  it('cada texto cabe no limite da mensagem', () => {
    expect(LIMITE_DA_MENSAGEM).toBe(500);
    for (const { texto } of MENSAGENS_PRONTAS) expect(texto.length).toBeLessThanOrEqual(LIMITE_DA_MENSAGEM);
  });
});

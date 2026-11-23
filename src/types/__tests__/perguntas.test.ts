import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { QUESTIONS } from '..';

const todas = Object.values(QUESTIONS).flat();

describe('as 24 perguntas (RF-F3b-12, R-TM-5)', () => {
  it('são 24, seis por grupo, com ids únicos', () => {
    expect(todas).toHaveLength(24);
    for (const grupo of Object.values(QUESTIONS)) expect(grupo).toHaveLength(6);
    expect(new Set(todas.map((q) => q.id)).size).toBe(24);
  });

  it('corrige "três ou more pessoas" para "três ou mais pessoas"', () => {
    const e2 = QUESTIONS.esforco.find((q) => q.id === 'e2');
    expect(e2?.text).toBe(
      'O processo exige a alocação de três ou mais pessoas (seja de forma simultânea ou em etapas de repasse) para ser concluído do início ao fim?',
    );
    expect(todas.some((q) => q.text.includes(' more '))).toBe(false);
  });

  it('não muda nenhuma outra palavra: o texto de todas as perguntas tem a mesma impressão digital', () => {
    const impressao = createHash('sha256')
      .update(todas.map((q) => `${q.id}|${q.text}`).join('\n'))
      .digest('hex');
    expect(impressao).toBe('3a82f923322d1b9ddad81cf17b346eb39bc2a56e3d2b42257affc28545dbe05e');
  });
});

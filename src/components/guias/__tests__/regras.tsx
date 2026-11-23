import type { ReactElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Regras comuns dos três guias (spec f4-guias, RF-F4-01 a RF-F4-08). Cada guia chama
// `regrasDoGuia` com o que é só dele: título, rótulos da tela e selos.

export const TOPICOS = [
  'Para que serve',
  'Passo a passo',
  'Exemplo com números',
  'Como ler o resultado',
  'Erros comuns',
  'Perguntas frequentes',
  'Aviso',
];

// RF-F4-05: nomes antigos que não podem aparecer no texto, a não ser entre parênteses.
export const TERMOS_PROIBIDOS = [
  'Matriz',
  'Score',
  'Atratividade',
  'Ticket médio',
  'CPC Médio',
  'Taxa de Conversão da LP',
  'Piso Aceitável',
  'Break-even',
  'Margem Real',
  'Capacidade Produtiva',
  'Ociosidade',
  'Eficiente',
  'Crítico',
  'Estrela',
  'Oportunidade',
  'Escala',
  'Tenho um orçamento',
  'Tenho uma meta',
  'Gerar Diagnóstico',
  'Novo Serviço',
  'Exportar',
  'Raio-X',
];

const BLOCOS = 'h1, h2, h3, h4, p, ul, ol, li, dl, dt, dd, div, section';

// `textContent` cola o fim de um bloco no começo do próximo ("Aviso" + "Os resultados" vira uma
// palavra só), o que esconde palavras na contagem e a fronteira de palavra dos termos proibidos
// (lacunas 1 e 2 do Verifier da F4). Aqui cada bloco fica separado por um espaço; o texto em linha
// (strong, link) continua colado, como o leitor vê.
// O Intl também formata moeda com espaço não separável (U+00A0).
export const textoDe = (el: Element) => {
  const copia = el.cloneNode(true) as Element;
  const doc = el.ownerDocument;
  for (const bloco of [copia, ...copia.querySelectorAll(BLOCOS)]) {
    bloco.insertBefore(doc.createTextNode(' '), bloco.firstChild);
    bloco.appendChild(doc.createTextNode(' '));
  }
  return (copia.textContent ?? '').replace(/\u00a0/g, ' ');
};
export const contarPalavras = (el: Element) => textoDe(el).split(/\s+/).filter(Boolean).length;

export const topico = (nome: string) =>
  screen.getByRole('heading', { level: 3, name: nome }).parentElement as HTMLElement;

const semParenteses = (texto: string) => {
  let atual = texto;
  let anterior;
  do {
    anterior = atual;
    atual = atual.replace(/\([^()]*\)/g, ' ');
  } while (atual !== anterior);
  return atual;
};

interface Regras {
  nome: string;
  guia: () => ReactElement;
  titulo: string;
  /** Rótulos literais da tela que o "Passo a passo" cita (CA-F4-04). */
  rotulosDoPasso: string[];
  /** Selos e nomes literais da tela que o "Como ler o resultado" cita (CA-F4-05). */
  selos: string[];
  /** Perguntas que a spec exige (RF-F4-07): texto que precisa aparecer no tópico. */
  perguntas: (string | RegExp)[];
}

export function regrasDoGuia({ nome, guia, titulo, rotulosDoPasso, selos, perguntas }: Regras) {
  describe(`${nome}: regras da spec`, () => {
    it('CA-F4-01: título novo e os sete tópicos, na ordem, sem "Como a conta é feita" nem "Quem fez"', () => {
      render(guia());
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(titulo);
      expect(screen.getByRole('region', { name: titulo }).tagName).toBe('SECTION');
      expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(TOPICOS);
      expect(screen.queryByText('Como a conta é feita')).not.toBeInTheDocument();
      expect(screen.queryByText('Quem fez')).not.toBeInTheDocument();
    });

    it('CA-F4-02: entre 300 e 650 palavras', () => {
      const { container } = render(guia());
      const palavras = contarPalavras(container);
      expect(palavras).toBeGreaterThanOrEqual(300);
      expect(palavras).toBeLessThanOrEqual(650);
    });

    it('CA-F4-03: nenhum termo antigo fora de parênteses', () => {
      const { container } = render(guia());
      const texto = semParenteses(textoDe(container));
      for (const termo of TERMOS_PROIBIDOS) {
        expect(texto, `termo proibido: ${termo}`).not.toMatch(new RegExp(`(?<![\\p{L}])${termo}(?![\\p{L}])`, 'iu'));
      }
    });

    it('CA-F4-04: o "Passo a passo" é uma lista numerada com os rótulos literais da tela, sem fórmula', () => {
      render(guia());
      const passo = topico('Passo a passo');
      const lista = within(passo).getByRole('list');
      expect(lista.tagName).toBe('OL');
      expect(within(lista).getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);
      const texto = textoDe(lista);
      for (const rotulo of rotulosDoPasso) {
        expect(texto, `rótulo: ${rotulo}`).toContain(`“${rotulo}”`);
      }
      expect(texto).not.toMatch(/[×÷−]/);
    });

    it('CA-F4-05: o "Como ler o resultado" cita os selos literais da tela', () => {
      render(guia());
      const texto = textoDe(topico('Como ler o resultado'));
      for (const selo of selos) {
        expect(texto, `selo: ${selo}`).toContain(`“${selo}”`);
      }
    });

    it('RF-F4-06: no máximo 3 erros comuns e 4 perguntas', () => {
      render(guia());
      const erros = within(topico('Erros comuns')).getAllByRole('listitem');
      expect(erros.length).toBeGreaterThanOrEqual(1);
      expect(erros.length).toBeLessThanOrEqual(3);
      const faq = topico('Perguntas frequentes');
      const perguntasDoGuia = faq.querySelectorAll('dt');
      expect(perguntasDoGuia.length).toBeGreaterThanOrEqual(1);
      expect(perguntasDoGuia.length).toBeLessThanOrEqual(4);
    });

    it('RF-F4-07: as perguntas obrigatórias da ferramenta estão lá', () => {
      render(guia());
      const faq = textoDe(topico('Perguntas frequentes'));
      for (const pergunta of perguntas) {
        if (typeof pergunta === 'string') expect(faq).toContain(pergunta);
        else expect(faq).toMatch(pergunta);
      }
    });

    it('RF-F4-08: o aviso tem 1 ou 2 frases e manda para o contador', () => {
      render(guia());
      const aviso = textoDe(topico('Aviso').querySelector('p')!);
      const frases = aviso.split(/[.!?]+\s*/).filter(Boolean);
      expect(frases.length).toBeGreaterThanOrEqual(1);
      expect(frases.length).toBeLessThanOrEqual(2);
      expect(aviso).toMatch(/estimativas/);
      expect(aviso).toMatch(/contador/);
    });

    it('RF-F4-04: frases de até 30 palavras, sem texto em caixa alta, tratando por "você"', () => {
      const { container } = render(guia());
      for (const el of container.querySelectorAll('p, li, dt, dd')) {
        for (const frase of textoDe(el).split(/[.!?]+\s+/)) {
          const palavras = frase.split(/\s+/).filter(Boolean).length;
          expect(palavras, `frase longa: ${frase}`).toBeLessThanOrEqual(30);
        }
      }
      const texto = textoDe(container);
      expect(texto).not.toMatch(/\b\p{Lu}{5,}\b/u);
      expect(texto).toMatch(/(?<![\p{L}])você(?![\p{L}])/u);
    });
  });
}

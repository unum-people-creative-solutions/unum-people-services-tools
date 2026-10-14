import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GuiaViabilidade, EXEMPLO_VIABILIDADE } from '../GuiaViabilidade';
import ViabilidadeView from '../../../app/calculadora-viabilidade/ViabilidadeView';

const TOPICOS = [
  'Para que serve',
  'Como a conta é feita',
  'Exemplo com números',
  'Como ler o resultado',
  'Erros comuns',
  'Perguntas frequentes',
  'Aviso',
  'Quem fez',
];

// O Intl formata moeda com espaço não separável (U+00A0)
const textoDe = (el: Element) => (el.textContent ?? '').replace(/ /g, ' ');
const contarPalavras = (el: Element) => textoDe(el).split(/\s+/).filter(Boolean).length;

describe('GuiaViabilidade', () => {
  it('tem um título e os oito tópicos, na ordem', () => {
    render(<GuiaViabilidade />);
    expect(screen.getByRole('heading', { level: 2, name: /Guia da Calculadora de Viabilidade/ })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(TOPICOS);
    expect(screen.getByRole('region', { name: /Guia da Calculadora de Viabilidade/ }).tagName).toBe('SECTION');
  });

  it('tem pelo menos 600 palavras', () => {
    const { container } = render(<GuiaViabilidade />);
    expect(contarPalavras(container)).toBeGreaterThanOrEqual(600);
  });

  it('mostra no exemplo os resultados dos dois cenários', () => {
    render(<GuiaViabilidade />);
    const exemplo = textoDe(screen.getByRole('heading', { name: 'Exemplo com números' }).parentElement!);
    expect(exemplo).toContain('800 cliques');
    expect(exemplo).toContain('32 oportunidades');
    expect(exemplo).toContain('arredonda para 7');
    expect(exemplo).toContain('20,8%');
    expect(exemplo).toContain('R$ 1.600,00');
    expect(exemplo).toContain('R$ 200,00');
    expect(exemplo).toContain('retorno de 20%');
  });

  it('com as entradas do exemplo, a calculadora real dá o mesmo resultado no cenário de orçamento', () => {
    const e = EXEMPLO_VIABILIDADE;
    render(<ViabilidadeView />);

    fireEvent.click(screen.getByText(/Tenho um orçamento/i).closest('button')!);
    fireEvent.change(screen.getByLabelText(/Ticket Médio/i), { target: { value: String(e.ticketMedio) } });
    fireEvent.change(screen.getByLabelText(/Custo Variável/i), { target: { value: String(e.custoVariavel) } });
    fireEvent.change(screen.getByLabelText(/CPC Médio/i), { target: { value: String(e.cpc) } });
    fireEvent.change(screen.getByLabelText(/Taxa de Conversão da LP/i), { target: { value: String(e.taxaConversao) } });
    fireEvent.change(screen.getByLabelText(/Orçamento da Campanha/i), { target: { value: String(e.orcamento.valor) } });
    fireEvent.click(screen.getByText(/Gerar Diagnóstico/i));

    const tela = textoDe(document.body);
    expect(tela).toContain('cerca de 32 oportunidades');
    expect(tela).toContain('transformar 7 dessas oportunidades');
    expect(tela).toContain('apenas 20.8%');
    expect(screen.getByText(/Este cenário é arriscado/i)).toBeInTheDocument();
  });

  it('com as entradas do exemplo, a calculadora real dá o mesmo resultado no cenário de meta', () => {
    const e = EXEMPLO_VIABILIDADE;
    render(<ViabilidadeView />);

    fireEvent.click(screen.getByText(/Tenho uma meta/i).closest('button')!);
    fireEvent.change(screen.getByLabelText(/Ticket Médio/i), { target: { value: String(e.ticketMedio) } });
    fireEvent.change(screen.getByLabelText(/Custo Variável/i), { target: { value: String(e.custoVariavel) } });
    fireEvent.change(screen.getByLabelText(/CPC Médio/i), { target: { value: String(e.cpc) } });
    fireEvent.change(screen.getByLabelText(/Taxa de Conversão da LP/i), { target: { value: String(e.taxaConversao) } });
    fireEvent.change(screen.getByLabelText(/Meta de Clientes/i), { target: { value: String(e.meta.clientes) } });
    fireEvent.change(screen.getByLabelText(/Taxa de Fechamento \(Vendas\)/i), { target: { value: String(e.meta.taxaFechamento) } });
    fireEvent.click(screen.getByText(/Gerar Diagnóstico/i));

    const tela = textoDe(document.body);
    expect(tela).toContain('investir cerca de R$ 1.600,00');
    expect(tela).toContain('32 oportunidades (leads)');
    expect(tela).toContain('pagando R$ 200,00');
    expect(tela).toContain('20.0%');
  });
});

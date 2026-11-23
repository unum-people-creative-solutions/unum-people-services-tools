import { render, screen, fireEvent, within } from '@testing-library/react';
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

  // A tela é uma página só, com resultado ao vivo; os valores digitados seguem o formato pt-BR
  const digitar = (rotulo: string, valor: number) => {
    const campo = screen.getByLabelText(rotulo);
    fireEvent.change(campo, { target: { value: String(valor).replace('.', ',') } });
    fireEvent.blur(campo);
  };
  const preencherBase = () => {
    const e = EXEMPLO_VIABILIDADE;
    digitar('Preço médio de cada venda', e.ticketMedio);
    digitar('Quanto custa entregar essa venda', e.custoVariavel);
    digitar('Quanto custa cada clique', e.cpc);
    digitar('De cada 100 que clicam, quantos chamam você', e.taxaConversao);
  };
  const resultado = () => within(screen.getByRole('region', { name: 'Seu resultado' }));

  it('com as entradas do exemplo, a calculadora real dá o mesmo resultado no cenário de orçamento', () => {
    const e = EXEMPLO_VIABILIDADE;
    render(<ViabilidadeView />);

    preencherBase();
    digitar('Quanto você quer gastar em anúncio', e.orcamento.valor);

    expect(resultado().getByText('Cliques com R$ 1.600,00').nextElementSibling).toHaveTextContent(
      `cerca de ${e.orcamento.cliques}`,
    );
    expect(resultado().getByText('Pessoas que chamam').nextElementSibling).toHaveTextContent(
      `cerca de ${e.orcamento.oportunidades}`,
    );
    expect(resultado().getByText(`${e.orcamento.vendasArredondadas} vendas`)).toBeInTheDocument();
    expect(textoDe(resultado().getByRole('status'))).toContain('(20,8%)');
    expect(resultado().getByText('Arriscado')).toBeInTheDocument();
  });

  it('com as entradas do exemplo, a calculadora real dá o mesmo resultado no cenário de meta', () => {
    const e = EXEMPLO_VIABILIDADE;
    render(<ViabilidadeView />);

    fireEvent.click(screen.getByRole('radio', { name: 'Quero um número de clientes' }));
    preencherBase();
    digitar('Quantos clientes novos você quer', e.meta.clientes);
    digitar('De cada 10 que chamam, quantos compram', e.meta.taxaFechamento);

    const tela = textoDe(screen.getByRole('region', { name: 'Seu resultado' }));
    expect(tela).toContain('invista cerca de');
    expect(tela).toContain('R$ 1.600,00');
    expect(resultado().getByText('Pessoas que chamam').nextElementSibling).toHaveTextContent(
      `cerca de ${e.orcamento.oportunidades}`,
    );
    expect(resultado().getByText('Cada cliente novo custa').nextElementSibling).toHaveTextContent('R$ 200,00');
    expect(tela).toContain('retorno de 20,0%');
  });
});

import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GuiaViabilidade, EXEMPLO_VIABILIDADE } from '../GuiaViabilidade';
import ViabilidadeView from '../../../app/calculadora-viabilidade/ViabilidadeView';
import { regrasDoGuia, textoDe, topico } from './regras';

regrasDoGuia({
  nome: 'GuiaViabilidade',
  guia: () => <GuiaViabilidade />,
  titulo: 'Como saber se vale a pena anunciar',
  rotulosDoPasso: [
    'Já sei quanto vou gastar',
    'Quero um número de clientes',
    'Preço médio de cada venda',
    'Quanto custa entregar essa venda',
    'Quanto custa cada clique',
    'De cada 100 que clicam, quantos chamam você',
    'Quanto você quer gastar em anúncio',
    'Quantos clientes novos você quer',
    'De cada 10 que chamam, quantos compram',
  ],
  selos: ['Falta pouco', 'Dá para pagar', 'Arriscado', 'Se paga', 'Prejuízo'],
  perguntas: ['Meus dados ficam salvos?', 'De onde tiro esse número?'],
});

describe('GuiaViabilidade: exemplo e ferramenta real', () => {
  it('mostra no exemplo os resultados dos dois caminhos', () => {
    render(<GuiaViabilidade />);
    const exemplo = textoDe(topico('Exemplo com números'));
    expect(exemplo).toContain('800 cliques');
    expect(exemplo).toContain('32 pessoas');
    expect(exemplo).toContain('arredonda para 7');
    expect(exemplo).toContain('20,8%');
    expect(exemplo).toContain('R$ 1.600,00');
    expect(exemplo).toContain('R$ 200,00');
    expect(exemplo).toContain('retorno (ROI) de 20,0%');
  });

  // A tela é uma página só, com resultado ao vivo; os valores digitados seguem o formato pt-BR
  const digitar = (rotulo: string, valor: number) => {
    const campo = screen.getByLabelText(rotulo);
    fireEvent.change(campo, { target: { value: String(valor).replace('.', ',') } });
    fireEvent.blur(campo);
  };
  const preencherBase = () => {
    const e = EXEMPLO_VIABILIDADE;
    digitar('Preço médio de cada venda', e.preco);
    digitar('Quanto custa entregar essa venda', e.custo);
    digitar('Quanto custa cada clique', e.cpc);
    digitar('De cada 100 que clicam, quantos chamam você', e.chamam);
  };
  const resultado = () => within(screen.getByRole('region', { name: 'Seu resultado' }));

  it('com as entradas do exemplo, a calculadora real dá o mesmo resultado no caminho do gasto', () => {
    const e = EXEMPLO_VIABILIDADE;
    render(<ViabilidadeView />);

    preencherBase();
    digitar('Quanto você quer gastar em anúncio', e.orcamento.valor);

    expect(screen.getByText('Sobra por venda, antes do anúncio').nextElementSibling).toHaveTextContent('R$ 240,00');
    expect(resultado().getByText('Cliques com R$ 1.600,00').nextElementSibling).toHaveTextContent(
      `cerca de ${e.orcamento.cliques}`,
    );
    expect(resultado().getByText('Pessoas que chamam').nextElementSibling).toHaveTextContent(
      `cerca de ${e.orcamento.pessoas}`,
    );
    expect(resultado().getByText(`${e.orcamento.vendasArredondadas} vendas`)).toBeInTheDocument();
    expect(textoDe(resultado().getByRole('status'))).toContain('(20,8%)');
    expect(resultado().getByText('Arriscado')).toBeInTheDocument();
  });

  it('com as entradas do exemplo, a calculadora real dá o mesmo resultado no caminho dos clientes', () => {
    const e = EXEMPLO_VIABILIDADE;
    render(<ViabilidadeView />);

    fireEvent.click(screen.getByRole('radio', { name: 'Quero um número de clientes' }));
    preencherBase();
    digitar('Quantos clientes novos você quer', e.meta.clientes);
    digitar('De cada 10 que chamam, quantos compram', e.meta.compram);

    const tela = textoDe(screen.getByRole('region', { name: 'Seu resultado' }));
    expect(tela).toContain('invista cerca de');
    expect(tela).toContain('R$ 1.600,00');
    expect(resultado().getByText('Pessoas que chamam').nextElementSibling).toHaveTextContent(
      `cerca de ${e.orcamento.pessoas}`,
    );
    expect(resultado().getByText('Cada cliente novo custa').nextElementSibling).toHaveTextContent('R$ 200,00');
    expect(tela).toContain('retorno de 20,0%');
    expect(resultado().getByText('Se paga')).toBeInTheDocument();
  });
});

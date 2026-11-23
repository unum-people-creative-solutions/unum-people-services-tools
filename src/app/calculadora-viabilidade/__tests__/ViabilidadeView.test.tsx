import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ViabilidadeView from '../ViabilidadeView';

const JA_SEI = 'Já sei quanto vou gastar';
const QUERO_CLIENTES = 'Quero um número de clientes';

const montar = (children?: React.ReactNode) => render(<ViabilidadeView>{children}</ViabilidadeView>);

const digitar = (rotulo: string, valor: string | number) => {
  act(() => {
    const campo = screen.getByLabelText(rotulo);
    fireEvent.change(campo, { target: { value: String(valor) } });
    // Sem foco o campo mostra o número formatado (pt-BR)
    fireEvent.blur(campo);
  });
};

const escolher = (caminho: string) => {
  act(() => {
    fireEvent.click(screen.getByRole('radio', { name: caminho }));
  });
};

const guardado = (storage: Storage) =>
  Object.keys(storage).filter((chave) => typeof (storage as unknown as Record<string, unknown>)[chave] !== 'function');

const resultado = () => screen.getByRole('region', { name: 'Seu resultado' });

// Valor que fica junto de um rótulo, ex.: a linha "Pessoas que chamam … cerca de 18"
const valorDe = (rotulo: string | RegExp) => within(resultado()).getByText(rotulo).nextElementSibling as HTMLElement;

const preencherVenda = (preco = 300, custo = 60) => {
  digitar('Preço médio de cada venda', preco);
  digitar('Quanto custa entregar essa venda', custo);
};
const preencherAnuncio = (cpc = 2, chamam = 6) => {
  digitar('Quanto custa cada clique', cpc);
  digitar('De cada 100 que clicam, quantos chamam você', chamam);
};
const preencherOrcamento = (orcamento = 600, chamam = 6) => {
  preencherVenda();
  preencherAnuncio(2, chamam);
  digitar('Quanto você quer gastar em anúncio', orcamento);
};
const preencherClientes = (clientes = 5, compram = 30) => {
  preencherVenda();
  preencherAnuncio();
  escolher(QUERO_CLIENTES);
  digitar('Quantos clientes novos você quer', clientes);
  digitar('De cada 10 que chamam, quantos compram', compram);
};

describe('Vale a pena anunciar?', () => {
  let setItem: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    setItem = vi.spyOn(window.localStorage, 'setItem');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('estrutura e textos (RF-F3a-01 a 05)', () => {
    it('tem o título, a frase e os dois blocos numa página só, sem o botão de gerar', () => {
      montar();
      expect(screen.getByRole('heading', { level: 1, name: 'Vale a pena anunciar?' })).toBeInTheDocument();
      expect(
        screen.getByText('Antes de gastar com anúncio no Google ou no Instagram, veja quantas vendas pagam a conta.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Sua venda' })).toBeInTheDocument();
      expect(screen.getByText('Pense numa venda típica do seu negócio.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Seu anúncio' })).toBeInTheDocument();
      expect(screen.getByText('Use os números do painel do anúncio, se já tiver.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Seu resultado' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Gerar Diagnóstico/i })).not.toBeInTheDocument();
    });

    it('sem modal de ajuda, botão Ajuda, passos nem cartão do CRM', () => {
      montar();
      expect(screen.queryByRole('button', { name: 'Ajuda' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Entendi, Prosseguir/ })).not.toBeInTheDocument();
      expect(screen.queryByText(/CONHECER UNUM PEOPLE/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Transforme seus anúncios/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /CRM/i })).not.toBeInTheDocument();
    });

    it('usa o cabeçalho e o rodapé novos e não tem anúncio', () => {
      const { container } = montar();
      expect(screen.getByRole('link', { name: 'Todas as ferramentas' })).toHaveAttribute('href', '/');
      expect(screen.getByText('Seus dados ficam neste aparelho.')).toBeInTheDocument();
      expect(container.querySelectorAll('ins')).toHaveLength(0);
      expect(screen.queryByText(/AdSense|Publicidade/i)).not.toBeInTheDocument();
    });

    it('oferece os dois caminhos como rádios, com "Já sei quanto vou gastar" marcado', () => {
      montar();
      const grupo = screen.getByRole('group', { name: 'O que você quer descobrir?' });
      const jaSei = within(grupo).getByRole('radio', { name: JA_SEI });
      const quero = within(grupo).getByRole('radio', { name: QUERO_CLIENTES });
      expect(jaSei).toBeChecked();
      expect(quero).not.toBeChecked();
      expect(within(grupo).getByText('Quantas vendas preciso para o anúncio se pagar?')).toBeInTheDocument();
      expect(within(grupo).getByText('Quanto preciso investir para chegar lá?')).toBeInTheDocument();
      expect(jaSei).toHaveAccessibleDescription('Quantas vendas preciso para o anúncio se pagar?');
      expect(quero).toHaveAccessibleDescription('Quanto preciso investir para chegar lá?');
    });

    it('mostra os campos e as ajudas do caminho "Já sei quanto vou gastar"', () => {
      montar();
      expect(screen.getByLabelText('Preço médio de cada venda')).toBeInTheDocument();
      expect(screen.getByLabelText('Quanto custa entregar essa venda')).toHaveAccessibleDescription(
        'Material, frete, taxa da maquininha. Se deixar em zero, o resultado fica bom demais.',
      );
      expect(screen.getByLabelText('Quanto custa cada clique')).toHaveAccessibleDescription(
        'Na sua plataforma de anúncios aparece como "CPC médio".',
      );
      expect(screen.getByLabelText('De cada 100 que clicam, quantos chamam você')).toHaveAccessibleDescription(
        'No WhatsApp, por formulário ou ligação.',
      );
      expect(screen.getByLabelText('Quanto você quer gastar em anúncio')).toBeInTheDocument();
      expect(screen.queryByLabelText('Quantos clientes novos você quer')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('De cada 10 que chamam, quantos compram')).not.toBeInTheDocument();
    });

    it('mostra os campos e a ajuda do caminho "Quero um número de clientes"', () => {
      montar();
      escolher(QUERO_CLIENTES);
      expect(screen.getByLabelText('Quantos clientes novos você quer')).toBeInTheDocument();
      expect(screen.getByLabelText('De cada 10 que chamam, quantos compram')).toHaveAccessibleDescription(
        'Se não souber, pense nos últimos 10 que pediram orçamento.',
      );
      expect(screen.queryByLabelText('Quanto você quer gastar em anúncio')).not.toBeInTheDocument();
    });

    it('trocar o caminho mantém os valores comuns', () => {
      montar();
      preencherVenda(300, 60);
      preencherAnuncio(2, 6);
      escolher(QUERO_CLIENTES);
      expect(screen.getByLabelText('Preço médio de cada venda')).toHaveValue('300,00');
      expect(screen.getByLabelText('Quanto custa entregar essa venda')).toHaveValue('60,00');
      expect(screen.getByLabelText('Quanto custa cada clique')).toHaveValue('2,00');
      expect(screen.getByLabelText('De cada 100 que clicam, quantos chamam você')).toHaveValue('6');
      escolher(JA_SEI);
      expect(screen.getByLabelText('Preço médio de cada venda')).toHaveValue('300,00');
    });

    it('mostra "Sobra por venda, antes do anúncio" ao vivo', () => {
      montar();
      preencherVenda(300, 60);
      expect(screen.getByText('Sobra por venda, antes do anúncio').nextElementSibling).toHaveTextContent('R$ 240,00');
    });
  });

  describe('cenário de orçamento (RF-F3a-06, CA-F3-02)', () => {
    it('300 / 60 / 2 / 6% / R$ 600: 3 vendas, cerca de 300 cliques e 18 pessoas, "Dá para pagar"', () => {
      montar();
      preencherOrcamento(600, 6);

      expect(within(resultado()).getByText('Para o anúncio se pagar, você precisa de')).toBeInTheDocument();
      expect(within(resultado()).getByText('3 vendas')).toBeInTheDocument();
      expect(valorDe('Cliques com R$ 600,00')).toHaveTextContent('cerca de 300');
      expect(valorDe('Pessoas que chamam')).toHaveTextContent('cerca de 18');

      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Dá para pagar')).toBeInTheDocument();
      // 2,5 vendas ÷ 18 pessoas = 13,9%; 100 ÷ 13,9 = 7,2 → 1 em cada 8
      expect(
        within(estado).getByText('Você precisa vender para 1 em cada 8 pessoas que chamarem (13,9%).'),
      ).toBeInTheDocument();
    });

    it('com 4% chamam: 12 pessoas, 20,8% e "Arriscado"', () => {
      montar();
      preencherOrcamento(600, 4);
      expect(valorDe('Pessoas que chamam')).toHaveTextContent('cerca de 12');
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Arriscado')).toBeInTheDocument();
      expect(within(estado).queryByText('Dá para pagar')).not.toBeInTheDocument();
      expect(
        within(estado).getByText('Você precisa vender para 1 em cada 5 pessoas que chamarem (20,8%).'),
      ).toBeInTheDocument();
    });

    it('taxa exigida de exatamente 20% ainda é "Dá para pagar"', () => {
      montar();
      // sobra 100 → 10 vendas; 1.000 cliques × 5% = 50 pessoas; 10 ÷ 50 = 20%
      preencherVenda(200, 100);
      preencherAnuncio(1, 5);
      digitar('Quanto você quer gastar em anúncio', 1000);
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Dá para pagar')).toBeInTheDocument();
      expect(
        within(estado).getByText('Você precisa vender para 1 em cada 5 pessoas que chamarem (20,0%).'),
      ).toBeInTheDocument();
    });

    it('taxa exigida de exatamente 20% por ruído de ponto flutuante (20,000000000000004) ainda é "Dá para pagar"', () => {
      montar();
      preencherVenda(100, 0);
      preencherAnuncio(3, 15);
      digitar('Quanto você quer gastar em anúncio', 250);
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Dá para pagar')).toBeInTheDocument();
      expect(
        within(estado).getByText('Você precisa vender para 1 em cada 5 pessoas que chamarem (20,0%).'),
      ).toBeInTheDocument();
    });

    it('taxa exigida de exatamente 100%: "Arriscado" e "para todas as pessoas que chamarem (100,0%)"', () => {
      montar();
      // sobra 100; R$ 100 → 1 venda; 100 cliques × 1% = 1 pessoa; 1 ÷ 1 = 100%
      preencherVenda(200, 100);
      preencherAnuncio(1, 1);
      digitar('Quanto você quer gastar em anúncio', 100);
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Arriscado')).toBeInTheDocument();
      expect(within(estado).queryByText('Dá para pagar')).not.toBeInTheDocument();
      expect(
        within(estado).getByText('Você precisa vender para todas as pessoas que chamarem (100,0%).'),
      ).toBeInTheDocument();
    });

    it('taxa exigida acima de 100%: "Arriscado" e diz que nem vendendo para todos se paga, sem o percentual', () => {
      montar();
      // 0,5% de 100 cliques = 0,5 pessoa; 1 venda ÷ 0,5 = 200%
      preencherVenda(200, 100);
      preencherAnuncio(1, 0.5);
      digitar('De cada 100 que clicam, quantos chamam você', '0,5');
      digitar('Quanto você quer gastar em anúncio', 100);
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Arriscado')).toBeInTheDocument();
      expect(
        within(estado).getByText(
          'Mesmo vendendo para todas as pessoas que chamarem, o anúncio não se paga. Aumente o preço, reduza o custo ou o gasto com anúncio.',
        ),
      ).toBeInTheDocument();
      expect(estado).not.toHaveTextContent('%');
    });

    it('uma venda só fica no singular', () => {
      montar();
      preencherVenda(300, 60);
      preencherAnuncio(2, 10);
      digitar('Quanto você quer gastar em anúncio', 200);
      expect(within(resultado()).getByText('1 venda')).toBeInTheDocument();
    });

    it('é ao vivo: mudar o orçamento muda o resultado sem apertar nada', () => {
      montar();
      preencherOrcamento(600, 6);
      expect(within(resultado()).getByText('3 vendas')).toBeInTheDocument();
      digitar('Quanto você quer gastar em anúncio', 1200);
      expect(within(resultado()).getByText('5 vendas')).toBeInTheDocument();
    });

    it('aceita vírgula pt-BR e arredonda pelo valor exato, sem ruído de ponto flutuante', () => {
      montar();
      // 500 ÷ 1,5 × 0,03 = 10 pessoas (em ponto flutuante: 9,999…)
      preencherVenda(300, 60);
      preencherAnuncio(1.5, 3);
      digitar('Quanto custa cada clique', '1,50');
      digitar('Quanto você quer gastar em anúncio', '500');
      expect(valorDe('Pessoas que chamam')).toHaveTextContent('cerca de 10');
    });

    it('a conta passo a passo mostra os valores da conta', () => {
      montar();
      preencherOrcamento(600, 6);
      const detalhes = within(resultado()).getByText('Ver a conta passo a passo').closest('details') as HTMLDetailsElement;
      expect(detalhes.open).toBe(false);
      expect(detalhes).toHaveTextContent('R$ 240,00');
      expect(detalhes).toHaveTextContent('2,5');
      expect(detalhes).toHaveTextContent('13,9%');
    });
  });

  describe('cenário de clientes (RF-F3a-07, CA-F3-02)', () => {
    it('300 / 60 / 2 / 6% / 5 clientes / 30%: investimento, cliques, pessoas, CAC e "Se paga"', () => {
      montar();
      preencherClientes(5, 30);

      expect(within(resultado()).getByText('Para conseguir 5 clientes, invista cerca de')).toBeInTheDocument();
      expect(
        within(resultado()).getByText('Para conseguir 5 clientes, invista cerca de').nextElementSibling,
      ).toHaveTextContent('R$ 555,56');
      expect(valorDe('Cliques')).toHaveTextContent('cerca de 277');
      expect(valorDe('Pessoas que chamam')).toHaveTextContent('cerca de 16');
      expect(valorDe('Cada cliente novo custa')).toHaveTextContent('R$ 111,11');

      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Se paga')).toBeInTheDocument();
      expect(
        within(estado).getByText('O anúncio volta R$ 644,44 de lucro além do que custou (retorno de 116,0%).'),
      ).toBeInTheDocument();
    });

    it('retorno negativo: "Prejuízo" com a frase do prejuízo', () => {
      montar();
      // sobra 30; investimento 555,56 (5 clientes); sobra total 150 → prejuízo de 405,56
      preencherVenda(100, 70);
      preencherAnuncio(2, 6);
      escolher(QUERO_CLIENTES);
      digitar('Quantos clientes novos você quer', 5);
      digitar('De cada 10 que chamam, quantos compram', 30);
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Prejuízo')).toBeInTheDocument();
      expect(
        within(estado).getByText(
          'Cada cliente custa mais do que sobra da venda. O anúncio dá prejuízo de R$ 405,56.',
        ),
      ).toBeInTheDocument();
    });

    it('retorno exatamente 0 é "Se paga"', () => {
      montar();
      // sobra 40; 5 × 2 ÷ (0,10 × 0,50) = 200 = 5 × 40
      preencherVenda(100, 60);
      preencherAnuncio(2, 10);
      escolher(QUERO_CLIENTES);
      digitar('Quantos clientes novos você quer', 5);
      digitar('De cada 10 que chamam, quantos compram', 50);
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Se paga')).toBeInTheDocument();
      expect(
        within(estado).getByText('O anúncio volta R$ 0,00 de lucro além do que custou (retorno de 0,0%).'),
      ).toBeInTheDocument();
    });

    it('lucro de ruído (-5,7e-14) não aparece como "-0,0%" nem como prejuízo', () => {
      montar();
      preencherVenda(100, 0);
      digitar('Quanto custa cada clique', '0,7');
      digitar('De cada 100 que clicam, quantos chamam você', 1);
      escolher(QUERO_CLIENTES);
      digitar('Quantos clientes novos você quer', 5);
      digitar('De cada 10 que chamam, quantos compram', 70);
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Se paga')).toBeInTheDocument();
      expect(resultado()).not.toHaveTextContent('-0,0');
      expect(within(estado).getByText(/retorno de 0,0%/)).toBeInTheDocument();
    });

    it('"2,5" clientes vira 2, sem fração', () => {
      montar();
      preencherClientes(2.5, 30);
      expect(within(resultado()).getByText('Para conseguir 2 clientes, invista cerca de')).toBeInTheDocument();
    });

    it('um cliente fica no singular', () => {
      montar();
      preencherClientes(1, 30);
      expect(within(resultado()).getByText('Para conseguir 1 cliente, invista cerca de')).toBeInTheDocument();
    });

    it('a conta passo a passo mostra os valores da conta', () => {
      montar();
      preencherClientes(5, 30);
      const detalhes = within(resultado()).getByText('Ver a conta passo a passo').closest('details') as HTMLDetailsElement;
      expect(detalhes).toHaveTextContent('R$ 555,56');
      expect(detalhes).toHaveTextContent('R$ 111,11');
      expect(detalhes).toHaveTextContent('R$ 1.200,00');
      expect(detalhes).toHaveTextContent('R$ 644,44');
    });
  });

  describe('estados sem número (RF-F3a-08, CA-F3-03)', () => {
    const FRASE = 'Preencha o preço, o clique e quantos chamam para ver a conta.';

    it('campos vazios: "Falta pouco", sem NaN nem "R$ 0,00" no resultado', () => {
      montar();
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Falta pouco')).toBeInTheDocument();
      expect(within(estado).getByText(FRASE)).toBeInTheDocument();
      expect(resultado()).not.toHaveTextContent('R$ 0,00');
      expect(document.body.textContent).not.toContain('NaN');
      expect(document.body.textContent).not.toContain('Infinity');
    });

    it('vale também no caminho dos clientes', () => {
      montar();
      escolher(QUERO_CLIENTES);
      expect(within(resultado()).getByText('Falta pouco')).toBeInTheDocument();
      expect(resultado()).not.toHaveTextContent('R$ 0,00');
      expect(document.body.textContent).not.toContain('NaN');
    });

    it.each([
      ['sem o preço', () => { preencherAnuncio(); digitar('Quanto você quer gastar em anúncio', 600); }],
      ['sem o clique', () => { preencherVenda(); digitar('De cada 100 que clicam, quantos chamam você', 6); digitar('Quanto você quer gastar em anúncio', 600); }],
      ['sem quantos chamam', () => { preencherVenda(); digitar('Quanto custa cada clique', 2); digitar('Quanto você quer gastar em anúncio', 600); }],
    ])('%s: "Falta pouco" com a frase dos campos básicos', (_nome, preencher) => {
      montar();
      preencher();
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Falta pouco')).toBeInTheDocument();
      expect(within(estado).getByText(FRASE)).toBeInTheDocument();
      expect(resultado()).not.toHaveTextContent('R$ 0,00');
    });

    it('sem o orçamento: "Falta pouco" e sem número', () => {
      montar();
      preencherVenda();
      preencherAnuncio();
      expect(within(resultado()).getByText('Falta pouco')).toBeInTheDocument();
      expect(within(resultado()).getByText('Preencha quanto você quer gastar em anúncio para ver a conta.')).toBeInTheDocument();
      expect(within(resultado()).queryByText(/venda/)).not.toBeInTheDocument();
    });

    it('sem a meta ou sem quantos compram: "Falta pouco"', () => {
      montar();
      preencherVenda();
      preencherAnuncio();
      escolher(QUERO_CLIENTES);
      digitar('Quantos clientes novos você quer', 5);
      expect(within(resultado()).getByText('Falta pouco')).toBeInTheDocument();
      expect(resultado()).not.toHaveTextContent('R$ 0,00');
      digitar('De cada 10 que chamam, quantos compram', 30);
      expect(within(resultado()).getByText('Se paga')).toBeInTheDocument();
    });

    it('custo maior ou igual ao preço: erro no campo do custo e "Falta pouco"', () => {
      montar();
      preencherOrcamento(600, 6);
      digitar('Quanto custa entregar essa venda', 300);
      const campo = screen.getByLabelText('Quanto custa entregar essa venda');
      expect(campo).toBeInvalid();
      expect(campo).toHaveAccessibleDescription(/O gasto por venda é maior que o preço\. Confira os dois valores\./);
      expect(within(resultado()).getByText('Falta pouco')).toBeInTheDocument();
      expect(within(resultado()).queryByText('Dá para pagar')).not.toBeInTheDocument();
      expect(resultado()).not.toHaveTextContent('R$ 0,00');
      expect(screen.getByText('Sobra por venda, antes do anúncio').nextElementSibling).not.toHaveTextContent('R$');

      digitar('Quanto custa entregar essa venda', 60);
      expect(screen.getByLabelText('Quanto custa entregar essa venda')).toBeValid();
      expect(within(resultado()).getByText('3 vendas')).toBeInTheDocument();
    });

    it('custo maior ou igual ao preço: a frase da falta aparece no resultado', () => {
      montar();
      preencherOrcamento(600, 6);
      digitar('Quanto custa entregar essa venda', 300);
      const estado = within(resultado()).getByRole('status');
      expect(within(estado).getByText('Falta pouco')).toBeInTheDocument();
      expect(within(estado).getByText('Corrija o preço e o custo da venda para ver a conta.')).toBeInTheDocument();
    });

    it('custo negativo não vale: o campo volta a 0,00 e a sobra é o preço inteiro', () => {
      montar();
      digitar('Preço médio de cada venda', 300);
      digitar('Quanto custa entregar essa venda', '-50');
      expect(screen.getByLabelText('Quanto custa entregar essa venda')).toHaveValue('0,00');
      expect(screen.getByText('Sobra por venda, antes do anúncio').nextElementSibling).toHaveTextContent('R$ 300,00');
      expect(screen.getByLabelText('Quanto custa entregar essa venda')).toBeValid();
    });

    it('custo zero com preço preenchido não dá erro', () => {
      montar();
      digitar('Preço médio de cada venda', 300);
      expect(screen.getByLabelText('Quanto custa entregar essa venda')).toBeValid();
    });
  });

  describe('barra do resultado (RF-F3a-10)', () => {
    const barra = () => screen.getByText('Ver resultado').closest('div')!.parentElement as HTMLElement;

    it('orçamento: "Vendas para se pagar" e "N vendas"; sem número: "Falta pouco"', () => {
      montar();
      expect(within(barra()).getByText('Vendas para se pagar')).toBeInTheDocument();
      expect(within(barra()).getByText('Falta pouco')).toBeInTheDocument();
      preencherOrcamento(600, 6);
      expect(within(barra()).getByText('3 vendas')).toBeInTheDocument();
    });

    it('clientes sem número: "Investimento" e "Falta pouco"', () => {
      montar();
      escolher(QUERO_CLIENTES);
      expect(within(barra()).getByText('Investimento')).toBeInTheDocument();
      expect(within(barra()).getByText('Falta pouco')).toBeInTheDocument();
      expect(barra()).not.toHaveTextContent('R$');
    });

    it('clientes: "Investimento" e "R$ O"', () => {
      montar();
      preencherClientes(5, 30);
      expect(within(barra()).getByText('Investimento')).toBeInTheDocument();
      expect(within(barra()).getByText('R$ 555,56')).toBeInTheDocument();
    });
  });

  describe('começar de novo (RF-F3a-09)', () => {
    it('pede confirmação na tela e só então zera tudo, voltando ao caminho padrão', () => {
      montar();
      preencherClientes(5, 30);
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Começar de novo' }));
      });
      expect(screen.getByLabelText('Preço médio de cada venda')).toHaveValue('300,00');
      expect(screen.getByText('Apagar tudo o que você preencheu?')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      });
      expect(screen.queryByText('Apagar tudo o que você preencheu?')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Preço médio de cada venda')).toHaveValue('300,00');

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Começar de novo' }));
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
      });
      expect(screen.getByRole('radio', { name: JA_SEI })).toBeChecked();
      expect(screen.getByLabelText('Preço médio de cada venda')).toHaveValue('0,00');
      expect(screen.getByLabelText('Quanto você quer gastar em anúncio')).toHaveValue('0,00');
      escolher(QUERO_CLIENTES);
      expect(screen.getByLabelText('Quantos clientes novos você quer')).toHaveValue('0');
      expect(within(resultado()).getByText('Falta pouco')).toBeInTheDocument();
    });
  });

  describe('guia, convite e privacidade (RF-F3a-11, 12)', () => {
    it('o guia vem recolhido em "Como funciona esta conta", depois da ferramenta e antes do convite', () => {
      montar(<p>GUIA-TESTE</p>);
      const detalhes = screen.getByText('Como funciona esta conta').closest('details') as HTMLDetailsElement;
      expect(detalhes.open).toBe(false);
      expect(detalhes).toContainElement(screen.getByText('GUIA-TESTE'));
      const depois = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      expect(depois(resultado(), detalhes)).toBe(true);
      expect(depois(detalhes, screen.getByText('Vai anunciar?', { exact: false }))).toBe(true);
      expect(screen.getByRole('main')).toContainElement(detalhes);
    });

    it('não mostra "Como funciona esta conta" sem guia', () => {
      montar();
      expect(screen.queryByText('Como funciona esta conta')).not.toBeInTheDocument();
    });

    it('tem o convite com UTM', () => {
      montar();
      expect(screen.getByText('Vai anunciar?', { exact: false })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Mande os cliques para uma página com o seu WhatsApp →' })).toHaveAttribute(
        'href',
        'https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=vale-anunciar',
      );
    });

    it('não guarda nada no aparelho', () => {
      montar();
      preencherClientes(5, 30);
      escolher(JA_SEI);
      preencherOrcamento(600, 6);
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Começar de novo' }));
      });
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
      });
      expect(setItem).not.toHaveBeenCalled();
      // O mock de localStorage do setup não tem `length`; por isso o que foi guardado
      // se lê pelas chaves próprias que não são métodos (pega também `localStorage.x = …`)
      expect(guardado(window.localStorage)).toEqual([]);
      expect(guardado(window.sessionStorage)).toEqual([]);
      expect(window.sessionStorage.length).toBe(0);
    });
  });
});

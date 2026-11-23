import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PrecificacaoView from '../PrecificacaoView';

type Callback = (entradas: Array<{ isIntersecting: boolean }>) => void;

// IntersectionObserver simulado: o teste diz se o cartão de resultado está visível
let observadores: Callback[] = [];

class IntersectionObserverFalso {
  constructor(callback: Callback) {
    observadores.push(callback);
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = () => [];
}

const cartaoVisivel = (visivel: boolean) => {
  act(() => {
    observadores.forEach((cb) => cb([{ isIntersecting: visivel }]));
  });
};

const CHAVE = 'pricing_data';
const OUTRAS_CONTAS = '+ Outras contas (internet, contador, programas, funcionários, DAS)';
const DAS = 'Guia do MEI (DAS) e outras contas';

// Exemplo do guia (CA-F2-04): contas fixas 4.400, 22 dias, 8 h, 20% parado,
// serviço de 3 h, material 40, transporte 20, imposto 6%
const EXEMPLO = {
  custosFixos: { aluguel: 800, energia: 150, internet: 100, contador: 250, softwares: 100, equipe: 0, proLabore: 3000 },
  capacidade: { diasTrabalhados: 22, horasDiarias: 8, percentualOciosidade: 20 },
  servico: {
    nome: '',
    horasEstimadas: 3,
    materiaisDiretos: 40,
    deslocamento: 20,
    impostosPercentual: 6,
    precoDesejado: 0,
  },
};

const comPreco = (precoDesejado: number) => ({
  ...EXEMPLO,
  servico: { ...EXEMPLO.servico, precoDesejado },
});

const guardar = (dados: unknown) => window.localStorage.setItem(CHAVE, JSON.stringify(dados));
const guardado = () => JSON.parse(window.localStorage.getItem(CHAVE) as string);

const montar = (children?: React.ReactNode) => {
  const resultado = render(<PrecificacaoView>{children}</PrecificacaoView>);
  // O carregamento do localStorage agenda um timer
  act(() => {
    vi.runAllTimers();
  });
  return resultado;
};

const digitar = (rotulo: string, valor: string | number) => {
  act(() => {
    fireEvent.change(screen.getByLabelText(rotulo), { target: { value: String(valor) } });
  });
};

const cartao = () => screen.getByRole('region', { name: 'Seu resultado' });

const outrasContas = () => screen.getByText(OUTRAS_CONTAS).closest('details') as HTMLDetailsElement;

// Valor que fica junto de um rótulo, ex.: a linha "Total por mês … R$ 4.400,00"
const valorDe = (rotulo: string) => screen.getByText(rotulo).nextElementSibling as HTMLElement;

describe('Quanto cobrar pelo serviço', () => {
  beforeEach(() => {
    window.localStorage.clear();
    observadores = [];
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('estrutura e textos (RF-F2-14 a 17)', () => {
    it('tem o título, a frase e os blocos, sem o modal de ajuda nem o botão Ajuda', () => {
      montar();
      expect(screen.getByRole('heading', { level: 1, name: 'Quanto cobrar pelo serviço' })).toBeInTheDocument();
      expect(
        screen.getByText('Responda três blocos e veja o menor preço que não dá prejuízo. Leva uns 3 minutos.'),
      ).toBeInTheDocument();

      expect(screen.getByRole('heading', { level: 2, name: 'Contas fixas do mês' })).toBeInTheDocument();
      expect(screen.getByText('O que você paga todo mês, vendendo ou não.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Seu tempo de trabalho' })).toBeInTheDocument();
      expect(screen.getByText('Quantas horas você consegue vender no mês.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Sobre o serviço' })).toBeInTheDocument();
      expect(screen.getByText('Um serviço de cada vez. Ex.: manutenção de ar-condicionado.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Seu resultado' })).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: 'Ajuda' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Entendi, Prosseguir/ })).not.toBeInTheDocument();
      expect(screen.queryByText('Precificação e Margem')).not.toBeInTheDocument();
      expect(screen.queryByText(/Garanta a saúde financeira/)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /CONHECER UNUM PEOPLE/i })).not.toBeInTheDocument();
    });

    it('usa o cabeçalho e o rodapé novos', () => {
      montar();
      expect(screen.getByRole('link', { name: 'Todas as ferramentas' })).toHaveAttribute('href', '/');
      expect(screen.getByText('Seus dados ficam neste aparelho.')).toBeInTheDocument();
    });

    it('não tem anúncio', () => {
      const { container } = montar();
      expect(container.querySelectorAll('ins')).toHaveLength(0);
      expect(screen.queryByText(/AdSense|Publicidade/i)).not.toBeInTheDocument();
    });
  });

  describe('campos e ajudas (CA-F2-03)', () => {
    it.each([
      'Aluguel e condomínio',
      'Luz e água',
      'Quanto você tira para viver',
      'Internet e telefone',
      'Contador',
      'Programas e assinaturas',
      'Salários de funcionários',
      'Guia do MEI (DAS) e outras contas',
      'Dias por mês',
      'Horas por dia',
      'Tempo sem vender',
      'Nome do serviço',
      'Horas que leva',
      'Material',
      'Transporte e extras',
      'Imposto na nota',
      'Quanto você quer cobrar?',
    ])('encontra o campo "%s" pelo rótulo', (rotulo) => {
      montar();
      expect(screen.getByLabelText(rotulo)).toBeInTheDocument();
    });

    it.each([
      ['Quanto você tira para viver', 'Seu salário (pró-labore). Sem ele, o preço só paga as contas e você trabalha de graça.'],
      ['Tempo sem vender', 'Orçamento, deslocamento, espera, burocracia. Se não souber, deixe 20%.'],
      ['Guia do MEI (DAS) e outras contas', 'A guia mensal do MEI e qualquer conta fixa que não esteja acima.'],
      [
        'Imposto na nota',
        'MEI: deixe 0% e coloque a guia mensal (DAS) em "Guia do MEI (DAS) e outras contas".',
      ],
    ])('o campo "%s" liga a ajuda por aria-describedby', (rotulo, ajuda) => {
      montar();
      const campo = screen.getByLabelText(rotulo);
      const alvo = document.getElementById(campo.getAttribute('aria-describedby') as string);
      expect(alvo).toHaveTextContent(ajuda);
      expect(campo).toHaveAccessibleDescription(ajuda);
    });

    it('o recolhível "Outras contas" guarda os cinco campos e só eles, com o DAS depois dos salários', () => {
      montar();
      const detalhes = outrasContas();
      ['Internet e telefone', 'Contador', 'Programas e assinaturas', 'Salários de funcionários', DAS].forEach((r) =>
        expect(within(detalhes).getByLabelText(r)).toBeInTheDocument(),
      );
      const ordem = within(detalhes)
        .getAllByRole('textbox')
        .map((c) => (c as HTMLInputElement).labels?.[0]?.textContent);
      expect(ordem.slice(-2)).toEqual(['Salários de funcionários', DAS]);
      expect(within(detalhes).queryByLabelText('Aluguel e condomínio')).not.toBeInTheDocument();
      expect(within(detalhes).queryByLabelText('Quanto você tira para viver')).not.toBeInTheDocument();
    });

    it('os campos de reais têm o prefixo R$ e os de porcentagem, o sufixo %', () => {
      montar();
      expect(screen.getByLabelText('Tempo sem vender').parentElement).toHaveTextContent('%');
      expect(screen.getByLabelText('Imposto na nota').parentElement).toHaveTextContent('%');
      ['Aluguel e condomínio', 'Material', 'Quanto você quer cobrar?'].forEach((r) =>
        expect(screen.getByLabelText(r).parentElement).toHaveTextContent('R$'),
      );
    });
  });

  describe('exemplo do guia (CA-F2-04)', () => {
    it('com os números do exemplo, mostra total, horas, conta por hora e preço mínimo', () => {
      guardar(EXEMPLO);
      montar();
      expect(valorDe('Total por mês')).toHaveTextContent('R$ 4.400,00');
      expect(valorDe('Horas que você vende')).toHaveTextContent('140,8 h');
      expect(valorDe('Conta fixa por hora')).toHaveTextContent('R$ 31,25');
      expect(screen.getByText('Preço mínimo deste serviço').parentElement).toHaveTextContent('R$ 163,56');
      expect(screen.getByText('Abaixo disso, cada venda dá prejuízo.')).toBeInTheDocument();
      // sem preço digitado: nenhum selo de margem
      expect(within(cartao()).queryByText('Saudável')).not.toBeInTheDocument();
      expect(within(cartao()).queryByText('Sobra pouco')).not.toBeInTheDocument();
      expect(within(cartao()).queryByText('Prejuízo')).not.toBeInTheDocument();
      expect(within(cartao()).queryByText('Sobra no bolso')).not.toBeInTheDocument();
    });

    it('digitando as entradas do exemplo, chega nos mesmos números', () => {
      montar();
      digitar('Aluguel e condomínio', 800);
      digitar('Luz e água', 150);
      digitar('Internet e telefone', 100);
      digitar('Contador', 250);
      digitar('Programas e assinaturas', 100);
      digitar('Quanto você tira para viver', 3000);
      digitar('Horas que leva', 3);
      digitar('Material', 40);
      digitar('Transporte e extras', 20);
      digitar('Imposto na nota', 6);
      expect(valorDe('Total por mês')).toHaveTextContent('R$ 4.400,00');
      expect(valorDe('Horas que você vende')).toHaveTextContent('140,8 h');
      expect(valorDe('Conta fixa por hora')).toHaveTextContent('R$ 31,25');
      expect(screen.getByText('Preço mínimo deste serviço').parentElement).toHaveTextContent('R$ 163,56');
    });

    it('preço 250: Saudável, sobra R$ 81,25 e "sobram R$ 32,50"', () => {
      guardar(comPreco(250));
      montar();
      const status = within(cartao()).getByRole('status');
      expect(within(status).getByText('Saudável')).toBeInTheDocument();
      expect(within(status).getByText('De cada R$ 100, sobram R$ 32,50.')).toBeInTheDocument();
      expect(within(status).getByText('Sobra no bolso').nextElementSibling).toHaveTextContent('R$ 81,25');
    });

    it('preço 150: Prejuízo e "perde R$ 12,75"', () => {
      guardar(comPreco(150));
      montar();
      const status = within(cartao()).getByRole('status');
      expect(within(status).getByText('Prejuízo')).toBeInTheDocument();
      expect(
        within(status).getByText('Esse preço está abaixo do mínimo. Você perde R$ 12,75 em cada venda.'),
      ).toBeInTheDocument();
      expect(within(status).queryByText('Saudável')).not.toBeInTheDocument();
      expect(within(status).queryByText('Sobra no bolso')).not.toBeInTheDocument();
    });

    it('digitar o preço no campo do resultado troca o estado na hora', () => {
      guardar(EXEMPLO);
      montar();
      digitar('Quanto você quer cobrar?', 250);
      expect(within(cartao()).getByText('Saudável')).toBeInTheDocument();
      digitar('Quanto você quer cobrar?', 150);
      expect(within(cartao()).getByText('Prejuízo')).toBeInTheDocument();
    });
  });

  describe('estados (CA-F2-05, 06)', () => {
    it('margem entre 0 e 20%: "Sobra pouco" com a dica', () => {
      // custo do serviço 153,75; preço 200 → lucro 34,25 → margem 17,125%
      guardar(comPreco(200));
      montar();
      const status = within(cartao()).getByRole('status');
      expect(within(status).getByText('Sobra pouco')).toBeInTheDocument();
      expect(
        within(status).getByText('De cada R$ 100, sobram R$ 17,13. Tente cobrar um pouco mais ou gastar menos.'),
      ).toBeInTheDocument();
      expect(within(status).getByText('Sobra no bolso').nextElementSibling).toHaveTextContent('R$ 34,25');
    });

    it('margem de exatamente 20% já é "Saudável"', () => {
      // sem contas fixas nem imposto: custo = material 80; preço 100 → margem 20%
      montar();
      digitar('Horas que leva', 1);
      digitar('Material', 80);
      digitar('Quanto você quer cobrar?', 100);
      const status = within(cartao()).getByRole('status');
      expect(within(status).getByText('Saudável')).toBeInTheDocument();
      expect(within(status).getByText('De cada R$ 100, sobram R$ 20,00.')).toBeInTheDocument();
    });

    it('margem de exatamente 0% é "Sobra pouco"', () => {
      montar();
      digitar('Horas que leva', 1);
      digitar('Material', 100);
      digitar('Quanto você quer cobrar?', 100);
      expect(within(cartao()).getByText('Sobra pouco')).toBeInTheDocument();
      expect(within(cartao()).queryByText('Prejuízo')).not.toBeInTheDocument();
    });

    it('sem horas do serviço: "Falta pouco" e nenhum "R$ 0,00" no cartão', () => {
      montar();
      const status = within(cartao()).getByRole('status');
      expect(within(status).getByText('Falta pouco')).toBeInTheDocument();
      expect(within(status).getByText('Preencha as horas do serviço para ver o preço mínimo.')).toBeInTheDocument();
      expect(cartao()).not.toHaveTextContent('R$ 0,00');
      expect(within(cartao()).queryByText('Preço mínimo deste serviço')).not.toBeInTheDocument();
    });

    it('sem horas vendáveis: "Falta pouco" também', () => {
      guardar({ ...EXEMPLO, capacidade: { ...EXEMPLO.capacidade, diasTrabalhados: 0 } });
      montar();
      expect(within(cartao()).getByText('Falta pouco')).toBeInTheDocument();
      expect(cartao()).not.toHaveTextContent('R$ 0,00');
    });

    it('com preço mas sem horas do serviço, continua "Falta pouco", sem selo de margem', () => {
      guardar({ ...comPreco(250), servico: { ...comPreco(250).servico, horasEstimadas: 0 } });
      montar();
      expect(within(cartao()).getByText('Falta pouco')).toBeInTheDocument();
      expect(within(cartao()).queryByText('Saudável')).not.toBeInTheDocument();
      expect(within(cartao()).queryByText('Prejuízo')).not.toBeInTheDocument();
    });
  });

  describe('vírgula, recolhível e dados antigos (CA-F2-07, 08, 12)', () => {
    it('"2,5" em "Horas que leva" grava 2,5', () => {
      montar();
      digitar('Horas que leva', '2,5');
      expect(guardado().servico.horasEstimadas).toBe(2.5);
    });

    it('aceita vírgula também nos reais ("1.234,56")', () => {
      montar();
      digitar('Aluguel e condomínio', '1.234,56');
      expect(guardado().custosFixos.aluguel).toBe(1234.56);
      expect(valorDe('Total por mês')).toHaveTextContent('R$ 1.234,56');
    });

    it('com "Internet" maior que zero salvo, "Outras contas" já abre aberto', () => {
      guardar({ ...EXEMPLO, custosFixos: { ...EXEMPLO.custosFixos, contador: 0, softwares: 0 } });
      montar();
      expect(outrasContas().open).toBe(true);
    });

    it.each(['contador', 'softwares', 'equipe', 'outras'])('abre sozinho se só "%s" estiver preenchido', (chave) => {
      guardar({
        ...EXEMPLO,
        custosFixos: { aluguel: 0, energia: 0, internet: 0, contador: 0, softwares: 0, equipe: 0, proLabore: 0, [chave]: 10 },
      });
      montar();
      expect(outrasContas().open).toBe(true);
    });

    it('com só o DAS preenchido, "Outras contas" abre sozinho (RF-F4-14)', () => {
      guardar({ ...EXEMPLO, custosFixos: { ...EXEMPLO.custosFixos, internet: 0, contador: 0, softwares: 0, outras: 66 } });
      montar();
      expect(outrasContas().open).toBe(true);
      expect(screen.getByLabelText(DAS)).toHaveValue('66,00');
    });

    it('com os quatro em zero, abre fechado (mesmo com aluguel e pró-labore)', () => {
      guardar({
        ...EXEMPLO,
        custosFixos: { aluguel: 800, energia: 150, internet: 0, contador: 0, softwares: 0, equipe: 0, proLabore: 3000 },
      });
      montar();
      expect(outrasContas().open).toBe(false);
    });

    it('sem nada salvo, abre fechado', () => {
      montar();
      expect(outrasContas().open).toBe(false);
    });

    it('não fecha na cara de quem está digitando: apagar o único valor mantém aberto', () => {
      guardar({ ...EXEMPLO, custosFixos: { ...EXEMPLO.custosFixos, internet: 100, contador: 0, softwares: 0 } });
      montar();
      expect(outrasContas().open).toBe(true);
      digitar('Internet e telefone', 0);
      expect(outrasContas().open).toBe(true);
    });

    it('um pricing_data salvo no formato atual abre preenchido, sem erro', () => {
      const erro = vi.spyOn(console, 'error').mockImplementation(() => {});
      guardar(comPreco(250));
      montar();
      expect(screen.getByLabelText('Aluguel e condomínio')).toHaveValue('800,00');
      expect(screen.getByLabelText('Quanto você tira para viver')).toHaveValue('3.000,00');
      expect(screen.getByLabelText('Dias por mês')).toHaveValue('22');
      expect(screen.getByLabelText('Horas que leva')).toHaveValue('3');
      expect(screen.getByLabelText('Imposto na nota')).toHaveValue('6');
      expect(screen.getByLabelText('Quanto você quer cobrar?')).toHaveValue('250,00');
      expect(erro).not.toHaveBeenCalled();
      erro.mockRestore();
    });

    it('guarda no mesmo formato de antes (chave e campos)', () => {
      montar();
      digitar('Aluguel e condomínio', 500);
      expect(Object.keys(guardado())).toEqual(['custosFixos', 'capacidade', 'servico']);
      expect(guardado().custosFixos.aluguel).toBe(500);
    });
  });

  describe('a conta passo a passo (RF-F2-20)', () => {
    it('com preço digitado, mostra as cinco linhas com os valores', () => {
      guardar(comPreco(250));
      montar();
      const detalhes = within(cartao()).getByText('Ver a conta passo a passo').closest('details') as HTMLDetailsElement;
      expect(detalhes.open).toBe(false);
      expect(within(detalhes).getByText('Conta fixa por hora × horas do serviço').nextElementSibling).toHaveTextContent('R$ 93,75');
      expect(within(detalhes).getByText('+ material e transporte').nextElementSibling).toHaveTextContent('R$ 60,00');
      expect(within(detalhes).getByText('= custo do serviço').nextElementSibling).toHaveTextContent('R$ 153,75');
      expect(within(detalhes).getByText('÷ (1 − imposto) = preço mínimo').nextElementSibling).toHaveTextContent('R$ 163,56');
      expect(within(detalhes).getByText('preço − imposto − custo = sobra no bolso').nextElementSibling).toHaveTextContent('R$ 81,25');
    });

    it('sem preço digitado, não mostra a linha da sobra', () => {
      guardar(EXEMPLO);
      montar();
      const detalhes = within(cartao()).getByText('Ver a conta passo a passo').closest('details') as HTMLElement;
      expect(within(detalhes).getByText('= custo do serviço')).toBeInTheDocument();
      expect(within(detalhes).queryByText('preço − imposto − custo = sobra no bolso')).not.toBeInTheDocument();
    });
  });

  describe('começar de novo (CA-F2-09)', () => {
    it('pede confirmação na tela; "Cancelar" mantém os valores', () => {
      guardar(comPreco(250));
      montar();
      expect(screen.queryByText('Apagar tudo o que você preencheu?')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Começar de novo' }));
      expect(screen.getByText('Apagar tudo o que você preencheu?')).toBeInTheDocument();
      expect(screen.getByLabelText('Aluguel e condomínio')).toHaveValue('800,00');

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.queryByText('Apagar tudo o que você preencheu?')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Começar de novo' })).toBeInTheDocument();
      expect(screen.getByLabelText('Aluguel e condomínio')).toHaveValue('800,00');
      expect(screen.getByLabelText('Quanto você quer cobrar?')).toHaveValue('250,00');
      expect(guardado().custosFixos.aluguel).toBe(800);
    });

    it('"Apagar" volta ao padrão do simulador e regrava o armazenamento', () => {
      guardar({
        ...comPreco(250),
        servico: { ...comPreco(250).servico, nome: 'Instalação' },
        capacidade: { diasTrabalhados: 20, horasDiarias: 6, percentualOciosidade: 30 },
      });
      montar();
      fireEvent.click(screen.getByRole('button', { name: 'Começar de novo' }));
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
      });

      expect(screen.queryByText('Apagar tudo o que você preencheu?')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Aluguel e condomínio')).toHaveValue('0,00');
      expect(screen.getByLabelText('Quanto você tira para viver')).toHaveValue('0,00');
      expect(screen.getByLabelText('Dias por mês')).toHaveValue('22');
      expect(screen.getByLabelText('Horas por dia')).toHaveValue('8');
      expect(screen.getByLabelText('Tempo sem vender')).toHaveValue('20');
      expect(screen.getByLabelText('Nome do serviço')).toHaveValue('');
      expect(screen.getByLabelText('Horas que leva')).toHaveValue('0');
      expect(screen.getByLabelText('Imposto na nota')).toHaveValue('0');
      expect(within(cartao()).getByText('Falta pouco')).toBeInTheDocument();
      expect(guardado().capacidade).toEqual({ diasTrabalhados: 22, horasDiarias: 8, percentualOciosidade: 20 });
      expect(guardado().servico.nome).toBe('');
    });
  });

  describe('barra do resultado (CA-F2-10)', () => {
    beforeEach(() => {
      vi.stubGlobal('IntersectionObserver', IntersectionObserverFalso);
    });

    it('mostra "Preço mínimo" e o mesmo valor do cartão', () => {
      guardar(EXEMPLO);
      montar();
      const barra = screen.getByRole('button', { name: 'Ver resultado' }).parentElement as HTMLElement;
      expect(within(barra).getByText('Preço mínimo')).toBeInTheDocument();
      expect(within(barra).getByText('R$ 163,56')).toBeInTheDocument();
      expect(screen.getByText('Preço mínimo deste serviço').parentElement).toHaveTextContent('R$ 163,56');
    });

    it('sem horas do serviço, a barra diz "Falta pouco"', () => {
      montar();
      const barra = screen.getByRole('button', { name: 'Ver resultado' }).parentElement as HTMLElement;
      expect(within(barra).getByText('Falta pouco')).toBeInTheDocument();
      expect(barra).not.toHaveTextContent('R$');
    });

    it('acompanha o preço mínimo quando os dados mudam', () => {
      guardar(EXEMPLO);
      montar();
      digitar('Horas que leva', 4);
      // 31,25 × 4 + 60 = 185 → 185 / 0,94 = 196,81
      const barra = screen.getByRole('button', { name: 'Ver resultado' }).parentElement as HTMLElement;
      expect(within(barra).getByText('R$ 196,81')).toBeInTheDocument();
    });

    it('"Ver resultado" rola até o cartão do resultado', () => {
      guardar(EXEMPLO);
      montar();
      const rolar = vi.fn();
      cartao().scrollIntoView = rolar;
      fireEvent.click(screen.getByRole('button', { name: 'Ver resultado' }));
      expect(rolar).toHaveBeenCalledTimes(1);
    });

    it('com o cartão visível, a barra some; ao sair da tela, volta', () => {
      guardar(EXEMPLO);
      montar();
      cartaoVisivel(true);
      expect(screen.queryByRole('button', { name: 'Ver resultado' })).not.toBeInTheDocument();
      cartaoVisivel(false);
      expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeInTheDocument();
    });
  });

  describe('guia e convite (CA-F2-11, RF-F2-23, 24)', () => {
    it('o guia fica dentro do recolhível "Como funciona esta conta", fechado, e continua no HTML', () => {
      montar(<p>GUIA-TESTE</p>);
      const detalhes = screen.getByText('Como funciona esta conta').closest('details') as HTMLDetailsElement;
      expect(detalhes.open).toBe(false);
      expect(within(detalhes).getByText('GUIA-TESTE')).toBeInTheDocument();
    });

    it('o guia aparece mesmo antes de carregar os dados', () => {
      render(
        <PrecificacaoView>
          <p>GUIA-TESTE</p>
        </PrecificacaoView>,
      );
      expect(screen.getByText('GUIA-TESTE')).toBeInTheDocument();
    });

    it('o guia vem depois do cartão de resultado, e o convite depois do guia', () => {
      montar(<p>GUIA-TESTE</p>);
      const depois = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const convite = screen.getByRole('link', { name: 'Mostre numa página com botão de WhatsApp →' });
      expect(depois(cartao(), screen.getByText('GUIA-TESTE'))).toBe(true);
      expect(depois(screen.getByText('GUIA-TESTE'), convite)).toBe(true);
    });

    it('o convite tem a frase e o endereço exatos', () => {
      montar();
      expect(screen.getByText('Já sabe o seu preço?')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Mostre numa página com botão de WhatsApp →' })).toHaveAttribute(
        'href',
        'https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=quanto-cobrar',
      );
    });
  });
});

// Lacuna 1 do Verifier da F2 (23/11/2026): o preço mínimo mostrado é arredondado
// (R$ 163,56; o exato é 163,5638). Quem digita exatamente o mínimo da tela não
// pode ver "Prejuízo — você perde R$ 0,00": o estado segue o valor em centavos.
describe('Quanto cobrar — cobrar exatamente o mínimo mostrado', () => {
  beforeEach(() => {
    window.localStorage.clear();
    observadores = [];
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('R$ 163,56 (o mínimo da tela) não é prejuízo: sobra R$ 0,00 e o estado é "Sobra pouco"', () => {
    guardar(comPreco(163.56));
    montar();
    const resultado = screen.getByRole('heading', { name: 'Seu resultado' }).closest('section') as HTMLElement;
    expect(within(resultado).queryByText('Prejuízo')).toBeNull();
    expect(within(resultado).getByText('Sobra pouco')).toBeInTheDocument();
    expect(resultado.textContent).not.toMatch(/perde R\$ 0,00/);
  });

  it('um centavo abaixo do mínimo (R$ 163,55) continua "Prejuízo"', () => {
    guardar(comPreco(163.55));
    montar();
    const resultado = screen.getByRole('heading', { name: 'Seu resultado' }).closest('section') as HTMLElement;
    expect(within(resultado).getByText('Prejuízo')).toBeInTheDocument();
  });
});

// CA-F4-09 (spec f4-guias, emenda de 23/11/2026): o campo do DAS entra em toda a conta.
// Com R$ 66 de DAS sobre o exemplo: total 4.466,00; conta fixa por hora 4.466 ÷ 140,8 = 31,71875;
// custo do serviço 31,71875 × 3 + 60 = 155,15625; preço mínimo 155,15625 ÷ 0,94 = 165,0598;
// cobrando 250: sobra 250 × 0,94 − 155,15625 = 79,84 (31,94 de cada R$ 100).
describe('Quanto cobrar: guia do MEI (DAS) e outras contas', () => {
  beforeEach(() => {
    window.localStorage.clear();
    observadores = [];
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const comDas = (outras: number, preco = 0) => ({
    ...comPreco(preco),
    custosFixos: { ...EXEMPLO.custosFixos, outras },
  });

  it('com R$ 66 de DAS, o total, a conta fixa por hora e o preço mínimo mudam', () => {
    guardar(comDas(66));
    montar();
    expect(valorDe('Total por mês')).toHaveTextContent('R$ 4.466,00');
    expect(valorDe('Horas que você vende')).toHaveTextContent('140,8 h');
    expect(valorDe('Conta fixa por hora')).toHaveTextContent('R$ 31,72');
    expect(screen.getByText('Preço mínimo deste serviço').parentElement).toHaveTextContent('R$ 165,06');
  });

  it('com R$ 66 de DAS e preço de R$ 250, a sobra e o "de cada R$ 100" mudam', () => {
    guardar(comDas(66, 250));
    montar();
    const status = within(cartao()).getByRole('status');
    expect(within(status).getByText('De cada R$ 100, sobram R$ 31,94.')).toBeInTheDocument();
    expect(within(status).getByText('Sobra no bolso').nextElementSibling).toHaveTextContent('R$ 79,84');
  });

  it('digitar o DAS no campo muda o total e grava "outras" no mesmo pricing_data', () => {
    guardar(EXEMPLO);
    montar();
    digitar(DAS, 66);
    expect(valorDe('Total por mês')).toHaveTextContent('R$ 4.466,00');
    expect(guardado().custosFixos.outras).toBe(66);
    expect(Object.keys(guardado())).toEqual(['custosFixos', 'capacidade', 'servico']);
  });

  it('o exemplo sem DAS continua com os mesmos números (4.400,00; 31,25; 163,56)', () => {
    guardar(EXEMPLO);
    montar();
    expect(screen.getByLabelText(DAS)).toHaveValue('0,00');
    expect(valorDe('Total por mês')).toHaveTextContent('R$ 4.400,00');
    expect(valorDe('Conta fixa por hora')).toHaveTextContent('R$ 31,25');
    expect(screen.getByText('Preço mínimo deste serviço').parentElement).toHaveTextContent('R$ 163,56');
  });

  it('um dado antigo, sem "outras", abre sem erro e sem NaN', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {});
    guardar(EXEMPLO);
    expect(guardado().custosFixos).not.toHaveProperty('outras');
    montar();
    expect(screen.getByLabelText(DAS)).toHaveValue('0,00');
    expect(cartao()).not.toHaveTextContent('NaN');
    expect(erro).not.toHaveBeenCalled();
    erro.mockRestore();
  });
});

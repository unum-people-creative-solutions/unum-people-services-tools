import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PortfolioView from '../PortfolioView';
import { Service } from '../../../types';

const CHAVE = 'portfolio_services';
const FRASE =
  'Responda algumas perguntas sobre cada serviço e veja o que dá lucro e o que dá trabalho demais.';

const servico = (id: string, nome: string, extra: Partial<Service> = {}): Service => ({
  id,
  nome,
  esforco: 50,
  complexidade: 50,
  padronizacao: 50,
  lucratividade: 50,
  ...extra,
});

const guardar = (servicos: Service[]) => window.localStorage.setItem(CHAVE, JSON.stringify(servicos));
const guardados = (): Service[] => JSON.parse(window.localStorage.getItem(CHAVE) ?? '[]');

const montar = (children?: React.ReactNode) => {
  const resultado = render(<PortfolioView>{children}</PortfolioView>);
  // O carregamento do localStorage agenda um timer; uma segunda rodada cobre efeitos em cadeia
  act(() => {
    vi.runAllTimers();
  });
  act(() => {
    vi.runAllTimers();
  });
  return resultado;
};

const vemDepois = (antes: Element, depois: Element) =>
  Boolean(antes.compareDocumentPosition(depois) & Node.DOCUMENT_POSITION_FOLLOWING);

const proximo = () => fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

const cadastrar = (nome: string, simsNoEsforco = 0) => {
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));
  screen
    .getAllByRole('radio', { name: 'Sim' })
    .slice(0, simsNoEsforco)
    .forEach((r) => fireEvent.click(r));
  for (let i = 0; i < 4; i++) proximo();
  fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: nome } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
};

describe('PortfolioView', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  describe('textos da tela (RF-F3b-01, CA-F3-01)', () => {
    it('tem o h1 e a frase da spec e o botão "Adicionar serviço"', () => {
      montar();
      expect(screen.getByRole('heading', { level: 1, name: 'Quais serviços compensam' })).toBeInTheDocument();
      expect(screen.getByText(FRASE)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Adicionar serviço' })).toBeInTheDocument();
    });

    it('não tem mais o botão Ajuda, o modal de ajuda, o "Novo Serviço" nem o cartão "Conheça a Unum People"', () => {
      montar();
      expect(screen.queryByRole('button', { name: 'Ajuda' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Entendi, Prosseguir/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Novo Serviço/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Mapeamento Estratégico/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /CONHECER UNUM PEOPLE/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Priorize o que realmente traz resultado/)).not.toBeInTheDocument();
    });

    it('tem o link de volta e o rodapé da base visual', () => {
      montar();
      expect(screen.getByRole('link', { name: /Todas as ferramentas/ })).toHaveAttribute('href', '/');
      expect(screen.getByRole('navigation', { name: 'Rodapé' })).toBeInTheDocument();
    });

    it('o convite do fim leva ao site com UTM (RF-F3b-10)', () => {
      montar();
      expect(screen.getByText(/Já sabe o que vender mais\?/)).toBeInTheDocument();
      const link = screen.getByRole('link', { name: 'Mostre esses serviços numa página com o seu WhatsApp →' });
      const url = new URL(link.getAttribute('href') as string);
      expect(url.origin + url.pathname).toBe('https://unumpeople.app/');
      expect(url.searchParams.get('utm_source')).toBe('tools');
      expect(url.searchParams.get('utm_medium')).toBe('convite');
      expect(url.searchParams.get('utm_campaign')).toBe('servicos-compensam');
    });
  });

  describe('sem serviços (RF-F3b-03)', () => {
    it('mostra o estado vazio no lugar dos gráficos e não mostra a lista', () => {
      montar();
      expect(screen.getByText('Adicione o primeiro serviço para ver os gráficos.')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Quanto trabalho dá' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Baixar planilha (CSV)' })).not.toBeInTheDocument();
    });
  });

  describe('cadastrar, editar e apagar', () => {
    it('cadastra pela gaveta: o serviço aparece nos gráficos e na lista, é guardado e a gaveta fecha', () => {
      montar();
      cadastrar('Serviço de Teste', 6);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Quanto trabalho dá' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Quanto vale a pena' })).toBeInTheDocument();
      expect(screen.getByRole('listitem', { name: 'Serviço de Teste' })).toBeInTheDocument();
      expect(screen.queryByText('Adicione o primeiro serviço para ver os gráficos.')).not.toBeInTheDocument();

      const [salvo] = guardados();
      expect(guardados()).toHaveLength(1);
      expect(salvo.nome).toBe('Serviço de Teste');
      expect(salvo.esforco).toBe(100);
      expect(salvo.id).toEqual(expect.any(String));
    });

    it('fechar a gaveta sem salvar não cadastra nada', () => {
      montar();
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));
      fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(guardados()).toEqual([]);
    });

    it('Editar abre a gaveta preenchida e salvar substitui o serviço, com o mesmo id', () => {
      guardar([servico('a', 'Alfa'), servico('b', 'Beta', { esforco: 100 })]);
      montar();

      fireEvent.click(screen.getByRole('button', { name: 'Editar Beta' }));
      expect(screen.getByRole('dialog', { name: 'Editar serviço' })).toBeInTheDocument();
      for (let i = 0; i < 4; i++) proximo();
      const campo = screen.getByLabelText('Nome do serviço');
      expect(campo).toHaveValue('Beta');
      fireEvent.change(campo, { target: { value: 'Beta renomeado' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByRole('listitem', { name: 'Beta renomeado' })).toBeInTheDocument();
      expect(screen.queryByRole('listitem', { name: 'Beta' })).not.toBeInTheDocument();
      const salvos = guardados();
      expect(salvos.map((s) => s.id)).toEqual(['a', 'b']);
      // Serviço antigo (sem respostas): ao salvar passa a guardar as respostas remontadas da nota
      const tresSims = [true, true, true, false, false, false];
      expect(salvos[1]).toEqual(
        servico('b', 'Beta renomeado', {
          esforco: 100,
          respostas: [...Array(6).fill(true), ...tresSims, ...tresSims, ...tresSims],
        }),
      );
    });

    it('cadastra com respostas variadas, reabre em edição com cada resposta como foi dada, sem aviso, e salvar mantém o id e as respostas', () => {
      montar();
      // esforço: sim só na 2ª, 4ª e 6ª pergunta
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));
      const grupos = screen.getAllByRole('group');
      [1, 3, 5].forEach((i) => fireEvent.click(within(grupos[i]).getByRole('radio', { name: 'Sim' })));
      for (let i = 0; i < 4; i++) proximo();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: 'Variado' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));

      const [criado] = guardados();
      expect(criado.respostas).toHaveLength(24);
      expect(criado.respostas?.slice(0, 6)).toEqual([false, true, false, true, false, true]);

      fireEvent.click(screen.getByRole('button', { name: 'Editar Variado' }));
      expect(screen.queryByText(/remontadas a partir da nota/)).not.toBeInTheDocument();
      const lidas = screen.getAllByRole('group').map((g) => (within(g).getByRole('radio', { name: 'Sim' }) as HTMLInputElement).checked);
      expect(lidas).toEqual([false, true, false, true, false, true]);
      for (let i = 0; i < 4; i++) proximo();
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));

      const [editado] = guardados();
      expect(guardados()).toHaveLength(1);
      expect(editado.id).toBe(criado.id);
      expect(editado.respostas).toEqual(criado.respostas);
    });

    it('depois de editar, "Adicionar serviço" abre a gaveta vazia, não a do serviço editado', () => {
      guardar([servico('a', 'Alfa')]);
      montar();
      fireEvent.click(screen.getByRole('button', { name: 'Editar Alfa' }));
      fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
      fireEvent.click(screen.getByRole('button', { name: 'Adicionar serviço' }));
      expect(screen.getByRole('dialog', { name: 'Adicionar serviço' })).toBeInTheDocument();
    });

    it('apagar pede confirmação e só apaga depois de confirmar (CA-F3-04)', () => {
      guardar([servico('a', 'Alfa'), servico('b', 'Beta')]);
      montar();

      fireEvent.click(screen.getByRole('button', { name: 'Apagar Alfa' }));
      expect(screen.getByText('Apagar "Alfa"?')).toBeInTheDocument();
      expect(guardados()).toHaveLength(2);

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(guardados()).toHaveLength(2);
      expect(screen.getByRole('listitem', { name: 'Alfa' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Apagar Alfa' }));
      fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
      expect(screen.queryByRole('listitem', { name: 'Alfa' })).not.toBeInTheDocument();
      expect(guardados().map((s) => s.id)).toEqual(['b']);
    });

    it('apagar o último serviço volta ao estado vazio', () => {
      guardar([servico('a', 'Alfa')]);
      montar();
      fireEvent.click(screen.getByRole('button', { name: 'Apagar Alfa' }));
      fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
      expect(screen.getByText('Adicione o primeiro serviço para ver os gráficos.')).toBeInTheDocument();
    });
  });

  describe('dados antigos (RF-F3b-09, CA-F3-04)', () => {
    it('quem já cadastrou na chave portfolio_services vê os mesmos serviços, sem erro', () => {
      guardar([
        servico('x1', 'Adesivo de vitrine', { esforco: 16.666666666666664, complexidade: 16.666666666666664, padronizacao: 83.33333333333334, lucratividade: 66.66666666666666 }),
        servico('x2', 'Fachada em ACM', { esforco: 83.33333333333334, complexidade: 83.33333333333334, padronizacao: 16.666666666666664, lucratividade: 50 }),
      ]);
      montar();

      const itens = screen.getAllByRole('listitem');
      expect(itens.map((li) => li.getAttribute('aria-label'))).toEqual(['Adesivo de vitrine', 'Fachada em ACM']);
      const adesivo = within(screen.getByRole('listitem', { name: 'Adesivo de vitrine' }));
      expect(adesivo.getByText('Nota geral').nextElementSibling).toHaveTextContent('79,2');
    });

    it('serviço antigo, sem respostas, abre em edição com o aviso de remontagem', () => {
      guardar([servico('x1', 'Antigo', { esforco: 50 })]);
      montar();
      fireEvent.click(screen.getByRole('button', { name: 'Editar Antigo' }));
      expect(
        screen.getByText(
          'Este serviço guarda só a nota de cada grupo. As respostas abaixo foram remontadas a partir da nota: confira e ajuste.',
        ),
      ).toBeVisible();
    });
  });

  describe('guia e ordem da página', () => {
    it('enquanto carrega, o guia já está na página, sem anúncio', () => {
      render(
        <PortfolioView>
          <p>GUIA-TESTE</p>
        </PortfolioView>,
      );
      expect(screen.getByText('GUIA-TESTE')).toBeInTheDocument();
      expect(document.querySelectorAll('ins')).toHaveLength(0);
    });

    it('o guia fica recolhido em "Como funciona esta conta", depois da lista e antes do convite e do rodapé', () => {
      guardar([servico('a', 'Alfa')]);
      montar(<p>GUIA-TESTE</p>);

      const detalhes = screen.getByText('Como funciona esta conta').closest('details') as HTMLDetailsElement;
      expect(detalhes.open).toBe(false);
      expect(detalhes).toContainElement(screen.getByText('GUIA-TESTE'));

      const titulo = screen.getByRole('heading', { level: 1 });
      const botao = screen.getByRole('button', { name: 'Adicionar serviço' });
      const lista = screen.getByRole('heading', { name: 'Seus serviços, do que mais compensa ao que menos compensa' });
      const convite = screen.getByText(/Já sabe o que vender mais\?/);
      const rodape = screen.getByRole('navigation', { name: 'Rodapé' });

      expect(vemDepois(titulo, botao)).toBe(true);
      expect(vemDepois(botao, lista)).toBe(true);
      expect(vemDepois(lista, detalhes)).toBe(true);
      expect(vemDepois(detalhes, convite)).toBe(true);
      expect(vemDepois(convite, rodape)).toBe(true);
      expect(screen.getByRole('main')).toContainElement(detalhes);
    });
  });
});

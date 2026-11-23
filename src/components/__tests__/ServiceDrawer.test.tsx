import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ServiceDrawer } from '../ServiceDrawer';
import { Service } from '../../types';

const PASSOS = ['Dá muito trabalho?', 'É difícil de fazer?', 'Dá para repetir sempre igual?', 'Dá lucro?'];
const AVISO = 'Pergunta sem resposta conta como "não".';

const abrir = (props: Partial<React.ComponentProps<typeof ServiceDrawer>> = {}) => {
  const onClose = vi.fn();
  const onSave = vi.fn();
  const resultado = render(<ServiceDrawer isOpen onClose={onClose} onSave={onSave} {...props} />);
  return { onClose, onSave, ...resultado };
};

const proximo = () => fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
const anterior = () => fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
const passoAtual = () => screen.getByRole('heading', { level: 3 }).textContent;

// Marca "Sim" nas n primeiras perguntas do passo visível
const marcarSim = (n: number) =>
  screen
    .getAllByRole('radio', { name: 'Sim' })
    .slice(0, n)
    .forEach((r) => fireEvent.click(r));

const irParaONome = () => {
  for (let i = 0; i < 4; i++) proximo();
};

describe('ServiceDrawer', () => {
  it('não renderiza nada se isOpen é false', () => {
    render(<ServiceDrawer isOpen={false} onClose={() => {}} onSave={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('diálogo acessível (RF-F3b-07, CA-F3-05)', () => {
    it('é um dialog modal com nome acessível', () => {
      abrir();
      const dialogo = screen.getByRole('dialog', { name: 'Adicionar serviço' });
      expect(dialogo).toHaveAttribute('aria-modal', 'true');
    });

    it('o botão de fechar tem o nome "Fechar" e chama onClose', () => {
      const { onClose } = abrir();
      fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('Esc fecha', () => {
      const { onClose } = abrir();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('ao abrir, o foco vai para dentro do diálogo', () => {
      abrir();
      expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    });

    it('o foco fica preso: Tab no último volta ao primeiro e Shift+Tab no primeiro vai ao último', () => {
      abrir();
      const dialogo = screen.getByRole('dialog');
      const focaveis = within(dialogo)
        .getAllByRole('button')
        .concat(within(dialogo).getAllByRole('radio'));
      // ordem do documento
      const ordenados = focaveis.sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      const primeiro = ordenados[0];
      const ultimo = ordenados[ordenados.length - 1];

      ultimo.focus();
      const seguiu = fireEvent.keyDown(ultimo, { key: 'Tab' });
      expect(seguiu).toBe(false); // o navegador não segue sozinho
      expect(primeiro).toHaveFocus();

      const voltou = fireEvent.keyDown(primeiro, { key: 'Tab', shiftKey: true });
      expect(voltou).toBe(false);
      expect(ultimo).toHaveFocus();
    });

    it('com o foco fora do diálogo, Tab traz o foco de volta para dentro', () => {
      render(
        <>
          <button type="button">Fora</button>
          <ServiceDrawer isOpen onClose={() => {}} onSave={() => {}} />
        </>,
      );
      screen.getByRole('button', { name: 'Fora' }).focus();
      fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Tab' });
      expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    });

    it('ao fechar, o foco volta para quem abriu', () => {
      const Pagina = ({ aberto }: { aberto: boolean }) => (
        <>
          <button type="button">Abrir</button>
          <ServiceDrawer isOpen={aberto} onClose={() => {}} onSave={() => {}} />
        </>
      );
      const { rerender } = render(<Pagina aberto={false} />);
      const abridor = screen.getByRole('button', { name: 'Abrir' });
      abridor.focus();
      rerender(<Pagina aberto />);
      expect(abridor).not.toHaveFocus();
      rerender(<Pagina aberto={false} />);
      expect(abridor).toHaveFocus();
    });
  });

  describe('passos em pergunta (RF-F3b-07)', () => {
    it('cada passo tem como título a pergunta da spec, e o último pergunta o nome', () => {
      abrir();
      for (const titulo of PASSOS) {
        expect(passoAtual()).toBe(titulo);
        proximo();
      }
      expect(passoAtual()).toBe('Como se chama este serviço?');
    });

    it('mostra as 6 perguntas de cada passo, cada uma com Sim e Não', () => {
      abrir();
      expect(screen.getAllByRole('group')).toHaveLength(6);
      expect(screen.getAllByRole('radio', { name: 'Sim' })).toHaveLength(6);
      expect(screen.getAllByRole('radio', { name: 'Não' })).toHaveLength(6);
    });

    it('mantém o texto original das perguntas, com a correção de "mais"', () => {
      abrir();
      expect(
        screen.getByRole('group', {
          name: /A execução operacional do serviço consome, no total, mais de 8 horas de trabalho ativo/,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('group', { name: /alocação de três ou mais pessoas/ }),
      ).toBeInTheDocument();
    });

    it('avisa que pergunta sem resposta conta como "não", em todos os passos de perguntas', () => {
      abrir();
      for (let i = 0; i < 4; i++) {
        expect(screen.getByText(AVISO)).toBeVisible();
        proximo();
      }
    });

    it('navega com Próximo e Anterior sem perder as respostas', () => {
      abrir();
      marcarSim(2);
      proximo();
      expect(passoAtual()).toBe('É difícil de fazer?');
      expect(screen.queryByRole('button', { name: 'Anterior' })).toBeInTheDocument();
      anterior();
      expect(passoAtual()).toBe('Dá muito trabalho?');
      expect(screen.getAllByRole('radio', { name: 'Sim' }).filter((r) => (r as HTMLInputElement).checked)).toHaveLength(2);
    });

    it('no primeiro passo não há "Anterior"', () => {
      abrir();
      expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument();
    });

    it('ao mudar de passo, o foco vai para o título novo', () => {
      abrir();
      proximo();
      expect(screen.getByRole('heading', { level: 3, name: 'É difícil de fazer?' })).toHaveFocus();
    });
  });

  describe('salvar um serviço novo', () => {
    it('nota de cada grupo = respostas "sim" ÷ 6; id novo; nome informado', () => {
      const { onSave, onClose } = abrir();
      marcarSim(3); // esforço 50
      proximo();
      marcarSim(6); // dificuldade 100
      proximo();
      marcarSim(1); // repetição 16,67
      proximo();
      proximo(); // lucro sem resposta = 0
      expect(passoAtual()).toBe('Como se chama este serviço?');
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: 'Teste de Serviço' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));

      expect(onSave).toHaveBeenCalledOnce();
      const salvo = onSave.mock.calls[0][0] as Service;
      expect(salvo.nome).toBe('Teste de Serviço');
      expect(salvo.id).toEqual(expect.any(String));
      expect(salvo.id.length).toBeGreaterThan(0);
      expect(salvo.esforco).toBe(50);
      expect(salvo.complexidade).toBe(100);
      expect(salvo.padronizacao).toBeCloseTo(16.6667, 3);
      expect(salvo.lucratividade).toBe(0);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('pergunta sem resposta conta como "não": passar direto dá nota 0 em tudo', () => {
      const { onSave } = abrir();
      irParaONome();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: 'Vazio' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Vazio', esforco: 0, complexidade: 0, padronizacao: 0, lucratividade: 0 }),
      );
    });

    it('"Não" explícito também vale zero', () => {
      const { onSave } = abrir();
      screen.getAllByRole('radio', { name: 'Não' }).forEach((r) => fireEvent.click(r));
      irParaONome();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: 'Nao' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ esforco: 0 }));
    });

    it('o botão de salvar fica desativado até ter um nome', () => {
      const { onSave } = abrir();
      irParaONome();
      const salvar = screen.getByRole('button', { name: 'Salvar serviço' });
      expect(salvar).toBeDisabled();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: '   ' } });
      expect(salvar).toBeDisabled();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: 'Algo' } });
      expect(salvar).toBeEnabled();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('mostra o resumo das notas com os nomes novos', () => {
      abrir();
      marcarSim(3);
      proximo();
      proximo();
      proximo();
      proximo();
      expect(screen.getByText('Esforço: 50%')).toBeInTheDocument();
      expect(screen.getByText('Dificuldade: 0%')).toBeInTheDocument();
      expect(screen.getByText('Repetição: 0%')).toBeInTheDocument();
      expect(screen.getByText('Lucro: 0%')).toBeInTheDocument();
    });

    it('não mostra o aviso de respostas remontadas num serviço novo', () => {
      abrir();
      expect(screen.queryByText(/remontadas a partir da nota/)).not.toBeInTheDocument();
    });

    it('abre vazio de novo depois de fechar e abrir', () => {
      const props = { onClose: () => {}, onSave: () => {} };
      const { rerender } = render(<ServiceDrawer isOpen {...props} />);
      marcarSim(4);
      rerender(<ServiceDrawer isOpen={false} {...props} />);
      rerender(<ServiceDrawer isOpen {...props} />);
      expect(passoAtual()).toBe('Dá muito trabalho?');
      expect(screen.getAllByRole('radio').filter((r) => (r as HTMLInputElement).checked)).toHaveLength(0);
    });
  });

  describe('editar (RF-F3b-05, CA-F3-04)', () => {
    const FACHADA: Service = {
      id: 'id-da-fachada',
      nome: 'Fachada em ACM',
      esforco: (5 / 6) * 100,
      complexidade: (5 / 6) * 100,
      padronizacao: (1 / 6) * 100,
      lucratividade: 50,
    };

    it('abre preenchido: título de edição, respostas das notas e o nome', () => {
      abrir({ service: FACHADA });
      expect(screen.getByRole('dialog', { name: 'Editar serviço' })).toBeInTheDocument();
      // esforço 5 de 6
      expect(screen.getAllByRole('radio', { name: 'Sim' }).filter((r) => (r as HTMLInputElement).checked)).toHaveLength(5);
      expect(screen.getAllByRole('radio', { name: 'Não' }).filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1);
      irParaONome();
      expect(screen.getByLabelText('Nome do serviço')).toHaveValue('Fachada em ACM');
      expect(screen.getByText('Esforço: 83%')).toBeInTheDocument();
      expect(screen.getByText('Dificuldade: 83%')).toBeInTheDocument();
      expect(screen.getByText('Repetição: 17%')).toBeInTheDocument();
      expect(screen.getByText('Lucro: 50%')).toBeInTheDocument();
    });

    it('avisa que as respostas foram remontadas a partir das notas guardadas', () => {
      abrir({ service: FACHADA });
      expect(screen.getByText(/remontadas a partir da nota/)).toBeVisible();
    });

    it('salvar sem mexer devolve o mesmo serviço (mesmo id, mesmas notas)', () => {
      const { onSave } = abrir({ service: FACHADA });
      irParaONome();
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
      expect(onSave).toHaveBeenCalledOnce();
      const salvo = onSave.mock.calls[0][0] as Service;
      const remontadas = [
        ...[true, true, true, true, true, false], // esforço 5 de 6
        ...[true, true, true, true, true, false], // dificuldade 5 de 6
        ...[true, false, false, false, false, false], // repetição 1 de 6
        ...[true, true, true, false, false, false], // lucro 3 de 6
      ];
      expect(salvo).toEqual({ ...FACHADA, respostas: remontadas });
    });

    it('salvar com respostas e nome mudados mantém o id e troca o resto', () => {
      const { onSave } = abrir({ service: FACHADA });
      // esforço: de 5 para 6 "sim"
      screen
        .getAllByRole('radio', { name: 'Sim' })
        .forEach((r) => fireEvent.click(r));
      irParaONome();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: 'Fachada em ACM 3D' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
      const salvo = onSave.mock.calls[0][0] as Service;
      expect(salvo.id).toBe('id-da-fachada');
      expect(salvo.nome).toBe('Fachada em ACM 3D');
      expect(salvo.esforco).toBe(100);
      expect(salvo.complexidade).toBeCloseTo(FACHADA.complexidade, 5);
    });

    describe('respostas guardadas (RF-F3b-05a)', () => {
      // Lê, no passo visível, a resposta de cada pergunta: 'sim', 'nao' ou null (sem resposta)
      const lerPasso = () =>
        screen.getAllByRole('group').map((g) => {
          const sim = within(g).getByRole('radio', { name: 'Sim' }) as HTMLInputElement;
          const nao = within(g).getByRole('radio', { name: 'Não' }) as HTMLInputElement;
          return sim.checked ? 'sim' : nao.checked ? 'nao' : null;
        });

      const marcarPosicoes = (posicoes: number[]) => {
        const grupos = screen.getAllByRole('group');
        posicoes.forEach((i) => fireEvent.click(within(grupos[i]).getByRole('radio', { name: 'Sim' })));
      };

      const SIMS_POR_PASSO = [[1, 3, 5], [0, 5], [2], [0, 1, 2, 3, 4]];
      const esperadoDoPasso = (sims: number[]) => Array.from({ length: 6 }, (_, i) => (sims.includes(i) ? 'sim' : 'nao'));

      const cadastrarVariado = () => {
        const { onSave } = abrir();
        SIMS_POR_PASSO.forEach((sims, i) => {
          marcarPosicoes(sims);
          if (i < 3) proximo();
        });
        proximo();
        fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: 'Varia' } });
        fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
        return onSave.mock.calls[0][0] as Service;
      };

      it('serviço novo grava as 24 respostas, na ordem das perguntas (pergunta sem resposta = false)', () => {
        const salvo = cadastrarVariado();
        expect(salvo.respostas).toHaveLength(24);
        const esperado = SIMS_POR_PASSO.flatMap((sims) => Array.from({ length: 6 }, (_, i) => sims.includes(i)));
        expect(salvo.respostas).toEqual(esperado);
      });

      it('pergunta sem resposta é gravada como false', () => {
        const { onSave } = abrir();
        irParaONome();
        fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: 'Vazio' } });
        fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
        expect((onSave.mock.calls[0][0] as Service).respostas).toEqual(Array(24).fill(false));
      });

      it('as notas continuam sendo as respostas "sim" ÷ 6 de cada grupo', () => {
        const salvo = cadastrarVariado();
        expect(salvo.esforco).toBe(50);
        expect(salvo.complexidade).toBeCloseTo((2 / 6) * 100, 5);
        expect(salvo.padronizacao).toBeCloseTo((1 / 6) * 100, 5);
        expect(salvo.lucratividade).toBeCloseTo((5 / 6) * 100, 5);
      });

      it('ao editar um serviço com respostas, cada rádio abre como foi respondido e sem o aviso de remontagem', () => {
        const salvo = cadastrarVariado();
        cleanup();
        abrir({ service: salvo });

        expect(screen.queryByText(/remontadas a partir da nota/)).not.toBeInTheDocument();
        SIMS_POR_PASSO.forEach((sims, i) => {
          expect(passoAtual()).toBe(PASSOS[i]);
          expect(lerPasso()).toEqual(esperadoDoPasso(sims));
          proximo();
        });
        expect(screen.queryByText(/remontadas a partir da nota/)).not.toBeInTheDocument();
      });

      it('salvar a edição mantém o id e grava as respostas (inclusive as mudadas)', () => {
        const salvo = cadastrarVariado();
        cleanup();
        const { onSave } = abrir({ service: salvo });
        // esforço: a pergunta 1 (que era "não") passa a "sim"
        marcarPosicoes([0]);
        irParaONome();
        fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));

        const editado = onSave.mock.calls[0][0] as Service;
        expect(editado.id).toBe(salvo.id);
        const esperado = [...(salvo.respostas as boolean[])];
        esperado[0] = true;
        expect(editado.respostas).toEqual(esperado);
        expect(editado.esforco).toBeCloseTo((4 / 6) * 100, 5);
      });

      it('serviço antigo, sem respostas, abre remontado a partir da nota e com o aviso literal', () => {
        abrir({ service: FACHADA });
        expect(
          screen.getByText(
            'Este serviço guarda só a nota de cada grupo. As respostas abaixo foram remontadas a partir da nota: confira e ajuste.',
          ),
        ).toBeVisible();
        expect(lerPasso()).toEqual(['sim', 'sim', 'sim', 'sim', 'sim', 'nao']);
      });

      it.each([23, 25])(
        'respostas com %i itens (não são as 24) é dado antigo: remonta pela nota e mostra o aviso',
        (tamanho) => {
          abrir({ service: { ...FACHADA, respostas: Array.from({ length: tamanho }, () => true) } });
          expect(screen.getByText(/remontadas a partir da nota/)).toBeVisible();
          // remontado pela nota (5 de 6), não pelas respostas guardadas (todas "sim")
          expect(lerPasso()).toEqual(['sim', 'sim', 'sim', 'sim', 'sim', 'nao']);
        },
      );
    });

    it('Esc também fecha a gaveta em modo edição, sem salvar', () => {
      const { onSave, onClose } = abrir({ service: FACHADA });
      expect(screen.getByRole('dialog', { name: 'Editar serviço' })).toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('salva o nome sem espaços nas pontas', () => {
      const { onSave } = abrir({ service: FACHADA });
      irParaONome();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: '  Placa  ' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar serviço' }));
      expect((onSave.mock.calls[0][0] as Service).nome).toBe('Placa');
    });

    it('nome só com espaços não habilita salvar, mesmo ao editar', () => {
      const { onSave } = abrir({ service: FACHADA });
      irParaONome();
      fireEvent.change(screen.getByLabelText('Nome do serviço'), { target: { value: '   ' } });
      const salvar = screen.getByRole('button', { name: 'Salvar serviço' });
      expect(salvar).toBeDisabled();
      fireEvent.click(salvar);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('fechar sem salvar não chama onSave', () => {
      const { onSave, onClose } = abrir({ service: FACHADA });
      fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
      expect(onClose).toHaveBeenCalledOnce();
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});

import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceList } from '../ServiceList';
import { exportToCSV } from '../../utils/csv';
import { Service } from '../../types';

vi.mock('../../utils/csv', () => ({ exportToCSV: vi.fn() }));

// A: trabalho 20, retorno 80, nota geral (100 − 20 + 80) ÷ 2 = 80
// B: trabalho 80, retorno 20, nota geral (100 − 80 + 20) ÷ 2 = 20
const A: Service = { id: '1', nome: 'Serviço A', esforco: 20, complexidade: 20, padronizacao: 80, lucratividade: 80 };
const B: Service = { id: '2', nome: 'Serviço B', esforco: 80, complexidade: 80, padronizacao: 20, lucratividade: 20 };

const montar = (services: Service[], props: Partial<React.ComponentProps<typeof ServiceList>> = {}) =>
  render(
    <ServiceList services={services} onEdit={() => {}} onRemove={() => {}} onHover={() => {}} {...props} />,
  );

describe('ServiceList', () => {
  beforeEach(() => {
    vi.mocked(exportToCSV).mockClear();
  });

  it('tem o título da spec e um item por serviço (RF-F3b-04)', () => {
    montar([A, B]);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Seus serviços, do que mais compensa ao que menos compensa' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('mostra Nota geral, Trabalho e Retorno de cada serviço', () => {
    montar([A, B]);
    const itemA = within(screen.getByRole('listitem', { name: 'Serviço A' }));
    expect(itemA.getByText('Nota geral').nextElementSibling).toHaveTextContent('80,0');
    expect(itemA.getByText('Trabalho').nextElementSibling).toHaveTextContent('20%');
    expect(itemA.getByText('Retorno').nextElementSibling).toHaveTextContent('80%');

    const itemB = within(screen.getByRole('listitem', { name: 'Serviço B' }));
    expect(itemB.getByText('Nota geral').nextElementSibling).toHaveTextContent('20,0');
    expect(itemB.getByText('Trabalho').nextElementSibling).toHaveTextContent('80%');
    expect(itemB.getByText('Retorno').nextElementSibling).toHaveTextContent('20%');
  });

  it('explica que a nota geral vai de 0 a 100', () => {
    montar([A]);
    expect(screen.getByText(/de 0 a 100/)).toBeInTheDocument();
  });

  it('ordena do que mais compensa ao que menos compensa', () => {
    montar([B, A]);
    const nomes = screen.getAllByRole('listitem').map((li) => li.getAttribute('aria-label'));
    expect(nomes).toEqual(['Serviço A', 'Serviço B']);
  });

  it('o botão Editar entrega o serviço inteiro (RF-F3b-05)', () => {
    const onEdit = vi.fn();
    montar([A, B], { onEdit });
    fireEvent.click(screen.getByRole('button', { name: 'Editar Serviço B' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledWith(B);
  });

  describe('apagar (RF-F3b-06)', () => {
    it('o botão de apagar fica sempre visível, com o nome do serviço', () => {
      montar([A, B]);
      expect(screen.getByRole('button', { name: 'Apagar Serviço A' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Apagar Serviço B' })).toBeVisible();
    });

    it('pede confirmação na tela e só apaga depois de "Apagar"', () => {
      const onRemove = vi.fn();
      montar([A, B], { onRemove });

      fireEvent.click(screen.getByRole('button', { name: 'Apagar Serviço A' }));
      expect(screen.getByText('Apagar "Serviço A"?')).toBeInTheDocument();
      expect(onRemove).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
      expect(onRemove).toHaveBeenCalledOnce();
      expect(onRemove).toHaveBeenCalledWith('1');
    });

    it('"Cancelar" fecha a confirmação sem apagar', () => {
      const onRemove = vi.fn();
      montar([A, B], { onRemove });

      fireEvent.click(screen.getByRole('button', { name: 'Apagar Serviço A' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(onRemove).not.toHaveBeenCalled();
      expect(screen.queryByText('Apagar "Serviço A"?')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apagar Serviço A' })).toBeInTheDocument();
    });

    it('a confirmação vale só para o serviço escolhido', () => {
      montar([A, B]);
      fireEvent.click(screen.getByRole('button', { name: 'Apagar Serviço B' }));
      expect(screen.getByText('Apagar "Serviço B"?')).toBeInTheDocument();
      expect(screen.queryByText('Apagar "Serviço A"?')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apagar Serviço A' })).toBeInTheDocument();
    });

    it('põe o foco em "Cancelar" ao pedir a confirmação e devolve ao botão de apagar ao cancelar', () => {
      montar([A]);
      fireEvent.click(screen.getByRole('button', { name: 'Apagar Serviço A' }));
      expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.getByRole('button', { name: 'Apagar Serviço A' })).toHaveFocus();
    });
  });

  it('"Baixar planilha (CSV)" exporta os serviços (RF-F3b-08)', () => {
    montar([A, B]);
    expect(screen.queryByRole('button', { name: /^Exportar/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Baixar planilha (CSV)' }));
    expect(exportToCSV).toHaveBeenCalledWith([A, B]);
  });

  it('avisa qual serviço está em foco para o gráfico destacar o ponto', () => {
    const onHover = vi.fn();
    montar([A], { onHover });
    const item = screen.getByRole('listitem', { name: 'Serviço A' });
    fireEvent.mouseEnter(item);
    expect(onHover).toHaveBeenLastCalledWith('1');
    fireEvent.mouseLeave(item);
    expect(onHover).toHaveBeenLastCalledWith(null);
    fireEvent.focus(screen.getByRole('button', { name: 'Editar Serviço A' }));
    expect(onHover).toHaveBeenLastCalledWith('1');
  });

  it('sem serviços, não mostra a lista (o estado vazio fica nos gráficos)', () => {
    const { container } = montar([]);
    expect(container).toBeEmptyDOMElement();
  });
});

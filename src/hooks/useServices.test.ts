import { renderHook, act } from '@testing-library/react';
import { useServices } from './useServices';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Service } from '../types';

const servico = (id: string, nome: string, extra: Partial<Service> = {}): Service => ({
  id,
  nome,
  esforco: 50,
  complexidade: 50,
  padronizacao: 50,
  lucratividade: 50,
  ...extra,
});

const CHAVE = 'portfolio_services';

const montar = () => {
  const hook = renderHook(() => useServices());
  act(() => {
    vi.runAllTimers();
  });
  return hook;
};

describe('useServices', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  it('deve inicializar vazio se não houver dados no localStorage', () => {
    const { result } = montar();

    expect(result.current.services).toEqual([]);
    expect(result.current.isLoaded).toBe(true);
  });

  it('abre os serviços já cadastrados na chave portfolio_services (RF-F3b-09)', () => {
    const guardados = [servico('1', 'Serviço 1', { esforco: 80, lucratividade: 70 })];
    window.localStorage.setItem(CHAVE, JSON.stringify(guardados));

    const { result } = montar();

    expect(result.current.services).toEqual(guardados);
  });

  it('deve adicionar um serviço corretamente e guardar na mesma chave', () => {
    const { result } = montar();
    const novo = servico('2', 'Novo serviço');

    act(() => {
      result.current.addService(novo);
    });

    expect(result.current.services).toEqual([novo]);
    expect(JSON.parse(window.localStorage.getItem(CHAVE) as string)).toEqual([novo]);
  });

  it('deve remover um serviço corretamente', () => {
    window.localStorage.setItem(CHAVE, JSON.stringify([servico('1', 'Serviço 1'), servico('2', 'Serviço 2')]));
    const { result } = montar();

    act(() => {
      result.current.removeService('1');
    });

    expect(result.current.services).toHaveLength(1);
    expect(result.current.services[0].id).toBe('2');
  });

  describe('updateService (RF-F3b-05)', () => {
    it('substitui o serviço de mesmo id, mantendo a posição e os outros', () => {
      window.localStorage.setItem(
        CHAVE,
        JSON.stringify([servico('1', 'A'), servico('2', 'B'), servico('3', 'C')]),
      );
      const { result } = montar();
      const editado = servico('2', 'B editado', { esforco: 17, lucratividade: 100 });

      act(() => {
        result.current.updateService(editado);
      });

      expect(result.current.services.map((s) => s.id)).toEqual(['1', '2', '3']);
      expect(result.current.services[1]).toEqual(editado);
      expect(result.current.services[0].nome).toBe('A');
      expect(result.current.services[2].nome).toBe('C');
      expect(JSON.parse(window.localStorage.getItem(CHAVE) as string)[1]).toEqual(editado);
    });

    it('não cria serviço novo quando o id não existe', () => {
      window.localStorage.setItem(CHAVE, JSON.stringify([servico('1', 'A')]));
      const { result } = montar();

      act(() => {
        result.current.updateService(servico('99', 'Fantasma'));
      });

      expect(result.current.services).toEqual([servico('1', 'A')]);
    });
  });
});

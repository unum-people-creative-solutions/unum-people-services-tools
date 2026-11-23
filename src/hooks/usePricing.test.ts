import { renderHook, act } from '@testing-library/react';
import { usePricing } from './usePricing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('usePricing', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() => usePricing());
    
    // Avançar timers para o carregamento do useEffect
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.data.capacidade.diasTrabalhados).toBe(22);
  });

  it('deve calcular o total de custos fixos corretamente', () => {
    const { result } = renderHook(() => usePricing());
    
    act(() => {
      vi.runAllTimers();
      result.current.updateCustosFixos({ aluguel: 1000, energia: 200 });
    });

    expect(result.current.calculations.totalCustosFixos).toBe(1200);
  });

  it('soma "outras" (guia do MEI) às contas fixas; dado antigo sem o campo vale 0', () => {
    window.localStorage.setItem(
      'pricing_data',
      JSON.stringify({
        custosFixos: { aluguel: 1000, energia: 200, internet: 0, contador: 0, softwares: 0, equipe: 0, proLabore: 0 },
        capacidade: { diasTrabalhados: 22, horasDiarias: 8, percentualOciosidade: 20 },
        servico: { nome: '', horasEstimadas: 0, materiaisDiretos: 0, deslocamento: 0, impostosPercentual: 0, precoDesejado: 0 },
      }),
    );
    const { result } = renderHook(() => usePricing());
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.calculations.totalCustosFixos).toBe(1200);

    act(() => {
      result.current.updateCustosFixos({ outras: 66 });
    });
    expect(result.current.calculations.totalCustosFixos).toBe(1266);
    expect(JSON.parse(window.localStorage.getItem('pricing_data') as string).custosFixos.outras).toBe(66);
  });

  it('deve calcular as horas faturáveis corretamente', () => {
    const { result } = renderHook(() => usePricing());
    
    act(() => {
      vi.runAllTimers();
      result.current.updateCapacidade({ 
        diasTrabalhados: 20, 
        horasDiarias: 8, 
        percentualOciosidade: 25 
      });
    });

    // 20 * 8 = 160 horas brutas
    // 160 * (1 - 0.25) = 120 horas faturáveis
    expect(result.current.calculations.horasFaturaveis).toBe(120);
  });

  it('deve calcular o piso aceitável (break-even) corretamente', () => {
    const { result } = renderHook(() => usePricing());
    
    act(() => {
      vi.runAllTimers();
      result.current.updateCustosFixos({ proLabore: 5000 }); // Total 5000
      result.current.updateCapacidade({ 
        diasTrabalhados: 20, 
        horasDiarias: 5, 
        percentualOciosidade: 0 
      }); // 100 horas faturáveis -> Custo/Hora = 50
      
      result.current.updateServico({ 
        horasEstimadas: 10, 
        materiaisDiretos: 100, 
        impostosPercentual: 10 
      });
    });

    // Custo Base = (50 * 10) + 100 = 600
    // Piso = 600 / (1 - 0.1) = 600 / 0.9 = 666.666...
    expect(result.current.calculations.pisoAceitavel).toBeCloseTo(666.67, 1);
  });

  it('deve calcular a margem de lucro real corretamente', () => {
    const { result } = renderHook(() => usePricing());
    
    act(() => {
      vi.runAllTimers();
      result.current.updateCustosFixos({ proLabore: 5000 }); // Total 5000
      result.current.updateCapacidade({ diasTrabalhados: 20, horasDiarias: 5, percentualOciosidade: 0 }); // 100h -> $50/h
      result.current.updateServico({ 
        horasEstimadas: 10, 
        materiaisDiretos: 100, 
        impostosPercentual: 20,
        precoDesejado: 1000 
      });
    });

    // Custo Base = (50 * 10) + 100 = 600
    // Imposto (20%) sobre 1000 = 200
    // Lucro Nominal = 1000 - 200 - 600 = 200
    // Margem = (200 / 1000) * 100 = 20%
    expect(result.current.calculations.margemLucroReal).toBe(20);
    expect(result.current.calculations.lucroNominal).toBe(200);
  });
  it('reset volta tudo ao padrão e regrava o localStorage no formato de sempre', () => {
    const { result } = renderHook(() => usePricing());
    act(() => {
      vi.runAllTimers();
    });
    act(() => {
      result.current.updateCustosFixos({ aluguel: 800, proLabore: 3000 });
      result.current.updateCapacidade({ diasTrabalhados: 20 });
      result.current.updateServico({ nome: 'Pintura', horasEstimadas: 3, precoDesejado: 250 });
    });
    expect(result.current.data.custosFixos.aluguel).toBe(800);

    act(() => {
      result.current.reset();
    });

    expect(result.current.data.custosFixos.aluguel).toBe(0);
    expect(result.current.data.custosFixos.proLabore).toBe(0);
    expect(result.current.data.capacidade).toEqual({ diasTrabalhados: 22, horasDiarias: 8, percentualOciosidade: 20 });
    expect(result.current.data.servico).toEqual({
      nome: '',
      horasEstimadas: 0,
      materiaisDiretos: 0,
      deslocamento: 0,
      impostosPercentual: 0,
      precoDesejado: 0,
    });
    const salvo = JSON.parse(window.localStorage.getItem('pricing_data') as string);
    expect(salvo.capacidade.diasTrabalhados).toBe(22);
    expect(salvo.custosFixos.aluguel).toBe(0);
  });
});

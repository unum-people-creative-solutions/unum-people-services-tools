'use client';

import { useState, useEffect } from 'react';
import { PricingData } from '../types';

const STORAGE_KEY = 'pricing_data';

const DEFAULT_PRICING_DATA: PricingData = {
  custosFixos: {
    aluguel: 0,
    energia: 0,
    internet: 0,
    contador: 0,
    softwares: 0,
    equipe: 0,
    proLabore: 0,
  },
  capacidade: {
    diasTrabalhados: 22,
    horasDiarias: 8,
    percentualOciosidade: 20,
  },
  servico: {
    nome: '',
    horasEstimadas: 0,
    materiaisDiretos: 0,
    deslocamento: 0,
    impostosPercentual: 0,
    precoDesejado: 0,
  },
};

export function usePricing() {
  const [data, setData] = useState<PricingData>(DEFAULT_PRICING_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTimeout(() => {
          setData(parsed);
          setIsLoaded(true);
        }, 0);
      } catch (e) {
        console.error('Failed to parse pricing data from localStorage', e);
        setTimeout(() => setIsLoaded(true), 0);
      }
    } else {
      setTimeout(() => setIsLoaded(true), 0);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateCustosFixos = (updates: Partial<PricingData['custosFixos']>) => {
    setData((prev) => ({
      ...prev,
      custosFixos: { ...prev.custosFixos, ...updates },
    }));
  };

  const updateCapacidade = (updates: Partial<PricingData['capacidade']>) => {
    setData((prev) => ({
      ...prev,
      capacidade: { ...prev.capacidade, ...updates },
    }));
  };

  const updateServico = (updates: Partial<PricingData['servico']>) => {
    setData((prev) => ({
      ...prev,
      servico: { ...prev.servico, ...updates },
    }));
  };

  const reset = () => {
    setData(DEFAULT_PRICING_DATA);
  };

  // Cálculos
  const { aluguel, energia, internet, contador, softwares, equipe, proLabore, outras } = data.custosFixos;
  const totalCustosFixos = aluguel + energia + internet + contador + softwares + equipe + proLabore + (outras ?? 0);
  
  const horasFaturaveis = 
    (data.capacidade.diasTrabalhados * data.capacidade.horasDiarias) * 
    (1 - data.capacidade.percentualOciosidade / 100);
  
  const custoFixoPorHora = horasFaturaveis > 0 ? totalCustosFixos / horasFaturaveis : 0;

  const custosVariaveisDiretos = data.servico.materiaisDiretos + data.servico.deslocamento;
  
  const custoBase = (custoFixoPorHora * data.servico.horasEstimadas) + custosVariaveisDiretos;
  
  // Piso Aceitável (Ponto de Equilíbrio) considerando impostos "por dentro"
  // Preço = Custo / (1 - Imposto)
  const aliquota = data.servico.impostosPercentual / 100;
  const pisoAceitavel = aliquota < 1 ? custoBase / (1 - aliquota) : 0;

  // Resultados da Simulação
  const precoSugerido = data.servico.precoDesejado;
  const lucroNominal = precoSugerido > 0 ? (precoSugerido * (1 - aliquota)) - custoBase : 0;
  const margemLucroReal = precoSugerido > 0 ? (lucroNominal / precoSugerido) * 100 : 0;

  return {
    data,
    updateCustosFixos,
    updateCapacidade,
    updateServico,
    reset,
    isLoaded,
    calculations: {
      totalCustosFixos,
      horasFaturaveis,
      custoFixoPorHora,
      custosVariaveisDiretos,
      pisoAceitavel,
      lucroNominal,
      margemLucroReal,
    },
  };
}

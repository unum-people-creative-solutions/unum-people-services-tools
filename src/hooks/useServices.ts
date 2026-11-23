'use client';

import { useState, useEffect } from 'react';
import { Service } from '../types';

const STORAGE_KEY = 'portfolio_services';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTimeout(() => {
          setServices(parsed);
          setIsLoaded(true);
        }, 0);
      } catch (e) {
        console.error('Failed to parse services from localStorage', e);
        setTimeout(() => setIsLoaded(true), 0);
      }
    } else {
      setTimeout(() => setIsLoaded(true), 0);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
    }
  }, [services, isLoaded]);

  const addService = (service: Service) => {
    setServices((prev) => [...prev, service]);
  };

  // Substitui o serviço de mesmo id (edição); id desconhecido não cria serviço novo.
  const updateService = (service: Service) => {
    setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return { services, addService, updateService, removeService, isLoaded };
}

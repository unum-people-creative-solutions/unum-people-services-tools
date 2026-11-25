// @vitest-environment-options {"url": "https://unum-people-services-tools.vercel.app/"}
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ORIGEM_DA_MEDICAO, origemPodeMedir, useMedicao } from './useMedicao';
import { desligarMedicao, ligarMedicao } from '../test/medicao';

describe('origemPodeMedir', () => {
  it('aceita só a origem oficial do Tools', () => {
    expect(ORIGEM_DA_MEDICAO).toBe('https://tools.unumpeople.com.br');
    expect(origemPodeMedir('https://tools.unumpeople.com.br')).toBe(true);
  });

  it.each([
    'https://unum-people-services-tools.vercel.app',
    'https://unum-people-tools.netlify.app',
    'http://localhost:3000',
    'https://tools.unumpeople.com',
    'http://tools.unumpeople.com.br',
    'https://tools.unumpeople.com.br.exemplo.test',
    'https://xtools.unumpeople.com.br',
    '',
  ])('recusa %j', (origem) => {
    expect(origemPodeMedir(origem)).toBe(false);
  });
});

describe('useMedicao fora do domínio oficial', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;
  let fetchEspiao: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendBeacon = ligarMedicao();
    fetchEspiao = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal('fetch', fetchEspiao);
  });
  afterEach(() => {
    desligarMedicao();
    vi.restoreAllMocks();
  });

  it('não envia nada (nem beacon nem fetch), mas "comecou" continua valendo', () => {
    expect(window.location.origin).toBe('https://unum-people-services-tools.vercel.app');
    const { result } = renderHook(() => useMedicao('quanto-cobrar'));

    expect(() => {
      act(() => {
        result.current.marcar('visita');
      });
      act(() => {
        result.current.marcar('comecou');
      });
      act(() => {
        result.current.marcar('resultado');
      });
    }).not.toThrow();

    expect(result.current.comecou).toBe(true);
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchEspiao).not.toHaveBeenCalled();
  });
});

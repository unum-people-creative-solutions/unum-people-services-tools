// @vitest-environment-options {"url": "http://tools.unumpeople.com.br/"}
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMedicao } from './useMedicao';
import { desligarMedicao, ligarMedicao } from '../test/medicao';

// Mesmo host do domínio oficial, mas em http: a origem não é igual, então nada sai (RF-02).
describe('useMedicao em origem parecida com a oficial (http, mesmo host)', () => {
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
    expect(window.location.origin).toBe('http://tools.unumpeople.com.br');
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

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMedicao } from './useMedicao';
import { desligarMedicao, enviados, ligarMedicao, URL_USO } from '../test/medicao';

describe('useMedicao', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    sendBeacon = ligarMedicao();
  });
  afterEach(() => {
    desligarMedicao();
    vi.restoreAllMocks();
  });

  it('envia o par {"f","e"} como text/plain para a URL configurada', () => {
    const fetchEspiao = vi.fn();
    vi.stubGlobal('fetch', fetchEspiao);
    const { result } = renderHook(() => useMedicao('quanto-cobrar'));
    result.current.marcar('visita');

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    // Beacon aceito: não há segundo envio por fetch (contaria em dobro no servidor).
    expect(fetchEspiao).not.toHaveBeenCalled();
    const [url, corpo] = sendBeacon.mock.calls[0];
    expect(url).toBe(URL_USO);
    expect((corpo as Blob).type).toBe('text/plain');
    expect(enviados(sendBeacon)).toEqual([{ f: 'quanto-cobrar', e: 'visita' }]);
    expect((corpo as unknown as { texto: string }).texto).toBe('{"f":"quanto-cobrar","e":"visita"}');
  });

  it('ignora "resultado" até haver "comecou" na mesma carga, e depois deixa passar', () => {
    const { result } = renderHook(() => useMedicao('quanto-cobrar'));
    act(() => {
      result.current.marcar('resultado');
    });
    expect(enviados(sendBeacon)).toEqual([]);
    expect(result.current.comecou).toBe(false);

    act(() => {
      result.current.marcar('comecou');
    });
    expect(result.current.comecou).toBe(true);
    act(() => {
      result.current.marcar('resultado');
      result.current.marcar('resultado');
    });
    expect(enviados(sendBeacon)).toEqual([
      { f: 'quanto-cobrar', e: 'comecou' },
      { f: 'quanto-cobrar', e: 'resultado' },
    ]);
  });

  it('envia cada evento uma vez só por carregamento, mesmo repetindo a ação e re-renderizando', () => {
    const { result, rerender } = renderHook(() => useMedicao('vale-anunciar'));
    result.current.marcar('comecou');
    result.current.marcar('comecou');
    rerender();
    result.current.marcar('comecou');
    result.current.marcar('resultado');
    result.current.marcar('resultado');

    expect(enviados(sendBeacon)).toEqual([
      { f: 'vale-anunciar', e: 'comecou' },
      { f: 'vale-anunciar', e: 'resultado' },
    ]);
  });

  it('uma página aberta de novo (novo carregamento) conta de novo', () => {
    const primeira = renderHook(() => useMedicao('home'));
    primeira.result.current.marcar('visita');
    primeira.unmount();
    const segunda = renderHook(() => useMedicao('home'));
    segunda.result.current.marcar('visita');
    expect(sendBeacon).toHaveBeenCalledTimes(2);
  });

  it('sem NEXT_PUBLIC_TOOLS_USO_URL não envia nada, nem por fetch', () => {
    vi.stubEnv('NEXT_PUBLIC_TOOLS_USO_URL', '');
    const fetchEspiao = vi.fn();
    vi.stubGlobal('fetch', fetchEspiao);
    const { result } = renderHook(() => useMedicao('home'));
    result.current.marcar('visita');
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchEspiao).not.toHaveBeenCalled();
  });

  it('sem sendBeacon, usa fetch no-cors, keepalive, text/plain, sem ler a resposta', () => {
    Reflect.deleteProperty(navigator, 'sendBeacon');
    const fetchEspiao = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchEspiao);
    const { result } = renderHook(() => useMedicao('servicos-compensam'));
    result.current.marcar('planilha');

    expect(fetchEspiao).toHaveBeenCalledTimes(1);
    expect(fetchEspiao).toHaveBeenCalledWith(URL_USO, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
      body: '{"f":"servicos-compensam","e":"planilha"}',
    });
  });

  it('se o sendBeacon recusa (devolve false), tenta o fetch', () => {
    sendBeacon.mockReturnValue(false);
    const fetchEspiao = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchEspiao);
    const { result } = renderHook(() => useMedicao('home'));
    result.current.marcar('convite');
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(fetchEspiao).toHaveBeenCalledTimes(1);
  });

  it('falha do sendBeacon não quebra a ferramenta', () => {
    sendBeacon.mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sem rede')));
    const { result } = renderHook(() => useMedicao('home'));
    expect(() => result.current.marcar('visita')).not.toThrow();
  });

  it('falha do fetch (promessa recusada) também é engolida: a rejeição recebe um tratador', async () => {
    Reflect.deleteProperty(navigator, 'sendBeacon');
    // Sem tratador, a rejeição ficaria solta (ruído no console do navegador). Detectar a rejeição solta
    // pelo Node não é confiável aqui (o vitest não a reporta), então se afirma que o `.catch` é registrado
    // e que, ao rodar, ele devolve a promessa resolvida.
    const rejeitada = Promise.reject(new Error('sem rede'));
    const catchEspiao = vi.spyOn(rejeitada, 'catch');
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(rejeitada));
    const { result } = renderHook(() => useMedicao('home'));
    expect(() => result.current.marcar('visita')).not.toThrow();

    expect(catchEspiao).toHaveBeenCalledTimes(1);
    const tratador = catchEspiao.mock.calls[0][0] as (motivo: unknown) => unknown;
    expect(typeof tratador).toBe('function');
    expect(() => tratador(new Error('sem rede'))).not.toThrow();
    await expect(rejeitada.catch(() => 'ok')).resolves.toBe('ok');
  });

  it('fetch que lança na hora também não quebra', () => {
    Reflect.deleteProperty(navigator, 'sendBeacon');
    vi.stubGlobal('fetch', () => {
      throw new Error('bloqueado');
    });
    const { result } = renderHook(() => useMedicao('home'));
    expect(() => result.current.marcar('visita')).not.toThrow();
  });

  it('nunca grava em localStorage nem sessionStorage', () => {
    const setItem = vi.spyOn(window.localStorage, 'setItem');
    const setSessao = vi.spyOn(window.sessionStorage, 'setItem');
    const { result } = renderHook(() => useMedicao('home'));
    result.current.marcar('visita');
    result.current.marcar('convite');
    expect(setItem).not.toHaveBeenCalled();
    expect(setSessao).not.toHaveBeenCalled();
  });

  it('marcar mantém a mesma identidade entre renders', () => {
    const { result, rerender } = renderHook(() => useMedicao('home'));
    const primeira = result.current.marcar;
    rerender();
    expect(result.current.marcar).toBe(primeira);
  });
});

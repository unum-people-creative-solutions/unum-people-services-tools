import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePngPronto, ATRASO_DO_PNG_MS } from './usePngPronto';
import { criarMatriz } from '../utils/qr/matriz';

const matrizA = criarMatriz('https://www.a.com.br', { comLogo: false });
const matrizB = criarMatriz('https://www.b.com.br', { comLogo: false });

let canvases: { largura: number; altura: number }[];
let toBlobDevolve: 'blob' | 'nulo';

beforeEach(() => {
  canvases = [];
  toBlobDevolve = 'blob';
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb, tipo) {
    canvases.push({ largura: this.width, altura: this.height });
    cb(toBlobDevolve === 'blob' ? new Blob(['png'], { type: tipo }) : null);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const esperarOPng = () => act(() => vi.advanceTimersByTimeAsync(ATRASO_DO_PNG_MS + 50));

describe('usePngPronto (TASK-F2-000, RT-QR-1)', () => {
  it('começa preparando, sem arquivo, e fica pronto com o File depois do atraso curto', async () => {
    const desenho = { cor: '#000000' };
    const { result } = renderHook(() => usePngPronto(matrizA, desenho, 'qr-code-pix.png'));
    expect(result.current.situacao).toBe('preparando');
    expect(result.current.arquivo).toBeNull();

    await esperarOPng();
    expect(result.current.situacao).toBe('pronto');
    expect(result.current.arquivo).toBeInstanceOf(File);
    expect(result.current.arquivo?.name).toBe('qr-code-pix.png');
    expect(result.current.arquivo?.type).toBe('image/png');
  });

  it('muitas mudanças seguidas geram um PNG só (debounce)', async () => {
    const { rerender } = renderHook(({ cor }) => usePngPronto(matrizA, { cor }, 'qr-code-pix.png'), {
      initialProps: { cor: '#000000' },
    });
    for (const cor of ['#0a1c82', '#0b4f8a', '#4b0f9e']) {
      await act(() => vi.advanceTimersByTimeAsync(ATRASO_DO_PNG_MS / 3));
      rerender({ cor });
    }
    await esperarOPng();
    expect(canvases).toHaveLength(1);
  });

  it('quando a matriz muda, volta a preparar e regenera o arquivo', async () => {
    const desenho = { cor: '#000000' };
    const { result, rerender } = renderHook(({ matriz }) => usePngPronto(matriz, desenho, 'qr-code-pix.png'), {
      initialProps: { matriz: matrizA },
    });
    await esperarOPng();
    const primeiro = result.current.arquivo;
    expect(primeiro).not.toBeNull();

    rerender({ matriz: matrizB });
    expect(result.current.situacao).toBe('preparando');
    expect(result.current.arquivo).toBeNull();

    await esperarOPng();
    expect(result.current.situacao).toBe('pronto');
    expect(result.current.arquivo).not.toBe(primeiro);
    expect(canvases).toHaveLength(2);
  });

  it('quando o desenho muda (frase), regenera com a altura nova', async () => {
    const { result, rerender } = renderHook(({ frase }) => usePngPronto(matrizA, { cor: '#000000', frase }, 'qr-code-pix.png'), {
      initialProps: { frase: '' },
    });
    await esperarOPng();
    rerender({ frase: 'Pague com Pix' });
    expect(result.current.arquivo).toBeNull();
    await esperarOPng();
    expect(result.current.situacao).toBe('pronto');
    expect(canvases[0].altura).toBe(1024);
    expect(canvases[1].altura).toBeGreaterThan(1024);
  });

  it('se o navegador não devolve a imagem, a situação é "falhou" (nunca fica preparando para sempre)', async () => {
    toBlobDevolve = 'nulo';
    const desenho = { cor: '#000000' };
    const { result } = renderHook(() => usePngPronto(matrizA, desenho, 'qr-code-pix.png'));
    await esperarOPng();
    expect(result.current.situacao).toBe('falhou');
    expect(result.current.arquivo).toBeNull();
  });

  it('um PNG antigo que termina depois do novo não toma o lugar dele', async () => {
    const pendentes: (() => void)[] = [];
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(function (this: HTMLCanvasElement, cb, tipo) {
      pendentes.push(() => cb(new Blob([String(pendentes.length)], { type: tipo })));
    });
    const desenho = { cor: '#000000' };
    const { result, rerender } = renderHook(({ matriz }) => usePngPronto(matriz, desenho, 'qr-code-pix.png'), {
      initialProps: { matriz: matrizA },
    });
    await esperarOPng();
    rerender({ matriz: matrizB });
    await esperarOPng();
    expect(pendentes).toHaveLength(2);

    await act(async () => pendentes[1]());
    const novo = result.current.arquivo;
    expect(result.current.situacao).toBe('pronto');
    await act(async () => pendentes[0]());
    expect(result.current.arquivo).toBe(novo);
  });
});

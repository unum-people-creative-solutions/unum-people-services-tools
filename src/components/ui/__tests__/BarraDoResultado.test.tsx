import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BarraDoResultado } from '../BarraDoResultado';

type Callback = (entradas: Array<{ isIntersecting: boolean }>) => void;

// IntersectionObserver simulado: guarda o callback para o teste dizer se o alvo está visível
let observadores: Array<{ callback: Callback; observados: Element[]; desconectado: boolean }> = [];

class IntersectionObserverFalso {
  private registro: { callback: Callback; observados: Element[]; desconectado: boolean };
  constructor(callback: Callback) {
    this.registro = { callback, observados: [], desconectado: false };
    observadores.push(this.registro);
  }
  observe = (el: Element) => {
    this.registro.observados.push(el);
  };
  unobserve = vi.fn();
  disconnect = () => {
    this.registro.desconectado = true;
  };
  takeRecords = () => [];
}

const alvoVisivel = (visivel: boolean) => {
  act(() => {
    observadores.forEach((o) => o.callback([{ isIntersecting: visivel }]));
  });
};

const montar = () =>
  render(
    <>
      <section id="resultado" aria-label="Seu resultado" />
      <BarraDoResultado rotulo="Preço mínimo" valor="R$ 163,56" alvoId="resultado" />
    </>,
  );

describe('BarraDoResultado', () => {
  beforeEach(() => {
    observadores = [];
    vi.stubGlobal('IntersectionObserver', IntersectionObserverFalso);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra o rótulo, o valor e "Ver resultado"', () => {
    montar();
    expect(screen.getByText('Preço mínimo')).toBeInTheDocument();
    expect(screen.getByText('R$ 163,56')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeInTheDocument();
  });

  it('observa o alvo pelo id', () => {
    montar();
    expect(observadores).toHaveLength(1);
    expect(observadores[0].observados).toEqual([document.getElementById('resultado')]);
  });

  it('"Ver resultado" rola até o alvo', () => {
    const rolar = vi.fn();
    montar();
    document.getElementById('resultado')!.scrollIntoView = rolar;
    fireEvent.click(screen.getByRole('button', { name: 'Ver resultado' }));
    expect(rolar).toHaveBeenCalledTimes(1);
  });

  it('some enquanto o alvo está visível e volta quando sai da tela', () => {
    montar();
    alvoVisivel(true);
    expect(screen.queryByRole('button', { name: 'Ver resultado' })).not.toBeInTheDocument();
    expect(screen.queryByText('R$ 163,56')).not.toBeInTheDocument();
    alvoVisivel(false);
    expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeInTheDocument();
  });

  it('aceita o alvo por ref', () => {
    const rolar = vi.fn();
    const ref = { current: null as HTMLElement | null };
    render(
      <>
        <section ref={ref} aria-label="alvo" />
        <BarraDoResultado rotulo="Preço mínimo" valor="Falta pouco" alvo={ref} />
      </>,
    );
    ref.current!.scrollIntoView = rolar;
    fireEvent.click(screen.getByRole('button', { name: 'Ver resultado' }));
    expect(rolar).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Falta pouco')).toBeInTheDocument();
  });

  it('desconecta o observador ao desmontar', () => {
    const { unmount } = montar();
    unmount();
    expect(observadores[0].desconectado).toBe(true);
  });

  it('sem IntersectionObserver no navegador, a barra continua aparecendo', () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('IntersectionObserver', undefined);
    montar();
    expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeInTheDocument();
  });
});

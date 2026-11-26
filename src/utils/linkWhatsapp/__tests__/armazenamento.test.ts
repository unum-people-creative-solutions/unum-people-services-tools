import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apagarLink, CHAVE_DO_LINK, gravarLink, lerLink } from '../armazenamento';

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('armazenamento do link do WhatsApp (RF-LW-21, DT-LW-07)', () => {
  it('a chave é tools-link-whatsapp:v1', () => {
    expect(CHAVE_DO_LINK).toBe('tools-link-whatsapp:v1');
  });

  it('grava só o número e a mensagem, como foram digitados, e lê de volta', () => {
    gravarLink({ numero: '(11) 98765-4321', mensagem: 'Olá!\nQuero pão' });
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DO_LINK)!)).toEqual({
      numero: '(11) 98765-4321',
      mensagem: 'Olá!\nQuero pão',
    });
    expect(lerLink()).toEqual({ numero: '(11) 98765-4321', mensagem: 'Olá!\nQuero pão' });
  });

  it('não guarda nada além do número e da mensagem', () => {
    gravarLink({ numero: '1', mensagem: 'a', extra: 'x' } as never);
    expect(Object.keys(JSON.parse(window.localStorage.getItem(CHAVE_DO_LINK)!)).sort()).toEqual(['mensagem', 'numero']);
  });

  it('sem nada guardado, lê null', () => {
    expect(lerLink()).toBeNull();
  });

  it.each(['{x', 'null', '[]', '"texto"', '42', '{}', '{"numero":1,"mensagem":2}'])(
    'dado ilegível (%s): lê null',
    (texto) => {
      window.localStorage.setItem(CHAVE_DO_LINK, texto);
      expect(lerLink()).toBeNull();
    },
  );

  it('um dos campos de outro tipo vale vazio, o outro é aproveitado', () => {
    window.localStorage.setItem(CHAVE_DO_LINK, '{"numero":"11987654321","mensagem":7}');
    expect(lerLink()).toEqual({ numero: '11987654321', mensagem: '' });
  });

  it('mensagem maior que o limite é cortada em 500', () => {
    window.localStorage.setItem(CHAVE_DO_LINK, JSON.stringify({ numero: '', mensagem: 'a'.repeat(900) }));
    expect(lerLink()?.mensagem).toHaveLength(500);
  });

  it('apagar tira a chave', () => {
    gravarLink({ numero: '11', mensagem: '' });
    apagarLink();
    expect(window.localStorage.getItem(CHAVE_DO_LINK)).toBeNull();
  });

  it('localStorage que lança erro não derruba nada', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('cota');
    });
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(lerLink()).toBeNull();
    expect(() => gravarLink({ numero: '11', mensagem: 'a' })).not.toThrow();
    expect(() => apagarLink()).not.toThrow();
  });
});

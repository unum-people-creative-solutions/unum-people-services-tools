import { describe, it, expect, beforeEach } from 'vitest';
import { levarParaOQr } from '../paraOQr';
import { CHAVE_DO_QR, lerEstado } from '../../qr/armazenamento';
import { estadoVazio } from '../../qr/estado';
import { EXEMPLOS } from '../../qr/__tests__/exemplos';

beforeEach(() => {
  window.localStorage.clear();
});

describe('levarParaOQr (RF-LW-19, DT-LW-06)', () => {
  it('com um estado do QR já guardado, vira o tipo whatsapp e mantém os outros campos e a aparência', () => {
    const antes = estadoVazio();
    antes.tipo = 'pix';
    antes.campos = { ...antes.campos, pix: EXEMPLOS.pix, link: EXEMPLOS.link };
    antes.cor = '#1D4ED8';
    antes.frase = 'Pague aqui';
    antes.nomeDoNegocio = 'Padaria Boa';
    antes.tamanho = 'A4';
    window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify(antes));

    levarParaOQr('(11) 98765-4321', 'Olá!\nQuero pão');

    const depois = lerEstado()!;
    expect(depois.tipo).toBe('whatsapp');
    expect(depois.campos.whatsapp).toEqual({ numero: '(11) 98765-4321', mensagem: 'Olá!\nQuero pão' });
    expect(depois.campos.pix).toEqual(EXEMPLOS.pix);
    expect(depois.campos.link).toEqual(EXEMPLOS.link);
    expect(depois.cor).toBe('#1D4ED8');
    expect(depois.frase).toBe('Pague aqui');
    expect(depois.nomeDoNegocio).toBe('Padaria Boa');
    expect(depois.tamanho).toBe('A4');
  });

  it('sem nada guardado, parte do estado vazio do QR', () => {
    levarParaOQr('11987654321', '');
    expect(lerEstado()).toEqual({
      ...estadoVazio(),
      tipo: 'whatsapp',
      campos: { ...estadoVazio().campos, whatsapp: { numero: '11987654321', mensagem: '' } },
    });
  });

  it('guarda o que a pessoa digitou, sem tirar espaços nem formatar', () => {
    levarParaOQr('  11 98765-4321 ', '  Oi  ');
    expect(lerEstado()!.campos.whatsapp).toEqual({ numero: '  11 98765-4321 ', mensagem: '  Oi  ' });
  });

  it('a frase que acompanha a chamada do tipo anterior passa a acompanhar a do WhatsApp', () => {
    const antes = estadoVazio();
    antes.tipo = 'pix';
    antes.frase = 'Pague com Pix';
    window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify(antes));
    levarParaOQr('11987654321', '');
    expect(lerEstado()!.frase).toBe('Chame no WhatsApp');
  });

  it('o armazenamento do navegador que falha não derruba nada', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('cota');
    };
    try {
      expect(() => levarParaOQr('11987654321', '')).not.toThrow();
    } finally {
      window.localStorage.setItem = original;
    }
  });
});

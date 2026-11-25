import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CHAVE_DO_QR, apagarEstado, gravarEstado, lerEstado, lerEstadoDoTexto } from '../armazenamento';
import { estadoVazio } from '../estado';
import { camposVazios } from '../conteudos';

describe('lerEstadoDoTexto', () => {
  it('texto ausente, ilegível ou de outro formato: abre vazio (null)', () => {
    for (const texto of [null, '', '{nao é json', 'null', '[]', '"texto"', '42']) {
      expect(lerEstadoDoTexto(texto), String(texto)).toBeNull();
    }
  });

  it('devolve o que foi guardado, campo a campo', () => {
    const estado = estadoVazio();
    estado.tipo = 'whatsapp';
    estado.campos.whatsapp.numero = '11987654321';
    estado.campos.pix.chave = '52998224725';
    estado.cor = '#0a1c82';
    estado.frase = 'Chame no WhatsApp';
    estado.nomeDoNegocio = 'Doces da Maria';
    estado.tamanho = 'A4';
    expect(lerEstadoDoTexto(JSON.stringify(estado))).toEqual(estado);
  });

  it('o que está fora do formato volta ao valor vazio, sem derrubar o resto', () => {
    const lido = lerEstadoDoTexto(
      JSON.stringify({
        tipo: 'inexistente',
        campos: {
          pix: { tipoChave: 'xyz', chave: 123, nome: 'Maria', extra: 'x' },
          whatsapp: 'texto',
          wifi: { rede: 'Loja', senha: 'abc', semSenha: 'sim' },
          redes: { rede: 'myspace', perfil: '@a' },
        },
        cor: 'vermelho',
        frase: 5,
        nomeDoNegocio: 'Loja',
        tamanho: 'A3',
      }),
    );
    expect(lido).not.toBeNull();
    expect(lido!.tipo).toBeNull();
    expect(lido!.campos.pix).toEqual({ ...camposVazios().pix, nome: 'Maria' });
    expect(lido!.campos.whatsapp).toEqual(camposVazios().whatsapp);
    expect(lido!.campos.wifi).toEqual({ rede: 'Loja', senha: 'abc', semSenha: false });
    expect(lido!.campos.redes).toEqual({ rede: 'instagram', perfil: '@a' });
    expect(lido!.cor).toBe('#000000');
    expect(lido!.frase).toBe('');
    expect(lido!.nomeDoNegocio).toBe('Loja');
    expect(lido!.tamanho).toBe('A6');
  });

  it('nunca devolve campos que não existem (o logo, por exemplo)', () => {
    const lido = lerEstadoDoTexto(JSON.stringify({ ...estadoVazio(), logo: 'data:image/png;base64,AAAA' }));
    expect(lido).not.toBeNull();
    expect(Object.keys(lido!).sort()).toEqual(['campos', 'cor', 'frase', 'nomeDoNegocio', 'tamanho', 'tipo']);
  });
});

describe('gravar, ler e apagar', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a chave é tools-qr-code:v1', () => {
    expect(CHAVE_DO_QR).toBe('tools-qr-code:v1');
  });

  it('grava e lê de volta', () => {
    const estado = estadoVazio();
    estado.tipo = 'link';
    estado.campos.link.endereco = 'www.seunegocio.com.br';
    gravarEstado(estado);
    expect(window.localStorage.getItem(CHAVE_DO_QR)).not.toBeNull();
    expect(lerEstado()).toEqual(estado);
  });

  it('apagar tira a chave', () => {
    gravarEstado({ ...estadoVazio(), tipo: 'link' });
    apagarEstado();
    expect(window.localStorage.getItem(CHAVE_DO_QR)).toBeNull();
    expect(lerEstado()).toBeNull();
  });

  it('se o armazenamento recusar a escrita, a leitura ou a remoção, nada quebra', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('cota');
    });
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => gravarEstado(estadoVazio())).not.toThrow();
    expect(() => apagarEstado()).not.toThrow();
    expect(lerEstado()).toBeNull();
  });
});

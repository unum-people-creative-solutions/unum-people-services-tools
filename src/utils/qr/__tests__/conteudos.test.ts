import { describe, it, expect } from 'vitest';
import {
  TIPOS,
  montarConteudo,
  chamadaDoTipo,
  linhaDeApoio,
  avisosDoPix,
  type CamposPorTipo,
} from '../conteudos';
import { EXEMPLOS } from './exemplos';

function com<T extends keyof CamposPorTipo>(tipo: T, mudancas: Partial<CamposPorTipo[T]>): CamposPorTipo[T] {
  return { ...EXEMPLOS[tipo], ...mudancas };
}

describe('TIPOS (RF-QR-04)', () => {
  it('tem os 11 tipos, na ordem e com os nomes da tela', () => {
    expect(TIPOS.map((t) => [t.id, t.nome, t.grupo])).toEqual([
      ['pix', 'Receber Pix', 'mais-usados'],
      ['whatsapp', 'Chamar no WhatsApp', 'mais-usados'],
      ['redes', 'Instagram e redes', 'mais-usados'],
      ['link', 'Link do site', 'mais-usados'],
      ['wifi', 'Wi-Fi da loja', 'mais-usados'],
      ['avaliacao', 'Avaliar no Google', 'mais-usados'],
      ['como-chegar', 'Como chegar', 'mais-opcoes'],
      ['contato', 'Salvar contato', 'mais-opcoes'],
      ['email', 'E-mail', 'mais-opcoes'],
      ['ligacao', 'Ligação', 'mais-opcoes'],
      ['texto', 'Texto', 'mais-opcoes'],
    ]);
  });
});

describe('montarConteudo: Receber Pix (RF-QR-06, 17 a 20)', () => {
  it('gera o BR Code oficial do manual (sem valor)', () => {
    expect(montarConteudo('pix', EXEMPLOS.pix)).toEqual({
      ok: true,
      texto:
        '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
      avisos: {},
    });
  });

  it('com valor, o campo 54 vem com ponto e 2 casas', () => {
    const r = montarConteudo('pix', com('pix', { valor: '1.250,5' }));
    expect(r.ok && r.texto).toContain('530398654071250.505802BR');
  });

  it('avisa quando nome e cidade são cortados, e o QR leva o texto cortado', () => {
    const r = montarConteudo(
      'pix',
      com('pix', { nome: 'Maria Aparecida dos Santos Oliveira', cidade: 'São João da Boa Vista' }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.texto).toContain('5925Maria Aparecida dos Santo');
      expect(r.texto).toContain('6015Sao Joao da Boa');
      expect(r.avisos).toEqual({
        nome: 'O Pix aceita até 25 letras no nome. No QR vai: Maria Aparecida dos Santo',
        cidade: 'O Pix aceita até 15 letras na cidade. No QR vai: Sao Joao da Boa',
      });
    }
  });

  it('erros: chave, nome vazio, cidade vazia e valor, todos de uma vez', () => {
    expect(
      montarConteudo('pix', { tipoChave: 'cpf', chave: '123', nome: ' ', cidade: '', valor: 'abc' }),
    ).toEqual({
      ok: false,
      erros: {
        chave: 'Esse CPF não existe. Confira os números.',
        nome: 'Preencha o nome de quem recebe.',
        cidade: 'Preencha a cidade.',
        valor: 'Digite o valor em reais. Exemplo: 25,00',
      },
    });
  });

  it('chave de celular vira +55 dentro do BR Code', () => {
    const r = montarConteudo('pix', com('pix', { tipoChave: 'celular', chave: '(11) 98765-4321' }));
    expect(r.ok && r.texto).toContain('0114+5511987654321');
  });

  it('avisosDoPix devolve os avisos mesmo com outros campos inválidos', () => {
    expect(avisosDoPix(com('pix', { chave: '', nome: 'A'.repeat(30) }))).toEqual({
      nome: `O Pix aceita até 25 letras no nome. No QR vai: ${'A'.repeat(25)}`,
    });
  });
});

describe('montarConteudo: Chamar no WhatsApp (RF-QR-07)', () => {
  it('com mensagem codificada', () => {
    expect(montarConteudo('whatsapp', EXEMPLOS.whatsapp)).toEqual({
      ok: true,
      texto:
        'https://wa.me/5511987654321?text=Ol%C3%A1!%20Vim%20pelo%20QR%20code%20e%20quero%20saber%20mais.',
      avisos: {},
    });
  });

  it('sem mensagem, só o número', () => {
    const r = montarConteudo('whatsapp', com('whatsapp', { mensagem: '' }));
    expect(r.ok && r.texto).toBe('https://wa.me/5511987654321');
  });

  it('erro de número', () => {
    expect(montarConteudo('whatsapp', com('whatsapp', { numero: '1234' }))).toEqual({
      ok: false,
      erros: { numero: 'Digite o número com DDD. Exemplo: (11) 98765-4321' },
    });
  });
});

describe('montarConteudo: Instagram e redes (RF-QR-08)', () => {
  const texto = (rede: CamposPorTipo['redes']['rede'], perfil: string) => {
    const r = montarConteudo('redes', { rede, perfil });
    return r.ok ? r.texto : r.erros;
  };
  const ERRO = { perfil: 'Digite o seu @ (exemplo: @seunegocio) ou cole o link do perfil.' };

  it('monta o endereço de cada rede a partir do @', () => {
    expect(texto('instagram', '@seunegocio')).toBe('https://www.instagram.com/seunegocio/');
    expect(texto('tiktok', 'seu.negocio')).toBe('https://www.tiktok.com/@seu.negocio');
    expect(texto('facebook', '@seu_negocio')).toBe('https://www.facebook.com/seu_negocio');
    expect(texto('youtube', '@seu-negocio')).toBe('https://www.youtube.com/@seu-negocio');
  });

  it('com link, usa o link e põe https:// se faltar', () => {
    expect(texto('instagram', 'https://www.instagram.com/outro/')).toBe('https://www.instagram.com/outro/');
    expect(texto('facebook', 'facebook.com/minhapagina')).toBe('https://facebook.com/minhapagina');
  });

  it('"Outra" exige link', () => {
    expect(texto('outra', 'https://linktr.ee/seunegocio')).toBe('https://linktr.ee/seunegocio');
    expect(texto('outra', '@seunegocio')).toEqual(ERRO);
  });

  it('erro: vazio, espaço, caractere inválido ou mais de 30 caracteres', () => {
    expect(texto('instagram', '')).toEqual(ERRO);
    expect(texto('instagram', '@seu negocio')).toEqual(ERRO);
    expect(texto('instagram', '@seu$negocio')).toEqual(ERRO);
    expect(texto('instagram', `@${'a'.repeat(31)}`)).toEqual(ERRO);
    expect(texto('instagram', `@${'a'.repeat(30)}`)).toBe(`https://www.instagram.com/${'a'.repeat(30)}/`);
  });
});

describe('montarConteudo: Link do site (RF-QR-09)', () => {
  const ERRO = { endereco: 'Confira o endereço. Exemplo: www.seunegocio.com.br' };

  it('prefixa https:// quando falta e apara espaços', () => {
    expect(montarConteudo('link', { endereco: '  www.seunegocio.com.br  ' })).toEqual({
      ok: true,
      texto: 'https://www.seunegocio.com.br',
      avisos: {},
    });
  });

  it('mantém o esquema digitado e o caminho', () => {
    const r = montarConteudo('link', { endereco: 'http://seunegocio.com.br/cardapio?mesa=1' });
    expect(r.ok && r.texto).toBe('http://seunegocio.com.br/cardapio?mesa=1');
  });

  it('erro: sem ponto no host, com espaço ou vazio', () => {
    expect(montarConteudo('link', { endereco: 'seunegocio' })).toEqual({ ok: false, erros: ERRO });
    expect(montarConteudo('link', { endereco: 'www.seu negocio.com' })).toEqual({ ok: false, erros: ERRO });
    expect(montarConteudo('link', { endereco: '' })).toEqual({ ok: false, erros: ERRO });
    expect(montarConteudo('link', { endereco: 'javascript:alert(1)' })).toEqual({ ok: false, erros: ERRO });
  });
});

describe('montarConteudo: Wi-Fi da loja (RF-QR-10)', () => {
  it('rede com senha', () => {
    expect(montarConteudo('wifi', EXEMPLOS.wifi)).toEqual({
      ok: true,
      texto: 'WIFI:T:WPA;S:Loja da Maria;P:senha-forte-123;;',
      avisos: {},
    });
  });

  it('escapa \\ ; , " : na rede e na senha', () => {
    const r = montarConteudo('wifi', { rede: 'Café "Bom"', senha: 'abc;def,12:3\\45', semSenha: false });
    expect(r.ok && r.texto).toBe('WIFI:T:WPA;S:Café \\"Bom\\";P:abc\\;def\\,12\\:3\\\\45;;');
  });

  it('rede sem senha ignora a senha digitada', () => {
    const r = montarConteudo('wifi', { rede: 'Loja', senha: 'curta', semSenha: true });
    expect(r.ok && r.texto).toBe('WIFI:T:nopass;S:Loja;;');
  });

  it('erro: senha fora de 8 a 63 caracteres', () => {
    const erro = { ok: false, erros: { senha: 'A senha do Wi-Fi tem de 8 a 63 caracteres.' } };
    expect(montarConteudo('wifi', com('wifi', { senha: '1234567' }))).toEqual(erro);
    expect(montarConteudo('wifi', com('wifi', { senha: 'a'.repeat(64) }))).toEqual(erro);
    expect(montarConteudo('wifi', com('wifi', { senha: 'a'.repeat(63) })).ok).toBe(true);
  });

  it('erro: rede vazia ou com mais de 32 caracteres', () => {
    const r1 = montarConteudo('wifi', com('wifi', { rede: '  ' }));
    expect(r1.ok).toBe(false);
    expect(!r1.ok && Object.keys(r1.erros)).toEqual(['rede']);
    const r2 = montarConteudo('wifi', com('wifi', { rede: 'a'.repeat(33) }));
    expect(!r2.ok && Object.keys(r2.erros)).toEqual(['rede']);
    expect(montarConteudo('wifi', com('wifi', { rede: 'a'.repeat(32) })).ok).toBe(true);
  });
});

describe('montarConteudo: Avaliar no Google (RF-QR-11)', () => {
  const ERRO = {
    link: 'Esse não parece o link de avaliação do Google. Veja no guia como pegar o link.',
  };

  it.each([
    'https://g.page/r/CabcDEF123/review',
    'https://maps.app.goo.gl/abc123',
    'https://goo.gl/maps/abc',
    'https://www.google.com/maps/place/Loja',
    'https://search.google.com.br/local/writereview?placeid=x',
    'https://google.com/maps',
  ])('aceita %s', (link) => {
    expect(montarConteudo('avaliacao', { link })).toEqual({ ok: true, texto: link, avisos: {} });
  });

  it.each([
    'https://exemplo.com.br/avaliar',
    'https://evilgoogle.com/x',
    'https://google.com.evil.com/x',
    'http://g.page/r/abc/review',
    'g.page nao e link',
    '',
  ])('recusa %s', (link) => {
    expect(montarConteudo('avaliacao', { link })).toEqual({ ok: false, erros: ERRO });
  });
});

describe('montarConteudo: Como chegar (RF-QR-12)', () => {
  it('endereço em texto vira busca no Google Maps', () => {
    expect(montarConteudo('como-chegar', { endereco: 'Rua das Flores, 100 - Centro' })).toEqual({
      ok: true,
      texto:
        'https://www.google.com/maps/search/?api=1&query=Rua%20das%20Flores%2C%20100%20-%20Centro',
      avisos: {},
    });
  });

  it('link http(s) é usado como está', () => {
    const r = montarConteudo('como-chegar', { endereco: 'https://maps.app.goo.gl/abc123' });
    expect(r.ok && r.texto).toBe('https://maps.app.goo.gl/abc123');
  });

  it('erro: vazio', () => {
    const r = montarConteudo('como-chegar', { endereco: '   ' });
    expect(r.ok).toBe(false);
    expect(!r.ok && Object.keys(r.erros)).toEqual(['endereco']);
  });
});

describe('montarConteudo: Salvar contato (RF-QR-13)', () => {
  it('vCard 3.0 completo, com CRLF e escapes', () => {
    const r = montarConteudo('contato', com('contato', { negocio: 'Doces, Bolos; Cia' }));
    expect(r).toEqual({
      ok: true,
      texto: [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Silva;Maria da;;;',
        'FN:Maria da Silva',
        'ORG:Doces\\, Bolos\\; Cia',
        'TEL;TYPE=CELL:+5511987654321',
        'EMAIL:maria@doces.com.br',
        'URL:https://www.doces.com.br',
        'END:VCARD',
      ].join('\r\n'),
      avisos: {},
    });
  });

  it('só nome e e-mail: nome de uma palavra e sem as linhas vazias', () => {
    const r = montarConteudo('contato', {
      nome: 'Maria',
      negocio: '',
      celular: '',
      email: 'maria@doces.com.br',
      site: '',
    });
    expect(r.ok && r.texto).toBe(
      'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Maria;;;;\r\nFN:Maria\r\nEMAIL:maria@doces.com.br\r\nEND:VCARD',
    );
  });

  it.each(['a?b@x.com', 'a&b@x.com', 'a#b@x.com', 'a/b@x.com', 'a b@x.com'])(
    'erro: e-mail com ? & # espaço ou / (%s)',
    (email) => {
      expect(montarConteudo('contato', com('contato', { email }))).toEqual({
        ok: false,
        erros: { email: 'Confira o e-mail. Exemplo: contato@seunegocio.com.br' },
      });
    },
  );

  it('erro: sem celular e sem e-mail', () => {
    expect(montarConteudo('contato', { nome: 'Maria', negocio: '', celular: '', email: '', site: '' })).toEqual({
      ok: false,
      erros: { celular: 'Preencha o celular ou o e-mail.' },
    });
  });

  it('erro: nome vazio', () => {
    const r = montarConteudo('contato', com('contato', { nome: ' ' }));
    expect(r.ok).toBe(false);
    expect(!r.ok && Object.keys(r.erros)).toEqual(['nome']);
  });

  it('erro: celular com formato inválido', () => {
    expect(montarConteudo('contato', com('contato', { celular: '123' }))).toEqual({
      ok: false,
      erros: { celular: 'Digite o celular com DDD. Exemplo: (11) 98765-4321' },
    });
  });
});

describe('montarConteudo: E-mail (RF-QR-14)', () => {
  it('só o endereço', () => {
    const r = montarConteudo('email', { email: 'contato@seunegocio.com.br', assunto: '', mensagem: '' });
    expect(r.ok && r.texto).toBe('mailto:contato@seunegocio.com.br');
  });

  it('assunto e mensagem codificados', () => {
    const r = montarConteudo('email', EXEMPLOS.email);
    expect(r.ok && r.texto).toBe(
      'mailto:contato@seunegocio.com.br?subject=Or%C3%A7amento&body=Quero%20um%20or%C3%A7amento.',
    );
  });

  it('só os parâmetros preenchidos', () => {
    const r = montarConteudo('email', com('email', { assunto: '' }));
    expect(r.ok && r.texto).toBe(
      'mailto:contato@seunegocio.com.br?body=Quero%20um%20or%C3%A7amento.',
    );
  });

  it('erro de e-mail', () => {
    expect(montarConteudo('email', com('email', { email: 'contato@' }))).toEqual({
      ok: false,
      erros: { email: 'Confira o e-mail. Exemplo: contato@seunegocio.com.br' },
    });
  });

  it('assunto e mensagem com & e ? saem como %26 e %3F (não quebram os parâmetros)', () => {
    const r = montarConteudo('email', com('email', { assunto: 'Preço & prazo?', mensagem: 'Qual o valor? Pão & café' }));
    expect(r.ok && r.texto).toBe(
      'mailto:contato@seunegocio.com.br?subject=Pre%C3%A7o%20%26%20prazo%3F&body=Qual%20o%20valor%3F%20P%C3%A3o%20%26%20caf%C3%A9',
    );
    expect(r.ok && r.texto.split('?')).toHaveLength(2);
    expect(r.ok && r.texto.split('&')).toHaveLength(2);
  });

  it.each(['a?b@x.com', 'a&b@x.com', 'a#b@x.com', 'a/b@x.com', 'a b@x.com', 'ab@x.com?subject=x', 'ab@x/y.com'])(
    'recusa e-mail com ? & # espaço ou / (%s)',
    (email) => {
      expect(montarConteudo('email', com('email', { email }))).toEqual({
        ok: false,
        erros: { email: 'Confira o e-mail. Exemplo: contato@seunegocio.com.br' },
      });
    },
  );
});

describe('montarConteudo: Ligação (RF-QR-15)', () => {
  it('tel:+55 com o número nacional', () => {
    expect(montarConteudo('ligacao', EXEMPLOS.ligacao)).toEqual({
      ok: true,
      texto: 'tel:+551134567890',
      avisos: {},
    });
  });

  it('erro de telefone', () => {
    expect(montarConteudo('ligacao', { telefone: '3456' })).toEqual({
      ok: false,
      erros: { telefone: 'Digite o telefone com DDD. Exemplo: (11) 98765-4321' },
    });
  });
});

describe('montarConteudo: Texto (RF-QR-16)', () => {
  it('devolve o texto', () => {
    const r = montarConteudo('texto', EXEMPLOS.texto);
    expect(r.ok && r.texto).toBe(EXEMPLOS.texto.texto);
  });

  it('aceita 300 caracteres e recusa 301 ou vazio', () => {
    expect(montarConteudo('texto', { texto: 'a'.repeat(300) }).ok).toBe(true);
    for (const texto of ['a'.repeat(301), '', '   ']) {
      const r = montarConteudo('texto', { texto });
      expect(r.ok).toBe(false);
      expect(!r.ok && Object.keys(r.erros)).toEqual(['texto']);
    }
  });
});

describe('chamadaDoTipo e linhaDeApoio (RF-QR-37)', () => {
  it('chamadas', () => {
    expect(chamadaDoTipo('pix', EXEMPLOS.pix)).toBe('Pague com Pix');
    expect(chamadaDoTipo('whatsapp', EXEMPLOS.whatsapp)).toBe('Chame no WhatsApp');
    expect(chamadaDoTipo('redes', com('redes', { rede: 'instagram' }))).toBe('Siga a gente no Instagram');
    expect(chamadaDoTipo('redes', com('redes', { rede: 'tiktok' }))).toBe('Siga a gente no TikTok');
    expect(chamadaDoTipo('redes', com('redes', { rede: 'facebook' }))).toBe('Siga a gente no Facebook');
    expect(chamadaDoTipo('redes', com('redes', { rede: 'youtube' }))).toBe('Siga a gente no YouTube');
    expect(chamadaDoTipo('redes', com('redes', { rede: 'outra' }))).toBe('Siga a gente');
    expect(chamadaDoTipo('link', EXEMPLOS.link)).toBe('Visite nosso site');
    expect(chamadaDoTipo('wifi', EXEMPLOS.wifi)).toBe('Wi-Fi grátis');
    expect(chamadaDoTipo('avaliacao', EXEMPLOS.avaliacao)).toBe('Avalie a gente no Google');
    expect(chamadaDoTipo('como-chegar', EXEMPLOS['como-chegar'])).toBe('Como chegar');
    expect(chamadaDoTipo('contato', EXEMPLOS.contato)).toBe('Salve nosso contato');
    expect(chamadaDoTipo('email', EXEMPLOS.email)).toBe('Fale com a gente por e-mail');
    expect(chamadaDoTipo('ligacao', EXEMPLOS.ligacao)).toBe('Ligue para a gente');
    expect(chamadaDoTipo('texto', EXEMPLOS.texto)).toBe('Aponte a câmera');
  });

  it('Pix: chave como digitada e aviso em negrito', () => {
    expect(linhaDeApoio('pix', com('pix', { tipoChave: 'cpf', chave: ' 529.982.247-25 ' }))).toEqual([
      { texto: 'Chave Pix: 529.982.247-25' },
      { texto: 'Confira o nome antes de pagar.', negrito: true },
    ]);
  });

  it('WhatsApp e Ligação: telefone formatado', () => {
    expect(linhaDeApoio('whatsapp', EXEMPLOS.whatsapp)).toEqual([{ texto: '(11) 98765-4321' }]);
    expect(linhaDeApoio('ligacao', EXEMPLOS.ligacao)).toEqual([{ texto: '(11) 3456-7890' }]);
  });

  it('Redes: @usuário só quando foi digitado @', () => {
    expect(linhaDeApoio('redes', com('redes', { perfil: '@seunegocio' }))).toEqual([{ texto: '@seunegocio' }]);
    expect(linhaDeApoio('redes', com('redes', { perfil: 'seunegocio' }))).toEqual([]);
    expect(linhaDeApoio('redes', com('redes', { perfil: 'https://instagram.com/x' }))).toEqual([]);
  });

  it('Link: o endereço sem https://', () => {
    expect(linhaDeApoio('link', EXEMPLOS.link)).toEqual([{ texto: 'www.seunegocio.com.br' }]);
    expect(linhaDeApoio('link', { endereco: 'http://seunegocio.com.br/x' })).toEqual([
      { texto: 'seunegocio.com.br/x' },
    ]);
  });

  it('Wi-Fi: rede e senha; sem senha só a rede', () => {
    expect(linhaDeApoio('wifi', EXEMPLOS.wifi)).toEqual([
      { texto: 'Rede: Loja da Maria' },
      { texto: 'Senha: senha-forte-123' },
    ]);
    expect(linhaDeApoio('wifi', { rede: 'Loja', senha: 'x', semSenha: true })).toEqual([
      { texto: 'Rede: Loja' },
    ]);
  });

  it('Como chegar: o endereço só quando foi digitado texto', () => {
    expect(linhaDeApoio('como-chegar', EXEMPLOS['como-chegar'])).toEqual([
      { texto: 'Rua das Flores, 100 - Centro, São Paulo' },
    ]);
    expect(linhaDeApoio('como-chegar', { endereco: 'https://maps.app.goo.gl/abc' })).toEqual([]);
  });

  it('Contato: o nome; E-mail: o e-mail', () => {
    expect(linhaDeApoio('contato', EXEMPLOS.contato)).toEqual([{ texto: 'Maria da Silva' }]);
    expect(linhaDeApoio('email', EXEMPLOS.email)).toEqual([{ texto: 'contato@seunegocio.com.br' }]);
  });

  it('Avaliar no Google e Texto: sem linha de apoio', () => {
    expect(linhaDeApoio('avaliacao', EXEMPLOS.avaliacao)).toEqual([]);
    expect(linhaDeApoio('texto', EXEMPLOS.texto)).toEqual([]);
  });
});

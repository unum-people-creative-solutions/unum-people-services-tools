// Texto que vai dentro do QR de cada tipo (RF-QR-06 a 16) e textos da plaquinha (RF-QR-37).
// Funções puras: tudo acontece no navegador e nada sai do aparelho.

import { formatarTelefone, linkDoWhatsapp, normalizarCelular } from '../whatsapp';
import {
  LIMITE_CIDADE_PIX,
  LIMITE_NOME_PIX,
  conferirChavePix,
  converterValor,
  limparTextoPix,
  montarBrCode,
  type TipoChavePix,
} from './pix';

export type TipoId =
  | 'pix'
  | 'whatsapp'
  | 'redes'
  | 'link'
  | 'wifi'
  | 'avaliacao'
  | 'como-chegar'
  | 'contato'
  | 'email'
  | 'ligacao'
  | 'texto';

export interface TipoDeQr {
  id: TipoId;
  /** Nome literal da tela. */
  nome: string;
  grupo: 'mais-usados' | 'mais-opcoes';
}

/** Na ordem da tela (RF-QR-04): os 6 mais usados e depois "Mais opções". */
export const TIPOS: readonly TipoDeQr[] = [
  { id: 'pix', nome: 'Receber Pix', grupo: 'mais-usados' },
  { id: 'whatsapp', nome: 'Chamar no WhatsApp', grupo: 'mais-usados' },
  { id: 'redes', nome: 'Instagram e redes', grupo: 'mais-usados' },
  { id: 'link', nome: 'Link do site', grupo: 'mais-usados' },
  { id: 'wifi', nome: 'Wi-Fi da loja', grupo: 'mais-usados' },
  { id: 'avaliacao', nome: 'Avaliar no Google', grupo: 'mais-usados' },
  { id: 'como-chegar', nome: 'Como chegar', grupo: 'mais-opcoes' },
  { id: 'contato', nome: 'Salvar contato', grupo: 'mais-opcoes' },
  { id: 'email', nome: 'E-mail', grupo: 'mais-opcoes' },
  { id: 'ligacao', nome: 'Ligação', grupo: 'mais-opcoes' },
  { id: 'texto', nome: 'Texto', grupo: 'mais-opcoes' },
];

export type RedeId = 'instagram' | 'tiktok' | 'facebook' | 'youtube' | 'outra';

/** Opções do campo "Rede" (RF-QR-08). */
export const REDES: readonly { id: RedeId; nome: string }[] = [
  { id: 'instagram', nome: 'Instagram' },
  { id: 'tiktok', nome: 'TikTok' },
  { id: 'facebook', nome: 'Facebook' },
  { id: 'youtube', nome: 'YouTube' },
  { id: 'outra', nome: 'Outra' },
];

/** Opções do campo "Tipo da chave" (RF-QR-06). */
export const TIPOS_DE_CHAVE_PIX: readonly { id: TipoChavePix; nome: string }[] = [
  { id: 'cpf', nome: 'CPF' },
  { id: 'cnpj', nome: 'CNPJ' },
  { id: 'celular', nome: 'Celular' },
  { id: 'email', nome: 'E-mail' },
  { id: 'aleatoria', nome: 'Chave aleatória' },
];

export const LIMITE_TEXTO = 300;

/** Todos os campos são o que a pessoa digitou (texto), prontos para o formulário e o `localStorage`. */
export interface CamposPorTipo {
  pix: { tipoChave: TipoChavePix; chave: string; nome: string; cidade: string; valor: string };
  whatsapp: { numero: string; mensagem: string };
  redes: { rede: RedeId; perfil: string };
  link: { endereco: string };
  wifi: { rede: string; senha: string; semSenha: boolean };
  avaliacao: { link: string };
  'como-chegar': { endereco: string };
  contato: { nome: string; negocio: string; celular: string; email: string; site: string };
  email: { email: string; assunto: string; mensagem: string };
  ligacao: { telefone: string };
  texto: { texto: string };
}

/** Campos de cada tipo, vazios (valores iniciais da tela). */
export function camposVazios(): CamposPorTipo {
  return {
    pix: { tipoChave: 'cpf', chave: '', nome: '', cidade: '', valor: '' },
    whatsapp: { numero: '', mensagem: '' },
    redes: { rede: 'instagram', perfil: '' },
    link: { endereco: '' },
    wifi: { rede: '', senha: '', semSenha: false },
    avaliacao: { link: '' },
    'como-chegar': { endereco: '' },
    contato: { nome: '', negocio: '', celular: '', email: '', site: '' },
    email: { email: '', assunto: '', mensagem: '' },
    ligacao: { telefone: '' },
    texto: { texto: '' },
  };
}

/** `avisos`: texto de aviso por campo (hoje só o corte do nome e da cidade do Pix). */
export type ResultadoConteudo =
  | { ok: true; texto: string; avisos: Record<string, string> }
  | { ok: false; erros: Record<string, string> };

export interface LinhaDeApoio {
  texto: string;
  negrito?: boolean;
}

// ---------------------------------------------------------------- auxiliares

const ERRO_LINK = 'Confira o endereço. Exemplo: www.seunegocio.com.br';
const ERRO_CELULAR = 'Digite o celular com DDD. Exemplo: (11) 98765-4321';
const ERRO_EMAIL = 'Confira o e-mail. Exemplo: contato@seunegocio.com.br';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function certo(texto: string, avisos: Record<string, string> = {}): ResultadoConteudo {
  return { ok: true, texto, avisos };
}

function resultado(erros: Record<string, string>, texto: () => string): ResultadoConteudo {
  return Object.keys(erros).length > 0 ? { ok: false, erros } : certo(texto());
}

/** Aparar, prefixar `https://` se faltar esquema; só http/https e host com ponto, sem espaço. */
function normalizarLink(texto: string): string | null {
  const t = texto.trim();
  if (t === '' || /\s/.test(t)) return null;
  const comEsquema = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const url = new URL(comEsquema);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return comEsquema;
  } catch {
    return null;
  }
}

function semEsquema(link: string): string {
  return link.replace(/^https?:\/\//i, '');
}

function escapar(texto: string, caracteres: RegExp): string {
  return texto.replace(caracteres, '\\$&');
}

function ehLink(texto: string): boolean {
  return /^https?:/i.test(texto) || (texto.includes('.') && texto.includes('/'));
}

const USUARIO = /^[A-Za-z0-9._-]{1,30}$/;

/** Usuário digitado com `@` (ou sem), nunca um link. */
function usuarioDe(perfil: string): string | null {
  const t = perfil.trim();
  if (ehLink(t)) return null;
  const sem = t.replace(/^@/, '');
  return USUARIO.test(sem) ? sem : null;
}

// ---------------------------------------------------------------- avisos do Pix

/** Avisos de corte do nome e da cidade, independentes dos outros campos. */
export function avisosDoPix(campos: CamposPorTipo['pix']): Record<string, string> {
  const avisos: Record<string, string> = {};
  const nome = limparTextoPix(campos.nome, LIMITE_NOME_PIX);
  const cidade = limparTextoPix(campos.cidade, LIMITE_CIDADE_PIX);
  if (nome.cortado) {
    avisos.nome = `O Pix aceita até ${LIMITE_NOME_PIX} letras no nome. No QR vai: ${nome.texto}`;
  }
  if (cidade.cortado) {
    avisos.cidade = `O Pix aceita até ${LIMITE_CIDADE_PIX} letras na cidade. No QR vai: ${cidade.texto}`;
  }
  return avisos;
}

// ---------------------------------------------------------------- montadores

const HOSTS_DO_GOOGLE = ['g.page', 'maps.app.goo.gl', 'goo.gl'];

function hostDoGoogle(host: string): boolean {
  if (HOSTS_DO_GOOGLE.includes(host)) return true;
  return ['google.com', 'google.com.br'].some((base) => host === base || host.endsWith(`.${base}`));
}

const MONTADORES: { [K in TipoId]: (campos: CamposPorTipo[K]) => ResultadoConteudo } = {
  pix(campos) {
    const erros: Record<string, string> = {};
    const chave = conferirChavePix(campos.tipoChave, campos.chave);
    if (!chave.ok) erros.chave = chave.erro;
    const nome = limparTextoPix(campos.nome, LIMITE_NOME_PIX);
    if (nome.texto === '') erros.nome = 'Preencha o nome de quem recebe.';
    const cidade = limparTextoPix(campos.cidade, LIMITE_CIDADE_PIX);
    if (cidade.texto === '') erros.cidade = 'Preencha a cidade.';
    const valor = converterValor(campos.valor);
    if (!valor.ok) erros.valor = valor.erro;

    if (Object.keys(erros).length > 0 || !chave.ok || !valor.ok) return { ok: false, erros };
    return certo(
      montarBrCode({ chave: chave.chave, nome: nome.texto, cidade: cidade.texto, valor: valor.valor }),
      avisosDoPix(campos),
    );
  },

  whatsapp(campos) {
    const numero = normalizarCelular(campos.numero);
    if (!numero) {
      return { ok: false, erros: { numero: 'Digite o número com DDD. Exemplo: (11) 98765-4321' } };
    }
    return certo(linkDoWhatsapp(numero, campos.mensagem));
  },

  redes(campos) {
    const erro = {
      ok: false as const,
      erros: { perfil: 'Digite o seu @ (exemplo: @seunegocio) ou cole o link do perfil.' },
    };
    const perfil = campos.perfil.trim();
    if (ehLink(perfil)) {
      const link = normalizarLink(perfil);
      return link ? certo(link) : erro;
    }
    const usuario = usuarioDe(perfil);
    if (!usuario || campos.rede === 'outra') return erro;
    const enderecos: Record<Exclude<RedeId, 'outra'>, string> = {
      instagram: `https://www.instagram.com/${usuario}/`,
      tiktok: `https://www.tiktok.com/@${usuario}`,
      facebook: `https://www.facebook.com/${usuario}`,
      youtube: `https://www.youtube.com/@${usuario}`,
    };
    return certo(enderecos[campos.rede]);
  },

  link(campos) {
    const link = normalizarLink(campos.endereco);
    return link ? certo(link) : { ok: false, erros: { endereco: ERRO_LINK } };
  },

  wifi(campos) {
    const erros: Record<string, string> = {};
    const rede = campos.rede.trim();
    if (rede.length < 1 || rede.length > 32) {
      erros.rede = 'Digite o nome da rede (de 1 a 32 caracteres).';
    }
    if (!campos.semSenha && (campos.senha.length < 8 || campos.senha.length > 63)) {
      erros.senha = 'A senha do Wi-Fi tem de 8 a 63 caracteres.';
    }
    const esc = (t: string) => escapar(t, /[\\;,":]/g);
    return resultado(erros, () =>
      campos.semSenha
        ? `WIFI:T:nopass;S:${esc(rede)};;`
        : `WIFI:T:WPA;S:${esc(rede)};P:${esc(campos.senha)};;`,
    );
  },

  avaliacao(campos) {
    const erro = {
      ok: false as const,
      erros: {
        link: 'Esse não parece o link de avaliação do Google. Veja no guia como pegar o link.',
      },
    };
    const link = normalizarLink(campos.link);
    if (!link) return erro;
    const url = new URL(link);
    return url.protocol === 'https:' && hostDoGoogle(url.hostname) ? certo(link) : erro;
  },

  'como-chegar'(campos) {
    const endereco = campos.endereco.trim();
    if (endereco === '') {
      return { ok: false, erros: { endereco: 'Digite o endereço ou cole o link do Google Maps.' } };
    }
    if (/^https?:\/\//i.test(endereco)) return certo(endereco);
    return certo(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`);
  },

  contato(campos) {
    const erros: Record<string, string> = {};
    const nome = campos.nome.trim();
    if (nome === '') erros.nome = 'Preencha o nome.';

    const celularDigitado = campos.celular.trim();
    const celular = celularDigitado ? normalizarCelular(celularDigitado) : null;
    if (celularDigitado && !celular) erros.celular = ERRO_CELULAR;

    const email = campos.email.trim();
    if (email && !EMAIL.test(email)) erros.email = ERRO_EMAIL;

    if (!celularDigitado && !email) erros.celular = 'Preencha o celular ou o e-mail.';

    const siteDigitado = campos.site.trim();
    const site = siteDigitado ? normalizarLink(siteDigitado) : null;
    if (siteDigitado && !site) erros.site = ERRO_LINK;

    return resultado(erros, () => {
      const esc = (t: string) => escapar(t, /[\\,;]/g);
      const partes = nome.split(/\s+/);
      const ultimo = partes.pop() ?? '';
      const negocio = campos.negocio.trim();
      const linhas = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${esc(ultimo)};${esc(partes.join(' '))};;;`,
        `FN:${esc(nome)}`,
      ];
      if (negocio) linhas.push(`ORG:${esc(negocio)}`);
      if (celular) linhas.push(`TEL;TYPE=CELL:+55${celular}`);
      if (email) linhas.push(`EMAIL:${esc(email)}`);
      if (site) linhas.push(`URL:${esc(site)}`);
      linhas.push('END:VCARD');
      return linhas.join('\r\n');
    });
  },

  email(campos) {
    const email = campos.email.trim();
    if (!EMAIL.test(email)) return { ok: false, erros: { email: ERRO_EMAIL } };
    const parametros: string[] = [];
    const assunto = campos.assunto.trim();
    const mensagem = campos.mensagem.trim();
    if (assunto) parametros.push(`subject=${encodeURIComponent(assunto)}`);
    if (mensagem) parametros.push(`body=${encodeURIComponent(mensagem)}`);
    return certo(`mailto:${email}${parametros.length ? `?${parametros.join('&')}` : ''}`);
  },

  ligacao(campos) {
    const telefone = normalizarCelular(campos.telefone);
    if (!telefone) {
      return {
        ok: false,
        erros: { telefone: 'Digite o telefone com DDD. Exemplo: (11) 98765-4321' },
      };
    }
    return certo(`tel:+55${telefone}`);
  },

  texto(campos) {
    const tamanho = Array.from(campos.texto).length;
    if (campos.texto.trim() === '') {
      return { ok: false, erros: { texto: 'Digite o texto do QR code.' } };
    }
    if (tamanho > LIMITE_TEXTO) {
      return { ok: false, erros: { texto: `O texto pode ter até ${LIMITE_TEXTO} caracteres.` } };
    }
    return certo(campos.texto);
  },
};

/** Texto do QR do tipo, ou os erros por campo (mensagens literais da spec). */
export function montarConteudo<T extends TipoId>(tipo: T, campos: CamposPorTipo[T]): ResultadoConteudo {
  return (MONTADORES[tipo] as (c: CamposPorTipo[T]) => ResultadoConteudo)(campos);
}

// ---------------------------------------------------------------- plaquinha (RF-QR-37)

const CHAMADAS_FIXAS: Record<Exclude<TipoId, 'redes'>, string> = {
  pix: 'Pague com Pix',
  whatsapp: 'Chame no WhatsApp',
  link: 'Visite nosso site',
  wifi: 'Wi-Fi grátis',
  avaliacao: 'Avalie a gente no Google',
  'como-chegar': 'Como chegar',
  contato: 'Salve nosso contato',
  email: 'Fale com a gente por e-mail',
  ligacao: 'Ligue para a gente',
  texto: 'Aponte a câmera',
};

/** Chamada em cima do QR na plaquinha e frase sugerida embaixo do QR. */
export function chamadaDoTipo<T extends TipoId>(tipo: T, campos: CamposPorTipo[T]): string {
  if (tipo !== 'redes') return CHAMADAS_FIXAS[tipo as Exclude<TipoId, 'redes'>];
  const { rede } = campos as CamposPorTipo['redes'];
  if (rede === 'outra') return 'Siga a gente';
  const nome = REDES.find((r) => r.id === rede)?.nome ?? '';
  return `Siga a gente no ${nome}`;
}

const APOIOS: { [K in TipoId]: (campos: CamposPorTipo[K]) => LinhaDeApoio[] } = {
  pix: (c) => [
    { texto: `Chave Pix: ${c.chave.trim()}` },
    { texto: 'Confira o nome antes de pagar.', negrito: true },
  ],
  whatsapp: (c) => {
    const numero = normalizarCelular(c.numero);
    return numero ? [{ texto: formatarTelefone(numero) }] : [];
  },
  redes: (c) => {
    const perfil = c.perfil.trim();
    const usuario = perfil.startsWith('@') ? usuarioDe(perfil) : null;
    return usuario ? [{ texto: `@${usuario}` }] : [];
  },
  link: (c) => {
    const link = normalizarLink(c.endereco);
    return link ? [{ texto: semEsquema(link) }] : [];
  },
  wifi: (c) => {
    const linhas: LinhaDeApoio[] = [{ texto: `Rede: ${c.rede.trim()}` }];
    if (!c.semSenha) linhas.push({ texto: `Senha: ${c.senha}` });
    return linhas;
  },
  avaliacao: () => [],
  'como-chegar': (c) => {
    const endereco = c.endereco.trim();
    return endereco && !/^https?:\/\//i.test(endereco) ? [{ texto: endereco }] : [];
  },
  contato: (c) => (c.nome.trim() ? [{ texto: c.nome.trim() }] : []),
  email: (c) => (c.email.trim() ? [{ texto: c.email.trim() }] : []),
  ligacao: (c) => {
    const telefone = normalizarCelular(c.telefone);
    return telefone ? [{ texto: formatarTelefone(telefone) }] : [];
  },
  texto: () => [],
};

/** Linhas de apoio embaixo do QR na plaquinha (vazio quando o tipo não tem). */
export function linhaDeApoio<T extends TipoId>(tipo: T, campos: CamposPorTipo[T]): LinhaDeApoio[] {
  return (APOIOS[tipo] as (c: CamposPorTipo[T]) => LinhaDeApoio[])(campos);
}

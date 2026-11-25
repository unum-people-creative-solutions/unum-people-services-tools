// Quais erros a tela mostra e quando (RF-QR spec §3): embaixo do campo, depois que a pessoa
// sai dele, ou quando um campo obrigatório está vazio e os outros obrigatórios já foram preenchidos.

import type { CamposPorTipo, TipoId } from './conteudos';

type Valores = Record<string, unknown>;

const vazio = (valor: unknown) => typeof valor !== 'string' || valor.trim() === '';

/** Campos obrigatórios de cada tipo, dado o que já foi digitado. */
const OBRIGATORIOS: { [K in TipoId]: (campos: CamposPorTipo[K]) => string[] } = {
  pix: () => ['chave', 'nome', 'cidade'],
  whatsapp: () => ['numero'],
  redes: () => ['perfil'],
  link: () => ['endereco'],
  wifi: (c) => (c.semSenha ? ['rede'] : ['rede', 'senha']),
  avaliacao: () => ['link'],
  'como-chegar': () => ['endereco'],
  // Pelo menos celular ou e-mail: sem nenhum dos dois, o celular é o campo que fica faltando.
  contato: (c) => (vazio(c.celular) && vazio(c.email) ? ['nome', 'celular'] : ['nome']),
  email: () => ['email'],
  ligacao: () => ['telefone'],
  texto: () => ['texto'],
};

/**
 * Dos erros do conteúdo, só os que já podem aparecer.
 * `tocados` guarda os campos de que a pessoa já saiu (chaves sem o tipo, ex.: "chave").
 */
export function errosVisiveis<T extends TipoId>(
  tipo: T,
  campos: CamposPorTipo[T],
  erros: Record<string, string>,
  tocados: ReadonlySet<string>,
): Record<string, string> {
  const valores = campos as unknown as Valores;
  const obrigatorios = (OBRIGATORIOS[tipo] as (c: CamposPorTipo[T]) => string[])(campos);
  const visiveis: Record<string, string> = {};

  for (const [campo, mensagem] of Object.entries(erros)) {
    const outros = obrigatorios.filter((o) => o !== campo);
    const faltaComOsOutrosPreenchidos =
      obrigatorios.includes(campo) &&
      vazio(valores[campo]) &&
      outros.length > 0 &&
      outros.every((o) => !vazio(valores[o]));
    if (tocados.has(campo) || faltaComOsOutrosPreenchidos) visiveis[campo] = mensagem;
  }
  return visiveis;
}

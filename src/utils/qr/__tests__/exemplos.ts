// Campos válidos de cada tipo, usados pelos testes de conteúdo e de leitura.
import type { CamposPorTipo } from '../conteudos';

export const EXEMPLOS: CamposPorTipo = {
  pix: {
    tipoChave: 'aleatoria',
    chave: '123e4567-e12b-12d1-a456-426655440000',
    nome: 'Fulano de Tal',
    cidade: 'BRASILIA',
    valor: '',
  },
  whatsapp: {
    numero: '(11) 98765-4321',
    mensagem: 'Olá! Vim pelo QR code e quero saber mais.',
  },
  redes: { rede: 'instagram', perfil: '@seunegocio' },
  link: { endereco: 'www.seunegocio.com.br' },
  wifi: { rede: 'Loja da Maria', senha: 'senha-forte-123', semSenha: false },
  avaliacao: { link: 'https://g.page/r/CabcDEF123/review' },
  'como-chegar': { endereco: 'Rua das Flores, 100 - Centro, São Paulo' },
  contato: {
    nome: 'Maria da Silva',
    negocio: 'Doces da Maria',
    celular: '(11) 98765-4321',
    email: 'maria@doces.com.br',
    site: 'www.doces.com.br',
  },
  email: {
    email: 'contato@seunegocio.com.br',
    assunto: 'Orçamento',
    mensagem: 'Quero um orçamento.',
  },
  ligacao: { telefone: '(11) 3456-7890' },
  texto: { texto: 'Bem-vindo! Horário: segunda a sexta, das 9h às 18h.' },
};

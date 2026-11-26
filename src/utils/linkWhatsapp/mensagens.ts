// Mensagens prontas e limite da mensagem do gerador de link do WhatsApp (RF-LW-09, RF-LW-10, D-LW-1, D-LW-2).

/** Teto de caracteres da mensagem (DT-LW-03). */
export const LIMITE_DA_MENSAGEM = 500;

export const MENSAGENS_PRONTAS: readonly { rotulo: string; texto: string }[] = [
  { rotulo: 'Fazer um pedido', texto: 'Olá! Quero fazer um pedido.' },
  { rotulo: 'Agendar um horário', texto: 'Olá! Quero agendar um horário. Quais dias você tem livres?' },
  { rotulo: 'Pedir orçamento', texto: 'Olá! Quero um orçamento.' },
  { rotulo: 'Saber o preço', texto: 'Olá! Quanto custa?' },
  { rotulo: 'Vi seu anúncio', texto: 'Olá! Vi seu anúncio e quero saber mais.' },
];

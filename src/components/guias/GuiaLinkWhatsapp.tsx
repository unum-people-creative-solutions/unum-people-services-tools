import React from 'react';
import { Guia, Topico, Lista, Perguntas } from './Guia';

/** Guia do Gerador de link do WhatsApp (RF-LW-23). Server Component: o texto sai no HTML, sem depender de JavaScript. */
export function GuiaLinkWhatsapp() {
  return (
    <Guia titulo="Como usar o link do WhatsApp no seu negócio">
      <Topico titulo="Mensagem que funciona">
        <p>A mensagem pronta poupa tempo de quem chama e de quem responde. Para ela funcionar:</p>
        <Lista>
          <li>Seja curta: uma ou duas frases.</li>
          <li>Diga o que o cliente quer: um pedido, um horário ou um orçamento.</li>
          <li>Não peça dados pessoais na mensagem. Se precisar, pergunte na conversa.</li>
        </Lista>
      </Topico>

      <Topico titulo="Se o link não abrir no Instagram">
        <p>
          Dentro do Instagram, alguns celulares não abrem o WhatsApp. Toque nos três pontos no canto da tela e
          escolha abrir no navegador.
        </p>
      </Topico>

      <Topico titulo="Perguntas frequentes">
        <Perguntas
          itens={[
            {
              pergunta: 'O link expira?',
              resposta:
                'Não. O link é do próprio WhatsApp e não passa por nenhum serviço nosso. Funciona enquanto o número tiver WhatsApp.',
            },
            {
              pergunta: 'Por que o link não é curto?',
              resposta:
                'Link curto precisa de um serviço no meio. Se o serviço sai do ar ou passa a cobrar, o link para. O link do WhatsApp é o oficial e não depende de ninguém.',
            },
            {
              pergunta: 'E se eu trocar de número?',
              resposta: 'Crie um link novo com o número novo e troque onde você colou o antigo.',
            },
            {
              pergunta: 'Precisa de cadastro?',
              resposta: 'Não. É grátis, sem cadastro e sem anúncio, e o que você digita não sai do seu aparelho.',
            },
          ]}
        />
      </Topico>
    </Guia>
  );
}

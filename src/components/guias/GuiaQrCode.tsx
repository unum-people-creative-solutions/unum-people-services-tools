import React from 'react';
import { Guia, Topico, Lista, ListaNumerada, Perguntas } from './Guia';

/** Guia do Gerador de QR code (RF-QR-30). Server Component: o texto sai no HTML, sem depender de JavaScript. */
export function GuiaQrCode() {
  return (
    <Guia titulo="Como usar o QR code no seu negócio">
      <Topico titulo="Onde colocar o QR code">
        <p>Coloque o QR code onde o cliente já está com o celular na mão:</p>
        <Lista>
          <li>no balcão, perto do caixa;</li>
          <li>na vitrine ou na porta da loja;</li>
          <li>na embalagem e na sacola;</li>
          <li>no cardápio;</li>
          <li>no cartão de visita;</li>
          <li>no seu perfil do Instagram, como imagem.</li>
        </Lista>
      </Topico>

      <Topico titulo="Pix: teste antes de imprimir">
        <p>
          Antes de imprimir, abra o app do seu banco, leia o QR code e confira se aparece o seu nome. O nome que
          o cliente vê vem do banco, não do QR code.
        </p>
        <p>
          Fique de olho no golpe do adesivo: alguém cola outro QR code por cima do seu, e o dinheiro vai para a
          conta errada. Olhe o seu QR de vez em quando e deixe-o onde só a sua equipe mexe.
        </p>
        <p>
          Se a sua chave é o CPF, crie uma chave aleatória no app do banco. Ela não mostra o seu CPF no balcão.
        </p>
      </Topico>

      <Topico titulo="Como pegar o link de avaliação do Google pelo celular">
        <ListaNumerada>
          <li>Abra o app do Google e pesquise o nome do seu negócio.</li>
          <li>No seu perfil, toque em Pedir avaliações.</li>
          <li>Toque em Copiar link e cole aqui.</li>
        </ListaNumerada>
      </Topico>

      <Topico titulo="Qual tamanho imprimir">
        <p>O QR code deve ter no mínimo 3 cm de lado.</p>
        <p>
          Para ler de longe, o lado do QR deve ser 1/10 da distância. A 1 metro, 10 cm.
        </p>
      </Topico>

      <Topico titulo="Perguntas frequentes">
        <Perguntas
          itens={[
            {
              pergunta: 'O QR code expira?',
              resposta:
                'Não. O que está no QR fica dentro da imagem e funciona para sempre. Só para de funcionar se o destino deixar de existir, como uma chave Pix apagada.',
            },
            {
              pergunta: 'Precisa de cadastro?',
              resposta:
                'Não. É grátis, sem cadastro e sem anúncio, e o que você digita não sai do seu aparelho.',
            },
            {
              pergunta: 'Posso mudar o destino depois?',
              resposta:
                'Não, porque o destino está dentro da imagem. Para mudar, crie outro. Se o QR leva para a sua página, você muda a página e o mesmo QR continua valendo.',
            },
          ]}
        />
      </Topico>
    </Guia>
  );
}

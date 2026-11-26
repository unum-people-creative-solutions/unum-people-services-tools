// Entrega do número e da mensagem ao gerador de QR code (RF-LW-19, DT-LW-06). Só usa o que o QR já
// oferece (`lerEstado`, `estadoVazio`, `gravarEstado`): o gerador de QR não muda. O número e a mensagem
// vão para o aparelho, nunca para o endereço da página.

import { gravarEstado, lerEstado } from '../qr/armazenamento';
import { acompanharChamada, estadoVazio } from '../qr/estado';

/** Deixa o estado do QR no tipo WhatsApp, preenchido, e mantém o resto (outros campos, cor, logo, plaquinha). */
export function levarParaOQr(numero: string, mensagem: string): void {
  const antes = lerEstado() ?? estadoVazio();
  // A frase que a pessoa nunca mexeu acompanha a chamada do tipo, como quando ela escolhe o tipo no QR.
  const depois = acompanharChamada(antes, {
    ...antes,
    tipo: 'whatsapp',
    campos: { ...antes.campos, whatsapp: { numero, mensagem } },
  });
  gravarEstado(depois);
}

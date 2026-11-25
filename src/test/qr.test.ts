import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import { lerQr } from './qr';

function matrizDe(texto: string, nivel: 'M' | 'H') {
  const qr = QRCode.create(texto, { errorCorrectionLevel: nivel });
  return {
    tamanho: qr.modules.size,
    escuro: (linha: number, coluna: number) => qr.modules.get(linha, coluna) === 1,
  };
}

describe('lerQr (helper de teste)', () => {
  it('devolve o texto de um QR montado a partir da matriz', () => {
    const texto = 'https://www.unumpeople.com.br/?a=1&b=ção';
    expect(lerQr(matrizDe(texto, 'M'))).toBe(texto);
  });

  it('continua lendo com o centro tapado em 22% quando a correção é H', () => {
    const texto = 'https://wa.me/5511987654321?text=Ol%C3%A1';
    expect(lerQr(matrizDe(texto, 'H'), { taparCentro: 0.22 })).toBe(texto);
  });

  it('devolve null quando o centro tapado passa do que a correção M aguenta', () => {
    const texto = 'https://www.unumpeople.com.br/gerador-qr-code?tipo=pix&origem=teste';
    expect(lerQr(matrizDe(texto, 'M'), { taparCentro: 0.7 })).toBeNull();
  });

  it('devolve null quando não há QR (matriz toda clara)', () => {
    expect(lerQr({ tamanho: 21, escuro: () => false })).toBeNull();
  });
});

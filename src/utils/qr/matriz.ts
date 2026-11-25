// Matriz de módulos do QR (DT-QR-01, DT-QR-03). A biblioteca `qrcode` só gera a matriz;
// o desenho (margem, cor, logo, frase) é nosso, em desenho.ts.

import QRCode from 'qrcode';

export interface MatrizQr {
  /** Módulos por lado, sem a margem. */
  tamanho: number;
  /** Correção de erro usada: M sem logo, H com logo. */
  nivel: 'M' | 'H';
  /** `true` quando o módulo (linha, coluna) é escuro. */
  escuro(linha: number, coluna: number): boolean;
}

/** Gera a matriz. Lança erro se o texto não couber num QR (o limite da tela é 300 caracteres no tipo Texto). */
export function criarMatriz(texto: string, opcoes: { comLogo: boolean }): MatrizQr {
  const nivel = opcoes.comLogo ? 'H' : 'M';
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: nivel });
  return {
    tamanho: modules.size,
    nivel,
    escuro: (linha, coluna) => modules.get(linha, coluna) === 1,
  };
}

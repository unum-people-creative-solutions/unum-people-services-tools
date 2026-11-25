// Arquivos que o gerador entrega: nome (RF-QR-26/27) e download pelo navegador.

import type { TipoId } from './conteudos';

export function nomeDoArquivoDoQr(tipo: TipoId, extensao: 'png' | 'svg'): string {
  return `qr-code-${tipo}.${extensao}`;
}

/** Baixa o arquivo por um `<a download>` temporário. Lança erro se o navegador não conseguir. */
export function baixarArquivo(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Dá tempo de o navegador iniciar o download antes de soltar a URL.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

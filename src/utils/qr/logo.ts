// Leitura do logo que a pessoa escolhe (RF-QR-34, DT-QR-12). O logo vive só na memória da página:
// nunca vai para o `localStorage` nem sai do aparelho.

/** Limite do arquivo de logo. */
export const LIMITE_DO_LOGO = 5 * 1024 * 1024;

export const ERRO_LOGO_LEITURA = 'Não deu para abrir essa imagem. Tente outra foto.';
export const ERRO_LOGO_GRANDE = 'Essa imagem passa de 5 MB. Escolha uma menor.';

/** Falha de leitura do logo com a mensagem que vai para a tela. */
export class ErroDoLogo extends Error {}

export interface LogoLido {
  /** `data:image/...`: vai no SVG e decide o nível H do QR. */
  dataUrl: string;
  /** A mesma imagem já carregada, para o canvas (PNG e plaquinha). */
  imagem: HTMLImageElement;
  /** Tamanho natural, para caber no quadrado sem distorcer. */
  largura: number;
  altura: number;
}

/**
 * No Android, `accept="image/*"` abre o seletor de fotos do sistema e o Chrome perde a leitura do arquivo
 * (NotReadableError; lp-builder #191). Lá o campo vai sem `accept`.
 */
export const ehAndroid = (): boolean => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.addEventListener('load', () => resolver(String(leitor.result)));
    leitor.addEventListener('error', () => rejeitar(new ErroDoLogo(ERRO_LOGO_LEITURA)));
    leitor.addEventListener('abort', () => rejeitar(new ErroDoLogo(ERRO_LOGO_LEITURA)));
    try {
      leitor.readAsDataURL(arquivo);
    } catch {
      rejeitar(new ErroDoLogo(ERRO_LOGO_LEITURA));
    }
  });
}

function abrirImagem(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem);
    imagem.onerror = () => rejeitar(new ErroDoLogo(ERRO_LOGO_LEITURA));
    imagem.src = dataUrl;
  });
}

/**
 * Lê o arquivo UMA vez (FileReader → data URL) e abre a imagem a partir dele. Nada mais volta a tocar no
 * `File`: o seletor do Android só deixa ler uma vez. Rejeita com `ErroDoLogo` e a mensagem da tela.
 */
export async function lerLogo(arquivo: File): Promise<LogoLido> {
  if (arquivo.size > LIMITE_DO_LOGO) throw new ErroDoLogo(ERRO_LOGO_GRANDE);
  // Sem `accept` (Android), qualquer arquivo pode chegar: só imagem vira logo.
  if (!arquivo.type.startsWith('image/')) throw new ErroDoLogo(ERRO_LOGO_LEITURA);

  const dataUrl = await lerComoDataUrl(arquivo);
  if (!/^data:image\//i.test(dataUrl)) throw new ErroDoLogo(ERRO_LOGO_LEITURA);
  const imagem = await abrirImagem(dataUrl);

  // SVG sem medidas pode vir com 0 × 0: vale como quadrado.
  const largura = imagem.naturalWidth > 0 ? imagem.naturalWidth : 1;
  const altura = imagem.naturalHeight > 0 ? imagem.naturalHeight : 1;
  return { dataUrl, imagem, largura, altura };
}

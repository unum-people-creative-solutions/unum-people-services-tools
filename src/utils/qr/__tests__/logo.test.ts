import { describe, it, expect, vi, afterEach } from 'vitest';
import { ERRO_LOGO_GRANDE, ERRO_LOGO_LEITURA, LIMITE_DO_LOGO, ErroDoLogo, ehAndroid, lerLogo } from '../logo';

class ImagemFalsa {
  static falhar = false;
  static largura = 100;
  static altura = 50;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = ImagemFalsa.largura;
  naturalHeight = ImagemFalsa.altura;
  set src(valor: string) {
    void valor;
    queueMicrotask(() => (ImagemFalsa.falhar ? this.onerror?.() : this.onload?.()));
  }
}

function arquivo(tipo = 'image/png', tamanho?: number) {
  const f = new File(['conteudo'], 'logo.png', { type: tipo });
  if (tamanho !== undefined) Object.defineProperty(f, 'size', { value: tamanho });
  return f;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  ImagemFalsa.falhar = false;
  ImagemFalsa.largura = 100;
  ImagemFalsa.altura = 50;
});

describe('lerLogo (DT-QR-12)', () => {
  it('lê o arquivo UMA vez e devolve o data URL, a imagem e o tamanho natural', async () => {
    vi.stubGlobal('Image', ImagemFalsa);
    const ler = vi.spyOn(FileReader.prototype, 'readAsDataURL');
    const logo = await lerLogo(arquivo());
    expect(ler).toHaveBeenCalledTimes(1);
    expect(logo.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(logo.largura).toBe(100);
    expect(logo.altura).toBe(50);
    expect(logo.imagem).toBeInstanceOf(ImagemFalsa);
  });

  it('o limite é de 5 MB: acima disso recusa sem ler o arquivo', async () => {
    vi.stubGlobal('Image', ImagemFalsa);
    expect(LIMITE_DO_LOGO).toBe(5 * 1024 * 1024);
    const ler = vi.spyOn(FileReader.prototype, 'readAsDataURL');
    await expect(lerLogo(arquivo('image/png', LIMITE_DO_LOGO + 1))).rejects.toMatchObject({ message: ERRO_LOGO_GRANDE });
    expect(ler).not.toHaveBeenCalled();
  });

  it('5 MB exatos passam', async () => {
    vi.stubGlobal('Image', ImagemFalsa);
    await expect(lerLogo(arquivo('image/png', LIMITE_DO_LOGO))).resolves.toBeTruthy();
  });

  it('erro de leitura do arquivo vira a mensagem da spec', async () => {
    vi.stubGlobal('Image', ImagemFalsa);
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      queueMicrotask(() => this.dispatchEvent(new ProgressEvent('error')));
    });
    const erro = await lerLogo(arquivo()).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroDoLogo);
    expect(erro.message).toBe(ERRO_LOGO_LEITURA);
  });

  it('arquivo que não é imagem vira a mensagem de leitura', async () => {
    vi.stubGlobal('Image', ImagemFalsa);
    await expect(lerLogo(arquivo('application/pdf'))).rejects.toMatchObject({ message: ERRO_LOGO_LEITURA });
  });

  it('imagem que o navegador não abre vira a mensagem de leitura', async () => {
    vi.stubGlobal('Image', ImagemFalsa);
    ImagemFalsa.falhar = true;
    await expect(lerLogo(arquivo())).rejects.toMatchObject({ message: ERRO_LOGO_LEITURA });
  });

  it('imagem sem tamanho natural (SVG sem medidas) é tratada como quadrada', async () => {
    vi.stubGlobal('Image', ImagemFalsa);
    ImagemFalsa.largura = 0;
    ImagemFalsa.altura = 0;
    const logo = await lerLogo(arquivo('image/svg+xml'));
    expect(logo.largura).toBe(logo.altura);
    expect(logo.largura).toBeGreaterThan(0);
  });
});

describe('ehAndroid', () => {
  it('olha o userAgent', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 13; SM-N981B) Chrome/120');
    expect(ehAndroid()).toBe(true);
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari');
    expect(ehAndroid()).toBe(false);
  });
});

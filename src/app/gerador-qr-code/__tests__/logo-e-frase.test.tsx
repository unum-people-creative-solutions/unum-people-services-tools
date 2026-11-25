import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { lerQrDoSvg } from '@/test/qrNaTela';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';
import { CHAVE_DO_QR } from '@/utils/qr/armazenamento';
import { montarConteudo } from '@/utils/qr/conteudos';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const escolher = (nome: string) => fireEvent.click(screen.getByRole('radio', { name: nome }));
const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });

function preencherPix() {
  escolher('Receber Pix');
  digitar('Tipo da chave', 'aleatoria');
  digitar('Chave Pix', EXEMPLOS.pix.chave);
  digitar('Nome de quem recebe', EXEMPLOS.pix.nome);
  digitar('Cidade', EXEMPLOS.pix.cidade);
}

const textoDoPix = () => {
  const r = montarConteudo('pix', EXEMPLOS.pix);
  if (!r.ok) throw new Error('exemplo inválido');
  return r.texto;
};
const qrNaTela = () => screen.getByRole('img', { name: 'QR code de Receber Pix' });
const svgDaTela = () => qrNaTela().querySelector('svg')!;
const larguraDoSvg = () => Number(svgDaTela().getAttribute('viewBox')!.split(' ')[2]);
const campoDoLogo = () => screen.getByLabelText('Escolher a imagem do logo') as HTMLInputElement;

class ImagemFalsa {
  static falhar = false;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 200;
  naturalHeight = 100;
  set src(valor: string) {
    void valor;
    queueMicrotask(() => (ImagemFalsa.falhar ? this.onerror?.() : this.onload?.()));
  }
}

function arquivoDoLogo(tamanho?: number, tipo = 'image/png') {
  const f = new File(['x'], 'logo.png', { type: tipo });
  if (tamanho !== undefined) Object.defineProperty(f, 'size', { value: tamanho });
  return f;
}
const enviarLogo = (arquivo: File) => fireEvent.change(campoDoLogo(), { target: { files: [arquivo] } });

let alturas: number[];
let textos: string[];
let imagensDesenhadas: number;

beforeEach(() => {
  window.localStorage.clear();
  alturas = [];
  textos = [];
  imagensDesenhadas = 0;
  ImagemFalsa.falhar = false;
  vi.stubGlobal('Image', ImagemFalsa);
  const ctx = {
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn((texto: string) => textos.push(texto)),
    drawImage: vi.fn(() => imagensDesenhadas++),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb, tipo) {
    alturas.push(this.height);
    cb(new Blob(['png'], { type: tipo }));
  });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:x') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('Logo no centro (RF-QR-34, T21)', () => {
  it('tem o botão "Colocar o logo no centro" no recolhível "Deixar com a cara do negócio"', () => {
    render(<QrCodeView />);
    preencherPix();
    const detalhes = screen.getByText('Deixar com a cara do negócio').closest('details') as HTMLDetailsElement;
    expect(within(detalhes).getByRole('button', { name: 'Colocar o logo no centro' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tirar o logo' })).not.toBeInTheDocument();
  });

  it('o botão abre o seletor de arquivos', () => {
    render(<QrCodeView />);
    preencherPix();
    const abrir = vi.spyOn(campoDoLogo(), 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Colocar o logo no centro' }));
    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('fora do Android o seletor aceita imagens (accept="image/*")', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1');
    render(<QrCodeView />);
    preencherPix();
    expect(campoDoLogo()).toHaveAttribute('accept', 'image/*');
  });

  it('no Android o seletor NÃO tem accept (DT-QR-12: o seletor de fotos perde a leitura)', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 13; SM-N981B) Chrome/120 Mobile');
    render(<QrCodeView />);
    preencherPix();
    expect(campoDoLogo()).not.toHaveAttribute('accept');
  });

  it('com o logo: aparece no QR da prévia, a correção sobe para H e a leitura continua igual ao conteúdo', async () => {
    render(<QrCodeView />);
    preencherPix();
    const larguraSemLogo = larguraDoSvg();
    expect(lerQrDoSvg(svgDaTela())).toBe(textoDoPix());

    enviarLogo(arquivoDoLogo());
    expect(await screen.findByRole('button', { name: 'Tirar o logo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Colocar o logo no centro' })).not.toBeInTheDocument();

    const imagem = svgDaTela().querySelector('image');
    expect(imagem?.getAttribute('href')).toMatch(/^data:image\/png;base64,/);
    // H pede uma matriz maior que M para o mesmo conteúdo
    expect(larguraDoSvg()).toBeGreaterThan(larguraSemLogo);
    // tapando o quadrado do logo (22% + 1 módulo), o QR ainda lê o mesmo conteúdo
    expect(lerQrDoSvg(svgDaTela(), { taparCentro: 0.22 })).toBe(textoDoPix());
  });

  it('lê o arquivo uma única vez, mesmo depois de mudar cor e frase e gerar o PNG', async () => {
    const lerArquivo = vi.spyOn(FileReader.prototype, 'readAsDataURL');
    const outrasLeituras = [
      vi.spyOn(FileReader.prototype, 'readAsArrayBuffer'),
      vi.spyOn(FileReader.prototype, 'readAsText'),
      vi.spyOn(FileReader.prototype, 'readAsBinaryString'),
    ];
    render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo());
    await screen.findByRole('button', { name: 'Tirar o logo' });

    fireEvent.click(screen.getByRole('radio', { name: 'Azul' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Colocar uma frase embaixo' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled());

    expect(lerArquivo).toHaveBeenCalledTimes(1);
    for (const outra of outrasLeituras) expect(outra).not.toHaveBeenCalled();
  });

  it('o logo entra no PNG que se baixa', async () => {
    render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo());
    await screen.findByRole('button', { name: 'Tirar o logo' });
    await waitFor(() => expect(imagensDesenhadas).toBeGreaterThan(0));
  });

  it('falha ao ler o arquivo: alerta literal e o QR segue sem logo', async () => {
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      queueMicrotask(() => this.dispatchEvent(new ProgressEvent('error')));
    });
    render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo());
    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para abrir essa imagem. Tente outra foto.');
    expect(svgDaTela().querySelector('image')).toBeNull();
    expect(screen.getByRole('button', { name: 'Colocar o logo no centro' })).toBeInTheDocument();
  });

  it('imagem que o navegador não abre: o mesmo alerta', async () => {
    ImagemFalsa.falhar = true;
    render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo());
    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para abrir essa imagem. Tente outra foto.');
  });

  it('mais de 5 MB: alerta literal, sem ler o arquivo e sem logo', async () => {
    const lerArquivo = vi.spyOn(FileReader.prototype, 'readAsDataURL');
    render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo(5 * 1024 * 1024 + 1));
    expect(await screen.findByRole('alert')).toHaveTextContent('Essa imagem passa de 5 MB. Escolha uma menor.');
    expect(lerArquivo).not.toHaveBeenCalled();
    expect(svgDaTela().querySelector('image')).toBeNull();
  });

  it('o alerta some quando um logo bom entra', async () => {
    render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo(5 * 1024 * 1024 + 1));
    await screen.findByRole('alert');
    enviarLogo(arquivoDoLogo());
    await screen.findByRole('button', { name: 'Tirar o logo' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('"Tirar o logo" volta ao QR sem logo (correção M)', async () => {
    render(<QrCodeView />);
    preencherPix();
    const larguraSemLogo = larguraDoSvg();
    enviarLogo(arquivoDoLogo());
    fireEvent.click(await screen.findByRole('button', { name: 'Tirar o logo' }));
    expect(svgDaTela().querySelector('image')).toBeNull();
    expect(larguraDoSvg()).toBe(larguraSemLogo);
    expect(screen.getByRole('button', { name: 'Colocar o logo no centro' })).toBeInTheDocument();
  });

  it('o logo nunca vai para o localStorage', async () => {
    render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo());
    await screen.findByRole('button', { name: 'Tirar o logo' });
    fireEvent.click(screen.getByRole('radio', { name: 'Roxo' }));
    const tudo = JSON.stringify(Object.fromEntries([[CHAVE_DO_QR, window.localStorage.getItem(CHAVE_DO_QR)]]));
    expect(tudo).not.toContain('data:image');
    expect(Object.keys(JSON.parse(window.localStorage.getItem(CHAVE_DO_QR)!)).sort()).toEqual([
      'campos',
      'cor',
      'frase',
      'nomeDoNegocio',
      'tamanho',
      'tipo',
    ]);
  });

  it('ao reabrir a página o logo não volta', async () => {
    const primeira = render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo());
    await screen.findByRole('button', { name: 'Tirar o logo' });
    primeira.unmount();
    render(<QrCodeView />);
    expect(svgDaTela().querySelector('image')).toBeNull();
    expect(screen.getByRole('button', { name: 'Colocar o logo no centro' })).toBeInTheDocument();
  });

  it('"Apagar o que eu digitei" também tira o logo', async () => {
    render(<QrCodeView />);
    preencherPix();
    enviarLogo(arquivoDoLogo());
    await screen.findByRole('button', { name: 'Tirar o logo' });
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o que eu digitei' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    preencherPix();
    expect(svgDaTela().querySelector('image')).toBeNull();
  });
});

describe('Frase embaixo do QR (RF-QR-35, T22)', () => {
  const caixa = () => screen.getByRole('checkbox', { name: 'Colocar uma frase embaixo' });

  it('a caixa começa desmarcada e sem o campo "Frase"', () => {
    render(<QrCodeView />);
    preencherPix();
    expect(caixa()).not.toBeChecked();
    expect(screen.queryByLabelText('Frase')).not.toBeInTheDocument();
    expect(svgDaTela().querySelector('text')).toBeNull();
  });

  it('marcar a caixa mostra o campo "Frase" já com a chamada do tipo, e ela entra no SVG da prévia', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(caixa());
    expect(caixa()).toBeChecked();
    expect(screen.getByLabelText('Frase')).toHaveValue('Pague com Pix');
    expect(svgDaTela().querySelector('text')?.textContent).toBe('Pague com Pix');
    // a frase não atrapalha a leitura
    expect(lerQrDoSvg(svgDaTela())).toBe(textoDoPix());
  });

  it('escrever outra frase troca o texto da prévia; o limite é de 40 caracteres', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(caixa());
    const campo = screen.getByLabelText('Frase');
    expect(campo).toHaveAttribute('maxlength', '40');
    digitar('Frase', 'Pague aqui e ganhe um brinde!');
    expect(svgDaTela().querySelector('text')?.textContent).toBe('Pague aqui e ganhe um brinde!');
    digitar('Frase', 'x'.repeat(60));
    expect(campo).toHaveValue('x'.repeat(40));
  });

  it('a frase entra no PNG (a altura cresce e o texto é desenhado) e no SVG baixado', async () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(caixa());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled());
    expect(Math.max(...alturas)).toBeGreaterThan(1024);
    expect(textos).toContain('Pague com Pix');

    fireEvent.click(screen.getByRole('button', { name: 'Baixar SVG (para gráfica)' }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    const svg = await (vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob).text();
    expect(svg).toContain('>Pague com Pix</text>');
  });

  it('desmarcar a caixa tira a frase de tudo', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(caixa());
    fireEvent.click(caixa());
    expect(caixa()).not.toBeChecked();
    expect(screen.queryByLabelText('Frase')).not.toBeInTheDocument();
    expect(svgDaTela().querySelector('text')).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DO_QR)!).frase).toBe('');
  });

  it('apagar o texto do campo não fecha o campo: só fica sem frase', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(caixa());
    digitar('Frase', '');
    expect(caixa()).toBeChecked();
    expect(screen.getByLabelText('Frase')).toHaveValue('');
    expect(svgDaTela().querySelector('text')).toBeNull();
  });

  it('a frase fica guardada: ao reabrir, a caixa está marcada com a frase', () => {
    const primeira = render(<QrCodeView />);
    preencherPix();
    fireEvent.click(caixa());
    digitar('Frase', 'Obrigado pela preferência');
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DO_QR)!).frase).toBe('Obrigado pela preferência');
    primeira.unmount();

    render(<QrCodeView />);
    expect(caixa()).toBeChecked();
    expect(screen.getByLabelText('Frase')).toHaveValue('Obrigado pela preferência');
    expect(svgDaTela().querySelector('text')?.textContent).toBe('Obrigado pela preferência');
  });

  it('a frase sugerida acompanha o tipo; a que a pessoa escreveu fica', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(caixa());
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    escolher('Chamar no WhatsApp');
    expect(screen.getByLabelText('Frase')).toHaveValue('Chame no WhatsApp');

    digitar('Frase', 'Fale comigo');
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    escolher('Link do site');
    expect(screen.getByLabelText('Frase')).toHaveValue('Fale comigo');
  });

  it('logo, cor e frase juntos: o QR ainda lê o mesmo conteúdo', async () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('radio', { name: 'Azul-marinho' }));
    fireEvent.click(caixa());
    enviarLogo(arquivoDoLogo());
    await screen.findByRole('button', { name: 'Tirar o logo' });
    expect(lerQrDoSvg(svgDaTela(), { taparCentro: 0.22 })).toBe(textoDoPix());
  });
});

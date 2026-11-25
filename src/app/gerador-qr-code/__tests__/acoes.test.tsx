import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const escolher = (nome: string) => fireEvent.click(screen.getByRole('radio', { name: nome }));
/** O PNG é feito antes do toque (F2-000): o botão só libera quando o arquivo está pronto. */
const baixarImagemPronto = () =>
  waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled()).then(() =>
    screen.getByRole('button', { name: 'Baixar imagem' }),
  );
const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });

function preencherPix() {
  escolher('Receber Pix');
  digitar('Tipo da chave', 'aleatoria');
  digitar('Chave Pix', EXEMPLOS.pix.chave);
  digitar('Nome de quem recebe', EXEMPLOS.pix.nome);
  digitar('Cidade', EXEMPLOS.pix.cidade);
}

interface Baixado {
  nome: string;
  href: string;
}

let baixados: Baixado[];
let blobs: Blob[];
let canvas: { largura: number; altura: number }[];
let toBlobDevolve: 'blob' | 'nulo';

beforeEach(() => {
  window.localStorage.clear();
  baixados = [];
  blobs = [];
  canvas = [];
  toBlobDevolve = 'blob';

  // jsdom não tem canvas nem URL de Blob
  const ctx = { fillStyle: '', fillRect: vi.fn(), fillText: vi.fn(), drawImage: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb, tipo) {
    canvas.push({ largura: this.width, altura: this.height });
    cb(toBlobDevolve === 'blob' ? new Blob(['png'], { type: tipo }) : null);
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn((blob: Blob) => {
      blobs.push(blob);
      return `blob:teste/${blobs.length}`;
    }),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    baixados.push({ nome: this.download, href: this.getAttribute('href') ?? '' });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'canShare');
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

function ligarCompartilhamento(share: (dados: ShareData) => Promise<void>) {
  const canShare = vi.fn((dados: ShareData) => Boolean(dados.files?.length) && dados.files!.every((f) => f instanceof File));
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
  const compartilhar = vi.fn(share);
  Object.defineProperty(navigator, 'share', { configurable: true, value: compartilhar });
  return { canShare, compartilhar };
}

describe('Ações (RF-QR-25 a 27)', () => {
  it('sem QR válido, não há botões de ação', () => {
    render(<QrCodeView />);
    escolher('Receber Pix');
    expect(screen.queryByRole('button', { name: 'Baixar imagem' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument();
  });

  it('sem canShare com arquivo, "Compartilhar" não aparece e "Baixar imagem" está lá', async () => {
    render(<QrCodeView />);
    preencherPix();
    expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument());
  });

  it('canShare falso para arquivos: "Compartilhar" não aparece', () => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: vi.fn(() => false) });
    render(<QrCodeView />);
    preencherPix();
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument();
  });

  it('canShare que lança erro: "Compartilhar" não aparece e a tela segue', () => {
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn(() => {
        throw new Error('sem suporte');
      }),
    });
    render(<QrCodeView />);
    preencherPix();
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeInTheDocument();
  });

  it('com canShare verdadeiro para um arquivo de verdade, mostra "Compartilhar" e chama share com qr-code-pix.png', async () => {
    const { canShare, compartilhar } = ligarCompartilhamento(async () => undefined);
    render(<QrCodeView />);
    preencherPix();
    const botao = await screen.findByRole('button', { name: 'Compartilhar' });
    const arquivoDoTeste = canShare.mock.calls[0][0].files![0];
    expect(arquivoDoTeste).toBeInstanceOf(File);
    expect(arquivoDoTeste.type).toBe('image/png');

    fireEvent.click(botao);
    await waitFor(() => expect(compartilhar).toHaveBeenCalledTimes(1));
    const [dados] = compartilhar.mock.calls[0];
    expect(dados.files).toHaveLength(1);
    expect(dados.files![0]).toBeInstanceOf(File);
    expect(dados.files![0].name).toBe('qr-code-pix.png');
    expect(dados.files![0].type).toBe('image/png');
    expect(canvas).toEqual([{ largura: 1024, altura: 1024 }]);
  });

  it('o compartilhamento leva o título "QR code de {nome do tipo}" (DT-QR-08)', async () => {
    const { compartilhar } = ligarCompartilhamento(async () => undefined);
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(compartilhar).toHaveBeenCalledTimes(1));
    expect(compartilhar.mock.calls[0][0].title).toBe('QR code de Receber Pix');
  });

  it('cancelar o compartilhamento (AbortError) não mostra nada', async () => {
    const { compartilhar } = ligarCompartilhamento(async () => {
      throw new DOMException('cancelado', 'AbortError');
    });
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(compartilhar).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeEnabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('outra falha ao compartilhar mostra o alerta da spec', async () => {
    ligarCompartilhamento(async () => {
      throw new DOMException('negado', 'NotAllowedError');
    });
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para compartilhar. Use Baixar imagem.');
  });

  it('"Baixar imagem" baixa o PNG com o nome do tipo', async () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(await baixarImagemPronto());
    await waitFor(() => expect(baixados).toHaveLength(1));
    expect(baixados[0]).toEqual({ nome: 'qr-code-pix.png', href: 'blob:teste/1' });
    expect(blobs[0].type).toBe('image/png');
    expect(canvas).toEqual([{ largura: 1024, altura: 1024 }]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('o nome do arquivo segue o tipo escolhido', async () => {
    render(<QrCodeView />);
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', '11987654321');
    fireEvent.click(await baixarImagemPronto());
    await waitFor(() => expect(baixados).toHaveLength(1));
    expect(baixados[0].nome).toBe('qr-code-whatsapp.png');
  });

  it('se o PNG falhar, mostra o alerta da spec e não baixa nada', async () => {
    toBlobDevolve = 'nulo';
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(await baixarImagemPronto());
    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para baixar a imagem. Tente de novo.');
    expect(baixados).toHaveLength(0);
  });

  it('"Mais formatos" tem "Baixar SVG (para gráfica)", que baixa o SVG do QR', async () => {
    render(<QrCodeView />);
    preencherPix();
    const detalhes = screen.getByText('Mais formatos').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    fireEvent.click(within(detalhes).getByRole('button', { name: 'Baixar SVG (para gráfica)' }));
    await waitFor(() => expect(baixados).toHaveLength(1));
    expect(baixados[0].nome).toBe('qr-code-pix.svg');
    expect(blobs[0].type).toBe('image/svg+xml');
    const texto = await blobs[0].text();
    const naTela = screen.getByRole('img', { name: 'QR code de Receber Pix' }).innerHTML;
    expect(texto.startsWith('<svg')).toBe(true);
    // o arquivo é o mesmo desenho da prévia
    const caixa = document.createElement('div');
    caixa.innerHTML = texto;
    expect(caixa.innerHTML).toBe(naTela);
  });

  it('se o download do SVG falhar, mostra o alerta', async () => {
    (URL.createObjectURL as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('sem memória');
    });
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('button', { name: 'Baixar SVG (para gráfica)' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para baixar a imagem. Tente de novo.');
  });

  it('os botões somem quando o conteúdo deixa de ser válido', () => {
    render(<QrCodeView />);
    preencherPix();
    digitar('Cidade', '');
    expect(screen.queryByRole('button', { name: 'Baixar imagem' })).not.toBeInTheDocument();
  });
});

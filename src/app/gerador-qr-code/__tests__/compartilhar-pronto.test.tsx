import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';

// O logo do cabeçalho não importa aqui (e `<img>` solto na suíte acende o lint).
vi.mock('next/image', () => ({ default: () => null }));

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

let canvases: number;
let liberar: (() => void)[];
let segurar: boolean;

beforeEach(() => {
  window.localStorage.clear();
  canvases = 0;
  liberar = [];
  segurar = false;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb, tipo) => {
    canvases++;
    const entregar = () => cb(new Blob(['png'], { type: tipo }));
    if (segurar) liberar.push(entregar);
    else entregar();
  });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:x') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'canShare');
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

function ligarCompartilhamento(share: (dados: ShareData) => Promise<void> = async () => undefined) {
  Object.defineProperty(navigator, 'canShare', {
    configurable: true,
    value: vi.fn((d: ShareData) => Boolean(d.files?.length)),
  });
  const compartilhar = vi.fn(share);
  Object.defineProperty(navigator, 'share', { configurable: true, value: compartilhar });
  return compartilhar;
}

describe('Compartilhar com o PNG já pronto (TASK-F2-000, RT-QR-1)', () => {
  it('o clique chama share na hora, sem esperar a geração do PNG (o File já existe)', async () => {
    const compartilhar = ligarCompartilhamento();
    render(<QrCodeView />);
    preencherPix();

    const botao = await screen.findByRole('button', { name: 'Compartilhar' });
    const canvasAntesDoClique = canvases;
    fireEvent.click(botao);

    // sem `await` entre o clique e a conferência: o share tem de ter sido chamado dentro do gesto
    expect(compartilhar).toHaveBeenCalledTimes(1);
    expect(canvases).toBe(canvasAntesDoClique);
    const [dados] = compartilhar.mock.calls[0];
    expect(dados.files).toHaveLength(1);
    expect(dados.files![0]).toBeInstanceOf(File);
    expect(dados.files![0].name).toBe('qr-code-pix.png');
    expect(dados.files![0].type).toBe('image/png');
  });

  it('enquanto o arquivo não está pronto, o botão fica desabilitado e diz que está preparando', async () => {
    segurar = true;
    const compartilhar = ligarCompartilhamento();
    render(<QrCodeView />);
    preencherPix();

    const preparando = await screen.findByRole('button', { name: 'Preparando para compartilhar…' });
    expect(preparando).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument();
    fireEvent.click(preparando);
    expect(compartilhar).not.toHaveBeenCalled();

    segurar = false;
    liberar.splice(0).forEach((entregar) => entregar());
    const pronto = await screen.findByRole('button', { name: 'Compartilhar' });
    expect(pronto).toBeEnabled();
  });

  it('mudar o conteúdo volta a preparar e depois entrega o arquivo novo', async () => {
    ligarCompartilhamento();
    render(<QrCodeView />);
    preencherPix();
    await screen.findByRole('button', { name: 'Compartilhar' });

    digitar('Cidade', 'CURITIBA');
    expect(screen.getByRole('button', { name: 'Preparando para compartilhar…' })).toBeDisabled();
    expect(await screen.findByRole('button', { name: 'Compartilhar' })).toBeEnabled();
  });

  it('"Baixar imagem" também espera o arquivo ficar pronto', async () => {
    segurar = true;
    render(<QrCodeView />);
    preencherPix();
    expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeDisabled();

    await vi.waitFor(() => expect(liberar.length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeDisabled();
    liberar.splice(0).forEach((entregar) => entregar());
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled());
  });

  it('se o PNG não puder ser gerado, avisa na tela e "Baixar imagem" tenta de novo', async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((cb) => cb(null));
    ligarCompartilhamento();
    render(<QrCodeView />);
    preencherPix();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para compartilhar. Use Baixar imagem.');
    expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled();
  });
});

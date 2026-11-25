import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { desligarMedicao, enviados, ligarMedicao } from '@/test/medicao';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';
import { CHAVE_DO_QR } from '@/utils/qr/armazenamento';
import { estadoVazio } from '@/utils/qr/estado';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const FERRAMENTA = 'qr-code';
const escolher = (nome: string) => fireEvent.click(screen.getByRole('radio', { name: nome }));
const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
/** O PNG é feito antes do toque (F2-000): o botão só libera quando o arquivo está pronto. */
const baixarImagemPronto = () =>
  waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled()).then(() =>
    screen.getByRole('button', { name: 'Baixar imagem' }),
  );
const eventos = (sendBeacon: ReturnType<typeof ligarMedicao>) => enviados(sendBeacon).map((x) => x.e);

describe('Gerador de QR code: medição de uso (RF-QR-39)', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;

  beforeEach(() => {
    window.localStorage.clear();
    sendBeacon = ligarMedicao();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb, tipo) =>
      cb(new Blob(['x'], { type: tipo })),
    );
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:x') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });
  afterEach(() => {
    desligarMedicao();
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('marca a visita uma vez ao abrir a página, mesmo re-renderizando', () => {
    const { rerender } = render(<QrCodeView />);
    rerender(<QrCodeView />);
    expect(enviados(sendBeacon)).toEqual([{ f: FERRAMENTA, e: 'visita' }]);
  });

  it('marca "comecou" ao escolher o tipo, uma vez só', () => {
    render(<QrCodeView />);
    expect(eventos(sendBeacon)).not.toContain('comecou');
    escolher('Link do site');
    escolher('Receber Pix');
    expect(eventos(sendBeacon).filter((e) => e === 'comecou')).toHaveLength(1);
  });

  it('digitar num campo sem escolher o tipo antes não é possível, e digitar depois não marca outro "comecou"', () => {
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    expect(eventos(sendBeacon).filter((e) => e === 'comecou')).toHaveLength(1);
  });

  it('marca "resultado" no primeiro QR válido, uma vez só, e depois de "comecou"', () => {
    render(<QrCodeView />);
    escolher('Link do site');
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou']);
    digitar('Endereço do site', 'www.um.com.br');
    digitar('Endereço do site', 'www.outro.com.br');
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou', 'resultado']);
  });

  it('restaurar do aparelho não conta "comecou" nem "resultado"', () => {
    const estado = estadoVazio();
    estado.tipo = 'link';
    estado.campos.link.endereco = 'www.um.com.br';
    window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify(estado));
    render(<QrCodeView />);
    expect(screen.getByRole('img', { name: 'QR code de Link do site' })).toBeInTheDocument();
    expect(eventos(sendBeacon)).toEqual(['visita']);
  });

  it('quem volta e escolhe um tipo conta "comecou" e, com o QR já válido, "resultado"', () => {
    const estado = estadoVazio();
    estado.tipo = 'link';
    estado.campos.link.endereco = 'www.um.com.br';
    window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify(estado));
    render(<QrCodeView />);
    escolher('Link do site');
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou', 'resultado']);
  });

  it('marca "baixou" ao baixar a imagem, uma vez só', async () => {
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    fireEvent.click(await baixarImagemPronto());
    await waitFor(() => expect(eventos(sendBeacon)).toContain('baixou'));
    fireEvent.click(await baixarImagemPronto());
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(2));
    expect(eventos(sendBeacon).filter((e) => e === 'baixou')).toHaveLength(1);
  });

  it('marca "baixou" ao baixar o SVG', async () => {
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    fireEvent.click(screen.getByRole('button', { name: 'Baixar SVG (para gráfica)' }));
    await waitFor(() => expect(eventos(sendBeacon)).toContain('baixou'));
  });

  it('marca "baixou" ao compartilhar, só se o compartilhamento terminar', async () => {
    const compartilhar = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('cancelado', 'AbortError'))
      .mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: compartilhar });
    render(<QrCodeView />);
    escolher('Receber Pix');
    digitar('Tipo da chave', 'aleatoria');
    digitar('Chave Pix', EXEMPLOS.pix.chave);
    digitar('Nome de quem recebe', EXEMPLOS.pix.nome);
    digitar('Cidade', EXEMPLOS.pix.cidade);

    fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(compartilhar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeEnabled());
    expect(eventos(sendBeacon)).not.toContain('baixou');

    fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
    await waitFor(() => expect(eventos(sendBeacon)).toContain('baixou'));
  });

  it('uma falha ao baixar não marca "baixou"', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(null));
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    fireEvent.click(await baixarImagemPronto());
    await screen.findByRole('alert');
    expect(eventos(sendBeacon)).not.toContain('baixou');
  });

  it('sem NEXT_PUBLIC_TOOLS_USO_URL nada é enviado, e a tela segue funcionando', () => {
    vi.stubEnv('NEXT_PUBLIC_TOOLS_USO_URL', '');
    render(<QrCodeView />);
    escolher('Link do site');
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Endereço do site')).toBeInTheDocument();
  });
});

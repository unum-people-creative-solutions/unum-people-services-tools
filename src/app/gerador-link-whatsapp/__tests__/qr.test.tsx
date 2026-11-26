import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LinkWhatsappView from '../LinkWhatsappView';
import { lerQrDoSvg } from '@/test/qrNaTela';
import { linkDoWhatsapp } from '@/utils/whatsapp';
import { CHAVE_DO_QR, lerEstado } from '@/utils/qr/armazenamento';
import { estadoVazio } from '@/utils/qr/estado';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';
import { CHAVE_DO_LINK } from '@/utils/linkWhatsapp/armazenamento';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const NUMERO = '(11) 98765-4321';
const MENSAGEM = 'Olá! Quero 2 pães 🍞\nPara amanhã';
const LINK = linkDoWhatsapp('11987654321', MENSAGEM);

const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const preencher = () => {
  digitar('Número com DDD', NUMERO);
  digitar('Mensagem (opcional)', MENSAGEM);
};
const atalho = () => screen.getByRole('link', { name: 'Abrir no gerador de QR code' });
/** O PNG é feito antes do toque: o botão só libera quando o arquivo está pronto. */
const baixarImagemPronto = () =>
  waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled()).then(() =>
    screen.getByRole('button', { name: 'Baixar imagem' }),
  );

let baixados: { nome: string }[];

beforeEach(() => {
  window.localStorage.clear();
  baixados = [];
  const ctx = { fillStyle: '', fillRect: vi.fn(), fillText: vi.fn(), drawImage: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb, tipo) => cb(new Blob(['png'], { type: tipo })));
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:x') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    if (this.download) baixados.push({ nome: this.download });
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('QR code do link (RF-LW-18, DT-LW-05)', () => {
  it('sem número válido, não há QR nem atalho', () => {
    render(<LinkWhatsappView />);
    digitar('Número com DDD', '1198');
    expect(screen.queryByRole('heading', { level: 2, name: 'QR code do seu link' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'QR code de WhatsApp' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Abrir no gerador de QR code' })).not.toBeInTheDocument();
  });

  it('com número válido, mostra o h2 e o QR, e o QR lê exatamente o link (com acento, emoji e quebra de linha)', () => {
    render(<LinkWhatsappView />);
    preencher();
    expect(screen.getByRole('heading', { level: 2, name: 'QR code do seu link' })).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'QR code de WhatsApp' }).querySelector('svg')!;
    expect(lerQrDoSvg(svg)).toBe(LINK);
    expect((screen.getByLabelText('Seu link') as HTMLInputElement).value).toBe(LINK);
  });

  it('o QR acompanha o texto: muda a mensagem, muda o que o QR lê', () => {
    render(<LinkWhatsappView />);
    preencher();
    digitar('Mensagem (opcional)', 'Outra');
    const svg = screen.getByRole('img', { name: 'QR code de WhatsApp' }).querySelector('svg')!;
    expect(lerQrDoSvg(svg)).toBe(linkDoWhatsapp('11987654321', 'Outra'));
  });

  it('o QR é preto, sem logo e sem frase', () => {
    render(<LinkWhatsappView />);
    preencher();
    const svg = screen.getByRole('img', { name: 'QR code de WhatsApp' }).querySelector('svg')!;
    expect(svg.outerHTML).toContain('#000000');
    expect(svg.querySelector('image')).toBeNull();
    expect(svg.querySelector('text')).toBeNull();
  });

  it('baixa qr-code-whatsapp.png e qr-code-whatsapp.svg', async () => {
    render(<LinkWhatsappView />);
    preencher();
    fireEvent.click(await baixarImagemPronto());
    await waitFor(() => expect(baixados).toEqual([{ nome: 'qr-code-whatsapp.png' }]));
    fireEvent.click(screen.getByRole('button', { name: 'Baixar SVG (para gráfica)' }));
    await waitFor(() => expect(baixados).toHaveLength(2));
    expect(baixados[1]).toEqual({ nome: 'qr-code-whatsapp.svg' });
  });

  it('mensagem que não cabe num QR: avisa em vez de quebrar, e o link continua', () => {
    render(<LinkWhatsappView />);
    digitar('Número com DDD', NUMERO);
    digitar('Mensagem (opcional)', '€'.repeat(500));
    expect(screen.getByRole('alert')).toHaveTextContent('Esse conteúdo é grande demais para caber num QR code. Escreva menos.');
    expect(screen.queryByRole('img', { name: 'QR code de WhatsApp' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar link' })).toBeInTheDocument();
  });
});

describe('Atalho para o gerador de QR code (RF-LW-19, DT-LW-06)', () => {
  it('mostra a frase e o link, que leva a /gerador-qr-code sem parâmetros', () => {
    render(<LinkWhatsappView />);
    preencher();
    expect(screen.getByText('Quer cor, logo ou plaquinha?')).toBeInTheDocument();
    expect(atalho()).toHaveAttribute('href', '/gerador-qr-code');
  });

  it('ao tocar, grava o tipo e os campos no estado do QR e mantém o que já estava lá', () => {
    const antes = estadoVazio();
    antes.tipo = 'pix';
    antes.campos = { ...antes.campos, pix: EXEMPLOS.pix };
    antes.cor = '#1D4ED8';
    window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify(antes));

    render(<LinkWhatsappView />);
    preencher();
    atalho().addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(atalho());

    const depois = lerEstado()!;
    expect(depois.tipo).toBe('whatsapp');
    expect(depois.campos.whatsapp).toEqual({ numero: NUMERO, mensagem: MENSAGEM });
    expect(depois.campos.pix).toEqual(EXEMPLOS.pix);
    expect(depois.cor).toBe('#1D4ED8');
    expect(atalho()).toHaveAttribute('href', '/gerador-qr-code');
  });

  it('sem estado do QR guardado, parte do estado vazio', () => {
    render(<LinkWhatsappView />);
    preencher();
    atalho().addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(atalho());
    expect(lerEstado()).toEqual({
      ...estadoVazio(),
      tipo: 'whatsapp',
      campos: { ...estadoVazio().campos, whatsapp: { numero: NUMERO, mensagem: MENSAGEM } },
    });
  });

  it('o estado da própria página não muda ao tocar no atalho', () => {
    render(<LinkWhatsappView />);
    preencher();
    atalho().addEventListener('click', (e) => e.preventDefault());
    fireEvent.click(atalho());
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DO_LINK)!)).toEqual({ numero: NUMERO, mensagem: MENSAGEM });
  });
});

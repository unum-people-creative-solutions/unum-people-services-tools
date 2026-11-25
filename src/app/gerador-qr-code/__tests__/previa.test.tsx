import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { lerQrDoSvg } from '@/test/qrNaTela';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';
import { montarConteudo } from '@/utils/qr/conteudos';
import { montarBrCode } from '@/utils/qr/pix';

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

const AVISO_DO_PIX =
  'Teste antes de imprimir: leia o QR com o app do seu banco e confira se aparece o seu nome. O nome que o cliente vê vem do banco, não do QR code.';
const DICA_DO_CPF =
  'Dica: a chave aleatória não mostra o seu CPF no balcão. Você cria uma no app do banco.';

beforeEach(() => {
  window.localStorage.clear();
});

describe('Prévia (RF-QR-23)', () => {
  it('sem conteúdo válido, mostra a mensagem e nenhum botão de ação', () => {
    render(<QrCodeView />);
    escolher('Chamar no WhatsApp');
    expect(screen.getByText('Preencha os campos acima para ver o seu QR code.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /^QR code de/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Seu QR code está pronto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Compartilhar|Baixar|Mais formatos/ })).not.toBeInTheDocument();
  });

  it('com o conteúdo válido, mostra o QR com nome acessível, o título e a dica de teste', () => {
    render(<QrCodeView />);
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', '(11) 98765-4321');
    expect(screen.queryByText('Preencha os campos acima para ver o seu QR code.')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'QR code de Chamar no WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Seu QR code está pronto' })).toBeInTheDocument();
    expect(screen.getByText('Aponte a câmera de outro celular para testar.')).toBeInTheDocument();
  });

  it('o QR na tela lê de volta exatamente o conteúdo montado (WhatsApp)', () => {
    render(<QrCodeView />);
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', EXEMPLOS.whatsapp.numero);
    digitar('Mensagem que já chega escrita (opcional)', EXEMPLOS.whatsapp.mensagem);
    const esperado = montarConteudo('whatsapp', EXEMPLOS.whatsapp);
    expect(esperado.ok).toBe(true);
    const svg = screen.getByRole('img', { name: 'QR code de Chamar no WhatsApp' }).querySelector('svg')!;
    expect(lerQrDoSvg(svg)).toBe(esperado.ok ? esperado.texto : null);
  });

  it('o QR muda a cada alteração e volta à mensagem se o campo ficar inválido', () => {
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    const svg1 = screen.getByRole('img', { name: 'QR code de Link do site' }).innerHTML;
    digitar('Endereço do site', 'www.outro-endereco.com.br');
    const svg2 = screen.getByRole('img', { name: 'QR code de Link do site' }).innerHTML;
    expect(svg2).not.toBe(svg1);
    digitar('Endereço do site', 'semponto');
    expect(screen.queryByRole('img', { name: 'QR code de Link do site' })).not.toBeInTheDocument();
    expect(screen.getByText('Preencha os campos acima para ver o seu QR code.')).toBeInTheDocument();
  });

  it('o QR usa a cor padrão preta e fundo branco', () => {
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    const svg = screen.getByRole('img', { name: 'QR code de Link do site' }).querySelector('svg')!;
    expect(svg.querySelector('path')).toHaveAttribute('fill', '#000000');
    expect(svg.querySelector('rect')).toHaveAttribute('fill', '#ffffff');
  });

  it('um conteúdo grande demais para o QR mostra um alerta em vez de quebrar a tela', () => {
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', `www.seunegocio.com.br/${'a'.repeat(3200)}`);
    expect(screen.getByRole('alert')).toHaveTextContent('Esse conteúdo é grande demais para caber num QR code.');
    expect(screen.queryByRole('img', { name: /^QR code de/ })).not.toBeInTheDocument();
  });
});

describe('Pix: copia e cola e avisos (RF-QR-21, RF-QR-22)', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('mostra o aviso fixo no Pix, mesmo sem o QR pronto, e em nenhum outro tipo', () => {
    render(<QrCodeView />);
    escolher('Receber Pix');
    expect(screen.getByText(AVISO_DO_PIX)).toBeInTheDocument();
    expect(screen.queryByText('Pix copia e cola')).not.toBeInTheDocument();
    escolher('Link do site');
    expect(screen.queryByText(AVISO_DO_PIX)).not.toBeInTheDocument();
  });

  it('a dica do CPF aparece só com a chave CPF', () => {
    render(<QrCodeView />);
    escolher('Receber Pix');
    expect(screen.getByText(DICA_DO_CPF)).toBeInTheDocument();
    digitar('Tipo da chave', 'aleatoria');
    expect(screen.queryByText(DICA_DO_CPF)).not.toBeInTheDocument();
  });

  it('o copia e cola é igual ao BR Code dos campos e ao que o QR lê', () => {
    render(<QrCodeView />);
    preencherPix();
    const esperado = montarBrCode({
      chave: EXEMPLOS.pix.chave,
      nome: EXEMPLOS.pix.nome,
      cidade: EXEMPLOS.pix.cidade,
      valor: null,
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Pix copia e cola' })).toBeInTheDocument();
    expect(screen.getByText(esperado)).toBeInTheDocument();
    const svg = screen.getByRole('img', { name: 'QR code de Receber Pix' }).querySelector('svg')!;
    expect(lerQrDoSvg(svg)).toBe(esperado);
  });

  it('com valor, o campo 54 vai no código', () => {
    render(<QrCodeView />);
    preencherPix();
    digitar('Valor (opcional)', '25,5');
    expect(screen.getByText(/540525\.50/)).toBeInTheDocument();
  });

  it('"Copiar código" copia e avisa com role="status"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Código copiado.'));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/^000201.*63041D3D$/);
  });

  it('se a cópia falhar, avisa com role="alert" e o texto da spec', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('negado'));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não deu para copiar. Toque e segure no código para copiar.',
      ),
    );
  });

  it('sem a API da área de transferência, também avisa da falha', async () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Não deu para copiar. Toque e segure no código para copiar.'),
    );
  });

  it('o aviso de "copiado" some quando o código muda', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    digitar('Cidade', 'SANTOS');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { lerQrDoSvg } from '@/test/qrNaTela';
import { CHAVE_DO_QR } from '@/utils/qr/armazenamento';
import { estadoVazio } from '@/utils/qr/estado';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

beforeEach(() => {
  window.localStorage.clear();
});

describe('Mensagem do WhatsApp em várias linhas', () => {
  it('mostra a quebra de linha que veio guardada e a leva ao QR depois de editar', () => {
    const estado = estadoVazio();
    estado.tipo = 'whatsapp';
    estado.campos.whatsapp = { numero: '11987654321', mensagem: 'Olá!\nPara amanhã' };
    window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify(estado));
    render(<QrCodeView />);

    const campo = screen.getByLabelText('Mensagem que já chega escrita (opcional)');
    expect(campo).toHaveValue('Olá!\nPara amanhã');

    fireEvent.change(campo, { target: { value: 'Olá!\nPara amanhã?' } });
    expect(campo).toHaveValue('Olá!\nPara amanhã?');

    const svg = screen.getByRole('img', { name: 'QR code de Chamar no WhatsApp' }).querySelector('svg')!;
    const texto = lerQrDoSvg(svg);
    expect(texto).toContain('text=');
    expect(texto).toContain('%0A');
  });
});

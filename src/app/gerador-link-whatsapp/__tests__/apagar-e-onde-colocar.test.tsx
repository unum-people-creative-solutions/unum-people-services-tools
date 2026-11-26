import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LinkWhatsappView from '../LinkWhatsappView';
import { CHAVE_DO_LINK } from '@/utils/linkWhatsapp/armazenamento';
import { CHAVE_DO_QR } from '@/utils/qr/armazenamento';
import { estadoVazio } from '@/utils/qr/estado';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const numero = () => screen.getByLabelText('Número com DDD');
const mensagem = () => screen.getByLabelText('Mensagem (opcional)');
const digitar = (campo: HTMLElement, valor: string) => fireEvent.change(campo, { target: { value: valor } });
const guardado = () => window.localStorage.getItem(CHAVE_DO_LINK);
const apagar = () => fireEvent.click(screen.getByRole('button', { name: 'Apagar o que eu digitei' }));

const ESTADO_DO_QR = JSON.stringify({ ...estadoVazio(), tipo: 'link', cor: '#1D4ED8' });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem(CHAVE_DO_QR, ESTADO_DO_QR);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const comDados = () => {
  render(<LinkWhatsappView />);
  digitar(numero(), '11987654321');
  digitar(mensagem(), 'Oi!');
};

describe('Apagar o que eu digitei (RF-LW-22)', () => {
  it('pede confirmação com o texto da spec antes de apagar', () => {
    comDados();
    apagar();
    expect(screen.getByText('Apagar tudo o que você digitou neste aparelho?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sim, apagar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(guardado()).not.toBeNull();
  });

  it('"Cancelar" fecha a confirmação e não apaga nada', () => {
    comDados();
    apagar();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Apagar tudo o que você digitou neste aparelho?')).not.toBeInTheDocument();
    expect(numero()).toHaveValue('11987654321');
    expect(mensagem()).toHaveValue('Oi!');
    expect(guardado()).not.toBeNull();
    expect(screen.queryByText('Pronto, apagamos tudo.')).not.toBeInTheDocument();
  });

  it('"Sim, apagar" limpa número, mensagem e a chave, e avisa com role="status"', () => {
    comDados();
    apagar();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    expect(numero()).toHaveValue('');
    expect(mensagem()).toHaveValue('');
    expect(guardado()).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Pronto, apagamos tudo.');
    expect(screen.getByText('Digite o seu número para ver o link.')).toBeInTheDocument();
    expect(screen.queryByText('Apagar tudo o que você digitou neste aparelho?')).not.toBeInTheDocument();
  });

  it('não apaga o estado do gerador de QR code', () => {
    comDados();
    apagar();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    expect(window.localStorage.getItem(CHAVE_DO_QR)).toBe(ESTADO_DO_QR);
  });

  it('apagar também limpa o erro do número', () => {
    render(<LinkWhatsappView />);
    digitar(numero(), '1198');
    fireEvent.blur(numero());
    expect(numero()).toHaveAttribute('aria-invalid', 'true');
    apagar();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    expect(numero()).not.toHaveAttribute('aria-invalid');
  });

  it('depois de apagar, abrir a página de novo volta vazia', () => {
    const primeira = render(<LinkWhatsappView />);
    digitar(numero(), '11987654321');
    apagar();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    primeira.unmount();
    render(<LinkWhatsappView />);
    expect(numero()).toHaveValue('');
    expect(mensagem()).toHaveValue('');
  });

  it('o aviso "Pronto, apagamos tudo." some quando a pessoa volta a digitar', () => {
    comDados();
    apagar();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    digitar(numero(), '1');
    expect(screen.queryByText('Pronto, apagamos tudo.')).not.toBeInTheDocument();
  });
});

describe('Onde colocar o seu link (RF-LW-20)', () => {
  const ITENS = [
    'Bio do Instagram: toque em Editar perfil, depois em Links e em Adicionar link externo. Cole o link.',
    'Perfil do Google: no seu perfil, toque em Editar perfil, depois em Contato e em Chat. Escolha WhatsApp e cole o link.',
    'Status do WhatsApp: escreva uma frase e cole o link. Quem vê o status toca no link e abre a conversa com você.',
    'Anúncio e cartão: use o link como destino do anúncio. No cartão e no balcão, use o QR code.',
  ];

  it('sem número válido, não aparece', () => {
    render(<LinkWhatsappView />);
    expect(screen.queryByText('Onde colocar o seu link')).not.toBeInTheDocument();
  });

  it('com número válido, abre fechado e traz os 4 itens da spec', () => {
    render(<LinkWhatsappView />);
    digitar(numero(), '11987654321');
    const detalhes = screen.getByText('Onde colocar o seu link').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    const itens = within(detalhes).getAllByRole('listitem', { hidden: true });
    expect(itens.map((i) => i.textContent)).toEqual(ITENS);
  });
});

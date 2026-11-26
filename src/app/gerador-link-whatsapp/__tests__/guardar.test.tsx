import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LinkWhatsappView from '../LinkWhatsappView';
import { CHAVE_DO_LINK } from '@/utils/linkWhatsapp/armazenamento';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const numero = () => screen.getByLabelText('Número com DDD');
const mensagem = () => screen.getByLabelText('Mensagem (opcional)');
const guardado = () => window.localStorage.getItem(CHAVE_DO_LINK);

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Guardar no aparelho e voltar (RF-LW-21)', () => {
  it('guarda o número e a mensagem, como digitados, a cada mudança', () => {
    render(<LinkWhatsappView />);
    fireEvent.change(numero(), { target: { value: '(11) 98765' } });
    expect(JSON.parse(guardado()!)).toEqual({ numero: '(11) 98765', mensagem: '' });
    fireEvent.change(mensagem(), { target: { value: 'Oi!' } });
    expect(JSON.parse(guardado()!)).toEqual({ numero: '(11) 98765', mensagem: 'Oi!' });
  });

  it('ao voltar, os dois reaparecem', () => {
    const primeira = render(<LinkWhatsappView />);
    fireEvent.change(numero(), { target: { value: '11987654321' } });
    fireEvent.change(mensagem(), { target: { value: 'Olá!\nQuero pão' } });
    primeira.unmount();

    render(<LinkWhatsappView />);
    expect(numero()).toHaveValue('11987654321');
    expect(mensagem()).toHaveValue('Olá!\nQuero pão');
    expect(screen.getByText('O cliente vai chamar (11) 98765-4321')).toBeInTheDocument();
  });

  it('abrir a página não grava nada nem apaga o que estava guardado', () => {
    const antes = JSON.stringify({ numero: '11987654321', mensagem: 'Oi' });
    window.localStorage.setItem(CHAVE_DO_LINK, antes);
    render(<LinkWhatsappView />);
    expect(guardado()).toBe(antes);
  });

  it('restaurar não mostra erro nem tira o foco de onde está', () => {
    window.localStorage.setItem(CHAVE_DO_LINK, JSON.stringify({ numero: '1198', mensagem: '' }));
    render(<LinkWhatsappView />);
    expect(numero()).toHaveValue('1198');
    expect(numero()).not.toHaveAttribute('aria-invalid');
    expect(numero()).not.toHaveFocus();
  });

  it.each(['{x', 'null', '[]', '{}'])('guardado ilegível (%s): a página abre vazia, sem erro', (texto) => {
    window.localStorage.setItem(CHAVE_DO_LINK, texto);
    render(<LinkWhatsappView />);
    expect(numero()).toHaveValue('');
    expect(mensagem()).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('se o armazenamento do navegador falhar ao ler ou ao gravar, a página funciona', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('cota');
    });
    render(<LinkWhatsappView />);
    fireEvent.change(numero(), { target: { value: '11987654321' } });
    expect(screen.getByText('O cliente vai chamar (11) 98765-4321')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

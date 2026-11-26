import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LinkWhatsappView from '../LinkWhatsappView';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const campo = () => screen.getByLabelText('Número com DDD');
const digitar = (valor: string) => fireEvent.change(campo(), { target: { value: valor } });

beforeEach(() => {
  window.localStorage.clear();
});

describe('Bloco 1: número (RF-LW-04 a RF-LW-07)', () => {
  it('o campo tem o rótulo, o exemplo, o teclado de telefone e o preenchimento do aparelho', () => {
    render(<LinkWhatsappView />);
    expect(campo()).toHaveAttribute('placeholder', '(11) 98765-4321');
    expect(campo()).toHaveAttribute('inputmode', 'tel');
    expect(campo()).toHaveAttribute('autocomplete', 'tel-national');
    expect(campo()).not.toHaveAttribute('aria-invalid');
  });

  it('com número válido mostra o número formatado embaixo do campo', () => {
    render(<LinkWhatsappView />);
    digitar('11987654321');
    expect(screen.getByText('O cliente vai chamar (11) 98765-4321')).toBeInTheDocument();
    expect(campo()).not.toHaveAttribute('aria-invalid');
  });

  it.each([
    ['+55 (11) 98765-4321', '(11) 98765-4321'],
    ['011 98765-4321', '(11) 98765-4321'],
    ['(11) 3456-7890', '(11) 3456-7890'],
  ])('aceita %s', (digitado, formatado) => {
    render(<LinkWhatsappView />);
    digitar(digitado);
    expect(screen.getByText(`O cliente vai chamar ${formatado}`)).toBeInTheDocument();
  });

  it('número incompleto: o erro só aparece depois de sair do campo, com aria-invalid e aria-describedby', () => {
    render(<LinkWhatsappView />);
    digitar('1198765');
    expect(campo()).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByText(/Falta número/)).not.toBeInTheDocument();

    fireEvent.blur(campo());
    expect(campo()).toHaveAttribute('aria-invalid', 'true');
    expect(campo()).toHaveAccessibleDescription('Falta número. Digite o DDD e o número. Exemplo: (11) 98765-4321');
    expect(screen.queryByText(/O cliente vai chamar/)).not.toBeInTheDocument();
  });

  it('depois do erro, ele acompanha a digitação e some quando o número fica certo', () => {
    render(<LinkWhatsappView />);
    digitar('1198765');
    fireEvent.blur(campo());
    digitar('119876543210');
    expect(campo()).toHaveAccessibleDescription('Tem dígito a mais. Digite só o DDD e o número.');
    digitar('11987654321');
    expect(campo()).not.toHaveAttribute('aria-invalid');
    expect(campo()).toHaveAccessibleDescription('O cliente vai chamar (11) 98765-4321');
  });

  it.each([
    ['', 'Digite o seu número com DDD.'],
    ['11887654321', 'Celular com 11 dígitos tem 9 depois do DDD. Confira o número.'],
    ['0011987654321', 'Confira o DDD: ele não começa com 0.'],
  ])('ao sair do campo com %j mostra o texto da spec', (digitado, texto) => {
    render(<LinkWhatsappView />);
    if (digitado) digitar(digitado);
    fireEvent.blur(campo());
    expect(campo()).toHaveAttribute('aria-invalid', 'true');
    expect(campo()).toHaveAccessibleDescription(texto);
  });

  it('sair do campo com o número certo não mostra erro', () => {
    render(<LinkWhatsappView />);
    digitar('11987654321');
    fireEvent.blur(campo());
    expect(campo()).not.toHaveAttribute('aria-invalid');
  });
});

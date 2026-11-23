import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Campo, CampoTexto } from '../Campo';

describe('Campo', () => {
  it('liga o rótulo ao campo (getByLabelText) com teclado numérico', () => {
    render(<Campo rotulo="Aluguel e condomínio" valor={800} onChange={() => {}} prefixo="R$" />);
    const campo = screen.getByLabelText('Aluguel e condomínio');
    expect(campo).toHaveAttribute('inputmode', 'decimal');
  });

  it('liga a ajuda por aria-describedby e a deixa sempre visível', () => {
    const ajuda = 'Orçamento, deslocamento, espera. Se não souber, deixe 20%.';
    render(<Campo rotulo="Tempo sem vender" ajuda={ajuda} valor={20} onChange={() => {}} sufixo="%" />);
    const campo = screen.getByLabelText('Tempo sem vender');
    const texto = screen.getByText(ajuda);
    expect(texto).toBeVisible();
    expect(campo.getAttribute('aria-describedby')).toContain(texto.id);
    expect(texto.id).not.toBe('');
  });

  it('sem ajuda nem erro, não declara aria-describedby', () => {
    render(<Campo rotulo="Luz e água" valor={150} onChange={() => {}} />);
    expect(screen.getByLabelText('Luz e água')).not.toHaveAttribute('aria-describedby');
  });

  it('mostra o prefixo R$ e o sufixo % ao lado do campo', () => {
    const { rerender } = render(<Campo rotulo="Material" valor={40} onChange={() => {}} prefixo="R$" />);
    expect(screen.getByText('R$')).toBeInTheDocument();
    rerender(<Campo rotulo="Imposto" valor={6} onChange={() => {}} sufixo="%" />);
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('sem foco, mostra o número em pt-BR', () => {
    render(<Campo rotulo="Pró-labore" valor={3000} onChange={() => {}} prefixo="R$" />);
    expect(screen.getByLabelText('Pró-labore')).toHaveValue('3.000,00');
  });

  it('sem foco e sem R$, mostra sem zeros sobrando', () => {
    render(<Campo rotulo="Horas" valor={2.5} onChange={() => {}} />);
    expect(screen.getByLabelText('Horas')).toHaveValue('2,5');
  });

  it('aceita digitação com vírgula: "2,5" vira 2,5', () => {
    const aoMudar = vi.fn();
    render(<Campo rotulo="Horas que leva" valor={0} onChange={aoMudar} />);
    const campo = screen.getByLabelText('Horas que leva');
    fireEvent.focus(campo);
    fireEvent.change(campo, { target: { value: '2,5' } });
    expect(aoMudar).toHaveBeenLastCalledWith(2.5);
    expect(campo).toHaveValue('2,5');
  });

  it('aceita "R$ 1.234,56" colado', () => {
    const aoMudar = vi.fn();
    render(<Campo rotulo="Material" valor={0} onChange={aoMudar} prefixo="R$" />);
    fireEvent.change(screen.getByLabelText('Material'), { target: { value: 'R$ 1.234,56' } });
    expect(aoMudar).toHaveBeenLastCalledWith(1234.56);
  });

  it('ao sair do campo, volta a mostrar o valor formatado', () => {
    const { rerender } = render(<Campo rotulo="Material" valor={0} onChange={() => {}} prefixo="R$" />);
    const campo = screen.getByLabelText('Material');
    fireEvent.focus(campo);
    fireEvent.change(campo, { target: { value: '40' } });
    rerender(<Campo rotulo="Material" valor={40} onChange={() => {}} prefixo="R$" />);
    expect(campo).toHaveValue('40');
    fireEvent.blur(campo);
    expect(campo).toHaveValue('40,00');
  });

  it('com foco num valor zero, abre vazio para digitar', () => {
    render(<Campo rotulo="Material" valor={0} onChange={() => {}} prefixo="R$" />);
    const campo = screen.getByLabelText('Material');
    fireEvent.focus(campo);
    expect(campo).toHaveValue('');
  });

  it('mostra o erro com aria-invalid e a mensagem ligada ao campo', () => {
    const erro = 'Coloque pelo menos 1 cliente para ver a conta.';
    render(<Campo rotulo="Clientes novos" valor={0} onChange={() => {}} erro={erro} />);
    const campo = screen.getByLabelText('Clientes novos');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    const mensagem = screen.getByText(erro);
    expect(campo.getAttribute('aria-describedby')).toContain(mensagem.id);
  });

  it('sem erro, não marca aria-invalid', () => {
    render(<Campo rotulo="Clientes novos" valor={1} onChange={() => {}} />);
    expect(screen.getByLabelText('Clientes novos')).not.toHaveAttribute('aria-invalid', 'true');
  });
});

describe('CampoTexto', () => {
  it('é um campo de texto com rótulo, que devolve o texto digitado', () => {
    const aoMudar = vi.fn();
    render(<CampoTexto rotulo="Nome do serviço" valor="" onChange={aoMudar} ajuda="Opcional." />);
    const campo = screen.getByLabelText('Nome do serviço');
    expect(campo).not.toHaveAttribute('inputmode', 'decimal');
    fireEvent.change(campo, { target: { value: 'Manutenção' } });
    expect(aoMudar).toHaveBeenCalledWith('Manutenção');
    expect(campo.getAttribute('aria-describedby')).toContain(screen.getByText('Opcional.').id);
  });
});

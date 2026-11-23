import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Botao } from '../Botao';

describe('Botao', () => {
  it.each(['principal', 'contorno', 'link'] as const)('variante %s tem nome acessível e dispara o clique', (variante) => {
    const aoClicar = vi.fn();
    render(<Botao variante={variante} onClick={aoClicar}>Ver resultado</Botao>);
    const botao = screen.getByRole('button', { name: 'Ver resultado' });
    fireEvent.click(botao);
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it('não envia formulário por engano (type=button por padrão)', () => {
    render(<Botao>Apagar</Botao>);
    expect(screen.getByRole('button', { name: 'Apagar' })).toHaveAttribute('type', 'button');
  });

  it('desabilitado não dispara o clique', () => {
    const aoClicar = vi.fn();
    render(<Botao disabled onClick={aoClicar}>Apagar</Botao>);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
    expect(aoClicar).not.toHaveBeenCalled();
  });
});

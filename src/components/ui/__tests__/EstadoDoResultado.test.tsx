import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EstadoDoResultado } from '../EstadoDoResultado';

describe('EstadoDoResultado', () => {
  it.each([
    ['falta', 'Falta pouco', 'Preencha as horas do serviço para ver o preço mínimo.'],
    ['saudavel', 'Saudável', 'De cada R$ 100, sobram R$ 32,50.'],
    ['sobra-pouco', 'Sobra pouco', 'De cada R$ 100, sobram R$ 8,00.'],
    ['prejuizo', 'Prejuízo', 'Esse preço está abaixo do mínimo. Você perde R$ 12,75 em cada venda.'],
  ] as const)('estado %s escreve o selo "%s" e a frase', (estado, selo, frase) => {
    render(<EstadoDoResultado estado={estado} frase={frase} />);
    const area = screen.getByRole('status');
    expect(area).toHaveTextContent(selo);
    expect(area).toHaveTextContent(frase);
  });

  it('aceita linhas extras depois da frase', () => {
    render(
      <EstadoDoResultado estado="saudavel" frase="De cada R$ 100, sobram R$ 32,50.">
        <p>Sobra no bolso R$ 81,25</p>
      </EstadoDoResultado>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('De cada R$ 100, sobram R$ 32,50.');
    expect(screen.getByText('Sobra no bolso R$ 81,25')).toBeInTheDocument();
  });
});

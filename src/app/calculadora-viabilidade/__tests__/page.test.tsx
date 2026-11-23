import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Page, { metadata } from '../page';
import { metadata as metadataDoLayout } from '../layout';

const TITULO = 'Vale a pena anunciar? Calculadora grátis de anúncio | Unum People Tools';
const DESCRICAO =
  'Veja quantas vendas pagam o seu anúncio no Google ou no Instagram antes de gastar. Grátis, sem cadastro.';

describe('página de Vale a pena anunciar?', () => {
  it('monta a ferramenta com o guia recolhido em "Como funciona esta conta"', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: 'Vale a pena anunciar?' })).toBeInTheDocument();
    const detalhes = screen.getByText('Como funciona esta conta').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    expect(detalhes).toHaveTextContent('Guia da Calculadora de Viabilidade');
  });

  it('usa o título e a descrição da spec (RF-F3a-13), sem repetir o sufixo do site', () => {
    expect(metadata.title).toEqual({ absolute: TITULO });
    expect(metadata.description).toBe(DESCRICAO);
  });

  it('o layout da rota não contradiz a página', () => {
    expect(metadataDoLayout.title).toEqual({ absolute: TITULO });
    expect(metadataDoLayout.description).toBe(DESCRICAO);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Page, { metadata } from '../page';
import { metadata as metadataDoLayout } from '../layout';

const TITULO = 'Quais serviços compensam? Compare lucro e trabalho | Unum People Tools';
const DESCRICAO =
  'Descubra quais serviços dão lucro e quais dão trabalho demais. Ferramenta grátis para MEI e autônomos, sem cadastro.';

describe('página de Quais serviços compensam', () => {
  it('monta a ferramenta com o guia no recolhível, mesmo antes de carregar os dados', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: 'Quais serviços compensam' })).toBeInTheDocument();
    const detalhes = screen.getByText('Como funciona esta conta').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    expect(detalhes).toHaveTextContent('Como descobrir quais serviços compensam');
  });

  it('usa o título e a descrição da spec (RF-F3b-11), sem repetir o sufixo do site', () => {
    expect(metadata.title).toEqual({ absolute: TITULO });
    expect(metadata.description).toBe(DESCRICAO);
  });

  it('o layout da rota não contradiz a página', () => {
    expect(metadataDoLayout.title).toEqual({ absolute: TITULO });
    expect(metadataDoLayout.description).toBe(DESCRICAO);
  });
});

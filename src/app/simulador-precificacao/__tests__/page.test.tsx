import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Page, { metadata } from '../page';
import { metadata as metadataDoLayout } from '../layout';

const TITULO = 'Quanto cobrar pelo serviço — calculadora grátis | Unum People Tools';
const DESCRICAO =
  'Descubra o menor preço que não dá prejuízo e quanto sobra no bolso. Calculadora grátis para MEI e autônomos, sem cadastro.';

describe('página de Quanto cobrar pelo serviço', () => {
  it('monta a ferramenta com o guia no recolhível, mesmo antes de carregar os dados', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: 'Quanto cobrar pelo serviço' })).toBeInTheDocument();
    const detalhes = screen.getByText('Como funciona esta conta').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    expect(detalhes).toHaveTextContent('Guia do Simulador de Precificação');
  });

  it('usa o título e a descrição da spec (RF-F2-25), sem repetir o sufixo do site', () => {
    expect(metadata.title).toEqual({ absolute: TITULO });
    expect(metadata.description).toBe(DESCRICAO);
  });

  it('o layout da rota não contradiz a página', () => {
    expect(metadataDoLayout.title).toEqual({ absolute: TITULO });
    expect(metadataDoLayout.description).toBe(DESCRICAO);
  });
});

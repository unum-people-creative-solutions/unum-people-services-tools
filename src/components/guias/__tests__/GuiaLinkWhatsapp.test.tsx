import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GuiaLinkWhatsapp } from '../GuiaLinkWhatsapp';
import { textoDe, topico } from './regras';

describe('GuiaLinkWhatsapp (RF-LW-23)', () => {
  it('tem o h2 literal, numa seção com esse nome', () => {
    render(<GuiaLinkWhatsapp />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Como usar o link do WhatsApp no seu negócio' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Como usar o link do WhatsApp no seu negócio' }).tagName).toBe('SECTION');
  });

  it('tem os tópicos, na ordem', () => {
    render(<GuiaLinkWhatsapp />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Mensagem que funciona',
      'Se o link não abrir no Instagram',
      'Perguntas frequentes',
    ]);
  });

  it('"Mensagem que funciona" fala de mensagem curta, do que o cliente quer e de não pedir dados pessoais', () => {
    render(<GuiaLinkWhatsapp />);
    const texto = textoDe(topico('Mensagem que funciona')).toLowerCase();
    expect(texto).toContain('curta');
    for (const palavra of ['pedido', 'horário', 'orçamento']) expect(texto).toContain(palavra);
    expect(texto).toContain('dados pessoais');
  });

  it('"Se o link não abrir no Instagram" tem o texto literal', () => {
    render(<GuiaLinkWhatsapp />);
    expect(
      within(topico('Se o link não abrir no Instagram')).getByText(
        'Dentro do Instagram, alguns celulares não abrem o WhatsApp. Toque nos três pontos no canto da tela e escolha abrir no navegador.',
      ),
    ).toBeInTheDocument();
  });

  it('as 4 perguntas têm as respostas literais, na ordem', () => {
    render(<GuiaLinkWhatsapp />);
    const faq = topico('Perguntas frequentes');
    expect(within(faq).getAllByRole('term').map((t) => t.textContent)).toEqual([
      'O link expira?',
      'Por que o link não é curto?',
      'E se eu trocar de número?',
      'Precisa de cadastro?',
    ]);
    expect(within(faq).getAllByRole('definition').map((d) => d.textContent)).toEqual([
      'Não. O link é do próprio WhatsApp e não passa por nenhum serviço nosso. Funciona enquanto o número tiver WhatsApp.',
      'Link curto precisa de um serviço no meio. Se o serviço sai do ar ou passa a cobrar, o link para. O link do WhatsApp é o oficial e não depende de ninguém.',
      'Crie um link novo com o número novo e troque onde você colou o antigo.',
      'Não. É grátis, sem cadastro e sem anúncio, e o que você digita não sai do seu aparelho.',
    ]);
  });
});

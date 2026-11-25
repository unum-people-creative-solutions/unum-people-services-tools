import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GuiaQrCode } from '../GuiaQrCode';
import { textoDe, topico } from './regras';

describe('GuiaQrCode (RF-QR-30)', () => {
  it('tem o h2 literal, numa seção com esse nome', () => {
    render(<GuiaQrCode />);
    expect(screen.getByRole('heading', { level: 2, name: 'Como usar o QR code no seu negócio' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Como usar o QR code no seu negócio' }).tagName).toBe('SECTION');
  });

  it('tem os quatro tópicos e as perguntas, na ordem', () => {
    render(<GuiaQrCode />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Onde colocar o QR code',
      'Pix: teste antes de imprimir',
      'Como pegar o link de avaliação do Google pelo celular',
      'Qual tamanho imprimir',
      'Perguntas frequentes',
    ]);
  });

  it('"Onde colocar" cita balcão, vitrine, embalagem, cardápio, cartão e Instagram', () => {
    render(<GuiaQrCode />);
    const lista = within(topico('Onde colocar o QR code')).getByRole('list');
    const itens = within(lista).getAllByRole('listitem').map((i) => textoDe(i));
    expect(itens).toHaveLength(6);
    for (const [i, palavra] of ['balcão', 'vitrine', 'embalagem', 'cardápio', 'cartão', 'Instagram'].entries()) {
      expect(itens[i].toLowerCase()).toContain(palavra.toLowerCase());
    }
  });

  it('"Pix: teste antes de imprimir" fala do teste no app do banco, do adesivo por cima e da chave aleatória', () => {
    render(<GuiaQrCode />);
    const texto = textoDe(topico('Pix: teste antes de imprimir'));
    expect(texto).toMatch(/app do (seu )?banco/);
    expect(texto).toMatch(/adesivo/);
    expect(texto).toMatch(/por cima/);
    expect(texto).toMatch(/chave aleatória/);
  });

  it('o link de avaliação do Google tem 3 passos numerados, com o texto literal', () => {
    render(<GuiaQrCode />);
    const lista = within(topico('Como pegar o link de avaliação do Google pelo celular')).getByRole('list');
    expect(lista.tagName).toBe('OL');
    expect(within(lista).getAllByRole('listitem').map((i) => i.textContent)).toEqual([
      'Abra o app do Google e pesquise o nome do seu negócio.',
      'No seu perfil, toque em Pedir avaliações.',
      'Toque em Copiar link e cole aqui.',
    ]);
  });

  it('o tamanho: no mínimo 3 cm e 1/10 da distância (1 metro, 10 cm)', () => {
    render(<GuiaQrCode />);
    const texto = textoDe(topico('Qual tamanho imprimir'));
    expect(texto).toContain('3 cm');
    expect(texto).toMatch(/1\/10 da distância/);
    expect(texto).toMatch(/1 metro, 10 cm/);
  });

  it('as três perguntas e respostas literais', () => {
    render(<GuiaQrCode />);
    const faq = topico('Perguntas frequentes');
    expect(Array.from(faq.querySelectorAll('dt')).map((d) => d.textContent)).toEqual([
      'O QR code expira?',
      'Precisa de cadastro?',
      'Posso mudar o destino depois?',
    ]);
    const respostas = Array.from(faq.querySelectorAll('dd')).map((d) => d.textContent);
    expect(respostas).toEqual([
      'Não. O que está no QR fica dentro da imagem e funciona para sempre. Só para de funcionar se o destino deixar de existir, como uma chave Pix apagada.',
      'Não. É grátis, sem cadastro e sem anúncio, e o que você digita não sai do seu aparelho.',
      'Não, porque o destino está dentro da imagem. Para mudar, crie outro. Se o QR leva para a sua página, você muda a página e o mesmo QR continua valendo.',
    ]);
  });
});

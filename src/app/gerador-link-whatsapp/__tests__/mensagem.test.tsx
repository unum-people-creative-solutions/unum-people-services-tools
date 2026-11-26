import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LinkWhatsappView from '../LinkWhatsappView';
import { MENSAGENS_PRONTAS } from '@/utils/linkWhatsapp/mensagens';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const campo = () => screen.getByLabelText('Mensagem (opcional)') as HTMLTextAreaElement;
const grupo = () => screen.getByRole('group', { name: 'Mensagens prontas' });
const previa = () => screen.getByRole('region', { name: 'Prévia da mensagem' });

beforeEach(() => {
  window.localStorage.clear();
});

describe('Bloco 2: mensagem e prévia (RF-LW-08 a RF-LW-11)', () => {
  it('tem os 5 botões de mensagem pronta, na ordem da spec, nenhum marcado', () => {
    render(<LinkWhatsappView />);
    const botoes = within(grupo()).getAllByRole('button');
    expect(botoes.map((b) => b.textContent)).toEqual(MENSAGENS_PRONTAS.map((m) => m.rotulo));
    expect(botoes.map((b) => b.textContent)).toEqual([
      'Fazer um pedido',
      'Agendar um horário',
      'Pedir orçamento',
      'Saber o preço',
      'Vi seu anúncio',
    ]);
    for (const b of botoes) expect(b).toHaveAttribute('aria-pressed', 'false');
  });

  it('tocar em "Agendar um horário" põe o texto, marca só esse botão, conta e mostra na prévia', () => {
    render(<LinkWhatsappView />);
    fireEvent.click(screen.getByRole('button', { name: 'Agendar um horário' }));
    const texto = 'Olá! Quero agendar um horário. Quais dias você tem livres?';
    expect(campo()).toHaveValue(texto);
    expect(screen.getByRole('button', { name: 'Agendar um horário' })).toHaveAttribute('aria-pressed', 'true');
    for (const outro of ['Fazer um pedido', 'Pedir orçamento', 'Saber o preço', 'Vi seu anúncio']) {
      expect(screen.getByRole('button', { name: outro })).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.getByText('58 de 500')).toBeInTheDocument();
    expect(previa()).toHaveTextContent(texto);
  });

  it.each(MENSAGENS_PRONTAS.map((m) => [m.rotulo, m.texto]))('"%s" põe o texto exato no campo', (rotulo, texto) => {
    render(<LinkWhatsappView />);
    fireEvent.click(screen.getByRole('button', { name: rotulo }));
    expect(campo()).toHaveValue(texto);
  });

  it('tocar substitui o que estava no campo e leva o foco para o fim do texto', () => {
    render(<LinkWhatsappView />);
    fireEvent.change(campo(), { target: { value: 'outra coisa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Saber o preço' }));
    expect(campo()).toHaveValue('Olá! Quanto custa?');
    expect(campo()).toHaveFocus();
    expect(campo().selectionStart).toBe('Olá! Quanto custa?'.length);
    expect(campo().selectionEnd).toBe('Olá! Quanto custa?'.length);
  });

  it('acrescentar uma letra desmarca o botão', () => {
    render(<LinkWhatsappView />);
    fireEvent.click(screen.getByRole('button', { name: 'Pedir orçamento' }));
    fireEvent.change(campo(), { target: { value: `${campo().value}!` } });
    for (const b of within(grupo()).getAllByRole('button')) expect(b).toHaveAttribute('aria-pressed', 'false');
  });

  it('digitar o texto exato de um atalho também marca o botão', () => {
    render(<LinkWhatsappView />);
    fireEvent.change(campo(), { target: { value: 'Olá! Quanto custa?' } });
    expect(screen.getByRole('button', { name: 'Saber o preço' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('o campo tem 4 linhas, limite de 500 e o contador', () => {
    render(<LinkWhatsappView />);
    expect(campo().tagName).toBe('TEXTAREA');
    expect(campo()).toHaveAttribute('rows', '4');
    expect(campo()).toHaveAttribute('maxlength', '500');
    expect(screen.getByText('0 de 500')).toBeInTheDocument();
    fireEvent.change(campo(), { target: { value: 'Oi' } });
    expect(screen.getByText('2 de 500')).toBeInTheDocument();
    expect(campo()).toHaveAccessibleDescription('2 de 500');
  });

  it('sem mensagem, a prévia diz que a conversa abre em branco; o aviso fica sempre visível', () => {
    render(<LinkWhatsappView />);
    expect(within(previa()).getByText('Como chega para você')).toBeInTheDocument();
    expect(within(previa()).getByText('Sem mensagem, a conversa abre em branco.')).toBeInTheDocument();
    expect(within(previa()).getByText('O cliente ainda toca em enviar e pode mudar o texto.')).toBeInTheDocument();

    fireEvent.change(campo(), { target: { value: 'Oi' } });
    expect(screen.queryByText('Sem mensagem, a conversa abre em branco.')).not.toBeInTheDocument();
    expect(within(previa()).getByText('O cliente ainda toca em enviar e pode mudar o texto.')).toBeInTheDocument();
  });

  it('só espaços ou quebras de linha contam como sem mensagem', () => {
    render(<LinkWhatsappView />);
    fireEvent.change(campo(), { target: { value: '  \n ' } });
    expect(screen.getByText('Sem mensagem, a conversa abre em branco.')).toBeInTheDocument();
  });

  it('a prévia mantém as quebras de linha', () => {
    render(<LinkWhatsappView />);
    fireEvent.change(campo(), { target: { value: 'Linha 1\nLinha 2' } });
    const balao = within(previa()).getByText((_, el) => el?.textContent === 'Linha 1\nLinha 2' && el.children.length === 0);
    expect(balao).toBeInTheDocument();
    expect(getComputedStyle(balao).whiteSpace).toBe('pre-wrap');
  });
});

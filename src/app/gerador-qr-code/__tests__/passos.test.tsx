import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QrCodeView from '../QrCodeView';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const NOMES_DOS_6 = [
  'Receber Pix',
  'Chamar no WhatsApp',
  'Instagram e redes',
  'Link do site',
  'Wi-Fi da loja',
  'Avaliar no Google',
];
const NOMES_DE_MAIS_OPCOES = ['Como chegar', 'Salvar contato', 'E-mail', 'Ligação', 'Texto'];

const montar = () => render(<QrCodeView />);
const escolher = (nome: string) => fireEvent.click(screen.getByRole('radio', { name: nome }));
const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const sair = (rotulo: string) => fireEvent.blur(screen.getByLabelText(rotulo));

beforeEach(() => {
  window.localStorage.clear();
});

describe('Passo 1: tipo (RF-QR-04, RF-QR-05)', () => {
  it('tem o h2 e um radiogroup com o mesmo nome, com os 6 mais usados na ordem', () => {
    montar();
    expect(screen.getByRole('heading', { level: 2, name: 'Para que é o seu QR code?' })).toBeInTheDocument();
    const grupo = screen.getByRole('radiogroup', { name: 'Para que é o seu QR code?' });
    const radios = within(grupo).getAllByRole('radio');
    expect(radios.slice(0, 6).map((r) => r.getAttribute('aria-label') ?? r.closest('label')?.textContent)).toEqual(
      NOMES_DOS_6,
    );
  });

  it('põe os outros 5 em "Mais opções"', () => {
    montar();
    const detalhes = screen.getByText('Mais opções').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    const nomes = within(detalhes)
      .getAllByRole('radio')
      .map((r) => r.closest('label')?.textContent);
    expect(nomes).toEqual(NOMES_DE_MAIS_OPCOES);
  });

  it('antes de escolher, não mostra campos nem "QR code para:"', () => {
    montar();
    expect(screen.queryByText(/^QR code para:/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Trocar' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Chave Pix')).not.toBeInTheDocument();
  });

  it('ao escolher, recolhe a grade, mostra "QR code para: …" e põe o foco no primeiro campo', () => {
    montar();
    escolher('Chamar no WhatsApp');
    expect(screen.getByText('QR code para: Chamar no WhatsApp')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Número do WhatsApp com DDD')).toHaveFocus();
  });

  it('no Pix, o primeiro campo é "Tipo da chave"', () => {
    montar();
    escolher('Receber Pix');
    expect(screen.getByLabelText('Tipo da chave')).toHaveFocus();
  });

  it('"Trocar" reabre a grade com o tipo atual marcado', () => {
    montar();
    escolher('Wi-Fi da loja');
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    expect(screen.getByRole('radiogroup', { name: 'Para que é o seu QR code?' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Wi-Fi da loja' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Receber Pix' })).not.toBeChecked();
  });

  it('com um tipo de "Mais opções", reabre a grade com o recolhível aberto', () => {
    montar();
    escolher('Ligação');
    expect(screen.getByText('QR code para: Ligação')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    const detalhes = screen.getByText('Mais opções').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(true);
    expect(screen.getByRole('radio', { name: 'Ligação' })).toBeChecked();
  });

  it('tocar de novo no tipo já marcado também recolhe a grade', () => {
    montar();
    escolher('Link do site');
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    escolher('Link do site');
    expect(screen.getByText('QR code para: Link do site')).toBeInTheDocument();
  });

  it('trocar de tipo preserva os campos de todos os tipos', () => {
    montar();
    escolher('Receber Pix');
    digitar('Nome de quem recebe', 'Maria da Silva');
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', '11987654321');
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    escolher('Receber Pix');
    expect(screen.getByLabelText('Nome de quem recebe')).toHaveValue('Maria da Silva');
    fireEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    escolher('Chamar no WhatsApp');
    expect(screen.getByLabelText('Número do WhatsApp com DDD')).toHaveValue('11987654321');
  });
});

const FORMULARIOS: [string, string[]][] = [
  ['Receber Pix', ['Tipo da chave', 'Chave Pix', 'Nome de quem recebe', 'Cidade', 'Valor (opcional)']],
  ['Chamar no WhatsApp', ['Número do WhatsApp com DDD', 'Mensagem que já chega escrita (opcional)']],
  ['Instagram e redes', ['Rede', 'Seu @ ou o link do perfil']],
  ['Link do site', ['Endereço do site']],
  ['Wi-Fi da loja', ['Nome da rede (Wi-Fi)', 'Senha', 'Rede sem senha']],
  ['Avaliar no Google', ['Link de avaliação do Google']],
  ['Como chegar', ['Endereço do negócio ou link do Google Maps']],
  [
    'Salvar contato',
    ['Nome', 'Nome do negócio (opcional)', 'Celular (opcional)', 'E-mail (opcional)', 'Site (opcional)'],
  ],
  ['E-mail', ['Seu e-mail', 'Assunto (opcional)', 'Mensagem (opcional)']],
  ['Ligação', ['Telefone com DDD']],
  ['Texto', ['Texto']],
];

describe('Passo 2: os 11 formulários (RF-QR-06 a 16)', () => {
  it.each(FORMULARIOS)('%s tem os rótulos literais', (tipo, rotulos) => {
    montar();
    escolher(tipo);
    for (const rotulo of rotulos) {
      expect(screen.getByLabelText(rotulo), rotulo).toBeInTheDocument();
    }
  });

  it.each(FORMULARIOS)('%s: os campos de texto têm exemplo (placeholder)', (tipo, rotulos) => {
    montar();
    escolher(tipo);
    const comExemplo = rotulos
      .map((r) => screen.getByLabelText(r))
      .filter((el) => el.tagName !== 'SELECT' && (el as HTMLInputElement).type !== 'checkbox');
    for (const campo of comExemplo) {
      expect((campo as HTMLInputElement).placeholder, campo.id).not.toBe('');
    }
  });

  it('o WhatsApp usa o exemplo da spec na mensagem', () => {
    montar();
    escolher('Chamar no WhatsApp');
    expect(screen.getByLabelText('Mensagem que já chega escrita (opcional)')).toHaveAttribute(
      'placeholder',
      'Olá! Vim pelo QR code e quero saber mais.',
    );
  });

  it('o Pix tem os 5 tipos de chave e a ajuda do valor', () => {
    montar();
    escolher('Receber Pix');
    const opcoes = within(screen.getByLabelText('Tipo da chave')).getAllByRole('option');
    expect(opcoes.map((o) => o.textContent)).toEqual(['CPF', 'CNPJ', 'Celular', 'E-mail', 'Chave aleatória']);
    expect(screen.getByText('Deixe em branco para o cliente digitar o valor.')).toBeInTheDocument();
  });

  it('as redes têm as 5 opções', () => {
    montar();
    escolher('Instagram e redes');
    const opcoes = within(screen.getByLabelText('Rede')).getAllByRole('option');
    expect(opcoes.map((o) => o.textContent)).toEqual(['Instagram', 'TikTok', 'Facebook', 'YouTube', 'Outra']);
  });

  it('o Wi-Fi sem senha desliga o campo da senha', () => {
    montar();
    escolher('Wi-Fi da loja');
    const senha = screen.getByLabelText('Senha');
    expect(senha).toBeEnabled();
    fireEvent.click(screen.getByLabelText('Rede sem senha'));
    expect(senha).toBeDisabled();
  });

  it('o Texto tem contador até 300', () => {
    montar();
    escolher('Texto');
    expect(screen.getByText('0 de 300 caracteres')).toBeInTheDocument();
    digitar('Texto', 'Olá');
    expect(screen.getByText('3 de 300 caracteres')).toBeInTheDocument();
  });
});

describe('Passo 2: erros embaixo do campo (RF-QR-06 a 16)', () => {
  it('só mostra o erro depois que a pessoa sai do campo, ligado por aria-describedby', () => {
    montar();
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', '123');
    expect(screen.queryByText('Digite o número com DDD. Exemplo: (11) 98765-4321')).not.toBeInTheDocument();
    sair('Número do WhatsApp com DDD');
    const erro = screen.getByText('Digite o número com DDD. Exemplo: (11) 98765-4321');
    const campo = screen.getByLabelText('Número do WhatsApp com DDD');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo.getAttribute('aria-describedby')?.split(' ')).toContain(erro.id);
  });

  it('o erro some quando o campo fica certo', () => {
    montar();
    escolher('Link do site');
    digitar('Endereço do site', 'semponto');
    sair('Endereço do site');
    expect(screen.getByText('Confira o endereço. Exemplo: www.seunegocio.com.br')).toBeInTheDocument();
    digitar('Endereço do site', 'www.seunegocio.com.br');
    expect(screen.queryByText('Confira o endereço. Exemplo: www.seunegocio.com.br')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Endereço do site')).not.toHaveAttribute('aria-invalid');
  });

  it('um campo único vazio não mostra erro ao abrir', () => {
    montar();
    escolher('Ligação');
    expect(screen.queryByText(/Digite o telefone/)).not.toBeInTheDocument();
    sair('Telefone com DDD');
    expect(screen.getByText('Digite o telefone com DDD. Exemplo: (11) 98765-4321')).toBeInTheDocument();
  });

  it('campo obrigatório vazio mostra o erro quando os outros já estão preenchidos', () => {
    montar();
    escolher('Receber Pix');
    digitar('Chave Pix', '52998224725');
    expect(screen.queryByText('Preencha a cidade.')).not.toBeInTheDocument();
    digitar('Nome de quem recebe', 'Maria da Silva');
    expect(screen.getByText('Preencha a cidade.')).toBeInTheDocument();
    expect(screen.queryByText('Preencha o nome de quem recebe.')).not.toBeInTheDocument();
  });

  it('no contato, nome preenchido sem celular nem e-mail pede um dos dois', () => {
    montar();
    escolher('Salvar contato');
    digitar('Nome', 'Maria da Silva');
    expect(screen.getByText('Preencha o celular ou o e-mail.')).toBeInTheDocument();
    digitar('E-mail (opcional)', 'maria@doces.com.br');
    expect(screen.queryByText('Preencha o celular ou o e-mail.')).not.toBeInTheDocument();
  });

  it('o erro da chave Pix usa o texto literal do tipo escolhido', () => {
    montar();
    escolher('Receber Pix');
    digitar('Chave Pix', '11111111111');
    sair('Chave Pix');
    expect(screen.getByText('Esse CPF não existe. Confira os números.')).toBeInTheDocument();
  });

  it('o Pix avisa do corte do nome e da cidade enquanto a pessoa digita', () => {
    montar();
    escolher('Receber Pix');
    digitar('Nome de quem recebe', 'Maria Aparecida de Souza Santos');
    expect(
      screen.getByText('O Pix aceita até 25 letras no nome. No QR vai: Maria Aparecida de Souza'),
    ).toBeInTheDocument();
    digitar('Cidade', 'São João da Boa Vista');
    expect(
      screen.getByText('O Pix aceita até 15 letras na cidade. No QR vai: Sao Joao da Boa'),
    ).toBeInTheDocument();
    digitar('Cidade', 'Santos');
    expect(screen.queryByText(/letras na cidade/)).not.toBeInTheDocument();
  });
});

import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { lerQrDoSvg } from '@/test/qrNaTela';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';
import { CHAVE_DO_QR } from '@/utils/qr/armazenamento';
import { TIPOS, montarConteudo, type TipoId } from '@/utils/qr/conteudos';
import { estadoVazio } from '@/utils/qr/estado';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const escolher = (nome: string) => fireEvent.click(screen.getByRole('radio', { name: nome }));
const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const guardado = () => window.localStorage.getItem(CHAVE_DO_QR);

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Guardar no aparelho e voltar (RF-QR-28)', () => {
  it('guarda o tipo e os campos em tools-qr-code:v1, com o espaço da F2 reservado', () => {
    render(<QrCodeView />);
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', '11987654321');
    const dados = JSON.parse(guardado()!);
    expect(Object.keys(dados).sort()).toEqual(['campos', 'cor', 'frase', 'nomeDoNegocio', 'tamanho', 'tipo']);
    expect(dados.tipo).toBe('whatsapp');
    expect(dados.campos.whatsapp.numero).toBe('11987654321');
    expect(dados.cor).toBe('#000000');
  });

  it('não grava nada antes de a pessoa mexer, e abrir a página não apaga o que estava guardado', () => {
    const antes = JSON.stringify({ ...estadoVazio(), tipo: 'link' });
    window.localStorage.setItem(CHAVE_DO_QR, antes);
    render(<QrCodeView />);
    expect(guardado()).toBe(antes);
    const vazia = render(<QrCodeView />);
    vazia.unmount();
  });

  it('ao voltar, restaura o tipo e os campos, com a grade à vista e o tipo marcado, e o QR pronto', () => {
    const primeira = render(<QrCodeView />);
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', '11987654321');
    primeira.unmount();

    render(<QrCodeView />);
    const grupo = screen.getByRole('radiogroup', { name: 'Para que é o seu QR code?' });
    expect(within(grupo).getAllByRole('radio')).toHaveLength(11);
    expect(within(grupo).getByRole('radio', { name: 'Chamar no WhatsApp' })).toBeChecked();
    expect(screen.queryByText(/^QR code para:/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Número do WhatsApp com DDD')).toHaveValue('11987654321');
    expect(screen.getByRole('img', { name: 'QR code de Chamar no WhatsApp' })).toBeInTheDocument();
  });

  it('restaurar não tira o foco de onde está', () => {
    window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify({ ...estadoVazio(), tipo: 'link' }));
    render(<QrCodeView />);
    expect(screen.getByLabelText('Endereço do site')).not.toHaveFocus();
  });

  it('trocar de tipo preserva e guarda os campos de todos os tipos', () => {
    const primeira = render(<QrCodeView />);
    escolher('Receber Pix');
    digitar('Nome de quem recebe', 'Maria da Silva');
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    primeira.unmount();

    render(<QrCodeView />);
    expect(screen.getByLabelText('Endereço do site')).toHaveValue('www.um.com.br');
    escolher('Receber Pix');
    expect(screen.getByLabelText('Nome de quem recebe')).toHaveValue('Maria da Silva');
  });

  it.each(['{nao é json', 'null', '[]', '{"tipo":"inexistente"}'])('guardado ilegível (%s): abre vazia, sem erro', (texto) => {
    window.localStorage.setItem(CHAVE_DO_QR, texto);
    render(<QrCodeView />);
    expect(screen.getByRole('radiogroup', { name: 'Para que é o seu QR code?' })).toBeInTheDocument();
    expect(screen.queryByText(/^QR code para:/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('se o armazenamento do navegador falhar ao ler ou ao gravar, a página funciona', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('cota');
    });
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    expect(screen.getByRole('img', { name: 'QR code de Link do site' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each(TIPOS.map((t) => [t.nome, t.id] as [string, TipoId]))(
    'restaurado, %s mostra um QR que lê de volta exatamente o conteúdo montado',
    (nome, id) => {
      const estado = estadoVazio();
      estado.tipo = id;
      estado.campos = { ...estado.campos, ...EXEMPLOS };
      window.localStorage.setItem(CHAVE_DO_QR, JSON.stringify(estado));
      render(<QrCodeView />);
      const esperado = montarConteudo(id, EXEMPLOS[id]);
      expect(esperado.ok).toBe(true);
      const svg = screen.getByRole('img', { name: `QR code de ${nome}` }).querySelector('svg')!;
      expect(lerQrDoSvg(svg)).toBe(esperado.ok ? esperado.texto : null);
    },
  );
});

describe('Apagar o que eu digitei (RF-QR-29)', () => {
  const comDadosGuardados = () => {
    render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
  };

  it('pede confirmação com o texto da spec antes de apagar', () => {
    comDadosGuardados();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o que eu digitei' }));
    expect(screen.getByText('Apagar tudo o que você digitou neste aparelho?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sim, apagar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(guardado()).not.toBeNull();
  });

  it('"Cancelar" fecha a confirmação e não apaga nada', () => {
    comDadosGuardados();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o que eu digitei' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Apagar tudo o que você digitou neste aparelho?')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Endereço do site')).toHaveValue('www.um.com.br');
    expect(guardado()).not.toBeNull();
  });

  it('"Sim, apagar" limpa o estado e a chave, volta ao passo 1 e avisa com role="status"', () => {
    comDadosGuardados();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o que eu digitei' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    expect(guardado()).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Pronto, apagamos tudo.');
    expect(screen.getByRole('radiogroup', { name: 'Para que é o seu QR code?' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Endereço do site')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /^QR code de/ })).not.toBeInTheDocument();
    // os campos de todos os tipos foram limpos
    escolher('Link do site');
    expect(screen.getByLabelText('Endereço do site')).toHaveValue('');
  });

  it('depois de apagar, abrir de novo a página volta vazia', () => {
    const primeira = render(<QrCodeView />);
    escolher('Link do site');
    digitar('Endereço do site', 'www.um.com.br');
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o que eu digitei' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    primeira.unmount();
    render(<QrCodeView />);
    expect(screen.queryByText(/^QR code para:/)).not.toBeInTheDocument();
  });

  it('o aviso "Pronto, apagamos tudo." some quando a pessoa escolhe um tipo', () => {
    comDadosGuardados();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o que eu digitei' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    escolher('Receber Pix');
    expect(screen.queryByText('Pronto, apagamos tudo.')).not.toBeInTheDocument();
  });
});

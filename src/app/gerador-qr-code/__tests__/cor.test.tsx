import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { lerQrDoSvg } from '@/test/qrNaTela';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';
import { CHAVE_DO_QR } from '@/utils/qr/armazenamento';
import { CORES_DO_QR } from '@/utils/qr/desenho';
import { montarConteudo } from '@/utils/qr/conteudos';

// O logo do cabeçalho não importa aqui (e `<img>` solto na suíte acende o lint).
vi.mock('next/image', () => ({ default: () => null }));

const escolher = (nome: string) => fireEvent.click(screen.getByRole('radio', { name: nome }));
const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });

function preencherPix() {
  escolher('Receber Pix');
  digitar('Tipo da chave', 'aleatoria');
  digitar('Chave Pix', EXEMPLOS.pix.chave);
  digitar('Nome de quem recebe', EXEMPLOS.pix.nome);
  digitar('Cidade', EXEMPLOS.pix.cidade);
}

const qrNaTela = () => screen.getByRole('img', { name: 'QR code de Receber Pix' });
const corDoQrNaTela = () => qrNaTela().querySelector('path')?.getAttribute('fill');
const grupoDeCores = () => screen.getByRole('group', { name: 'Cor do QR code' });
const textoDoPix = () => {
  const r = montarConteudo('pix', EXEMPLOS.pix);
  if (!r.ok) throw new Error('exemplo inválido');
  return r.texto;
};

let preenchimentos: string[];

beforeEach(() => {
  window.localStorage.clear();
  preenchimentos = [];
  const ctx = {
    fillStyle: '' as string,
    fillRect: vi.fn(function (this: { fillStyle: string }) {
      preenchimentos.push(this.fillStyle);
    }),
    fillText: vi.fn(),
    drawImage: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb, tipo) => cb(new Blob(['png'], { type: tipo })));
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:x') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('Cor do QR code (RF-QR-32, RF-QR-33, T20)', () => {
  it('antes de escolher o tipo, o recolhível não aparece', () => {
    render(<QrCodeView />);
    expect(screen.queryByText('Deixar com a cara do negócio')).not.toBeInTheDocument();
  });

  it('tem o recolhível "Deixar com a cara do negócio", fechado de início', () => {
    render(<QrCodeView />);
    preencherPix();
    const detalhes = screen.getByText('Deixar com a cara do negócio').closest('details') as HTMLDetailsElement;
    expect(detalhes.open).toBe(false);
    expect(within(detalhes).getByRole('group', { name: 'Cor do QR code' })).toBeInTheDocument();
  });

  it('o grupo "Cor do QR code" tem as 8 cores, cada uma com o nome acessível, e Preto marcada', () => {
    render(<QrCodeView />);
    preencherPix();
    expect(within(grupoDeCores()).getAllByRole('radio')).toHaveLength(8);
    expect(CORES_DO_QR.map((c) => c.nome)).toEqual([
      'Preto',
      'Azul-marinho',
      'Azul',
      'Roxo',
      'Verde',
      'Vinho',
      'Marrom',
      'Grafite',
    ]);
    for (const cor of CORES_DO_QR) {
      expect(within(grupoDeCores()).getByRole('radio', { name: cor.nome })).toBeInTheDocument();
    }
    expect(within(grupoDeCores()).getByRole('radio', { name: 'Preto' })).toBeChecked();
    expect(corDoQrNaTela()).toBe('#000000');
  });

  it('escolher uma cor muda a cor do QR na prévia e ele continua lendo o mesmo conteúdo', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(within(grupoDeCores()).getByRole('radio', { name: 'Azul-marinho' }));
    expect(within(grupoDeCores()).getByRole('radio', { name: 'Azul-marinho' })).toBeChecked();
    expect(within(grupoDeCores()).getByRole('radio', { name: 'Preto' })).not.toBeChecked();
    expect(corDoQrNaTela()).toBe('#0a1c82');
    expect(lerQrDoSvg(qrNaTela().querySelector('svg')!)).toBe(textoDoPix());
  });

  it('a cor vale também para o PNG e para o SVG baixados', async () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(within(grupoDeCores()).getByRole('radio', { name: 'Vinho' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled());
    expect(preenchimentos).toContain('#7a1335');
    expect(preenchimentos).not.toContain('#000000');

    fireEvent.click(screen.getByRole('button', { name: 'Baixar SVG (para gráfica)' }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    const svg = await (vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob).text();
    expect(svg).toContain('fill="#7a1335"');
  });

  it('"Outra cor" usa um seletor de cor e aceita uma cor escura', () => {
    render(<QrCodeView />);
    preencherPix();
    const seletor = screen.getByLabelText('Outra cor') as HTMLInputElement;
    expect(seletor.type).toBe('color');
    fireEvent.change(seletor, { target: { value: '#1a5c2e' } });
    expect(corDoQrNaTela()).toBe('#1a5c2e');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // a cor própria não é nenhuma das 8: nenhuma fica marcada
    expect(within(grupoDeCores()).queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    expect(seletor.value).toBe('#1a5c2e');
  });

  it('cor clara demais: mostra o alerta e o QR mantém a cor anterior', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(within(grupoDeCores()).getByRole('radio', { name: 'Roxo' }));
    const seletor = screen.getByLabelText('Outra cor') as HTMLInputElement;
    fireEvent.change(seletor, { target: { value: '#ffcc00' } });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Essa cor é clara demais: o celular pode não ler. Escolha uma mais escura.',
    );
    expect(corDoQrNaTela()).toBe('#4b0f9e');
    expect(within(grupoDeCores()).getByRole('radio', { name: 'Roxo' })).toBeChecked();
    expect(seletor.value).toBe('#4b0f9e');
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DO_QR)!).cor).toBe('#4b0f9e');
  });

  it('o alerta some quando a pessoa escolhe uma cor boa depois', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.change(screen.getByLabelText('Outra cor'), { target: { value: '#ffcc00' } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(within(grupoDeCores()).getByRole('radio', { name: 'Verde' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(corDoQrNaTela()).toBe('#0b5d3b');
  });

  it('a cor fica guardada no aparelho e volta ao reabrir a página', () => {
    const primeira = render(<QrCodeView />);
    preencherPix();
    fireEvent.click(within(grupoDeCores()).getByRole('radio', { name: 'Marrom' }));
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DO_QR)!).cor).toBe('#5a3a1a');
    primeira.unmount();

    render(<QrCodeView />);
    expect(within(grupoDeCores()).getByRole('radio', { name: 'Marrom' })).toBeChecked();
    expect(corDoQrNaTela()).toBe('#5a3a1a');
  });

  it('"Apagar o que eu digitei" volta a cor para preto', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(within(grupoDeCores()).getByRole('radio', { name: 'Grafite' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar o que eu digitei' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sim, apagar' }));
    preencherPix();
    expect(within(grupoDeCores()).getByRole('radio', { name: 'Preto' })).toBeChecked();
  });
});

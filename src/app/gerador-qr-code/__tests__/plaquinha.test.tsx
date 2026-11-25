import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QrCodeView from '../QrCodeView';
import { lerQrDoSvg } from '@/test/qrNaTela';
import { desligarMedicao, enviados, ligarMedicao } from '@/test/medicao';
import { EXEMPLOS } from '@/utils/qr/__tests__/exemplos';
import { CHAVE_DO_QR } from '@/utils/qr/armazenamento';
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

const textoDoPix = () => {
  const r = montarConteudo('pix', EXEMPLOS.pix);
  if (!r.ok) throw new Error('exemplo inválido');
  return r.texto;
};
const previa = () => screen.getByRole('img', { name: 'Prévia da plaquinha' });
const eventos = (sendBeacon: ReturnType<typeof ligarMedicao>) => enviados(sendBeacon).map((x) => x.e);
const estilos = () => Array.from(document.querySelectorAll('style')).map((s) => s.textContent ?? '');

let sendBeacon: ReturnType<typeof ligarMedicao>;
let dimensoes: { largura: number; altura: number }[];
let baixados: string[];
let textosDesenhados: string[];
let preenchimentos: string[];
let toBlobDevolve: 'blob' | 'nulo';

beforeEach(() => {
  window.localStorage.clear();
  sendBeacon = ligarMedicao();
  dimensoes = [];
  baixados = [];
  textosDesenhados = [];
  preenchimentos = [];
  toBlobDevolve = 'blob';
  const ctx = {
    fillStyle: '' as string,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    fillRect: vi.fn(function (this: { fillStyle: string }) {
      preenchimentos.push(this.fillStyle);
    }),
    fillText: vi.fn((texto: string) => textosDesenhados.push(texto)),
    drawImage: vi.fn(),
    measureText: vi.fn((t: string) => ({ width: t.length * 10 })),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb, tipo) {
    dimensoes.push({ largura: this.width, altura: this.height });
    cb(toBlobDevolve === 'blob' ? new Blob(['png'], { type: tipo }) : null);
  });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:x') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    baixados.push(this.download);
  });
  vi.spyOn(window, 'print').mockImplementation(() => undefined);
});
afterEach(() => {
  desligarMedicao();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('Plaquinha para imprimir: seção e prévia (RF-QR-36, 37, T23)', () => {
  it('sem tipo ou sem QR válido a seção não aparece (decisão: oculta)', () => {
    render(<QrCodeView />);
    expect(screen.queryByRole('heading', { name: 'Plaquinha para imprimir' })).not.toBeInTheDocument();
    escolher('Receber Pix');
    expect(screen.queryByRole('heading', { name: 'Plaquinha para imprimir' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Imprimir plaquinha' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Baixar plaquinha' })).not.toBeInTheDocument();
  });

  it('com QR válido: h2, campo do nome, grupo "Tamanho" com A6 marcado e a prévia', () => {
    render(<QrCodeView />);
    preencherPix();
    expect(screen.getByRole('heading', { level: 2, name: 'Plaquinha para imprimir' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do negócio (opcional)')).toHaveValue('');
    const grupo = screen.getByRole('group', { name: 'Tamanho' });
    expect(within(grupo).getByRole('radio', { name: 'Balcão (A6)' })).toBeChecked();
    expect(within(grupo).getByRole('radio', { name: 'Cartaz (A4)' })).not.toBeChecked();
    expect(previa()).toBeInTheDocument();
  });

  it('a prévia do Pix tem a chamada, a chave, o aviso e o rodapé, sem nome e sem a marca da Unum People', () => {
    render(<QrCodeView />);
    preencherPix();
    const p = previa();
    expect(within(p).getByText('Pague com Pix')).toBeInTheDocument();
    expect(within(p).getByText(`Chave Pix: ${EXEMPLOS.pix.chave}`)).toBeInTheDocument();
    expect(within(p).getByText('Confira o nome antes de pagar.')).toBeInTheDocument();
    expect(within(p).getByText('Aponte a câmera do celular para o código.')).toBeInTheDocument();
    expect(p.textContent).not.toMatch(/unum/i);
    expect(p.querySelector('img')).toBeNull();
  });

  it('o QR da prévia da plaquinha lê igual ao conteúdo', () => {
    render(<QrCodeView />);
    preencherPix();
    expect(lerQrDoSvg(previa().querySelector('svg')!)).toBe(textoDoPix());
  });

  it('o nome do negócio entra em caixa alta em cima e fica guardado', () => {
    render(<QrCodeView />);
    preencherPix();
    digitar('Nome do negócio (opcional)', 'Doces da Maria');
    expect(within(previa()).getByText('DOCES DA MARIA')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DO_QR)!).nomeDoNegocio).toBe('Doces da Maria');
  });

  it('a chamada e a linha de apoio mudam com o tipo (WhatsApp)', () => {
    render(<QrCodeView />);
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', '11987654321');
    const p = previa();
    expect(within(p).getByText('Chame no WhatsApp')).toBeInTheDocument();
    expect(within(p).getByText('(11) 98765-4321')).toBeInTheDocument();
  });

  it('Avaliar no Google não tem linha de apoio', () => {
    render(<QrCodeView />);
    escolher('Avaliar no Google');
    digitar('Link de avaliação do Google', EXEMPLOS.avaliacao.link);
    const p = previa();
    expect(within(p).getByText('Avalie a gente no Google')).toBeInTheDocument();
    expect(p.textContent).toBe('Avalie a gente no GoogleAponte a câmera do celular para o código.');
  });

  it('a cor do QR vale para a chamada e para o QR da plaquinha', () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('radio', { name: 'Vinho' }));
    expect(previa().querySelector('svg path')?.getAttribute('fill')).toBe('#7a1335');
    expect(within(previa()).getByText('Pague com Pix')).toHaveStyle({ color: '#7a1335' });
  });

  it('o tamanho escolhido fica guardado e volta ao reabrir', () => {
    const primeira = render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('radio', { name: 'Cartaz (A4)' }));
    expect(screen.getByRole('radio', { name: 'Cartaz (A4)' })).toBeChecked();
    expect(JSON.parse(window.localStorage.getItem(CHAVE_DO_QR)!).tamanho).toBe('A4');
    primeira.unmount();
    render(<QrCodeView />);
    expect(screen.getByRole('radio', { name: 'Cartaz (A4)' })).toBeChecked();
  });
});

describe('Imprimir plaquinha (DT-QR-10)', () => {
  it('chama window.print e marca "baixou"', async () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir plaquinha' }));
    expect(window.print).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(eventos(sendBeacon)).toContain('baixou'));
  });

  it('a plaquinha de impressão fica fora da tela principal, com @page do tamanho escolhido', () => {
    render(<QrCodeView />);
    preencherPix();
    const principal = screen.getByRole('main');
    // uma cópia na prévia (dentro da página) e outra no contêiner só de impressão (fora dela)
    expect(within(principal).getAllByText('Pague com Pix')).toHaveLength(1);
    expect(screen.getAllByText('Pague com Pix')).toHaveLength(2);
    expect(estilos().some((css) => /@page\s*{\s*size:\s*A6;\s*margin:\s*0/.test(css))).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: 'Cartaz (A4)' }));
    expect(estilos().some((css) => /@page\s*{\s*size:\s*A4;\s*margin:\s*0/.test(css))).toBe(true);
    expect(estilos().some((css) => /size:\s*A6/.test(css))).toBe(false);
  });

  it('a cópia de impressão não aparece para leitores de tela (a prévia já descreve a plaquinha)', () => {
    render(<QrCodeView />);
    preencherPix();
    const copias = screen.getAllByText('Pague com Pix');
    const daImpressao = copias.find((c) => !screen.getByRole('main').contains(c))!;
    expect(daImpressao.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('se imprimir falhar, avisa e não marca "baixou"', () => {
    vi.spyOn(window, 'print').mockImplementation(() => {
      throw new Error('sem impressora');
    });
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir plaquinha' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Não deu para imprimir a plaquinha. Use Baixar plaquinha.');
    expect(eventos(sendBeacon)).not.toContain('baixou');
  });
});

describe('Baixar plaquinha (RF-QR-36, RF-QR-38)', () => {
  const baixarPlaquinha = () => fireEvent.click(screen.getByRole('button', { name: 'Baixar plaquinha' }));

  it('A6: baixa plaquinha-pix.png com 1240×1748 e marca "baixou"', async () => {
    render(<QrCodeView />);
    preencherPix();
    baixarPlaquinha();
    await waitFor(() => expect(baixados).toContain('plaquinha-pix.png'));
    expect(dimensoes).toContainEqual({ largura: 1240, altura: 1748 });
    expect(dimensoes).not.toContainEqual({ largura: 2480, altura: 3508 });
    await waitFor(() => expect(eventos(sendBeacon)).toContain('baixou'));
  });

  it('A4: 2480×3508', async () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('radio', { name: 'Cartaz (A4)' }));
    baixarPlaquinha();
    await waitFor(() => expect(baixados).toContain('plaquinha-pix.png'));
    expect(dimensoes).toContainEqual({ largura: 2480, altura: 3508 });
  });

  it('o nome do arquivo segue o tipo', async () => {
    render(<QrCodeView />);
    escolher('Chamar no WhatsApp');
    digitar('Número do WhatsApp com DDD', '11987654321');
    baixarPlaquinha();
    await waitFor(() => expect(baixados).toContain('plaquinha-whatsapp.png'));
  });

  it('desenha o mesmo conteúdo da prévia: nome, chamada, apoio, rodapé e a cor', async () => {
    render(<QrCodeView />);
    preencherPix();
    fireEvent.click(screen.getByRole('radio', { name: 'Azul-marinho' }));
    digitar('Nome do negócio (opcional)', 'Doces da Maria');
    baixarPlaquinha();
    await waitFor(() => expect(baixados).toContain('plaquinha-pix.png'));
    expect(textosDesenhados).toEqual(expect.arrayContaining(['DOCES DA MARIA', 'Pague com Pix', 'Confira o nome antes de pagar.']));
    expect(textosDesenhados).toContain('Aponte a câmera do celular para o código.');
    expect(preenchimentos).toContain('#0a1c82');
  });

  it('falha ao gerar: alerta literal, nada baixado e sem "baixou"', async () => {
    render(<QrCodeView />);
    preencherPix();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled());
    toBlobDevolve = 'nulo';
    baixarPlaquinha();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para baixar a plaquinha. Tente de novo.');
    expect(baixados).not.toContain('plaquinha-pix.png');
    expect(eventos(sendBeacon)).not.toContain('baixou');
  });

  it('falha no download do arquivo: o mesmo alerta', async () => {
    render(<QrCodeView />);
    preencherPix();
    vi.mocked(URL.createObjectURL).mockImplementation(() => {
      throw new Error('sem memória');
    });
    baixarPlaquinha();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para baixar a plaquinha. Tente de novo.');
  });

  it('o botão fica desabilitado enquanto gera e volta depois', async () => {
    render(<QrCodeView />);
    preencherPix();
    baixarPlaquinha();
    expect(screen.getByRole('button', { name: 'Baixar plaquinha' })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Baixar plaquinha' })).toBeEnabled());
  });
});

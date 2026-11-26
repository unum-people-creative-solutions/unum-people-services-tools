import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Page from '../page';
import LinkWhatsappView from '../LinkWhatsappView';
import { desligarMedicao, enviados, ligarMedicao } from '@/test/medicao';
import { CHAVE_DO_LINK } from '@/utils/linkWhatsapp/armazenamento';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const FERRAMENTA = 'link-whatsapp';
const NUMERO = '(11) 98765-4321';
const MENSAGEM = 'Olá! Quero 2 pães 🍞';

const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const eventos = (sendBeacon: ReturnType<typeof ligarMedicao>) => enviados(sendBeacon).map((x) => x.e);
const copiar = () => screen.getByRole('button', { name: 'Copiar link' });
const semNavegar = (el: HTMLElement) => el.addEventListener('click', (e) => e.preventDefault());
const baixarImagemPronto = () =>
  waitFor(() => expect(screen.getByRole('button', { name: 'Baixar imagem' })).toBeEnabled()).then(() =>
    screen.getByRole('button', { name: 'Baixar imagem' }),
  );

function ligarClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(writeText) } });
}

describe('Gerador de link do WhatsApp: medição de uso (RF-LW-25, DT-LW-08)', () => {
  let sendBeacon: ReturnType<typeof ligarMedicao>;

  beforeEach(() => {
    window.localStorage.clear();
    sendBeacon = ligarMedicao();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb, tipo) =>
      cb(new Blob(['x'], { type: tipo })),
    );
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:x') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });
  afterEach(() => {
    desligarMedicao();
    vi.restoreAllMocks();
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
    Reflect.deleteProperty(navigator, 'clipboard');
    Reflect.deleteProperty(navigator, 'canShare');
    Reflect.deleteProperty(navigator, 'share');
  });

  it('marca a visita uma vez ao abrir a página, mesmo re-renderizando', () => {
    const { rerender } = render(<LinkWhatsappView />);
    rerender(<LinkWhatsappView />);
    expect(enviados(sendBeacon)).toEqual([{ f: FERRAMENTA, e: 'visita' }]);
  });

  it('marca "comecou" só na primeira mudança, no número ou na mensagem', () => {
    render(<LinkWhatsappView />);
    expect(eventos(sendBeacon)).toEqual(['visita']);
    digitar('Número com DDD', '1');
    digitar('Número com DDD', '11');
    digitar('Mensagem (opcional)', 'Oi');
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou']);
  });

  it('mudar só a mensagem também começa', () => {
    render(<LinkWhatsappView />);
    digitar('Mensagem (opcional)', 'Oi');
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou']);
  });

  it('tocar num atalho de mensagem começa', () => {
    render(<LinkWhatsappView />);
    fireEvent.click(screen.getByRole('button', { name: 'Fazer um pedido' }));
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou']);
  });

  it('só sair do campo, sem mudar nada, não começa', () => {
    render(<LinkWhatsappView />);
    fireEvent.blur(screen.getByLabelText('Número com DDD'));
    expect(eventos(sendBeacon)).toEqual(['visita']);
  });

  it('marca "resultado" no primeiro link válido, uma vez só, e depois de "comecou"', () => {
    render(<LinkWhatsappView />);
    digitar('Número com DDD', '1198');
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou']);
    digitar('Número com DDD', '11987654321');
    digitar('Número com DDD', '11987654322');
    digitar('Mensagem (opcional)', 'Oi');
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou', 'resultado']);
  });

  it('restaurar do aparelho não conta "comecou" nem "resultado"', () => {
    window.localStorage.setItem(CHAVE_DO_LINK, JSON.stringify({ numero: NUMERO, mensagem: MENSAGEM }));
    render(<LinkWhatsappView />);
    expect(screen.getByRole('heading', { name: 'Seu link está pronto' })).toBeInTheDocument();
    expect(eventos(sendBeacon)).toEqual(['visita']);
  });

  it('quem volta e muda algo conta "comecou" e, com o link já válido, "resultado"', () => {
    window.localStorage.setItem(CHAVE_DO_LINK, JSON.stringify({ numero: NUMERO, mensagem: '' }));
    render(<LinkWhatsappView />);
    digitar('Mensagem (opcional)', 'Oi');
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou', 'resultado']);
  });

  describe('"baixou" (levou o link)', () => {
    const comLink = () => {
      render(<LinkWhatsappView />);
      digitar('Número com DDD', NUMERO);
      digitar('Mensagem (opcional)', MENSAGEM);
    };

    it('copiar com sucesso marca "baixou", uma vez só', async () => {
      ligarClipboard(async () => undefined);
      comLink();
      await act(async () => {
        fireEvent.click(copiar());
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Link copiado' }));
      });
      expect(eventos(sendBeacon).filter((e) => e === 'baixou')).toEqual(['baixou']);
    });

    it('copiar que falha não marca "baixou"', async () => {
      ligarClipboard(async () => {
        throw new Error('negado');
      });
      comLink();
      fireEvent.click(copiar());
      await screen.findByRole('alert');
      expect(eventos(sendBeacon)).not.toContain('baixou');
    });

    it('tocar em "Testar o link" marca "baixou"', () => {
      comLink();
      const testar = screen.getByRole('link', { name: 'Testar o link' });
      semNavegar(testar);
      fireEvent.click(testar);
      expect(eventos(sendBeacon)).toContain('baixou');
    });

    it('compartilhar o link marca "baixou" só se terminar', async () => {
      const share = vi
        .fn()
        .mockRejectedValueOnce(new DOMException('cancelado', 'AbortError'))
        .mockResolvedValueOnce(undefined);
      Object.defineProperty(navigator, 'share', { configurable: true, value: share });
      comLink();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Compartilhar link' }));
      });
      expect(eventos(sendBeacon)).not.toContain('baixou');
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Compartilhar link' }));
      });
      expect(eventos(sendBeacon)).toContain('baixou');
    });

    it('baixar o PNG do QR marca "baixou"', async () => {
      comLink();
      fireEvent.click(await baixarImagemPronto());
      await waitFor(() => expect(eventos(sendBeacon)).toContain('baixou'));
    });

    it('baixar o SVG do QR marca "baixou"', async () => {
      comLink();
      fireEvent.click(screen.getByRole('button', { name: 'Baixar SVG (para gráfica)' }));
      await waitFor(() => expect(eventos(sendBeacon)).toContain('baixou'));
    });

    it('compartilhar o QR marca "baixou" só se terminar', async () => {
      const compartilhar = vi
        .fn()
        .mockRejectedValueOnce(new DOMException('cancelado', 'AbortError'))
        .mockResolvedValueOnce(undefined);
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', { configurable: true, value: compartilhar });
      comLink();
      fireEvent.click(await screen.findByRole('button', { name: 'Compartilhar' }));
      await waitFor(() => expect(compartilhar).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeEnabled());
      expect(eventos(sendBeacon)).not.toContain('baixou');
      fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
      await waitFor(() => expect(eventos(sendBeacon)).toContain('baixou'));
    });

    it('"Abrir no gerador de QR code" não marca "baixou"', () => {
      comLink();
      const atalho = screen.getByRole('link', { name: 'Abrir no gerador de QR code' });
      semNavegar(atalho);
      fireEvent.click(atalho);
      expect(eventos(sendBeacon)).not.toContain('baixou');
    });
  });

  it('abrir o guia marca "guia" uma vez, e o convite marca "convite" uma vez', () => {
    render(<Page />);
    const detalhes = screen.getByText('Como usar o seu link').closest('details') as HTMLDetailsElement;
    for (let i = 0; i < 2; i++) {
      detalhes.setAttribute('open', '');
      fireEvent(detalhes, new Event('toggle'));
    }
    const convite = screen.getByRole('link', { name: 'Criar minha página' });
    semNavegar(convite);
    fireEvent.click(convite);
    fireEvent.click(convite);
    expect(enviados(sendBeacon)).toEqual([
      { f: FERRAMENTA, e: 'visita' },
      { f: FERRAMENTA, e: 'guia' },
      { f: FERRAMENTA, e: 'convite' },
    ]);
  });

  it('nenhum envio leva o número nem a mensagem: o corpo tem só "f" e "e"', async () => {
    ligarClipboard(async () => undefined);
    render(<LinkWhatsappView />);
    digitar('Número com DDD', NUMERO);
    digitar('Mensagem (opcional)', MENSAGEM);
    await act(async () => {
      fireEvent.click(copiar());
    });
    expect(eventos(sendBeacon)).toEqual(['visita', 'comecou', 'resultado', 'baixou']);

    for (const [url, corpo] of sendBeacon.mock.calls) {
      expect(url).toBe('https://uso.exemplo.test/public/tools/uso');
      const texto = (corpo as unknown as { texto: string }).texto;
      expect(Object.keys(JSON.parse(texto)).sort()).toEqual(['e', 'f']);
      for (const proibido of ['11987654321', '98765', '4321', 'pães', 'Quero', 'wa.me']) {
        expect(texto).not.toContain(proibido);
      }
    }
    // todos com a ferramenta nova
    expect(new Set(enviados(sendBeacon).map((x) => x.f))).toEqual(new Set([FERRAMENTA]));
  });

  it('sem NEXT_PUBLIC_TOOLS_USO_URL nada é enviado, e a tela segue funcionando', () => {
    vi.stubEnv('NEXT_PUBLIC_TOOLS_USO_URL', '');
    render(<LinkWhatsappView />);
    digitar('Número com DDD', NUMERO);
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Seu link está pronto' })).toBeInTheDocument();
  });
});

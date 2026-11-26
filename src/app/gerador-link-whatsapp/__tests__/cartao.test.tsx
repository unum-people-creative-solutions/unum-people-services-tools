import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LinkWhatsappView from '../LinkWhatsappView';
import { linkDoWhatsapp } from '@/utils/whatsapp';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const NUMERO = '(11) 98765-4321';
const MENSAGEM = 'Olá! Quero 2 pães 🍞\nPara amanhã';
const LINK = linkDoWhatsapp('11987654321', MENSAGEM);

const digitar = (rotulo: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
const preencher = () => {
  digitar('Número com DDD', NUMERO);
  digitar('Mensagem (opcional)', MENSAGEM);
};
const copiar = () => screen.getByRole('button', { name: /^Copiar link$|^Link copiado$/ });

function ligarClipboard(writeText: (texto: string) => Promise<void>) {
  const espiao = vi.fn(writeText);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: espiao } });
  return espiao;
}

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
  Reflect.deleteProperty(navigator, 'share');
});

describe('Cartão do link: sem número válido (RF-LW-12)', () => {
  it('pede o número e não mostra botão nenhum', () => {
    render(<LinkWhatsappView />);
    expect(screen.getByText('Digite o seu número para ver o link.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copiar link' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Compartilhar link' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Testar o link' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Seu link')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'QR code do seu link' })).not.toBeInTheDocument();
  });

  it('número incompleto também não gera link', () => {
    render(<LinkWhatsappView />);
    digitar('Número com DDD', '1198765');
    expect(screen.getByText('Digite o seu número para ver o link.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Seu link está pronto' })).not.toBeInTheDocument();
  });
});

describe('Cartão do link: pronto (RF-LW-13, RF-LW-14, RF-LW-17)', () => {
  it('mostra o título e o link num campo só de leitura', () => {
    render(<LinkWhatsappView />);
    preencher();
    expect(screen.getByRole('heading', { level: 2, name: 'Seu link está pronto' })).toBeInTheDocument();
    const campo = screen.getByLabelText('Seu link');
    expect(campo).toHaveValue(LINK);
    expect(campo).toHaveAttribute('readonly');
    expect(screen.queryByText('Digite o seu número para ver o link.')).not.toBeInTheDocument();
  });

  it('sem mensagem, o link é só o número', () => {
    render(<LinkWhatsappView />);
    digitar('Número com DDD', NUMERO);
    expect(screen.getByLabelText('Seu link')).toHaveValue('https://wa.me/5511987654321');
  });

  it('o link volta o número e a mensagem exatos (ida e volta)', () => {
    render(<LinkWhatsappView />);
    preencher();
    const url = new URL((screen.getByLabelText('Seu link') as HTMLInputElement).value);
    expect(url.pathname).toBe('/5511987654321');
    expect(url.searchParams.get('text')).toBe(MENSAGEM);
  });

  it('"Testar o link" abre o próprio link em outra aba, com rel seguro', () => {
    render(<LinkWhatsappView />);
    preencher();
    const testar = screen.getByRole('link', { name: 'Testar o link' });
    expect(testar).toHaveAttribute('href', LINK);
    expect(testar).toHaveAttribute('target', '_blank');
    expect(testar.getAttribute('rel')).toContain('noopener');
    expect(testar.getAttribute('rel')).toContain('noreferrer');
  });
});

describe('Copiar link (RF-LW-15, DT-LW-12)', () => {
  it('copia o link, vira "Link copiado" por 2 s e anuncia "Link copiado." num status', async () => {
    vi.useFakeTimers();
    const writeText = ligarClipboard(async () => undefined);
    render(<LinkWhatsappView />);
    preencher();
    expect(copiar()).toHaveTextContent('Copiar link');

    await act(async () => {
      fireEvent.click(copiar());
    });
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(copiar()).toHaveTextContent('Link copiado');
    expect(screen.getByRole('status')).toHaveTextContent('Link copiado.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(copiar()).toHaveTextContent('Link copiado');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(copiar()).toHaveTextContent('Copiar link');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('se o navegador recusar, mostra o caminho manual num alert', async () => {
    ligarClipboard(async () => {
      throw new DOMException('negado', 'NotAllowedError');
    });
    render(<LinkWhatsappView />);
    preencher();
    fireEvent.click(copiar());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não deu para copiar. Toque e segure o link acima para copiar.',
    );
    expect(copiar()).toHaveTextContent('Copiar link');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('se o navegador nem tem área de transferência, mostra o mesmo alert', async () => {
    render(<LinkWhatsappView />);
    preencher();
    fireEvent.click(copiar());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não deu para copiar. Toque e segure o link acima para copiar.',
    );
  });

  it('mudar o texto depois de copiar apaga o aviso: o link é outro', async () => {
    ligarClipboard(async () => undefined);
    render(<LinkWhatsappView />);
    preencher();
    await act(async () => {
      fireEvent.click(copiar());
    });
    expect(copiar()).toHaveTextContent('Link copiado');
    digitar('Mensagem (opcional)', 'Outra');
    expect(copiar()).toHaveTextContent('Copiar link');
  });
});

describe('Compartilhar link (RF-LW-16, DT-LW-11)', () => {
  it('sem navigator.share, o botão não existe', () => {
    render(<LinkWhatsappView />);
    preencher();
    expect(screen.queryByRole('button', { name: 'Compartilhar link' })).not.toBeInTheDocument();
  });

  it('com navigator.share, chama com o link e não mostra erro', async () => {
    const share = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<LinkWhatsappView />);
    preencher();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartilhar link' }));
    });
    expect(share).toHaveBeenCalledWith({ url: LINK });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cancelar (AbortError) não mostra nada', async () => {
    const share = vi.fn(async () => {
      throw new DOMException('cancelado', 'AbortError');
    });
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<LinkWhatsappView />);
    preencher();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartilhar link' }));
    });
    expect(share).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('outra falha mostra o alert, e uma tentativa nova limpa o erro', async () => {
    const share = vi
      .fn()
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    render(<LinkWhatsappView />);
    preencher();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartilhar link' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Não deu para compartilhar. Use Copiar link.');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartilhar link' }));
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('navigator.share que lança na hora também mostra o alert', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => {
        throw new TypeError('sem permissão');
      },
    });
    render(<LinkWhatsappView />);
    preencher();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Compartilhar link' }));
    });
    expect(within(document.body).getByRole('alert')).toHaveTextContent('Não deu para compartilhar. Use Copiar link.');
  });
});

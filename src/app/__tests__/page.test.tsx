import { render, screen, within } from '@testing-library/react';
import Home, { metadata } from '../page';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Home', () => {
  it('tem o título da página, a frase e a linha de apoio (RF-F2-08)', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Unum People Tools' })).toBeInTheDocument();
    expect(screen.getByText('Ferramentas grátis para o seu negócio crescer.')).toBeInTheDocument();
    expect(screen.getByText('Sem cadastro. O que você digita fica neste aparelho.')).toBeInTheDocument();
  });

  it('lista, em "Contas do negócio", as três ferramentas na ordem, com frase e destino (RF-F2-09)', () => {
    render(<Home />);
    const grupo = screen.getByRole('region', { name: 'Contas do negócio' });
    expect(screen.getByRole('heading', { level: 2, name: 'Contas do negócio' })).toBeInTheDocument();

    const links = within(grupo).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/simulador-precificacao',
      '/calculadora-viabilidade',
      '/portfolio-analises',
    ]);

    const esperado = [
      ['Quanto cobrar pelo serviço', 'Descubra o menor preço sem prejuízo e quanto sobra no bolso.'],
      ['Vale a pena anunciar?', 'Veja quantas vendas pagam o anúncio antes de gastar.'],
      ['Quais serviços compensam', 'Compare o que dá lucro com o que dá trabalho demais.'],
    ];
    esperado.forEach(([nome, frase], i) => {
      expect(links[i]).toHaveTextContent(nome);
      expect(links[i]).toHaveTextContent(frase);
    });
  });

  it('mostra só grupos com ferramenta, sem selo "Disponível" nem textos do ecossistema antigo', () => {
    render(<Home />);
    expect(screen.queryByText(/Dispon[ií]vel/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ecossistema/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Vender no WhatsApp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Em breve/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Acessar Ferramenta/i)).not.toBeInTheDocument();
  });

  it('apresenta para quem são as ferramentas (RF-F2-10)', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 2, name: 'Feitas para quem toca o próprio negócio' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Contas simples, explicadas passo a passo, para MEI, autônomos e pequenos negócios. Funcionam no celular e não pedem cadastro.',
      ),
    ).toBeInTheDocument();
  });

  it('traz o convite com o link da Unum People e as marcas de origem (RF-F2-11)', () => {
    render(<Home />);
    expect(screen.getByText(/Quer que seus clientes achem você\?/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Faça uma página com o seu WhatsApp →' })).toHaveAttribute(
      'href',
      'https://unumpeople.app/?utm_source=tools&utm_medium=convite&utm_campaign=home',
    );
  });

  it('tem o cabeçalho e o rodapé novos', () => {
    render(<Home />);
    expect(screen.getByText('Seus dados ficam neste aparelho.')).toBeInTheDocument();
    expect(screen.queryByText(/Todas as ferramentas/)).not.toBeInTheDocument();
  });

  it('não exibe anúncio (tela de navegação)', () => {
    const { container } = render(<Home />);
    expect(container.querySelectorAll('ins')).toHaveLength(0);
    expect(screen.queryByText(/AdSense|Publicidade/i)).not.toBeInTheDocument();
  });
});

describe('Home: metadados (RF-F2-12)', () => {
  it('usa o título e a descrição da spec', () => {
    expect(metadata.title).toEqual({
      absolute: 'Unum People Tools — ferramentas grátis para o seu negócio crescer',
    });
    expect(metadata.description).toBe(
      'Calculadoras grátis para MEI e pequenos negócios: quanto cobrar, se vale a pena anunciar e quais serviços compensam. Sem cadastro.',
    );
  });
});

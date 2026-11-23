import { render, screen } from '@testing-library/react';
import PrivacyPage from '../page';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/privacidade',
}));

const textoDaPagina = () => document.body.textContent ?? '';

describe('Política de Privacidade', () => {
  it('mostra o título e a data da nova versão', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeInTheDocument();
    expect(screen.getByText('Última atualização: 23 de novembro de 2026')).toBeInTheDocument();
  });

  it('tem as cinco seções do texto aprovado', () => {
    render(<PrivacyPage />);
    for (const titulo of [
      'Em poucas palavras',
      'O que fica guardado no seu aparelho',
      'O que contamos',
      'O que a hospedagem registra',
      'Seus direitos',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: titulo })).toBeInTheDocument();
    }
  });

  it('diz só o que o site faz hoje', () => {
    render(<PrivacyPage />);
    const texto = textoDaPagina();
    expect(texto).toContain(
      'As ferramentas da Unum People funcionam no seu navegador. O que você digita fica guardado neste aparelho e não é enviado para nós.',
    );
    expect(texto).toContain('Este site não tem anúncios e não usa cookies de rastreamento.');
    expect(texto).toContain('Para você não perder o que já preencheu, algumas ferramentas guardam os dados no próprio navegador:');
    expect(screen.getByText('os serviços que você cadastra em "Quais serviços compensam";')).toBeInTheDocument();
    expect(screen.getByText('os custos e valores do simulador de preço.')).toBeInTheDocument();
    expect(texto).toContain('A calculadora de anúncios não guarda nada: ao fechar a página, os números somem.');
    expect(texto).toContain(
      'Esses dados ficam só neste aparelho e neste navegador. Para apagar, limpe os dados de navegação do seu navegador.',
    );
    expect(texto).toContain('Netlify');
    expect(texto).toContain(
      'Não usamos esses registros para identificar você nem para publicidade.',
    );
    expect(texto).toContain('Pela Lei Geral de Proteção de Dados (LGPD), você pode pedir informação, correção ou exclusão de dados pessoais.');
    expect(texto).toContain('quase sempre basta limpar os dados do navegador');
  });

  it('conta o uso sem saber quem usou (R-MU-5)', () => {
    render(<PrivacyPage />);
    const texto = textoDaPagina();
    expect(texto).toContain('Contamos só quantas vezes as ferramentas são usadas, sem saber quem usou.');
    expect(texto).toContain(
      'Para saber se as ferramentas ajudam, contamos quantas vezes cada uma é aberta, usada até o resultado, e quantas vezes alguém clica nos links para a Unum People. É só uma soma por dia: não guardamos quem foi, nem o seu endereço IP, nem o que você digitou, e não usamos cookies.',
    );
  });

  it('liga o e-mail de contato', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('link', { name: 'contato@unumpeople.com.br' })).toHaveAttribute(
      'href',
      'mailto:contato@unumpeople.com.br',
    );
  });

  it('não fala mais de anúncios do Google, cookies de anúncio nem dados anônimos', () => {
    render(<PrivacyPage />);
    const texto = textoDaPagina();
    for (const proibido of ['AdSense', 'Anúncios e cookies', 'adssettings', 'aboutads', 'anônimos']) {
      expect(texto).not.toContain(proibido);
    }
    expect(document.querySelector('a[href*="google.com"]')).toBeNull();
  });
});

// Lacunas L1 e L2 do Verifier (23/11/2026): o texto aprovado pelo dono (spec §3)
// fica travado por inteiro, e a privacidade também não pode ter anúncio.
const TEXTO_APROVADO = [
  'Política de Privacidade',
  'Última atualização: 23 de novembro de 2026',
  'Em poucas palavras',
  'As ferramentas da Unum People funcionam no seu navegador. O que você digita fica guardado neste aparelho e não é enviado para nós. Este site não tem anúncios e não usa cookies de rastreamento. Contamos só quantas vezes as ferramentas são usadas, sem saber quem usou.',
  'O que fica guardado no seu aparelho',
  'Para você não perder o que já preencheu, algumas ferramentas guardam os dados no próprio navegador:',
  'os serviços que você cadastra em "Quais serviços compensam";',
  'os custos e valores do simulador de preço.',
  'A calculadora de anúncios não guarda nada: ao fechar a página, os números somem.',
  'Esses dados ficam só neste aparelho e neste navegador. Para apagar, limpe os dados de navegação do seu navegador.',
  'O que contamos',
  'Para saber se as ferramentas ajudam, contamos quantas vezes cada uma é aberta, usada até o resultado, e quantas vezes alguém clica nos links para a Unum People. É só uma soma por dia: não guardamos quem foi, nem o seu endereço IP, nem o que você digitou, e não usamos cookies.',
  'O que a hospedagem registra',
  'Como qualquer site, a empresa que hospeda estas páginas (Netlify) registra dados técnicos de acesso, como endereço IP, navegador e página visitada, para manter o site no ar e seguro. Não usamos esses registros para identificar você nem para publicidade.',
  'Seus direitos',
  'Pela Lei Geral de Proteção de Dados (LGPD), você pode pedir informação, correção ou exclusão de dados pessoais. Como as ferramentas não enviam o que você digita, quase sempre basta limpar os dados do navegador. Para qualquer dúvida, escreva para contato@unumpeople.com.br.',
];

describe('Política de Privacidade — texto aprovado por inteiro', () => {
  it('o conteúdo principal é exatamente o texto aprovado, na ordem', () => {
    render(<PrivacyPage />);
    const main = document.querySelector('main') as HTMLElement;
    const blocos = Array.from(main.querySelectorAll('h1, h2, p, li'))
      .map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    expect(blocos).toEqual(TEXTO_APROVADO);
  });

  it('não tem anúncio', () => {
    const { container } = render(<PrivacyPage />);
    expect(container.querySelectorAll('ins').length).toBe(0);
    expect(container.innerHTML).not.toMatch(/adsbygoogle|googlesyndication|ca-pub-/);
  });
});

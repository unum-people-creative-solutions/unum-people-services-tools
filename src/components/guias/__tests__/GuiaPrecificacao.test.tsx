import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GuiaPrecificacao, EXEMPLO_PRECIFICACAO } from '../GuiaPrecificacao';
import PrecificacaoView from '../../../app/simulador-precificacao/PrecificacaoView';

const TOPICOS = [
  'Para que serve',
  'Como a conta é feita',
  'Exemplo com números',
  'Como ler o resultado',
  'Erros comuns',
  'Perguntas frequentes',
  'Aviso',
  'Quem fez',
];

// O Intl formata moeda com espaço não separável (U+00A0)
const textoDe = (el: Element) => (el.textContent ?? '').replace(/ /g, ' ');
const contarPalavras = (el: Element) => textoDe(el).split(/\s+/).filter(Boolean).length;

describe('GuiaPrecificacao', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tem um título e os oito tópicos, na ordem', () => {
    render(<GuiaPrecificacao />);
    expect(screen.getByRole('heading', { level: 2, name: /Guia do Simulador de Precificação/ })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(TOPICOS);
    expect(screen.getByRole('region', { name: /Guia do Simulador de Precificação/ }).tagName).toBe('SECTION');
  });

  it('tem pelo menos 600 palavras', () => {
    const { container } = render(<GuiaPrecificacao />);
    expect(contarPalavras(container)).toBeGreaterThanOrEqual(600);
  });

  it('mostra no exemplo os resultados do simulador', () => {
    render(<GuiaPrecificacao />);
    const exemplo = textoDe(screen.getByRole('heading', { name: 'Exemplo com números' }).parentElement!);
    expect(exemplo).toContain('R$ 4.400,00');
    expect(exemplo).toContain('140,8 horas faturáveis');
    expect(exemplo).toContain('R$ 31,25');
    expect(exemplo).toContain('R$ 153,75');
    expect(exemplo).toContain('R$ 163,56');
    expect(exemplo).toContain('R$ 81,25');
    expect(exemplo).toContain('32,5%');
  });

  it('com as entradas do exemplo, o simulador real mostra o mesmo piso, lucro e margem', async () => {
    const e = EXEMPLO_PRECIFICACAO;
    render(<PrecificacaoView />);
    act(() => {
      vi.runAllTimers();
    });

    const preencher = async (rotulo: RegExp, valor: number) => {
      await act(async () => {
        fireEvent.change(screen.getByLabelText(rotulo), { target: { value: String(valor) } });
        vi.runAllTimers();
      });
    };

    await preencher(/Aluguel/i, e.custosFixos.aluguel);
    await preencher(/Energia/i, e.custosFixos.energia);
    await preencher(/Internet/i, e.custosFixos.internet);
    await preencher(/Contador/i, e.custosFixos.contador);
    await preencher(/Softwares/i, e.custosFixos.softwares);
    await preencher(/Salários Equipe/i, e.custosFixos.equipe);
    await preencher(/Pró-labore/i, e.custosFixos.proLabore);
    await preencher(/Dias Úteis/i, e.capacidade.diasTrabalhados);
    await preencher(/Horas Diárias/i, e.capacidade.horasDiarias);
    await preencher(/Ociosidade/i, e.capacidade.percentualOciosidade);
    await preencher(/Horas Estimadas/i, e.servico.horasEstimadas);
    await preencher(/Materiais Diretos/i, e.servico.materiaisDiretos);
    await preencher(/Deslocamento/i, e.servico.deslocamento);
    await preencher(/Impostos/i, e.servico.impostosPercentual);
    await preencher(/Quanto deseja cobrar/i, e.servico.preco);

    const tela = textoDe(document.body);
    expect(tela).toContain('R$ 4.400,00');
    expect(tela).toContain('140,80 h');
    expect(tela).toContain('R$ 31,25');
    expect(tela).toContain('R$ 163,56');
    expect(tela).toContain('R$ 81,25');
    expect(tela).toContain('32,50%');
  });
});

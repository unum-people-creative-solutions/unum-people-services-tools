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

    await preencher(/Aluguel e condomínio/i, e.custosFixos.aluguel);
    await preencher(/Luz e água/i, e.custosFixos.energia);
    await preencher(/Internet e telefone/i, e.custosFixos.internet);
    await preencher(/Contador/i, e.custosFixos.contador);
    await preencher(/Programas e assinaturas/i, e.custosFixos.softwares);
    await preencher(/Salários de funcionários/i, e.custosFixos.equipe);
    await preencher(/Quanto você tira para viver/i, e.custosFixos.proLabore);
    await preencher(/Dias por mês/i, e.capacidade.diasTrabalhados);
    await preencher(/Horas por dia/i, e.capacidade.horasDiarias);
    await preencher(/Tempo sem vender/i, e.capacidade.percentualOciosidade);
    await preencher(/Horas que leva/i, e.servico.horasEstimadas);
    await preencher(/Material/i, e.servico.materiaisDiretos);
    await preencher(/Transporte e extras/i, e.servico.deslocamento);
    await preencher(/Imposto na nota/i, e.servico.impostosPercentual);
    await preencher(/Quanto você quer cobrar/i, e.servico.preco);

    const tela = textoDe(document.body);
    expect(tela).toContain('R$ 4.400,00');
    expect(tela).toContain('140,8 h'); // formato da F2 (spec CA-F2-04); mesmo número
    expect(tela).toContain('R$ 31,25');
    expect(tela).toContain('R$ 163,56');
    expect(tela).toContain('R$ 81,25');
    expect(tela).toContain('sobram R$ 32,50'); // F2 RF-F2-18: margem de 32,5% dita como "de cada R$ 100"
  });
});

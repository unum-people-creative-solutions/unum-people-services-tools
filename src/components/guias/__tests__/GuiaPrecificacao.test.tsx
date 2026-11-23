import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GuiaPrecificacao, EXEMPLO_PRECIFICACAO } from '../GuiaPrecificacao';
import PrecificacaoView from '../../../app/simulador-precificacao/PrecificacaoView';
import { regrasDoGuia, textoDe, topico } from './regras';

regrasDoGuia({
  nome: 'GuiaPrecificacao',
  guia: () => <GuiaPrecificacao />,
  titulo: 'Como calcular o preço do seu serviço',
  rotulosDoPasso: [
    'Aluguel e condomínio',
    'Luz e água',
    'Quanto você tira para viver',
    'Dias por mês',
    'Horas por dia',
    'Tempo sem vender',
    'Horas que leva',
    'Material',
    'Transporte e extras',
    'Imposto na nota',
    'Quanto você quer cobrar?',
  ],
  selos: ['Falta pouco', 'Saudável', 'Sobra pouco', 'Prejuízo'],
  perguntas: ['Meus dados ficam salvos?', /MEI/, /\bDAS\b/],
});

describe('GuiaPrecificacao: exemplo e ferramenta real', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra no exemplo os resultados do simulador', () => {
    render(<GuiaPrecificacao />);
    const exemplo = textoDe(topico('Exemplo com números'));
    expect(exemplo).toContain('R$ 4.400,00');
    expect(exemplo).toContain('140,8 horas');
    expect(exemplo).toContain('R$ 31,25');
    expect(exemplo).toContain('R$ 153,75');
    expect(exemplo).toContain('R$ 163,56');
    expect(exemplo).toContain('R$ 81,25');
    expect(exemplo).toContain('R$ 32,50');
  });

  it('com as entradas do exemplo, o simulador real mostra o mesmo preço mínimo, sobra e margem', async () => {
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

  it('com o preço abaixo do mínimo, a ferramenta mostra o prejuízo que o guia cita', async () => {
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
    await preencher(/Quanto você tira para viver/i, e.custosFixos.proLabore);
    await preencher(/Dias por mês/i, e.capacidade.diasTrabalhados);
    await preencher(/Horas por dia/i, e.capacidade.horasDiarias);
    await preencher(/Tempo sem vender/i, e.capacidade.percentualOciosidade);
    await preencher(/Horas que leva/i, e.servico.horasEstimadas);
    await preencher(/Material/i, e.servico.materiaisDiretos);
    await preencher(/Transporte e extras/i, e.servico.deslocamento);
    await preencher(/Imposto na nota/i, e.servico.impostosPercentual);
    await preencher(/Quanto você quer cobrar/i, e.abaixoDoMinimo.preco);

    expect(textoDe(document.body)).toContain('Você perde R$ 12,75 em cada venda');
    expect(screen.getByText('Prejuízo')).toBeInTheDocument();
  });
});

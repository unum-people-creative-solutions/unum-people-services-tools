'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
  LabelList,
} from 'recharts';
import { Service } from '../types';
import { Bloco } from './ui/Bloco';
import { formatarNumero } from '../utils/numeros';

interface ServiceChartsProps {
  services: Service[];
  highlightedId: string | null;
}

type GraficoId = 'operacao' | 'decisao';

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#4f46e5', '#ea580c', '#65a30d',
];

// Nomes simples (RF-F3b-02). Os ids `operacao` e `decisao` seguem como chave interna.
const GRAFICOS = {
  operacao: {
    titulo: 'Quanto trabalho dá',
    explicacao:
      'Cada bolinha é um serviço. Quanto mais para a direita, mais esforço ele dá; quanto mais para cima, mais difícil ele é de fazer.',
    xNome: 'Esforço',
    yNome: 'Dificuldade',
    xChave: 'esforco',
    yChave: 'complexidade',
    quadrantes: {
      tr: 'Pesado e difícil',
      tl: 'Difícil, mas rápido',
      br: 'Pesado, mas simples',
      bl: 'Leve e simples',
    },
    significados: [
      { nome: 'Pesado e difícil', desc: 'Muito esforço e difícil de fazer.' },
      { nome: 'Difícil, mas rápido', desc: 'Difícil de fazer, mas com pouco esforço.' },
      { nome: 'Pesado, mas simples', desc: 'Dá trabalho, mas é simples de fazer.' },
      { nome: 'Leve e simples', desc: 'Pouco esforço e fácil de fazer.' },
    ],
  },
  decisao: {
    titulo: 'Quanto vale a pena',
    explicacao:
      'Cada bolinha é um serviço. Quanto mais para a direita, mais ele se repete sempre igual; quanto mais para cima, mais lucro ele deixa.',
    xNome: 'Repetição',
    yNome: 'Lucro',
    xChave: 'padronizacao',
    yChave: 'lucratividade',
    quadrantes: {
      tr: 'Vender mais',
      tl: 'Padronizar',
      br: 'Lucro baixo',
      bl: 'Repensar',
    },
    significados: [
      { nome: 'Vender mais', desc: 'Se repete igual e dá lucro.' },
      { nome: 'Padronizar', desc: 'Dá lucro, mas muda a cada venda.' },
      { nome: 'Lucro baixo', desc: 'Se repete igual, mas deixa pouco lucro.' },
      { nome: 'Repensar', desc: 'Muda a cada venda e deixa pouco lucro.' },
    ],
  },
} as const;

// Quadrante de um serviço num gráfico: 50% ou mais conta como alto.
// Exportada para o guia do portfólio conferir os quadrantes do exemplo.
export const quadranteDe = (x: number, y: number, id: GraficoId) => {
  const quadrantes = GRAFICOS[id].quadrantes;
  if (x >= 50 && y >= 50) return quadrantes.tr;
  if (x < 50 && y >= 50) return quadrantes.tl;
  if (x >= 50 && y < 50) return quadrantes.br;
  return quadrantes.bl;
};

interface TooltipProps {
  active?: boolean;
  payload?: { payload: Service; value: number }[];
  id: GraficoId;
}

function DicaDoPonto({ active, payload, id }: TooltipProps) {
  if (!active || !payload || payload.length < 2) return null;
  const grafico = GRAFICOS[id];
  const servico = payload[0].payload;
  const x = payload[0].value;
  const y = payload[1].value;

  return (
    <div className="min-w-[180px] rounded-lg border border-ui-line bg-ui-bg p-3 text-ui-ink shadow-lg">
      <p className="m-0 mb-2 border-b border-ui-line pb-2 text-sm font-semibold">{servico.nome}</p>
      <p className="m-0 flex justify-between gap-3 text-xs text-ui-muted">
        <span>{grafico.xNome}</span>
        <span className="font-semibold text-ui-ink">{formatarNumero(x, 0)}%</span>
      </p>
      <p className="m-0 flex justify-between gap-3 text-xs text-ui-muted">
        <span>{grafico.yNome}</span>
        <span className="font-semibold text-ui-ink">{formatarNumero(y, 0)}%</span>
      </p>
      <p className="m-0 mt-2 rounded bg-ui-surface px-2 py-1 text-xs font-semibold text-ui-brand-blue">
        {quadranteDe(x, y, id)}
      </p>
    </div>
  );
}

function Grafico({
  id,
  services,
  highlightedId,
}: {
  id: GraficoId;
  services: Service[];
  highlightedId: string | null;
}) {
  const grafico = GRAFICOS[id];
  const rotuloDoQuadrante = { fontSize: 11, fill: '#63668a' } as const;

  return (
    <Bloco titulo={grafico.titulo}>
      <div data-testid="area-do-grafico" className="flex flex-col gap-1">
        <div className="flex items-stretch gap-1">
          <span className="flex items-center justify-center text-[13px] font-medium text-ui-muted [writing-mode:vertical-rl] rotate-180">
            {grafico.yNome}
          </span>
          <div className="h-[280px] min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e5ef" />
                <XAxis
                  type="number"
                  dataKey={grafico.xChave}
                  name={grafico.xNome}
                  unit="%"
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey={grafico.yChave}
                  name={grafico.yNome}
                  unit="%"
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  width={44}
                  tick={{ fontSize: 11 }}
                />
                <ZAxis type="number" range={[100, 100]} />
                <Tooltip content={<DicaDoPonto id={id} />} cursor={{ strokeDasharray: '3 3' }} />

                <ReferenceArea
                  x1={0}
                  x2={50}
                  y1={50}
                  y2={100}
                  fill="transparent"
                  label={{ value: grafico.quadrantes.tl, position: 'insideTopLeft', ...rotuloDoQuadrante }}
                />
                <ReferenceArea
                  x1={50}
                  x2={100}
                  y1={50}
                  y2={100}
                  fill="transparent"
                  label={{ value: grafico.quadrantes.tr, position: 'insideTopRight', ...rotuloDoQuadrante }}
                />
                <ReferenceArea
                  x1={0}
                  x2={50}
                  y1={0}
                  y2={50}
                  fill="transparent"
                  label={{ value: grafico.quadrantes.bl, position: 'insideBottomLeft', ...rotuloDoQuadrante }}
                />
                <ReferenceArea
                  x1={50}
                  x2={100}
                  y1={0}
                  y2={50}
                  fill="transparent"
                  label={{ value: grafico.quadrantes.br, position: 'insideBottomRight', ...rotuloDoQuadrante }}
                />
                <ReferenceLine x={50} stroke="#c9cbe0" strokeWidth={2} />
                <ReferenceLine y={50} stroke="#c9cbe0" strokeWidth={2} />

                <Scatter name="Serviços" data={services}>
                  {services.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={highlightedId ? (highlightedId === entry.id ? 1 : 0.2) : 0.8}
                      stroke={highlightedId === entry.id ? '#14142b' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                  {/* Nome ao lado de cada bolinha: no celular não há "passar o mouse"
                      para descobrir qual serviço é qual (conferência visual da F3b). */}
                  <LabelList
                    dataKey="nome"
                    content={(props) => {
                      const { x, y, width, height, value, index } = props as {
                        x?: number | string; y?: number | string; width?: number | string; height?: number | string;
                        value?: string | number; index?: number;
                      };
                      const s = services[index ?? 0];
                      const cx = Number(x ?? 0) + Number(width ?? 0) / 2;
                      const cy = Number(y ?? 0) + Number(height ?? 0) / 2;
                      // Na metade direita, o nome vai para a esquerda da bolinha (não sai do gráfico).
                      const aDireita = s ? Number(s[grafico.xChave as keyof Service]) <= 50 : true;
                      return (
                        <text
                          x={aDireita ? cx + 9 : cx - 9}
                          y={cy}
                          dy="0.35em"
                          textAnchor={aDireita ? 'start' : 'end'}
                          fontSize={11}
                          fill="#14142b"
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        <span className="text-center text-[13px] font-medium text-ui-muted">{grafico.xNome}</span>
      </div>

      <p data-testid="explicacao" className="m-0 text-sm leading-[1.45] text-ui-muted">
        {grafico.explicacao}
      </p>

      <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
        {grafico.significados.map((q) => (
          <div key={q.nome} className="flex flex-col gap-0.5">
            <dt className="text-sm font-semibold text-ui-ink">{q.nome}</dt>
            <dd className="m-0 text-[13px] leading-[1.4] text-ui-muted">{q.desc}</dd>
          </div>
        ))}
      </dl>
    </Bloco>
  );
}

export function ServiceCharts({ services, highlightedId }: ServiceChartsProps) {
  if (services.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-[#c9cbe0] bg-ui-bg p-6 text-center text-[15px] leading-normal text-ui-muted"
      >
        Adicione o primeiro serviço para ver os gráficos.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Grafico id="operacao" services={services} highlightedId={highlightedId} />
      <Grafico id="decisao" services={services} highlightedId={highlightedId} />
    </div>
  );
}

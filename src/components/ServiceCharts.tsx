'use client';

import React, { useState } from 'react';
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
} from 'recharts';
import { Service } from '../types';
import { Info } from 'lucide-react';

interface ServiceChartsProps {
  services: Service[];
  highlightedId: string | null;
}

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', 
  '#db2777', '#0891b2', '#4f46e5', '#ea580c', '#65a30d'
];

const MATRIX_INFO = {
  operacao: {
    title: 'Matriz de Operação',
    description: 'Analisa o esforço vs complexidade técnica. Ajuda a identificar serviços que demandam muita energia da equipe ou alta especialização técnica.',
    xName: 'Esforço',
    yName: 'Complexidade',
    quadrants: {
      tr: 'Crítico',
      tl: 'Especialista',
      br: 'Operacional',
      bl: 'Eficiente'
    },
    quadrantList: [
      { name: 'Crítico', pos: 'Topo Direito', desc: 'Alta complexidade e alto esforço.' },
      { name: 'Especialista', pos: 'Topo Esquerdo', desc: 'Alta complexidade, mas baixo esforço.' },
      { name: 'Operacional', pos: 'Baixo Direito', desc: 'Baixa complexidade, mas alto esforço.' },
      { name: 'Eficiente', pos: 'Baixo Esquerdo', desc: 'Baixa complexidade e baixo esforço.' }
    ]
  },
  decisao: {
    title: 'Matriz de Decisão',
    description: 'Cruza a padronização (escalabilidade) com a lucratividade (margem). Essencial para definir onde focar o crescimento comercial.',
    xName: 'Padronização',
    yName: 'Lucratividade',
    quadrants: {
      tr: 'Estrela',
      tl: 'Oportunidade',
      br: 'Escala',
      bl: 'Revisar'
    },
    quadrantList: [
      { name: 'Estrela', pos: 'Topo Direito', desc: 'Alta padronização e alta lucratividade.' },
      { name: 'Oportunidade', pos: 'Topo Esquerdo', desc: 'Baixa padronização, mas alta margem.' },
      { name: 'Escala', pos: 'Baixo Direito', desc: 'Alta padronização, mas margem menor.' },
      { name: 'Revisar', pos: 'Baixo Esquerdo', desc: 'Baixa padronização e baixa margem.' }
    ]
  }
};

// Quadrante de um serviço numa matriz: 50% ou mais conta como alto.
// Exportada para o guia do portfólio conferir os quadrantes do exemplo.
export const quadranteDe = (x: number, y: number, id: 'operacao' | 'decisao') => {
  const quadrants = MATRIX_INFO[id].quadrants;
  if (x >= 50 && y >= 50) return quadrants.tr;
  if (x < 50 && y >= 50) return quadrants.tl;
  if (x >= 50 && y < 50) return quadrants.br;
  return quadrants.bl;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: Service; value: number }[];
  id?: string;
}

export function ServiceCharts({ services, highlightedId }: ServiceChartsProps) {
  const [hoveredInfo, setHoveredInfo] = useState<'operacao' | 'decisao' | null>(null);

  const CustomTooltip = ({ active, payload, id }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const x = payload[0].value;
      const y = payload[1].value;
      const info = MATRIX_INFO[id as 'operacao' | 'decisao'];
      const quadrant = quadranteDe(x, y, id as 'operacao' | 'decisao');

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg min-w-[180px]">
          <p className="font-bold text-gray-800 border-b pb-2 mb-2">{data.nome}</p>
          <div className="space-y-1 mb-2">
            <p className="text-[10px] text-gray-500 flex justify-between uppercase">
              <span>{info.xName}:</span>
              <span className="font-bold text-gray-700">{x.toFixed(0)}%</span>
            </p>
            <p className="text-[10px] text-gray-500 flex justify-between uppercase">
              <span>{info.yName}:</span>
              <span className="font-bold text-gray-700">{y.toFixed(0)}%</span>
            </p>
          </div>
          <div className="bg-brand-blue/10 px-2 py-1 rounded">
            <p className="text-[9px] text-brand-blue font-black uppercase">Quadrante:</p>
            <p className="text-xs font-bold text-brand-dark">{quadrant}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = (
    id: 'operacao' | 'decisao',
    data: Service[],
    xAxis: string,
    yAxis: string,
    xLabel: string,
    yLabel: string
  ) => {
    const info = MATRIX_INFO[id];
    
    return (
      <div className="flex-1 min-w-[300px] bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
        <div 
          className="flex items-center gap-2 mb-4 cursor-help inline-flex"
          onMouseEnter={() => setHoveredInfo(id)}
          onMouseLeave={() => setHoveredInfo(null)}
        >
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">{info.title}</h3>
          <Info size={14} className="text-gray-400 group-hover:text-brand-blue transition-colors" />
        </div>

        {/* Info Overlay */}
        {hoveredInfo === id && (
          <div className="absolute top-14 left-6 right-6 z-20 bg-gray-900/95 text-white p-4 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200 backdrop-blur-sm border border-white/10">
            <p className="text-xs font-medium leading-relaxed mb-3 opacity-90">{info.description}</p>
            <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              {info.quadrantList.map((q, i) => (
                <div key={i}>
                  <p className="text-[10px] font-bold text-brand-blue/60">{q.name}</p>
                  <p className="text-[9px] text-gray-400 leading-tight">{q.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey={xAxis}
                name={xLabel}
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                label={{ value: xLabel, position: 'bottom', offset: 0, fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey={yAxis}
                name={yLabel}
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              <ZAxis type="number" range={[100, 100]} />
              <Tooltip content={<CustomTooltip id={id} />} cursor={{ strokeDasharray: '3 3' }} />
              
              <ReferenceLine x={50} stroke="#cbd5e1" strokeWidth={2} />
              <ReferenceLine y={50} stroke="#cbd5e1" strokeWidth={2} />
              
              <Scatter name="Serviços" data={data}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={highlightedId ? (highlightedId === entry.id ? 1 : 0.2) : 0.8}
                    stroke={highlightedId === entry.id ? '#000' : 'none'}
                    strokeWidth={2}
                    className="transition-all duration-300"
                    r={highlightedId === entry.id ? 8 : 6}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-wrap gap-6 mb-8">
      {renderChart(
        'operacao',
        services,
        'esforco',
        'complexidade',
        'Esforço',
        'Complexidade'
      )}
      {renderChart(
        'decisao',
        services,
        'padronizacao',
        'lucratividade',
        'Padronização',
        'Lucratividade'
      )}
    </div>
  );
}

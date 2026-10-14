'use client';

import React from 'react';
import { usePricing } from '../../hooks/usePricing';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { AdUnit } from '../../components/AdUnit';
import { WelcomeModal } from '../../components/WelcomeModal';
import { CurrencyInput } from '../../components/CurrencyInput';
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings
} from 'lucide-react';

export default function PrecificacaoView({ children }: { children?: React.ReactNode }) {
  const { data, updateCustosFixos, updateCapacidade, updateServico, isLoaded, calculations } = usePricing();
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const idDias = React.useId();
  const idHoras = React.useId();
  const idOciosidade = React.useId();
  const idNome = React.useId();
  const idHorasEst = React.useId();
  const idImpostos = React.useId();

  React.useEffect(() => {
    if (isLoaded) {
      const hasSeenModal = localStorage.getItem('unum_pricing_welcome_seen');
      if (!hasSeenModal) {
        setTimeout(() => setIsHelpOpen(true), 0);
      }
    }
  }, [isLoaded]);

  const closeHelp = () => {
    localStorage.setItem('unum_pricing_welcome_seen', 'true');
    setIsHelpOpen(false);
  };

  const formatCurrency = (value: number) => {
    if (!mounted) return '...';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatNumber = (value: number) => {
    if (!mounted) return '...';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const getStatusColor = (margin: number) => {
    if (margin <= 0) return 'text-red-600 bg-red-50 border-red-100';
    if (margin < 20) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    return 'text-green-600 bg-green-50 border-green-100';
  };

  const getStatusIcon = (margin: number) => {
    if (margin <= 0) return <XCircle className="text-red-500" size={24} />;
    if (margin < 20) return <AlertTriangle className="text-yellow-500" size={24} />;
    return <CheckCircle2 className="text-green-500" size={24} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      <Header 
        onOpenHelp={() => setIsHelpOpen(true)} 
        toolName="Simulador de Precificação"
      />
      
      {/* Help Modal Content for Pricing */}
      <WelcomeModal 
        isOpen={isHelpOpen} 
        onClose={closeHelp} 
        title="Como usar o Simulador"
        description="Elimine o 'achismo' e descubra sua margem real."
        icon={<Calculator size={24} />}
        customContent={
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                  <DollarSign className="text-brand-blue" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-blue text-sm uppercase">1. Custos Fixos</h4>
                  <p className="text-xs text-brand-grey leading-relaxed">Insira tudo o que você paga para manter a empresa aberta, incluindo seu próprio salário (Pró-labore).</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Clock className="text-brand-blue" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-blue text-sm uppercase">2. Capacidade Produtiva</h4>
                  <p className="text-xs text-brand-grey leading-relaxed">Defina quanto tempo você realmente tem para produzir, descontando reuniões e burocracias.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                  <TrendingUp className="text-brand-blue" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-blue text-sm uppercase">3. Resultados Reais</h4>
                  <p className="text-xs text-brand-grey leading-relaxed">Veja o &quot;Piso Aceitável&quot; (o mínimo para não ter prejuízo) e simule preços para ver sua margem líquida.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-brand-blue/5 rounded-xl border border-brand-blue/10">
              <div className="flex items-center gap-2 mb-2 text-brand-blue">
                <AlertCircle size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Dica de Ouro</span>
              </div>
              <p className="text-xs text-brand-blue/80 leading-relaxed font-medium">
                O simulador calcula impostos &quot;por dentro&quot;, como o fisco faz. Isso garante que sua margem seja calculada sobre o valor final de venda, evitando o erro comum de aplicar a taxa sobre o custo.
              </p>
            </div>
          </div>
        }
      />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="text-brand-blue" size={20} />
                <h1 className="text-xl font-black brand-gradient-text uppercase tracking-tighter">
                  Precificação e Margem
                </h1>
              </div>
              <p className="text-brand-grey text-xs font-bold uppercase tracking-widest opacity-70">
                Análise de Custos e Ponto de Equilíbrio
              </p>
            </div>
          </header>

          {!isLoaded ? (
            <div className="py-20 flex items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-gray-100">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-brand-blue/20 rounded-full mb-4"></div>
                <p className="text-brand-grey font-medium">Carregando simulador...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Inputs Column */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* 1. Módulo de Custos Fixos */}
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">Custos Fixos Mensais</h2>
                          <p className="text-[10px] text-brand-grey font-bold uppercase opacity-60">O custo da operação aberta</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-brand-grey font-bold uppercase opacity-60 mb-1">Total Fixo</p>
                        <p className="text-lg font-black text-brand-blue tracking-tighter">{formatCurrency(calculations.totalCustosFixos)}</p>
                      </div>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { label: 'Aluguel / Cond.', key: 'aluguel' },
                        { label: 'Energia / Água', key: 'energia' },
                        { label: 'Internet / Telef.', key: 'internet' },
                        { label: 'Contador', key: 'contador' },
                        { label: 'Softwares (SaaS)', key: 'softwares' },
                        { label: 'Salários Equipe', key: 'equipe' },
                      ].map((field) => (
                        <CurrencyInput
                          key={field.key}
                          label={field.label}
                          value={data.custosFixos[field.key as keyof typeof data.custosFixos] || 0}
                          onChange={(value) => updateCustosFixos({ [field.key]: value })}
                        />
                      ))}
                      <div className="lg:col-span-1">
                        <CurrencyInput
                          label="Pró-labore"
                          value={data.custosFixos.proLabore || 0}
                          onChange={(value) => updateCustosFixos({ proLabore: value })}
                          className="bg-brand-blue/5 border-brand-blue/10"
                          labelClassName="text-brand-blue"
                          icon={
                            <div className="group cursor-help relative">
                              <Info size={12} className="text-brand-blue/40 group-hover:text-brand-blue transition-colors" />
                              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-brand-grey text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl normal-case font-medium">
                                Salário fixo do proprietário. Não confunda com o lucro da empresa!
                              </div>
                            </div>
                          }
                        />
                      </div>
                    </div>
                  </section>

                  {/* 2. Módulo de Capacidade Produtiva */}
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">Capacidade Produtiva</h2>
                          <p className="text-[10px] text-brand-grey font-bold uppercase opacity-60">O fator tempo da empresa</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-brand-grey font-bold uppercase opacity-60 mb-1">Custo/Hora Fixo</p>
                        <p className="text-lg font-black text-brand-blue tracking-tighter">{formatCurrency(calculations.custoFixoPorHora)}</p>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label 
                          htmlFor={idDias}
                          className="block text-[10px] font-black text-brand-grey uppercase tracking-widest mb-2"
                        >
                          Dias Úteis / Mês
                        </label>
                        <input
                          id={idDias}
                          type="number"
                          value={data.capacidade.diasTrabalhados}
                          onChange={(e) => updateCapacidade({ diasTrabalhados: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label 
                          htmlFor={idHoras}
                          className="block text-[10px] font-black text-brand-grey uppercase tracking-widest mb-2"
                        >
                          Horas Diárias
                        </label>
                        <input
                          id={idHoras}
                          type="number"
                          value={data.capacidade.horasDiarias}
                          onChange={(e) => updateCapacidade({ horasDiarias: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label 
                          htmlFor={idOciosidade}
                          className="block text-[10px] font-black text-brand-grey uppercase tracking-widest mb-2"
                        >
                          Ociosidade (%)
                        </label>
                        <div className="relative">
                          <input
                            id={idOciosidade}
                            type="number"
                            value={data.capacidade.percentualOciosidade}
                            onChange={(e) => updateCapacidade({ percentualOciosidade: Number(e.target.value) })}
                            className="w-full pr-9 pl-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 pb-6">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-brand-grey uppercase tracking-widest">Total de Horas Faturáveis:</span>
                        <span className="text-sm font-black text-brand-blue tracking-tighter">{formatNumber(calculations.horasFaturaveis)} h</span>
                      </div>
                    </div>
                  </section>

                  {/* 3. Módulo de Parametrização do Serviço */}
                  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                          <Settings size={20} />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">Parâmetros do Serviço</h2>
                          <p className="text-[10px] text-brand-grey font-bold uppercase opacity-60">Custos específicos da execução</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <label 
                          htmlFor={idNome}
                          className="block text-[10px] font-black text-brand-grey uppercase tracking-widest mb-2"
                        >
                          Nome do Serviço / Projeto
                        </label>
                        <input
                          id={idNome}
                          type="text"
                          value={data.servico.nome}
                          onChange={(e) => updateServico({ nome: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all"
                          placeholder="Ex: Instalação de Ar Condicionado"
                        />
                      </div>
                      <div>
                        <label 
                          htmlFor={idHorasEst}
                          className="block text-[10px] font-black text-brand-grey uppercase tracking-widest mb-2"
                        >
                          Horas Estimadas
                        </label>
                        <div className="relative">
                          <input
                            id={idHorasEst}
                            type="number"
                            value={data.servico.horasEstimadas || ''}
                            onChange={(e) => updateServico({ horasEstimadas: Number(e.target.value) })}
                            className="w-full pr-9 pl-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">h</span>
                        </div>
                      </div>
                      <CurrencyInput
                        label="Materiais Diretos"
                        value={data.servico.materiaisDiretos || 0}
                        onChange={(value) => updateServico({ materiaisDiretos: value })}
                      />
                      <CurrencyInput
                        label="Deslocamento / Extras"
                        value={data.servico.deslocamento || 0}
                        onChange={(value) => updateServico({ deslocamento: value })}
                      />
                      <div>
                        <label 
                          htmlFor={idImpostos}
                          className="block text-[10px] font-black text-brand-grey uppercase tracking-widest mb-2"
                        >
                          Impostos (%)
                        </label>
                        <div className="relative">
                          <input
                            id={idImpostos}
                            type="number"
                            value={data.servico.impostosPercentual || ''}
                            onChange={(e) => updateServico({ impostosPercentual: Number(e.target.value) })}
                            className="w-full pr-9 pl-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Results Column */}
                <div className="lg:col-span-4 space-y-8">
                  <section className="bg-brand-grey rounded-2xl shadow-2xl p-8 text-white sticky top-24">
                    <header className="mb-8 border-b border-white/10 pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={20} className="text-brand-blue" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Painel de Resultados</h2>
                      </div>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">Análise de Viabilidade em Tempo Real</p>
                    </header>

                    <div className="space-y-8">
                      {/* Piso Aceitável */}
                      <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
                          Piso Aceitável (Break-even)
                          <div className="relative group cursor-help">
                            <Info size={12} className="text-white/20 group-hover:text-white transition-colors" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-white text-[10px] text-brand-grey rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl normal-case font-medium">
                              Valor mínimo para cobrir custos e impostos. Abaixo disso, há prejuízo.
                            </div>
                          </div>
                        </label>
                        <div className="text-3xl font-black tracking-tighter text-white">
                          {formatCurrency(calculations.pisoAceitavel)}
                        </div>
                        <div className="mt-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                          O Ponto de Equilíbrio Real
                        </div>
                      </div>

                      {/* Simulador de Preço */}
                      <div className="pt-8 border-t border-white/10">
                        <CurrencyInput
                          label="Quanto deseja cobrar?"
                          value={data.servico.precoDesejado || 0}
                          onChange={(value) => updateServico({ precoDesejado: value })}
                          labelClassName="text-white/80"
                          className="bg-white/5 border-white/10 py-5 pl-12 pr-6 text-2xl font-black text-white focus:bg-white/10 focus:border-brand-blue placeholder:text-white/10"
                          prefix="R$"
                        />
                      </div>

                      {/* Margem e Lucro */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl border transition-colors ${getStatusColor(calculations.margemLucroReal)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Margem Real</span>
                            {getStatusIcon(calculations.margemLucroReal)}
                          </div>
                          <div className="text-xl font-black tracking-tighter">
                            {formatNumber(calculations.margemLucroReal)}%
                          </div>
                        </div>

                    <div className={`p-4 rounded-2xl border transition-colors ${getStatusColor(calculations.margemLucroReal)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Lucro Líquido</span>
                        <DollarSign size={16} className="opacity-40" />
                      </div>
                      <div className="text-xl font-black tracking-tighter">
                        {formatCurrency(calculations.lucroNominal)}
                      </div>
                    </div>
                      </div>

                      {/* Warning message if below floor */}
                      {data.servico.precoDesejado > 0 && data.servico.precoDesejado < calculations.pisoAceitavel && (
                        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl flex gap-3">
                          <AlertCircle className="text-red-400 shrink-0" size={18} />
                          <p className="text-[10px] font-bold text-red-200 leading-relaxed uppercase">
                            Atenção: O preço sugerido está abaixo do piso aceitável. Esta venda gerará prejuízo para a operação.
                          </p>
                        </div>
                      )}

                      {/* Recommendation based on margin */}
                      {data.servico.precoDesejado > 0 && calculations.margemLucroReal > 0 && calculations.margemLucroReal < 20 && (
                        <div className="p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl flex gap-3">
                          <AlertTriangle className="text-yellow-400 shrink-0" size={18} />
                          <p className="text-[10px] font-bold text-yellow-200 leading-relaxed uppercase">
                            Margem Apertada: Considere otimizar processos ou aumentar o valor para atingir a margem ideal (acima de 20%).
                          </p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="bg-white border-2 border-brand-blue/10 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-blue/5 mt-12">
                <div className="space-y-2 text-center md:text-left">
                  <h4 className="text-xl font-bold text-brand-blue">Garanta a saúde financeira da sua operação.</h4>
                  <p className="text-gray-500 text-sm">Descubra como o Unum People pode ajudar você a otimizar seus custos e garantir previsibilidade de lucro.</p>
                </div>
                <a 
                  href="https://unumpeople.com.br" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-brand-blue text-white font-black rounded-xl hover:bg-opacity-90 hover:scale-105 transition-all whitespace-nowrap shadow-lg shadow-brand-blue/20 inline-block text-center"
                >
                  CONHECER UNUM PEOPLE
                </a>
              </div>

              <AdUnit className="my-10" slot="1270666901" />
            </>
          )}

          {children}
        </div>
      </main>

      <AdUnit className="mb-8" slot="7715444307" />

      <Footer />
    </div>
  );
}

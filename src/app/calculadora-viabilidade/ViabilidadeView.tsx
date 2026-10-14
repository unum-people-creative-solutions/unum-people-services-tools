'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { AdUnit } from '../../components/AdUnit';
import { WelcomeModal } from '../../components/WelcomeModal';
import { CurrencyInput } from '../../components/CurrencyInput';
import { NumericFormat } from 'react-number-format';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  ChevronRight, 
  Info, 
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  ChevronDown,
  Calculator,
  Lightbulb,
  PieChart,
  Target,
  Zap
} from 'lucide-react';

type Step = 'CHOOSE_PATH' | 'FILL_FORM' | 'DIAGNOSIS';
type Scenario = 'BUDGET_TO_EFFORT' | 'GOAL_TO_INVESTMENT';

interface FormData {
  ticketMedio: number;
  custoVariavel: number;
  cpc: number;
  taxaConversaoLP: number;
  orcamento: number;
  clientesMeta: number;
  taxaFechamento: number;
}

const INITIAL_FORM_DATA: FormData = {
  ticketMedio: 0,
  custoVariavel: 0,
  cpc: 0,
  taxaConversaoLP: 0,
  orcamento: 0,
  clientesMeta: 0,
  taxaFechamento: 0,
};

export default function ViabilidadeView({ children }: { children?: React.ReactNode }) {
  const [step, setStep] = useState<Step>('CHOOSE_PATH');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isXrayOpen, setIsXrayOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const formatCurrency = (value: number | undefined) => {
    if (!mounted || value === undefined) return '...';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleValueChange = (name: keyof FormData, values: { floatValue?: number }) => {
    setFormData(prev => ({ ...prev, [name]: values.floatValue || 0 }));
  };

  const results = useMemo(() => {
    if (step !== 'DIAGNOSIS') return null;

    const { 
      ticketMedio, custoVariavel, cpc, taxaConversaoLP, 
      orcamento, clientesMeta, taxaFechamento 
    } = formData;

    const margemContribuicao = ticketMedio - custoVariavel;
    const txLP = taxaConversaoLP / 100;
    const txFech = taxaFechamento / 100;

    if (scenario === 'BUDGET_TO_EFFORT') {
      if (margemContribuicao <= 0) return { error: 'Margem de contribuição negativa. O produto custa mais para produzir do que o preço de venda.' };
      
      const vendasPE = orcamento / margemContribuicao;
      const visitantes = orcamento / cpc;
      const leads = visitantes * txLP;
      const txVendasExigida = leads > 0 ? (vendasPE / leads) * 100 : 0;
      const inviavel = txVendasExigida > 20;

      return {
        vendasPE: Math.ceil(vendasPE),
        visitantes: Math.floor(visitantes),
        leads: Math.floor(leads),
        txVendasExigida: txVendasExigida.toFixed(1),
        orcamento,
        ticketMedio,
        custoVariavel,
        margemContribuicao,
        inviavel
      };
    } else {
      if (txLP === 0 || txFech === 0) return { error: 'Taxas de conversão ou fechamento não podem ser zero.' };
      
      const orcamentoNecessario = (clientesMeta * cpc) / (txLP * txFech);
      const visitantes = orcamentoNecessario / cpc;
      const leads = visitantes * txLP;
      const cac = orcamentoNecessario / clientesMeta;
      const roi = ((clientesMeta * margemContribuicao) - orcamentoNecessario) / orcamentoNecessario;

      return {
        orcamentoNecessario: orcamentoNecessario.toFixed(2),
        visitantes: Math.floor(visitantes),
        leads: Math.floor(leads),
        cac: cac.toFixed(2),
        roi: (roi * 100).toFixed(1),
        clientesMeta,
        ticketMedio,
        custoVariavel,
        margemContribuicao,
        cpc,
        taxaConversaoLP,
        taxaFechamento,
        inviavel: false
      };
    }
  }, [step, scenario, formData]);

  const renderHelpContent = () => (
    <div className="space-y-8">
      <section>
        <h3 className="text-brand-blue font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
          <Zap size={16} /> Como funciona a ferramenta
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          A Calculadora de Viabilidade permite que você simule cenários de investimento em anúncios antes de gastar um único real. Ela ajuda a eliminar o &quot;achismo&quot; ao cruzar os dados da sua operação com as métricas de mercado.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
            <p className="font-bold text-gray-800 text-sm mb-1">Cenário A: Orçamento</p>
            <p className="text-xs text-gray-500 leading-relaxed italic">
              Você define quanto quer investir e nós dizemos quantas vendas e qual taxa de fechamento você precisa ter para o lucro pagar a campanha.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
            <p className="font-bold text-gray-800 text-sm mb-1">Cenário B: Meta</p>
            <p className="text-xs text-gray-500 leading-relaxed italic">
              Você define quantos clientes quer conquistar e nós calculamos o orçamento necessário baseado no seu funil de vendas.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-brand-blue font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
          <PieChart size={16} /> Glossário de Métricas
        </h3>
        <div className="space-y-4">
          {[
            { term: 'CPC (Custo por Clique)', desc: 'É o valor médio que você paga cada vez que alguém clica no seu anúncio.' },
            { term: 'Leads / Oportunidades', desc: 'Pessoas que clicaram no anúncio e realizaram uma ação (preencheram formulário ou chamaram no WhatsApp).' },
            { term: 'Taxa de Conversão LP', desc: 'A porcentagem de visitantes que chegam no seu site e se tornam leads.' },
            { term: 'CAC (Custo de Aquisição)', desc: 'Quanto custou, em média, o investimento em anúncios para conquistar cada cliente real.' },
            { term: 'ROI (Retorno Investimento)', desc: 'A relação entre o lucro gerado e o valor investido na campanha.' },
            { term: 'Ponto de Equilíbrio', desc: 'O momento em que o lucro gerado pelas vendas iguala o custo do investimento, ou seja, você não tem prejuízo.' },
          ].map((item, idx) => (
            <div key={idx} className="grid grid-cols-[160px_1fr] gap-4 text-sm items-start">
              <span className="font-bold text-brand-blue leading-tight">{item.term}:</span>
              <span className="text-gray-600 leading-tight">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/20">
        <h3 className="text-brand-blue font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
          <Target size={16} /> Planejamento Estratégico
        </h3>
        <p className="text-sm text-brand-dark leading-relaxed italic">
          Utilize esta ferramenta para definir orçamentos de marketing realistas. Se a calculadora indicar que você precisa de uma taxa de fechamento comercial de 80% para empatar a conta, talvez seja necessário ajustar o preço de venda ou otimizar seus custos antes de iniciar a campanha.
        </p>
      </section>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-brand-blue tracking-tighter">
          O QUE VOCÊ DESEJA DESCOBRIR?
        </h2>
        <p className="text-gray-500">Escolha o caminho para iniciar sua simulação</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => {
            setScenario('BUDGET_TO_EFFORT');
            setStep('FILL_FORM');
          }}
          className="group p-8 bg-white border-2 border-gray-100 rounded-2xl text-left hover:border-brand-blue hover:shadow-xl transition-all duration-300"
        >
          <div className="w-14 h-14 bg-brand-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <DollarSign className="text-brand-blue" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Tenho um orçamento</h3>
          <p className="text-gray-500 leading-relaxed">
            Quero saber qual o esforço de vendas necessário para ter retorno com este investimento.
          </p>
          <div className="mt-6 flex items-center text-brand-blue font-bold text-sm">
            COMEÇAR <ChevronRight size={16} className="ml-1" />
          </div>
        </button>

        <button
          onClick={() => {
            setScenario('GOAL_TO_INVESTMENT');
            setStep('FILL_FORM');
          }}
          className="group p-8 bg-white border-2 border-gray-100 rounded-2xl text-left hover:border-brand-blue hover:shadow-xl transition-all duration-300"
        >
          <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="text-green-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Tenho uma meta</h3>
          <p className="text-gray-500 leading-relaxed">
            Quero saber quanto preciso investir para conquistar um número específico de clientes.
          </p>
          <div className="mt-6 flex items-center text-green-600 font-bold text-sm">
            COMEÇAR <ChevronRight size={16} className="ml-1" />
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setStep('CHOOSE_PATH')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {scenario === 'BUDGET_TO_EFFORT' ? 'Orçamento para Esforço' : 'Meta para Investimento'}
          </h2>
          <p className="text-sm text-gray-500">Preencha os dados básicos da sua operação</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* TM */}
          <CurrencyInput
            label="Ticket Médio"
            value={formData.ticketMedio || 0}
            onChange={(value) => setFormData(prev => ({ ...prev, ticketMedio: value }))}
            icon={
              <div className="group relative">
                <Info size={14} className="text-gray-300 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg -top-2 left-6 normal-case font-medium">
                  Por qual valor você vende este serviço ou produto?
                </div>
              </div>
            }
          />

          {/* Custo Variável */}
          <div className="space-y-2">
            <label 
              htmlFor="custoVariavel"
              className="flex items-center gap-2 text-sm font-bold text-gray-700"
            >
              Custo Variável <span className="text-[10px] text-gray-400 font-normal uppercase">(Opcional)</span>
              <div className="group relative">
                <Info size={14} className="text-gray-300 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg -top-2 left-6">
                  Quanto custa do seu bolso para entregar uma unidade deste serviço (impostos, materiais, frete)? Isso garante o cálculo do ponto de equilíbrio real.
                </div>
              </div>
            </label>
            <NumericFormat
              id="custoVariavel"
              value={formData.custoVariavel || ''}
              onValueChange={(values) => handleValueChange('custoVariavel', values)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="R$ 0,00"
            />
          </div>

          {/* CPC */}
          <div className="space-y-2">
            <label 
              htmlFor="cpc"
              className="flex items-center gap-2 text-sm font-bold text-gray-700"
            >
              CPC Médio
              <div className="group relative">
                <Info size={14} className="text-gray-300 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg -top-2 left-6">
                  Quanto você acha que vai pagar por cada clique no seu anúncio? Média do mercado: R$ 0,50 a R$ 2,50.
                </div>
              </div>
            </label>
            <NumericFormat
              id="cpc"
              value={formData.cpc || ''}
              onValueChange={(values) => handleValueChange('cpc', values)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
              placeholder="R$ 0,00"
            />
          </div>

          {/* Taxa Conversão LP */}
          <div className="space-y-2">
            <label 
              htmlFor="taxaConversaoLP"
              className="flex items-center gap-2 text-sm font-bold text-gray-700"
            >
              Taxa de Conversão da LP
              <div className="group relative">
                <Info size={14} className="text-gray-300 cursor-help" />
                <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg -top-2 left-6">
                  De cada 100 pessoas que entram no seu site, quantas costumam te chamar no WhatsApp?
                </div>
              </div>
            </label>
            <div className="relative">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium z-10">%</span>
              <NumericFormat
                id="taxaConversaoLP"
                value={formData.taxaConversaoLP || ''}
                onValueChange={(values) => handleValueChange('taxaConversaoLP', values)}
                suffix=""
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
                placeholder="0"
              />
            </div>
          </div>

          {/* Exclusive Fields */}
          {scenario === 'BUDGET_TO_EFFORT' ? (
            <div className="md:col-span-2 space-y-2">
              <label 
                htmlFor="orcamento"
                className="flex items-center gap-2 text-sm font-bold text-gray-700"
              >
                Orçamento da Campanha
                <div className="group relative">
                  <Info size={14} className="text-gray-300 cursor-help" />
                  <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg -top-2 left-6">
                    Quanto dinheiro você quer investir nesta campanha de anúncios?
                  </div>
                </div>
              </label>
              <NumericFormat
                id="orcamento"
                value={formData.orcamento || ''}
                onValueChange={(values) => handleValueChange('orcamento', values)}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                className="w-full px-4 py-3 bg-brand-blue/5 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all font-bold text-brand-blue"
                placeholder="R$ 0,00"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label 
                  htmlFor="clientesMeta"
                  className="flex items-center gap-2 text-sm font-bold text-gray-700"
                >
                  Meta de Clientes
                  <div className="group relative">
                    <Info size={14} className="text-gray-300 cursor-help" />
                    <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg -top-2 left-6">
                      Quantos novos clientes você deseja conquistar com essa campanha?
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <NumericFormat
                    id="clientesMeta"
                    value={formData.clientesMeta || ''}
                    onValueChange={(values) => handleValueChange('clientesMeta', values)}
                    className="w-full pl-12 pr-4 py-3 bg-green-50/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-bold text-green-700"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="taxaFechamento"
                  className="flex items-center gap-2 text-sm font-bold text-gray-700"
                >
                  Taxa de Fechamento (Vendas)
                  <div className="group relative">
                    <Info size={14} className="text-gray-300 cursor-help" />
                    <div className="hidden group-hover:block absolute z-10 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg -top-2 left-6">
                      De cada 10 pessoas que chegam como lead, para quantas você realmente vende?
                    </div>
                  </div>
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium z-10">%</span>
                  <NumericFormat
                    id="taxaFechamento"
                    value={formData.taxaFechamento || ''}
                    onValueChange={(values) => handleValueChange('taxaFechamento', values)}
                    className="w-full pl-4 pr-10 py-3 bg-green-50/50 border border-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-bold text-green-700"
                    placeholder="0"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => {
            setStep('DIAGNOSIS');
            setIsXrayOpen(false);
          }}
          disabled={!formData.ticketMedio || !formData.cpc || !formData.taxaConversaoLP}
          className="w-full py-4 bg-brand-blue text-white rounded-xl font-black uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-lg shadow-brand-blue/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
        >
          Gerar Diagnóstico
        </button>
      </div>
    </div>
  );

  const renderDiagnosis = () => {
    if (!results) return null;
    if ('error' in results) return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center space-y-4">
        <AlertCircle className="mx-auto text-red-500" size={48} />
        <h3 className="text-xl font-bold text-red-700">Ops! Algo deu errado.</h3>
        <p className="text-red-600">{results.error}</p>
        <button 
          onClick={() => setStep('FILL_FORM')}
          className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
        >
          Corrigir Dados
        </button>
      </div>
    );

    const formattedOrcamento = scenario === 'BUDGET_TO_EFFORT' 
      ? formatCurrency(results.orcamento)
      : formatCurrency(parseFloat(results.orcamentoNecessario!));

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep('FILL_FORM')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Seu Diagnóstico de Viabilidade</h2>
        </div>

        <div className={`p-8 md:p-10 rounded-3xl border-2 transition-all ${
          results.inviavel ? 'bg-red-50 border-red-100' : 'bg-white border-gray-50 shadow-xl shadow-gray-100'
        }`}>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl ${results.inviavel ? 'bg-red-100 text-red-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
                {results.inviavel ? <AlertCircle size={32} /> : <TrendingUp size={32} />}
              </div>
              <div className="space-y-4">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  {scenario === 'BUDGET_TO_EFFORT' ? (
                    <>
                      Para cobrir o seu investimento de <span className="font-bold text-brand-blue">{formattedOrcamento}</span>, 
                      sua campanha vai gerar cerca de <span className="font-bold">{results.leads} oportunidades</span> (leads).
                      <br /><br />
                      O seu único esforço será transformar <span className="font-bold">{results.vendasPE} dessas oportunidades</span> em clientes reais. 
                      Isso significa que você precisa fechar negócio com apenas <span className={`font-bold ${results.inviavel ? 'text-red-600' : 'text-green-600'}`}>{results.txVendasExigida}%</span> das pessoas que te procurarem, para que o lucro pague o investimento na campanha.
                    </>
                  ) : (
                    <>
                      Para alcançar a sua meta de <span className="font-bold text-green-600">{results.clientesMeta} novos clientes</span>, 
                      você precisará investir cerca de <span className="font-bold text-brand-blue">{formattedOrcamento}</span> na sua campanha.
                      <br /><br />
                      Com esse valor, seus anúncios vão atrair aproximadamente <span className="font-bold">{results.leads} oportunidades (leads)</span>. 
                      Na prática, isso significa que você estará pagando <span className="font-bold text-brand-blue">{formatCurrency(parseFloat(results.cac!))}</span> para conquistar cada novo cliente (este é o seu custo de aquisição).
                    </>
                  )}
                </p>
                
                {scenario === 'GOAL_TO_INVESTMENT' && (
                  <div className="flex items-start gap-2 p-4 bg-brand-blue/10 rounded-2xl border border-brand-blue/20 text-brand-dark text-sm">
                    <Lightbulb className="text-brand-blue" size={18} />
                    <p>
                      <span className="font-bold">Dica de Ouro:</span> Para essa campanha valer a pena, o seu lucro livre a cada venda precisa ser maior do que esses <span className="font-bold">{formatCurrency(parseFloat(results.cac!))}</span>!
                    </p>
                  </div>
                )}

                <p className={`font-bold flex items-center gap-2 ${results.inviavel ? 'text-red-700' : 'text-green-700'}`}>
                  {results.inviavel 
                    ? "⚠️ Este cenário é arriscado. A taxa de fechamento exigida é muito alta para padrões comuns de mercado." 
                    : "✅ Este é um cenário viável e saudável para o seu negócio!"}
                </p>
              </div>
            </div>

            {/* Accordion: Raio-X do Lucro / Investimento */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setIsXrayOpen(!isXrayOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <Calculator size={18} className="text-brand-blue" />
                  {scenario === 'BUDGET_TO_EFFORT' ? 'Ver Raio-X do Lucro' : 'Ver Raio-X do Investimento'}
                </div>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isXrayOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isXrayOpen && (
                <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-3 animate-in slide-in-from-top-2 duration-300">
                  {scenario === 'BUDGET_TO_EFFORT' ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Preço de Venda (Ticket Médio)</span>
                        <span className="font-bold text-gray-700">
                          {formatCurrency(results.ticketMedio)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Custo da Operação (Variável)</span>
                        <span className="font-bold text-red-500">
                          - {formatCurrency(results.custoVariavel)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-700 font-bold">Lucro Real por Venda</span>
                        <span className="font-black text-green-600">
                          = {formatCurrency(results.margemContribuicao)}
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-white/50 rounded-xl text-[11px] text-gray-500 leading-relaxed italic">
                        <span className="font-bold text-gray-600">A Conta Final:</span> {formattedOrcamento} (Seu Orçamento) ÷ {formatCurrency(results.margemContribuicao)} (Seu Lucro Real) = <span className="font-bold text-brand-blue">{results.vendasPE}</span> Vendas Necessárias
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sua Meta de Clientes</span>
                        <span className="font-bold text-gray-700">{results.clientesMeta}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Oportunidades (Leads) Necessárias</span>
                        <span className="font-bold text-gray-700">
                          {results.leads} <span className="text-[10px] font-normal text-gray-400">(Taxa de fechamento: {results.taxaFechamento}%)</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Cliques Necessários no Anúncio</span>
                        <span className="font-bold text-gray-700">
                          {results.visitantes} <span className="text-[10px] font-normal text-gray-400">(Conversão do site: {results.taxaConversaoLP}%)</span>
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-white/50 rounded-xl text-[11px] text-gray-500 leading-relaxed italic border-t border-gray-200">
                        <span className="font-bold text-gray-600">A Conta Final:</span> {results.visitantes} Cliques x {formatCurrency(results.cpc)} (Custo por Clique) = <span className="font-bold text-brand-blue">{formattedOrcamento}</span> de Investimento
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <span className="block text-[10px] text-gray-400 font-black uppercase mb-1">Visitantes</span>
                <span className="text-xl font-bold text-gray-800">{results.visitantes}</span>
              </div>
              <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <span className="block text-[10px] text-gray-400 font-black uppercase mb-1">Leads (Oportunidades)</span>
                <span className="text-xl font-bold text-gray-800">{results.leads}</span>
              </div>
              {scenario === 'GOAL_TO_INVESTMENT' && (
                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <span className="block text-[10px] text-gray-400 font-black uppercase mb-1">ROI Est. (Margem)</span>
                  <span className={`text-xl font-bold ${parseFloat(results.roi!) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {results.roi}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-brand-blue/10 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-blue/5">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-xl font-bold text-brand-blue">Transforme seus anúncios em clientes reais.</h4>
            <p className="text-gray-500 text-sm">Elimine a fricção entre o investimento em marketing e o fechamento da venda com o Unum People CRM.</p>
          </div>
          <a 
            href="https://unumpeople.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-4 bg-brand-blue text-white font-black rounded-xl hover:bg-opacity-90 hover:scale-105 transition-all whitespace-nowrap shadow-lg shadow-brand-blue/20 inline-block text-center"
          >
            CONHECER UNUM PEOPLE CRM
          </a>
        </div>

        <button 
          onClick={() => {
            setStep('CHOOSE_PATH');
            setFormData(INITIAL_FORM_DATA);
            setIsXrayOpen(false);
          }}
          className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
        >
          RECOMEÇAR SIMULAÇÃO
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      <Header 
        onOpenHelp={() => setIsHelpOpen(true)}
        toolName="Calculadora de Viabilidade"
      />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="text-brand-blue" size={20} />
                <h1 className="text-xl font-black brand-gradient-text uppercase tracking-tighter">
                  Viabilidade de Campanha
                </h1>
              </div>
              <p className="text-brand-grey text-xs font-bold uppercase tracking-widest opacity-70">
                Projeção de ROI e CAC
              </p>
            </div>
            
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s}
                  className={`h-1 w-8 rounded-full transition-all ${
                    (s === 1 && step === 'CHOOSE_PATH') || 
                    (s === 2 && step === 'FILL_FORM') || 
                    (s === 3 && step === 'DIAGNOSIS')
                      ? 'brand-gradient w-12' 
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </header>

          <section className="min-h-[400px]">
            {step === 'CHOOSE_PATH' && renderStep1()}
            {step === 'FILL_FORM' && renderStep2()}
            {step === 'DIAGNOSIS' && renderDiagnosis()}
          </section>

          <AdUnit className="mb-8" slot="1270666901" />

          {children}
        </div>
      </main>

      <AdUnit className="mb-8" slot="7715444307" />

      <WelcomeModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Guia de Viabilidade"
        description="Entenda como planejar suas campanhas de anúncios com base em dados reais da sua operação."
        icon={<TrendingUp size={24} />}
        customContent={renderHelpContent()}
      />

      <Footer />
    </div>
  );
}

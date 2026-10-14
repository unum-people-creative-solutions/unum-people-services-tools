'use client';

import React, { useState } from 'react';
import { useServices } from '../../hooks/useServices';
import { ServiceCharts } from '../../components/ServiceCharts';
import { ServiceList } from '../../components/ServiceList';
import { ServiceDrawer } from '../../components/ServiceDrawer';
import { WelcomeModal } from '../../components/WelcomeModal';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { AdUnit } from '../../components/AdUnit';
import { LayoutGrid } from 'lucide-react';

export default function PortfolioView({ children }: { children?: React.ReactNode }) {
  const { services, addService, removeService, isLoaded } = useServices();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const closeHelp = () => {
    setIsHelpOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/30">
      <Header 
        onOpenHelp={() => setIsHelpOpen(true)} 
        toolName="Ferramenta de Portfólio"
      />
      <WelcomeModal isOpen={isHelpOpen} onClose={closeHelp} />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LayoutGrid className="text-brand-blue" size={20} />
                <h1 className="text-xl font-black brand-gradient-text uppercase tracking-tighter">
                  Mapeamento Estratégico
                </h1>
              </div>
              <p className="text-brand-grey text-xs font-bold uppercase tracking-widest opacity-70">
                Análise de Escalabilidade e Rentabilidade
              </p>
            </div>
            
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="brand-gradient hover:opacity-90 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-widest"
            >
              Novo Serviço
            </button>
          </header>

          {!isLoaded ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-brand-blue/20 rounded-full mb-4"></div>
                <p className="text-brand-grey font-medium">Carregando portfólio...</p>
              </div>
            </div>
          ) : (
            <>
              <section className="space-y-10">
                <ServiceCharts 
                  services={services} 
                  highlightedId={highlightedId} 
                />
                
                <ServiceList 
                  services={services} 
                  onRemove={removeService} 
                  onHover={setHighlightedId}
                  onAddClick={() => setIsDrawerOpen(true)}
                />
              </section>

              <div className="bg-white border-2 border-brand-blue/10 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-brand-blue/5 mt-12 mb-6">
                <div className="space-y-2 text-center md:text-left">
                  <h4 className="text-xl font-bold text-brand-blue">Priorize o que realmente traz resultado.</h4>
                  <p className="text-gray-500 text-sm">O Unum People ajuda você a organizar seus serviços e focar na rentabilidade real da sua operação.</p>
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

              <AdUnit className="mb-8" slot="1270666901" />
            </>
          )}

          {children}
        </div>
      </main>

      <AdUnit className="mb-8" slot="7715444307" />

      <Footer />

      <ServiceDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSave={addService} 
      />
    </div>
  );
}

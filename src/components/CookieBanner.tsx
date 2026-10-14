'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('unum_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('unum_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-blue/10 p-3 rounded-xl text-brand-blue shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-brand-blue font-bold text-lg mb-1">
                Privacidade e Cookies
              </h3>
              <p className="text-brand-grey text-sm leading-relaxed max-w-2xl">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência e para exibir anúncios do Google, que podem ser personalizados. Seus dados estratégicos são armazenados localmente no seu dispositivo e não em nossos servidores. Ao continuar, você concorda com nossa{' '}
                <Link href="/privacidade#anuncios" className="text-brand-blue font-bold hover:underline">
                  Política de Privacidade
                </Link>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={accept}
              className="flex-1 md:flex-none bg-brand-blue hover:bg-brand-grey text-white px-8 py-3 rounded-lg font-bold transition-all text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-brand-blue/20"
            >
              Aceitar e Continuar
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-3 text-brand-grey hover:text-brand-blue transition-colors rounded-lg hover:bg-gray-50"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';

export function Footer() {
  return (
    <footer className="brand-gradient text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-white/10 pb-8 mb-8">
          <div>
            <a 
              href="https://unumpeople.com.br/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block hover:opacity-80 transition-opacity"
            >
              <h3 className="text-lg font-bold mb-2">Unum People</h3>
            </a>
            <p className="text-sm text-white/70 max-w-sm leading-relaxed mb-2">
              O caminho mais curto entre você e o seu cliente.
            </p>
          </div>
          <div className="flex md:justify-end">
            <a 
              href="https://unumpeople.com.br/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="relative w-12 h-12 brightness-0 invert">
                <Image 
                  src="/images/logo_simbolo.png" 
                  alt="Unum Simbolo" 
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>
              <div className="relative w-28 h-6 brightness-0 invert">
                <Image 
                  src="/images/logo_texto.png" 
                  alt="Unum People" 
                  fill
                  className="object-contain"
                  sizes="112px"
                />
              </div>
            </a>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/50 uppercase tracking-widest font-semibold">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p>© 2026 Unum People. Todos os direitos reservados.</p>
            <a href="https://unumpeople.com.br/sobre" className="hover:text-white transition-colors">Sobre</a>
            <a href="https://unumpeople.com.br/contato" className="hover:text-white transition-colors">Contato</a>
            <a href="https://unumpeople.com.br/termos" className="hover:text-white transition-colors">Termos</a>
            <a href="/privacidade" className="hover:text-white transition-colors">Privacidade</a>
          </div>
          <p>People to People (P2P) Ecosystem</p>
        </div>
      </div>
    </footer>
  );
}

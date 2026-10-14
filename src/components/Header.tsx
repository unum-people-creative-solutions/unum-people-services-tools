'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle } from 'lucide-react';

const FERRAMENTAS = [
  { nome: 'Portfólio', href: '/portfolio-analises' },
  { nome: 'Precificação', href: '/simulador-precificacao' },
  { nome: 'Viabilidade', href: '/calculadora-viabilidade' },
];

interface HeaderProps {
  onOpenHelp?: () => void;
  toolName?: string;
}

export function Header({ onOpenHelp, toolName }: HeaderProps) {
  const pathname = usePathname();

  return (
    <>
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-10">
              <Image 
                src="/images/logo_simbolo.png" 
                alt="Unum Simbolo" 
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
            <div className="relative w-32 h-8">
              <Image 
                src="/images/logo_texto.png" 
                alt="Unum People" 
                fill
                className="object-contain"
                sizes="128px"
              />
            </div>
          </Link>
        
          <nav className="flex items-center gap-4 md:gap-8">
            {onOpenHelp && (
              <button
                onClick={onOpenHelp}
                className="flex items-center gap-2 text-xs font-bold text-brand-grey hover:text-brand-blue uppercase tracking-widest transition-colors group"
              >
                <HelpCircle size={18} className="text-brand-grey group-hover:text-brand-blue transition-colors" />
                <span className="hidden sm:inline">Ajuda</span>
              </button>
            )}
            {toolName && (
              <>
                <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                <span className="hidden md:inline text-xs font-bold text-brand-grey uppercase tracking-widest border-b-2 border-brand-blue pb-1">
                  {toolName}
                </span>
              </>
            )}
          </nav>
        </div>
      </header>
      <nav aria-label="Ferramentas" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 overflow-x-auto whitespace-nowrap">
          {FERRAMENTAS.map((ferramenta) => {
            const atual = pathname === ferramenta.href;
            return (
              <Link
                key={ferramenta.href}
                href={ferramenta.href}
                aria-current={atual ? 'page' : undefined}
                className={`py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
                  atual ? 'text-brand-blue border-brand-blue' : 'text-brand-grey border-transparent hover:text-brand-blue'
                }`}
              >
                {ferramenta.nome}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

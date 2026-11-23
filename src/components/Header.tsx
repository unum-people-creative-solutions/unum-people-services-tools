import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  /** Páginas de ferramenta: mostra "Todas as ferramentas" abaixo do cabeçalho. */
  ferramenta?: boolean;
}

export function Header({ ferramenta = false }: HeaderProps) {
  return (
    <>
      <header className="bg-ui-canvas">
        <div className="mx-auto flex w-full max-w-[1120px] items-center px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5 text-white no-underline">
            <span aria-hidden="true" className="brand-gradient size-6 rounded-[7px]" />
            <span className="text-[15px] font-semibold md:text-base">
              Unum People <span className="font-normal text-ui-muted-on-canvas">Tools</span>
            </span>
          </Link>
        </div>
      </header>
      {ferramenta && (
        <div className="mx-auto w-full max-w-[640px] px-5 pt-5">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ui-brand-blue no-underline hover:text-ui-brand-purple"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Todas as ferramentas
          </Link>
        </div>
      )}
    </>
  );
}

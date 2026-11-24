import Image from 'next/image';
import Link from 'next/link';

const linkClasses = 'inline-flex min-h-11 items-center text-ui-muted no-underline hover:text-ui-brand-purple';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-ui-line bg-ui-bg">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-3 px-5 pb-7 pt-6 text-[13px] text-ui-muted">
        <a href="https://unumpeople.com.br/" className="inline-flex min-h-11 items-center self-start">
          <Image
            src="/images/logo_texto_compact.png"
            alt="Unum People"
            width={865}
            height={146}
            className="h-[22px] w-auto"
          />
        </a>
        <span>Seus dados ficam neste aparelho.</span>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-[18px] gap-y-2">
          <Link href="/privacidade" className={linkClasses}>Privacidade</Link>
          <a href="https://unumpeople.com.br/sobre" className={linkClasses}>Sobre a Unum People</a>
          <a href="https://unumpeople.com.br/contato" className={linkClasses}>Contato</a>
          <a href="https://unumpeople.com.br/termos" className={linkClasses}>Termos</a>
        </nav>
        <span>© 2026 Unum People</span>
      </div>
    </footer>
  );
}

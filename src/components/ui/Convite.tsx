interface ConviteProps {
  texto: string;
  link: string;
  href: string;
  /** Avisa o clique no link (medição de uso). */
  onClick?: () => void;
}

/** Uma linha de texto com um link. Sem cartão nem cor de destaque. */
export function Convite({ texto, link, href, onClick }: ConviteProps) {
  return (
    <p className="m-0 text-sm leading-[1.5] text-ui-muted">
      {texto}{' '}
      <a href={href} onClick={onClick} className="font-semibold text-ui-brand-blue no-underline hover:text-ui-brand-purple">
        {link}
      </a>
    </p>
  );
}

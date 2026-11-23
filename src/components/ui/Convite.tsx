interface ConviteProps {
  texto: string;
  link: string;
  href: string;
}

/** Uma linha de texto com um link. Sem cartão nem cor de destaque. */
export function Convite({ texto, link, href }: ConviteProps) {
  return (
    <p className="m-0 text-sm leading-[1.5] text-ui-muted">
      {texto}{' '}
      <a href={href} className="font-semibold text-ui-brand-blue no-underline hover:text-ui-brand-purple">
        {link}
      </a>
    </p>
  );
}

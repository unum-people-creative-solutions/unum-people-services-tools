import type { Metadata } from 'next';

// O título já traz o nome do site; `absolute` evita repetir o sufixo do template do layout raiz.
export const metadata: Metadata = {
  title: {
    absolute: 'Quais serviços compensam? Compare lucro e trabalho | Unum People Tools',
  },
  description:
    'Descubra quais serviços dão lucro e quais dão trabalho demais. Ferramenta grátis para MEI e autônomos, sem cadastro.',
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

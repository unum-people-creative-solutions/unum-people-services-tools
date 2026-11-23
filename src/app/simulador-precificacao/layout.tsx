import type { Metadata } from 'next';

// O título já traz o nome do site; `absolute` evita repetir o sufixo do template do layout raiz.
export const metadata: Metadata = {
  title: {
    absolute: 'Quanto cobrar pelo serviço — calculadora grátis | Unum People Tools',
  },
  description:
    'Descubra o menor preço que não dá prejuízo e quanto sobra no bolso. Calculadora grátis para MEI e autônomos, sem cadastro.',
};

export default function PrecificacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

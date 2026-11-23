import PrecificacaoView from './PrecificacaoView';
import { GuiaPrecificacao } from '../../components/guias/GuiaPrecificacao';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Quanto cobrar pelo serviço — calculadora grátis | Unum People Tools',
  },
  description:
    'Descubra o menor preço que não dá prejuízo e quanto sobra no bolso. Calculadora grátis para MEI e autônomos, sem cadastro.',
};

export default function Page() {
  return (
    <PrecificacaoView>
      <GuiaPrecificacao />
    </PrecificacaoView>
  );
}

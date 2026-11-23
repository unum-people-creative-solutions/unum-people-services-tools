import ViabilidadeView from './ViabilidadeView';
import { GuiaViabilidade } from '../../components/guias/GuiaViabilidade';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Vale a pena anunciar? Calculadora grátis de anúncio | Unum People Tools',
  },
  description:
    'Veja quantas vendas pagam o seu anúncio no Google ou no Instagram antes de gastar. Grátis, sem cadastro.',
};

export default function Page() {
  return (
    <ViabilidadeView>
      <GuiaViabilidade />
    </ViabilidadeView>
  );
}

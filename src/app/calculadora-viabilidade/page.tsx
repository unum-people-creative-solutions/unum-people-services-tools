import ViabilidadeView from './ViabilidadeView';
import { GuiaViabilidade } from '../../components/guias/GuiaViabilidade';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculadora de Viabilidade de Campanha (ROI/CAC)',
  description: 'Simule o retorno de investimento (ROI) e o custo de aquisição (CAC) de suas campanhas de anúncios antes de investir.',
};

export default function Page() {
  return (
    <ViabilidadeView>
      <GuiaViabilidade />
    </ViabilidadeView>
  );
}

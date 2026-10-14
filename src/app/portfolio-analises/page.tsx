import PortfolioView from './PortfolioView';
import { GuiaPortfolio } from '../../components/guias/GuiaPortfolio';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mapeamento Estratégico de Portfólio e Rentabilidade',
  description: 'Analise a escalabilidade e rentabilidade de seus serviços para focar no que realmente traz lucro para sua empresa.',
};

export default function Page() {
  return (
    <PortfolioView>
      <GuiaPortfolio />
    </PortfolioView>
  );
}

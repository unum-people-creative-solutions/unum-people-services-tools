import PortfolioView from './PortfolioView';
import { GuiaPortfolio } from '../../components/guias/GuiaPortfolio';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'Quais serviços compensam? Compare lucro e trabalho | Unum People Tools',
  },
  description:
    'Descubra quais serviços dão lucro e quais dão trabalho demais. Ferramenta grátis para MEI e autônomos, sem cadastro.',
};

export default function Page() {
  return (
    <PortfolioView>
      <GuiaPortfolio />
    </PortfolioView>
  );
}

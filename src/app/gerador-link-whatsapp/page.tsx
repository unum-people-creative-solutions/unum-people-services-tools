import type { Metadata } from 'next';
import LinkWhatsappView from './LinkWhatsappView';
import { GuiaLinkWhatsapp } from '../../components/guias/GuiaLinkWhatsapp';

// O título já traz o nome do site; `absolute` evita repetir o sufixo do template do layout raiz.
export const metadata: Metadata = {
  title: {
    absolute: 'Gerador de link do WhatsApp com mensagem, grátis | Unum People Tools',
  },
  description:
    'Crie grátis o link do seu WhatsApp com a mensagem já escrita. Não expira, sem cadastro e sem anúncio. Com QR code e prévia da conversa.',
};

export default function Page() {
  return (
    <LinkWhatsappView>
      <GuiaLinkWhatsapp />
    </LinkWhatsappView>
  );
}

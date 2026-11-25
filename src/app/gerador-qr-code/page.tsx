import type { Metadata } from 'next';
import QrCodeView from './QrCodeView';

export const metadata: Metadata = {
  title: {
    absolute: 'Gerador de QR Code grátis: Pix, WhatsApp, Instagram e Wi-Fi | Unum People Tools',
  },
  description:
    'Crie grátis o QR code do seu Pix, WhatsApp, Instagram, Wi-Fi e mais. Nunca expira, sem cadastro e sem anúncio. Pronto no celular.',
};

export default function Page() {
  return <QrCodeView />;
}

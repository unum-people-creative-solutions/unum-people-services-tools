import type { Metadata } from 'next';

// O título já traz o nome do site; `absolute` evita repetir o sufixo do template do layout raiz.
export const metadata: Metadata = {
  title: {
    absolute: 'Gerador de QR Code grátis: Pix, WhatsApp, Instagram e Wi-Fi | Unum People Tools',
  },
  description:
    'Crie grátis o QR code do seu Pix, WhatsApp, Instagram, Wi-Fi e mais. Nunca expira, sem cadastro e sem anúncio. Pronto no celular.',
};

export default function GeradorQrCodeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

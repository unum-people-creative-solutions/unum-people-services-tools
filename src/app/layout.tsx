import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { CookieBanner } from '../components/CookieBanner';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tools.unumpeople.com.br'),
  title: {
    default: 'Unum People Tools | Ferramentas de Estratégia',
    template: '%s | Unum People Tools',
  },
  description: 'Ecossistema de ferramentas estratégicas da Unum People Creative Solutions para análise e otimização de negócios.',
  keywords: ['estratégia', 'negócios', 'calculadora de roi', 'precificação', 'análise de portfólio', 'unum people'],
  authors: [{ name: 'Unum People' }],
  creator: 'Unum People',
  publisher: 'Unum People',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://tools.unumpeople.com.br',
    siteName: 'Unum People Tools',
    title: 'Unum People Tools | Inteligência Estratégica',
    description: 'Ferramentas profissionais para análise de viabilidade, precificação e portfólio.',
    images: [
      {
        url: '/images/logo_texto.png',
        width: 1200,
        height: 630,
        alt: 'Unum People Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unum People Tools',
    description: 'Inteligência estratégica para o seu negócio.',
    images: ['/images/logo_texto.png'],
  },
  other: {
    'google-adsense-account': 'ca-pub-6348382549206741',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'Unum People',
  'url': 'https://tools.unumpeople.com.br',
  'logo': 'https://tools.unumpeople.com.br/images/logo_simbolo.png',
  'sameAs': [
    'https://www.instagram.com/unumpeople',
    'https://www.linkedin.com/company/unumpeople',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6348382549206741"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${poppins.variable} font-sans antialiased bg-brand-white`} suppressHydrationWarning>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}

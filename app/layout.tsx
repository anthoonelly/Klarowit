import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Klarowit · transkrypcja → dokumentacja',
  description:
    'Wgraj transkrypcję spotkania projektowego, otrzymaj profesjonalne dokumenty: opis projektu, dokumentację B+R, kosztorys, harmonogram i więcej.',
  keywords: [
    'B+R',
    'badania i rozwój',
    'dokumentacja projektowa',
    'AI',
    'transkrypcja',
    'art. 4a CIT',
  ],
  authors: [{ name: 'Klarowit' }],
  openGraph: {
    title: 'Klarowit',
    description: 'Z transkrypcji spotkania projektowego do gotowych dokumentów.',
    type: 'website',
    locale: 'pl_PL',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#F4F0E8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" data-theme="light" data-accent="amber" data-serif="instrument" data-density="comfortable">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

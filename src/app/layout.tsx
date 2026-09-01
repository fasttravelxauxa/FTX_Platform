import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#2A9524',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://fast-travel-xauxa.vercel.app'),
  title: {
    default: 'Fast Travel Xauxa | Transporte Ejecutivo y Turístico Oficial',
    template: '%s | Fast Travel Xauxa',
  },
  description: 'Servicio exclusivo de transporte ejecutivo, corporativo y turístico en el Valle del Mantaro. Conexión directa Aeropuerto Jauja ↔ Huancayo, Tarma, La Oroya y Selva Central. Máxima puntualidad, unidades SUV modernas y facturación electrónica oficial.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/images/banners/auto_sinfondo.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/images/banners/auto_sinfondo.png',
    apple: '/images/banners/auto_sinfondo.png',
  },
  keywords: [
    'Fast Travel Xauxa',
    'Transporte Aeropuerto Jauja',
    'Traslados Aeropuerto Jauja Huancayo',
    'Taxi Ejecutivo Huancayo Jauja',
    'Transporte Turistico Valle del Mantaro',
    'Servicio Privado SUV Jetour Jauja',
    'Facturacion Electronica Transporte Jauja',
    'Traslado Tarma La Oroya Selva Central',
  ],
  authors: [{ name: 'Fast Travel Xauxa' }],
  creator: 'Fast Travel Xauxa',
  publisher: 'Fast Travel Xauxa',
  openGraph: {
    title: 'Fast Travel Xauxa | Transporte Ejecutivo y Turístico Oficial',
    description: 'Plataforma oficial de reservas para traslados ejecutivos y turísticos en el Valle del Mantaro. Puntualidad garantizada, confort en unidades SUV modernas y facturación electrónica.',
    url: 'https://fast-travel-xauxa.vercel.app',
    siteName: 'Fast Travel Xauxa',
    images: [
      {
        url: '/images/banners/banner1.png',
        width: 1200,
        height: 630,
        alt: 'Fast Travel Xauxa - Transporte Ejecutivo y Turístico',
      },
      {
        url: '/images/banners/auto_sinfondo.png',
        width: 800,
        height: 600,
        alt: 'Unidad Ejecutiva Fast Travel Xauxa',
      },
    ],
    locale: 'es_PE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fast Travel Xauxa | Transporte Ejecutivo y Turístico Oficial',
    description: 'Traslados seguros, confortables y puntuales desde y hacia el Aeropuerto de Jauja, Huancayo y todo el Valle del Mantaro.',
    images: ['/images/banners/banner1.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <head>
        <Script id="ftx-theme" strategy="beforeInteractive">{`
          try {
            const savedTheme = localStorage.getItem('ftx_theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark', savedTheme === 'dark' || (!savedTheme && prefersDark));
          } catch (_) {}
        `}</Script>
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-crusoe-600 selection:text-white transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}

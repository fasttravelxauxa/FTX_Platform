import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
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
  title: 'Fast Travel Xauxa — Traslados Ejecutivos Aeropuerto Jauja ↔ Huancayo',
  description: 'Plataforma digital de transporte privado, traslados compartidos al Aeropuerto de Jauja por S/20, excursiones turísticas y renta por horas con SUV Jetour. Emitimos Boletas y Facturas Electrónicas.',
  manifest: '/manifest.json',
  keywords: [
    'Aeropuerto de Jauja',
    'transporte Jauja Huancayo',
    'traslado aeropuerto Jauja',
    'transporte privado Jauja',
    'turismo Valle del Mantaro',
    'Fast Travel Xauxa',
    'SUV Jetour Huancayo',
    'factura electronica Jauja',
  ],
  authors: [{ name: 'Fast Travel Xauxa' }],
  openGraph: {
    title: 'Fast Travel Xauxa — Traslados Ejecutivos Jauja ↔ Huancayo',
    description: 'Reserva tu transporte privado o compartido con 50% de adelanto. Confort, puntualidad y recepción personalizada en aeropuerto. Boletas y Facturas Electrónicas.',
    url: 'https://fasttravelxauxa.vercel.app',
    siteName: 'Fast Travel Xauxa',
    locale: 'es_PE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-crusoe-50 font-sans text-crusoe-950 antialiased selection:bg-crusoe-300 selection:text-crusoe-950">
        {children}
      </body>
    </html>
  );
}

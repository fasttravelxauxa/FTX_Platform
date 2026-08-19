import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-crusoe-700 dark:text-crusoe-400 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver al Inicio
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-xl space-y-6 text-slate-900 dark:text-slate-100 text-sm leading-relaxed">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-crusoe-700 dark:text-crusoe-400">Documento Legal</span>
            <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">Política de Privacidad y Datos Personales</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Versión 1.0 — Ley N° 29733 de Protección de Datos Personales (Perú)</p>
          </div>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">1. Datos Recopilados</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Fast Travel Xauxa recopila datos de identificación estrictamente necesarios para la prestación del servicio de transporte: Nombre completo, número de DNI, teléfono de contacto (WhatsApp), correo electrónico opcional, aerolínea y comprobantes de pago.
          </p>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">2. Finalidad del Tratamiento</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Los datos personales serán utilizados exclusivamente para gestionar la reserva del traslado, verificar el adelanto del pago, emitir el cartel de recepción en aeropuerto y establecer comunicación operativa vía WhatsApp.
          </p>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">3. Seguridad de Comprobantes</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Los vouchers y comprobantes adjuntados por los pasajeros se almacenan en repositorios privados con acceso exclusivo para el administrador y no se publican en internet.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

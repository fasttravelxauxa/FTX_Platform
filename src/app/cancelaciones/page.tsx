import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function CancellationPage() {
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
            <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">Política de Cancelación y Reembolsos</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Versión 1.0 — Regla Comercial 60 Minutos</p>
          </div>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">1. Ventana de Cancelación con Reembolso (60 Minutos)</h2>
          <p className="text-slate-700 dark:text-slate-300">
            El pasajero tiene derecho a cancelar su reserva y solicitar la devolución del <strong>100% de su adelanto</strong> siempre que la cancelación se registre dentro de los <strong>60 minutos posteriores a la creación de la reserva</strong>.
          </p>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">2. Cancelación fuera del plazo</h2>
          <p className="text-slate-700 dark:text-slate-300">
            En caso de cancelaciones solicitadas posterior a los 60 minutos o el mismo día del servicio sin causa justificada, el adelanto del 20% podrá retenerse para cubrir los costos de reserva de unidad y conductor programado.
          </p>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">3. Regla de No-Show en Aeropuerto</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Si el pasajero no se presenta en el aeropuerto transcurridos los 30 minutos de tolerancia tras el aterrizaje verificado y no mantiene contacto vía WhatsApp, la reserva podrá ser registrada como <strong>NO_SHOW</strong>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

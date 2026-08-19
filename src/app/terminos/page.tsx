import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
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
            <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">Términos y Condiciones del Servicio</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Versión 1.0 — Fast Travel Xauxa</p>
          </div>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">1. Descripción del Servicio</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Fast Travel Xauxa es una plataforma digital de gestión de traslados ejecutivos privados, traslados compartidos aeroportuarios, excursiones turísticas y renta por horas con conductor en la ruta Aeropuerto de Jauja ↔ Huancayo, Tarma, La Oroya, La Merced y el Valle del Mantaro.
          </p>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">2. Modelo de Reserva y Adelanto del 20%</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Para garantizar la reserva de la camioneta SUV Jetour X70 FL (2027) o auto de 4 pasajeros y la asignación del conductor, el usuario puede realizar el pago de un adelanto equivalente al <strong>20% del valor total de la cotización</strong> mediante Yape o Plin. El 80% restante será abonado al momento de abordar el vehículo. Si reserva sin pago, deberá pagar el adelanto antes de la hora programada.
          </p>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">3. Tolerancia y Recepción Aeroportuaria</h2>
          <p className="text-slate-700 dark:text-slate-300">
            En traslados con origen en el Aeropuerto Francisco Carlé de Jauja, la tolerancia de espera estándar es de <strong>30 minutos</strong> posteriores a la hora real de aterrizaje del vuelo.
          </p>

          <h2 className="text-base font-bold text-slate-950 dark:text-white">4. Accesibilidad y Condiciones Operativas</h2>
          <p className="text-slate-700 dark:text-slate-300">
            Si la ruta especificada presenta vías no pavimentadas en mal estado extremo o peligro manifiesto para la seguridad del vehículo y ocupantes, el operador podrá coordinar la finalización del tramo en una zona pavimentada segura cercana o modificar la cotización previa información al pasajero.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

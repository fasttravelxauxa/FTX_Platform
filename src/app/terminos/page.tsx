import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-crusoe-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-crusoe-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver al Inicio
          </Link>
        </div>

        <div className="rounded-3xl border border-crusoe-200 bg-white p-8 sm:p-12 shadow-xl space-y-6 text-crusoe-950 text-sm leading-relaxed">
          <div className="border-b border-crusoe-200 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-crusoe-700">Documento Legal</span>
            <h1 className="text-3xl font-extrabold text-crusoe-950 mt-1">Términos y Condiciones del Servicio</h1>
            <p className="text-xs text-crusoe-800 mt-1">Versión 1.0 — Aprobado Agosto 2026</p>
          </div>

          <h2 className="text-base font-bold text-crusoe-900">1. Descripción del Servicio</h2>
          <p>
            travelFastXauxa es una plataforma digital de gestión de traslados ejecutivos privados, traslados compartidos aeroportuarios, excursiones turísticas y renta por horas con conductor en la ruta Aeropuerto de Jauja ↔ Huancayo y el Valle del Mantaro.
          </p>

          <h2 className="text-base font-bold text-crusoe-900">2. Modelo de Reserva y Adelanto del 50%</h2>
          <p>
            Para garantizar la reserva de la camioneta SUV Jetour y la asignación del conductor, el usuario debe realizar el pago de un adelanto equivalente al <strong>50% del valor total de la cotización</strong> mediante Yape, Plin o Transferencia BCP y adjuntar la imagen del comprobante válido. El 50% restante será pagado al abordar el vehículo.
          </p>

          <h2 className="text-base font-bold text-crusoe-900">3. Tolerancia y Recepción Aeroportuaria</h2>
          <p>
            En traslados con origen en el Aeropuerto Francisco Carlé de Jauja, la tolerancia de espera estándar es de <strong>30 minutos</strong> posteriores a la hora real de aterrizaje del vuelo.
          </p>

          <h2 className="text-base font-bold text-crusoe-900">4. Accesibilidad y Condiciones Operativas</h2>
          <p>
            Si la ruta especificada presenta vías no pavimentadas en mal estado extremo o peligro manifiesto para la seguridad del vehículo y ocupantes, el operador podrá coordinar la finalización del tramo en una zona pavimentada segura cercana o modificar la cotización previa información al pasajero.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

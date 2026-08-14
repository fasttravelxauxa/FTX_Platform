import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function CancellationPage() {
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
            <h1 className="text-3xl font-extrabold text-crusoe-950 mt-1">Política de Cancelación y Reembolsos</h1>
            <p className="text-xs text-crusoe-800 mt-1">Versión 1.0 — Regla Comercial 60 Minutos</p>
          </div>

          <h2 className="text-base font-bold text-crusoe-900">1. Ventana de Cancelación con Reembolso (60 Minutos)</h2>
          <p>
            El pasajero tiene derecho a cancelar su reserva y solicitar la devolución del <strong>100% de su adelanto</strong> siempre que la cancelación se registre dentro de los <strong>60 minutos posteriores a la creación de la reserva</strong>.
          </p>

          <h2 className="text-base font-bold text-crusoe-900">2. Cancelación fuera del plazo</h2>
          <p>
            En caso de cancelaciones solicitadas posterior a los 60 minutos o el mismo día del servicio sin causa justificada, el adelanto del 50% podrá retenerse para cubrir los costos de reserva de unidad y conductor programado.
          </p>

          <h2 className="text-base font-bold text-crusoe-900">3. Regla de No-Show en Aeropuerto</h2>
          <p>
            Si el pasajero no se presenta en el aeropuerto transcurridos los 30 minutos de tolerancia tras el aterrizaje verificado y no mantiene contacto vía WhatsApp, la reserva podrá ser registrada como <strong>NO_SHOW</strong>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RepositoryService } from '@/lib/services/repository';
import { Reservation } from '@/lib/types';

export default function ReceptionPosterPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || '';

  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (code) {
      RepositoryService.getReservationByCode(code).then((res) => {
        if (res) {
          setReservation(res);
        }
      });
    }
  }, [code]);

  const handlePrint = () => {
    window.print();
  };

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-sm font-bold text-crusoe-900">Cargando datos del cartel...</p>
        </div>
      </div>
    );
  }

  const title = reservation.customer?.title_degree || 'Sr.(a)';
  const fullName = reservation.customer?.full_name || 'PASAJERO VIP';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Control bar for screen display */}
      <div className="no-print bg-crusoe-950 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button size="sm" variant="ghost" className="text-white hover:bg-crusoe-800">
              <ArrowLeft className="h-4 w-4" />
              Volver al Panel Admin
            </Button>
          </Link>
          <span className="text-xs font-semibold text-crusoe-300">
            Vista Previa del Cartel de Recepción Aeroportuaria ({reservation.code})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handlePrint} className="bg-crusoe-500 hover:bg-crusoe-400 text-crusoe-950 font-bold">
            <Printer className="h-4 w-4" />
            Imprimir / Guardar como PDF
          </Button>
        </div>
      </div>

      {/* Printable Area - Optimized for A4 Landscape / High Contrast */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="print-area w-full max-w-4xl bg-white border-8 border-crusoe-950 p-12 text-center rounded-3xl shadow-2xl space-y-12 flex flex-col justify-between my-auto">
          {/* Header */}
          <div className="space-y-2 border-b-4 border-crusoe-950 pb-8">
            <span className="text-2xl font-black uppercase tracking-widest text-crusoe-700">
              SERVICIO EJECUTIVO AEROPORTUARIO
            </span>
            <h1 className="text-6xl font-black tracking-tight text-crusoe-950 font-sans">
              FAST TRAVEL <span className="text-crusoe-600">XAUXA</span>
            </h1>
          </div>

          {/* Passenger Title & Name */}
          <div className="space-y-4 py-8">
            <span className="text-4xl font-extrabold uppercase tracking-wider text-crusoe-800 block">
              {title}
            </span>
            <h2 className="text-6xl sm:text-7xl font-black uppercase tracking-tight text-black leading-none font-sans">
              {fullName}
            </h2>
          </div>

          {/* Footer Metadata */}
          <div className="border-t-4 border-crusoe-950 pt-8 flex items-center justify-between text-base font-bold text-crusoe-900">
            <span>AEROPUERTO DE JAUJA (JAU)</span>
            <span>VUELO: {reservation.flight_airline || 'OFICIAL'} {reservation.flight_number || ''}</span>
            <span>
              {reservation.service_id === 'a2222222-2222-2222-2222-222222222222'
                ? `COMPARTIDO (${reservation.passengers_count || 1} ASIENTO${(reservation.passengers_count || 1) > 1 ? 'S' : ''})`
                : 'SUV JETOUR EXCLUSIVO'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

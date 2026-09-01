'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RepositoryService } from '@/lib/services/repository';
import { Reservation } from '@/lib/types';
import { BUSINESS_CONFIG } from '@/lib/constants';

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
          <p className="text-sm font-bold text-slate-800">Cargando datos del cartel...</p>
        </div>
      </div>
    );
  }

  // Obtener datos del cliente y sanitizar para evitar doble tipeo del grado
  const rawTitle = (reservation.customer?.title_degree || 'Sr.(a)').trim();
  const rawName = (reservation.customer?.full_name || 'PASAJERO VIP').trim();

  // Limpiar posibles títulos duplicados que el usuario haya escrito dentro de full_name
  const cleanName = rawName
    .replace(/^(sr\.?|sra\.?|srta\.?|ing\.?|dr\.?|dra\.?|lic\.?|mg\.?|don|doña)\s+/i, '')
    .trim();

  const displayTitle = rawTitle;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Control bar for screen display */}
      <div className="no-print bg-slate-950 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button size="sm" variant="ghost" className="text-white hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
              Volver al Panel Admin
            </Button>
          </Link>
          <span className="text-xs font-semibold text-slate-300">
            Vista Previa del Cartel de Recepción Aeroportuaria ({reservation.code})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handlePrint} className="bg-crusoe-500 hover:bg-crusoe-400 text-slate-950 font-bold shadow-md">
            <Printer className="h-4 w-4" />
            Imprimir / Guardar como PDF
          </Button>
        </div>
      </div>

      {/* Printable Area - Optimized for A4 Landscape / Maximum Contrast */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="print-area w-full max-w-4xl bg-white border-8 border-slate-950 p-8 sm:p-12 text-center rounded-3xl shadow-2xl space-y-8 flex flex-col justify-between my-auto min-h-[500px]">
          {/* Header con Logo Principal Yomyl y Nombre de la Web / URL como secundario */}
          <div className="flex flex-col items-center justify-center space-y-3 border-b-4 border-slate-950 pb-6">
            <div className="relative h-24 sm:h-32 w-auto max-w-full flex items-center justify-center">
              <img
                src="/images/yomil-removebg-preview.png"
                alt="Empresa de Transportes y Turismo Jomyl"
                className="max-h-24 sm:max-h-32 w-auto object-contain mx-auto drop-shadow-sm"
              />
            </div>

            <div className="space-y-0.5 pt-1">
              <span className="text-lg sm:text-2xl font-black uppercase tracking-widest text-slate-950 font-sans block">
                FAST TRAVEL <span className="text-crusoe-700">XAUXA</span>
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-600 tracking-wider block font-mono">
                {BUSINESS_CONFIG.domain || 'www.fasttravelxauxa.com'}
              </span>
            </div>
          </div>

          {/* Passenger Title & Clean Name (Sin doble tipeo) */}
          <div className="space-y-2 py-6 my-auto">
            <span className="text-2xl sm:text-3xl font-extrabold uppercase tracking-widest text-crusoe-800 block font-sans">
              {displayTitle}
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-slate-950 leading-tight font-sans">
              {cleanName}
            </h1>
          </div>

          {/* Footer Metadata (Solo información prioritaria sin tipo de unidad) */}
          <div className="border-t-4 border-slate-950 pt-6 flex items-center justify-between text-sm sm:text-base font-extrabold text-slate-900">
            <span>AEROPUERTO FRANCISCO CARLÉ — JAUJA (JAU)</span>
            {reservation.flight_airline && (
              <span>VUELO: {reservation.flight_airline} {reservation.flight_number ? `(${reservation.flight_number})` : ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

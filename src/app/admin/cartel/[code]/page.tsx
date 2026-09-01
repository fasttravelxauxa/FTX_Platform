'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
      {/* Estilos Globales para Impresión 100% Horizontal A4 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0mm !important;
          }
          html, body {
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .poster-root {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            min-height: 100vh !important;
            height: 100vh !important;
            width: 100vw !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .print-area {
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            border: 10px solid #020617 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 10mm 15mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .passenger-title {
            font-size: 28pt !important;
            line-height: 1.1 !important;
          }
          .passenger-name {
            font-size: 56pt !important;
            line-height: 1.05 !important;
          }
          .poster-logo {
            max-height: 30mm !important;
          }
        }
      `}</style>

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
            Cartel de Recepción Aeroportuaria ({reservation.code}) — Configurado para A4 Horizontal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handlePrint} className="bg-crusoe-500 hover:bg-crusoe-400 text-slate-950 font-bold shadow-md">
            <Printer className="h-4 w-4" />
            Imprimir / Guardar en PDF (A4 Horizontal)
          </Button>
        </div>
      </div>

      {/* Printable Area - Optimized for A4 Landscape / Maximum Contrast */}
      <div className="poster-root flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="print-area w-full max-w-5xl bg-white border-8 sm:border-[10px] border-slate-950 p-6 sm:p-10 md:p-12 text-center rounded-3xl shadow-2xl space-y-6 flex flex-col justify-between my-auto min-h-[580px]">
          
          {/* Header con Logo Principal Yomyl y Nombre de la Web / URL como secundario */}
          <div className="flex flex-col items-center justify-center space-y-2.5 border-b-4 border-slate-950 pb-5">
            <div className="relative h-20 sm:h-28 md:h-32 w-auto max-w-full flex items-center justify-center">
              <img
                src="/images/yomil-removebg-preview.png"
                alt="Empresa de Transportes y Turismo Jomyl"
                className="poster-logo max-h-20 sm:max-h-28 md:max-h-32 w-auto object-contain mx-auto drop-shadow-sm"
              />
            </div>

            <div className="space-y-0.5">
              <span className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-widest text-slate-950 font-sans block">
                FAST TRAVEL <span className="text-crusoe-700">XAUXA</span>
              </span>
              <span className="text-[11px] sm:text-xs md:text-sm font-bold text-slate-600 tracking-wider block font-mono">
                {BUSINESS_CONFIG.domain}
              </span>
            </div>
          </div>

          {/* Passenger Title & Clean Name (MÁXIMA VISIBILIDAD DESDE LEJOS) */}
          <div className="space-y-2 py-4 sm:py-6 my-auto flex-1 flex flex-col justify-center">
            <span className="passenger-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-widest text-crusoe-800 block font-sans">
              {displayTitle}
            </span>
            <h1 className="passenger-name text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase tracking-tight text-slate-950 leading-[1.05] font-sans break-words drop-shadow-sm">
              {cleanName}
            </h1>
          </div>

          {/* Footer Metadata (Solo información prioritaria sin tipo de unidad) */}
          <div className="border-t-4 border-slate-950 pt-5 flex items-center justify-between text-xs sm:text-sm md:text-base font-extrabold text-slate-900">
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

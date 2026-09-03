'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, MessageSquare, PhoneCall, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { BUSINESS_CONFIG } from '@/lib/constants';

export function openUrgentContactModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-urgent-contact-modal'));
  }
}

export function UrgentContactModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-urgent-contact-modal', handleOpen);
    return () => window.removeEventListener('open-urgent-contact-modal', handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleGoToReservations = () => {
    setIsOpen(false);
    const cleanNumber = BUSINESS_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent('Hola Fast Travel Xauxa, me gustaría solicitar información y realizar una reserva.')}`, '_blank');
  };

  const handleContinueUrgent = () => {
    setIsOpen(false);
    const cleanNumber = (BUSINESS_CONFIG.urgentPaymentNumber || '+51929667586').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent('Hola, me comunico por un asunto urgente / validación de pago en servicio Fast Travel Xauxa.')}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Cerrar ventana"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 mb-3 shadow-inner">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Canal de Pagos y Atención Prioritaria
          </span>
          <h3 className="text-xl font-black text-slate-950 dark:text-white mt-1">
            Línea Especial: {BUSINESS_CONFIG.urgentPaymentFormatted || '929 667 586'}
          </h3>
        </div>

        {/* Informative Body */}
        <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200">
            <p className="font-semibold">
              Esta línea telefónica está destinada exclusivamente a la <strong>recepción de pagos Yape / Plin</strong> y a la asistencia de <strong>incidencias prioritarias o urgentes</strong> en traslados en curso. Solo se responderán mensajes de alta importancia.
            </p>
          </div>

          <p className="text-center font-medium">
            Para <strong>cotizaciones, itinerarios, consultas de flota y reservas nuevas</strong>, por favor comuníquese con nuestra Central Oficial de Reservas.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            size="lg"
            onClick={handleGoToReservations}
            className="w-full justify-center shadow-lg shadow-crusoe-600/20 font-bold text-xs sm:text-sm flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Contactar a Reservas e Informes (940 378 999)</span>
          </Button>

          <button
            onClick={handleContinueUrgent}
            className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Continuar de todos modos a Línea de Urgencia (929 667 586)
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { MapPin, ShieldCheck, X, Sparkles, FileCheck, CheckCircle2, HeartHandshake } from 'lucide-react';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('ftx_has_seen_welcome_v2');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('ftx_has_seen_welcome_v2', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-crusoe-300 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        
        {/* Decorative Top Banner */}
        <div className="bg-gradient-to-br from-crusoe-800 via-crusoe-700 to-crusoe-900 p-6 sm:p-7 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-crusoe-500/20 blur-2xl"></div>
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-crusoe-400/20 blur-2xl"></div>

          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-crusoe-700 shadow-xl mb-3 ring-4 ring-white/20">
            <Sparkles className="h-7 w-7 text-crusoe-600 animate-pulse" />
          </div>

          <span className="relative z-10 text-[11px] font-extrabold uppercase tracking-widest text-crusoe-200">
            Plataforma Ejecutiva Oficial
          </span>
          <h2 className="relative z-10 text-2xl font-extrabold text-white mt-1">
            ¡Bienvenido a Fast Travel Xauxa! ✈️
          </h2>
          <p className="relative z-10 text-xs text-crusoe-100/90 mt-1 max-w-xs">
            Tu traslado seguro, cómodo y puntual desde y hacia el Aeropuerto de Jauja.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs font-medium">
          {/* Scope notice */}
          <div className="rounded-2xl border border-crusoe-200 dark:border-crusoe-800/60 bg-crusoe-50/70 dark:bg-crusoe-950/50 p-3.5 flex items-start gap-3 text-left">
            <MapPin className="h-5 w-5 text-crusoe-600 dark:text-crusoe-400 shrink-0 mt-0.5" />
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-[11px]">
              Nuestra aplicación fue diseñada con estándares de excelencia para operar a <strong>nivel nacional</strong>, y actualmente se encuentra <strong>100% activa en el Valle del Mantaro</strong> (Jauja, Huancayo, Tarma, La Oroya y Selva Central).
            </p>
          </div>

          {/* Attention & Seriousness Recommendation Card */}
          <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/60 p-4 space-y-2 text-left shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-xs">
              <FileCheck className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Garantiza una Reserva Rápida, Segura y Exitosa</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-[11px]">
              Te recomendamos <strong>completar tus datos con precisión</strong> (nombres completos, DNI y número de WhatsApp activo). Esto nos permite preparar tu chofer, validar tu vuelo y tener tu cartel de bienvenida listo a tu llegada.
            </p>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1">
              <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">20%</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-semibold leading-tight">Adelanto para asegurar</span>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1">
              <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">30 Min</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-semibold leading-tight">Tolerancia en arribo</span>
            </div>
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1">
              <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">SUV 2027</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-semibold leading-tight">Confort y clima a bordo</span>
            </div>
          </div>

          {/* CTA Action */}
          <div className="pt-2">
            <Button
              size="lg"
              className="w-full text-sm font-extrabold py-3.5 shadow-lg shadow-crusoe-600/30 flex items-center justify-center gap-2"
              onClick={handleClose}
            >
              <HeartHandshake className="h-5 w-5" />
              ¡Entendido, Comenzar mi Reserva! 🚀
            </Button>
          </div>
        </div>

        {/* Close X */}
        <button 
          onClick={handleClose}
          aria-label="Cerrar modal de bienvenida"
          className="absolute top-4 right-4 text-white hover:text-slate-200 bg-black/25 hover:bg-black/45 rounded-full p-1.5 transition-colors z-20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

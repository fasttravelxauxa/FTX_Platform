'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { MapPin, ShieldCheck, X, Shield, FileCheck2, Car, ArrowRight } from 'lucide-react';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('ftx_has_seen_welcome_v3');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('ftx_has_seen_welcome_v3', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        
        {/* Decorative Top Banner */}
        <div className="bg-gradient-to-br from-crusoe-900 via-crusoe-800 to-crusoe-950 p-6 sm:p-7 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-crusoe-500/10 blur-2xl"></div>
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-crusoe-400/10 blur-2xl"></div>

          <div className="relative z-10 flex items-center justify-center p-2 rounded-2xl bg-white/95 shadow-xl mb-2.5 ring-4 ring-white/10 max-h-16">
            <img
              src="/images/yomil-removebg-preview.png"
              alt="Empresa de Transportes y Turismo Jomyl"
              className="h-12 w-auto object-contain"
            />
          </div>

          <span className="relative z-10 text-[11px] font-bold uppercase tracking-widest text-crusoe-300">
            Plataforma Ejecutiva Oficial
          </span>
          <h2 className="relative z-10 text-2xl font-extrabold text-white mt-0.5 tracking-tight">
            Fast Travel Xauxa
          </h2>
          <p className="relative z-10 text-xs text-crusoe-200 mt-1 max-w-xs font-medium">
            Operado por Empresa de Transportes y Turismo Jomyl — Servicio Turístico Nacional.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs font-medium">
          {/* Scope notice */}
          <div className="rounded-2xl border border-crusoe-200 dark:border-crusoe-900/60 bg-crusoe-50/70 dark:bg-crusoe-950/40 p-3.5 flex items-start gap-3 text-left">
            <MapPin className="h-5 w-5 text-crusoe-700 dark:text-crusoe-400 shrink-0 mt-0.5" />
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              Plataforma desarrollada para cobertura a <strong>nivel nacional</strong>, operando oficialmente en el <strong>Valle del Mantaro</strong> (Jauja, Huancayo, Tarma, La Oroya y Selva Central).
            </p>
          </div>

          {/* Attention & Seriousness Recommendation Card */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 p-4 space-y-2 text-left shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
              <FileCheck2 className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>Registro Seguro y Formal</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              Recomendamos <strong>ingresar sus datos completos y precisos</strong> (nombres completos, DNI y número de WhatsApp activo). Esto permite coordinar a su conductor asignado, validar su vuelo y garantizar su cartel de bienvenida a su arribo.
            </p>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1">
              <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">20%</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium leading-tight">Adelanto de reserva</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1">
              <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">30 Min</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium leading-tight">Tolerancia en arribo</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1">
              <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">SUV 2027</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-medium leading-tight">Confort ejecutivo</span>
            </div>
          </div>

          {/* CTA Action */}
          <div className="pt-2">
            <Button
              size="lg"
              className="w-full text-xs sm:text-sm font-bold py-3.5 shadow-md shadow-crusoe-700/20 flex items-center justify-center gap-2"
              onClick={handleClose}
            >
              <span>Entendido, Iniciar Reserva</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Close X */}
        <button 
          onClick={handleClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors z-20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { MapPin, ShieldCheck, X } from 'lucide-react';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('ftx_has_seen_welcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('ftx_has_seen_welcome', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        <div className="bg-crusoe-600 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-crusoe-800 to-transparent opacity-60"></div>
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white text-crusoe-700 shadow-lg mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="relative z-10 text-xl font-extrabold text-white">
            Plataforma Exclusiva Nacional
          </h2>
        </div>

        <div className="p-6 text-center space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Fast Travel Xauxa es una plataforma exclusiva creada para operar a nivel nacional. 
          </p>
          
          <div className="bg-crusoe-50 dark:bg-crusoe-950/40 border border-crusoe-200 dark:border-crusoe-800 rounded-xl p-4 flex items-center gap-3 text-left">
            <MapPin className="h-8 w-8 text-crusoe-600 shrink-0" />
            <p className="text-xs text-crusoe-900 dark:text-crusoe-200 font-semibold leading-relaxed">
              Actualmente, nuestro servicio está disponible y funcionando de manera oficial en el <strong>Valle del Mantaro</strong> (Jauja, Huancayo y rutas aledañas).
            </p>
          </div>

          <div className="pt-2">
            <Button size="lg" className="w-full" onClick={handleClose}>
              Entendido, continuar
            </Button>
          </div>
        </div>

        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-white hover:text-slate-200 bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors z-20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

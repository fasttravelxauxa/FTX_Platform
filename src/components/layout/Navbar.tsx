'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Car, Menu, X, MessageSquare, ShieldCheck, UserCheck, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { WhatsAppService } from '@/lib/services/whatsapp';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crusoe-600 text-white shadow-md shadow-crusoe-600/30 group-hover:scale-105 transition-transform">
            <Car className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950 dark:text-white font-sans">
              Fast Travel <span className="text-crusoe-600 dark:text-crusoe-400">Xauxa</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 dark:text-slate-400 tracking-wider uppercase -mt-1">
              Jauja ↔ Huancayo Ejecutivo
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden items-center gap-6 lg:flex">
          <Link
            href="/#servicios"
            className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-crusoe-600 dark:hover:text-crusoe-400 transition-colors whitespace-nowrap"
          >
            Servicios
          </Link>
          <Link
            href="/#como-funciona"
            className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-crusoe-600 dark:hover:text-crusoe-400 transition-colors whitespace-nowrap"
          >
            ¿Cómo funciona?
          </Link>
          <Link
            href="/#vehiculo"
            className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-crusoe-600 dark:hover:text-crusoe-400 transition-colors whitespace-nowrap"
          >
            SUV Jetour
          </Link>
          <Link
            href="/mis-reservas"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-crusoe-600 dark:hover:text-crusoe-400 transition-colors whitespace-nowrap"
          >
            <Calendar className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400" />
            Mis Reservas
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2.5 lg:flex shrink-0">
          <ThemeToggle />
          <Link
            href="/admin"
            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-crusoe-600 dark:hover:text-crusoe-400 px-2 py-1.5 transition-colors whitespace-nowrap"
          >
            Admin
          </Link>
          <a
            href={WhatsAppService.getCustomerSupportLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-crusoe-300 dark:border-slate-700 bg-crusoe-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-crusoe-900 dark:text-crusoe-300 hover:bg-crusoe-100 transition-colors shrink-0"
            title="Coordinación únicamente por mensajes de WhatsApp"
          >
            <MessageSquare className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400 shrink-0" />
            <span className="whitespace-nowrap">929 667 586</span>
          </a>
          <Link href="/reserva">
            <Button size="sm" className="shadow-md shadow-crusoe-600/20 whitespace-nowrap">
              Reservar Viaje
            </Button>
          </Link>
        </div>

        {/* Mobile Navigation Header Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Link href="/reserva">
            <Button size="sm" className="text-xs px-2.5 py-1.5 font-bold">
              Reservar
            </Button>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl p-2 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Abrir menú"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pb-6 pt-3 lg:hidden">
          <div className="flex flex-col gap-2.5 text-slate-900 dark:text-slate-100">
            <Link
              href="/#servicios"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Servicios Ejecutivos
            </Link>
            <Link
              href="/#como-funciona"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              ¿Cómo Funciona?
            </Link>
            <Link
              href="/#vehiculo"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              SUV Jetour Deluxe
            </Link>
            <Link
              href="/mis-reservas"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2"
            >
              <Calendar className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400" />
              Consultar Mi Reserva
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-3.5 py-2.5 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400" />
              Acceso Panel Admin
            </Link>
            <div className="pt-2">
              <a
                href={WhatsAppService.getCustomerSupportLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-crusoe-300 dark:border-slate-700 bg-crusoe-50 dark:bg-slate-900 py-3 text-xs font-bold text-crusoe-900 dark:text-crusoe-300"
              >
                <MessageSquare className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400" />
                <span>WhatsApp Coordinación: 929 667 586 (Solo Mensajes)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

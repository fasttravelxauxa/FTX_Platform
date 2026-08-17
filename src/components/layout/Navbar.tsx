'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Car, Menu, X, MessageSquare, ShieldCheck, UserCheck, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { BUSINESS_CONFIG } from '@/lib/constants';
import { WhatsAppService } from '@/lib/services/whatsapp';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-crusoe-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crusoe-600 text-white shadow-md shadow-crusoe-600/30 group-hover:scale-105 transition-transform">
            <Car className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-crusoe-950 font-sans">
              Fast Travel <span className="text-crusoe-600">Xauxa</span>
            </span>
            <span className="text-[10px] font-semibold text-crusoe-700 tracking-wider uppercase -mt-1">
              Jauja ↔ Huancayo Ejecutivo
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href="/#servicios"
            className="text-sm font-medium text-crusoe-900 hover:text-crusoe-600 transition-colors"
          >
            Servicios
          </Link>
          <Link
            href="/#como-funciona"
            className="text-sm font-medium text-crusoe-900 hover:text-crusoe-600 transition-colors"
          >
            ¿Cómo funciona?
          </Link>
          <Link
            href="/#vehiculo"
            className="text-sm font-medium text-crusoe-900 hover:text-crusoe-600 transition-colors"
          >
            SUV Jetour
          </Link>
          <Link
            href="/#comprobantes"
            className="text-sm font-medium text-crusoe-900 hover:text-crusoe-600 transition-colors"
          >
            Boletas y Facturas
          </Link>
          <Link
            href="/mis-reservas"
            className="flex items-center gap-1.5 text-sm font-medium text-crusoe-900 hover:text-crusoe-600 transition-colors"
          >
            <Calendar className="h-4 w-4 text-crusoe-600" />
            Mis Reservas
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/admin" className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline px-2 py-1">
            Panel Admin
          </Link>
          <a
            href={WhatsAppService.getCustomerSupportLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-start rounded-xl border border-crusoe-300 bg-crusoe-50 dark:bg-slate-800 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-crusoe-900 dark:text-slate-100 hover:bg-crusoe-100 transition-colors"
            title="Coordinación únicamente por mensajes de WhatsApp (No llamadas)"
          >
            <div className="flex items-center gap-1.5 font-bold text-crusoe-800 dark:text-crusoe-400">
              <MessageSquare className="h-3.5 w-3.5 text-crusoe-600" />
              <span>WhatsApp 929 667 586</span>
            </div>
            <span className="text-[9px] text-crusoe-700 dark:text-crusoe-300 font-semibold pl-5">Solo Mensajes</span>
          </a>
          <Link href="/reserva">
            <Button size="sm" className="shadow-lg shadow-crusoe-600/20">
              Reservar Viaje
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Link href="/reserva">
            <Button size="sm" className="text-xs px-2.5 py-1.5">
              Reservar
            </Button>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Abrir menú"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="border-b border-crusoe-200 bg-white px-4 pb-6 pt-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/#servicios"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-crusoe-900 hover:bg-crusoe-50"
            >
              Servicios
            </Link>
            <Link
              href="/#como-funciona"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-crusoe-900 hover:bg-crusoe-50"
            >
              ¿Cómo funciona?
            </Link>
            <Link
              href="/#vehiculo"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-crusoe-900 hover:bg-crusoe-50"
            >
              Nuestra SUV Jetour
            </Link>
            <Link
              href="/#comprobantes"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-crusoe-900 hover:bg-crusoe-50"
            >
              Boletas y Facturas Electrónicas
            </Link>
            <Link
              href="/mis-reservas"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-crusoe-900 hover:bg-crusoe-50 flex items-center gap-2"
            >
              <Calendar className="h-4 w-4 text-crusoe-600" />
              Consultar Mi Reserva
            </Link>
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-crusoe-700 hover:bg-crusoe-50 flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4 text-crusoe-600" />
              Acceso Administrativo
            </Link>
            <div className="pt-2">
              <a
                href={WhatsAppService.getCustomerSupportLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-crusoe-300 bg-crusoe-50 py-2.5 font-medium text-crusoe-900"
              >
                <div className="flex items-center gap-2 font-bold">
                  <MessageSquare className="h-4 w-4 text-crusoe-600" />
                  <span>WhatsApp 929 667 586</span>
                </div>
                <span className="text-[10px] text-crusoe-700 font-semibold">(Coordinación por mensajes — Solo WhatsApp)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

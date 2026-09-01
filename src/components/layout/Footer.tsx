import React from 'react';
import Link from 'next/link';
import { Car, MessageSquare, ShieldCheck, MapPin, Clock, FileCheck } from 'lucide-react';
import { BUSINESS_CONFIG } from '@/lib/constants';
import { WhatsAppService } from '@/lib/services/whatsapp';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-crusoe-200 dark:border-slate-800 bg-crusoe-950 dark:bg-slate-950 text-white pt-12 pb-8 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Info */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-white text-slate-950 flex items-center justify-center max-w-[150px] shadow-sm">
                <img
                  src="/images/yomil-removebg-preview.png"
                  alt="Empresa de Transportes y Turismo Jomyl"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Fast Travel <span className="text-crusoe-400">Xauxa</span>
              </span>
            </div>
            <p className="text-xs text-crusoe-200 leading-relaxed">
              Operado por <strong>Empresa de Transportes y Turismo Jomyl</strong>. Servicio Turístico Nacional autorizado y transporte ejecutivo en el Valle del Mantaro.
            </p>
            <div className="flex items-center gap-2 text-xs text-crusoe-300">
              <ShieldCheck className="h-4 w-4 text-crusoe-400" />
              <span>Reserva anticipada garantizada (20% adelanto)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold tracking-wider text-crusoe-400 uppercase">Servicios</h4>
            <ul className="flex flex-col gap-2 text-xs text-crusoe-200">
              <li>
                <Link href="/reserva?servicio=privado-aeropuerto" className="hover:text-crusoe-300">
                  Traslado Aeropuerto Privado
                </Link>
              </li>
              <li>
                <Link href="/reserva?servicio=compartido-aeropuerto" className="hover:text-crusoe-300">
                  Traslado Aeropuerto Compartido (S/20)
                </Link>
              </li>
              <li>
                <Link href="/reserva?servicio=excursion" className="hover:text-crusoe-300">
                  Excursiones Valle del Mantaro
                </Link>
              </li>
              <li>
                <Link href="/reserva?servicio=renta-horas" className="hover:text-crusoe-300">
                  Renta por Horas SUV Jetour
                </Link>
              </li>
            </ul>
          </div>

          {/* Invoicing & Coverage */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold tracking-wider text-crusoe-400 uppercase">Comprobantes Fiscales</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-crusoe-200">
              <li className="flex items-start gap-2">
                <FileCheck className="h-4 w-4 text-crusoe-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Emitimos Boletas y Facturas Electrónicas:</strong> Ingresa tus datos tributarios en la reserva y la empresa emisora te entregará tu comprobante fiscal directamente vía WhatsApp.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-crusoe-400 shrink-0" />
                <span>Tolerancia de 30 min tras aterrizaje</span>
              </li>
            </ul>
          </div>

          {/* Contact & WhatsApp */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold tracking-wider text-crusoe-400 uppercase">Coordinación por WhatsApp</h4>
            <p className="text-xs text-crusoe-200">
              Atención exclusiva por mensajes para coordinaciones y consultas de vuelo:
            </p>
            <a
              href={WhatsAppService.getCustomerSupportLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-col items-center justify-center gap-1 rounded-xl bg-crusoe-500 px-4 py-2.5 text-xs font-bold text-crusoe-950 hover:bg-crusoe-400 transition-colors shadow-lg shadow-crusoe-500/20"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp {BUSINESS_CONFIG.whatsappFormatted}</span>
              </div>
              <span className="text-[10px] text-crusoe-950 font-semibold">(Solo Mensajes — No llamadas)</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar & Legal Versioning */}
        <div className="mt-10 border-t border-crusoe-900 dark:border-slate-800 pt-6 flex flex-col items-center justify-between gap-4 text-xs text-crusoe-400 dark:text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Fast Travel Xauxa. Todos los derechos reservados. Jauja – Perú.</p>
          <div className="flex gap-4">
            <Link href="/terminos" className="hover:underline">
              Términos v1.0
            </Link>
            <Link href="/privacidad" className="hover:underline">
              Privacidad v1.0
            </Link>
            <Link href="/cancelaciones" className="hover:underline">
              Política de Cancelación
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plane,
  Users,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Car,
  FileCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { SERVICES_CATALOG, BUSINESS_CONFIG } from '@/lib/constants';
import { WhatsAppService } from '@/lib/services/whatsapp';

export default function HomePage() {
  return (
    <div className="site-page min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-crusoe-950 via-crusoe-900 to-crusoe-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white py-20 lg:py-28">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-crusoe-500/15 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-crusoe-600/15 blur-3xl"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left text column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-crusoe-500/40 bg-crusoe-500/10 px-3.5 py-1.5 text-xs font-semibold text-crusoe-300">
                  <ShieldCheck className="h-4 w-4 text-crusoe-400" />
                  <span>Servicio Ejecutivo Oficial Jauja ↔ Huancayo</span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
                  Tu viaje comienza con <span className="text-crusoe-400">tranquilidad</span>.
                </h1>

                <p className="text-base sm:text-lg text-crusoe-100/90 max-w-2xl leading-relaxed">
                  Reserva con anticipación tu transporte privado o compartido desde y hacia el <strong className="text-white">Aeropuerto Francisco Carlé de Jauja</strong>. Viaja cómodo, limpio y puntual en nuestra camioneta <strong className="text-crusoe-300">SUV Jetour último modelo</strong>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link href="/reserva">
                    <Button size="lg" className="w-full sm:w-auto text-base shadow-xl shadow-crusoe-500/30">
                      Reservar Viaje Ahora
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <a
                    href="#servicios"
                    className="inline-flex items-center justify-center rounded-xl border border-crusoe-600/60 bg-crusoe-900/50 px-6 py-3.5 text-base font-semibold text-crusoe-100 hover:bg-crusoe-800 transition-colors"
                  >
                    Ver Servicios y Tarifas
                  </a>
                </div>

                {/* Key features bar */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-crusoe-800/80 text-xs sm:text-sm text-crusoe-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-crusoe-400 shrink-0" />
                    <span>Adelanto del 50%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-crusoe-400 shrink-0" />
                    <span>Tolerancia 30 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-crusoe-400 shrink-0" />
                    <span>Boletas y Facturas</span>
                  </div>
                </div>
              </div>

              {/* Right image card with real Jetour photo */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden border-2 border-crusoe-500/30 bg-crusoe-900 shadow-2xl shadow-crusoe-950/80">
                  <img
                    src="/images/car/jetour-front.jpg"
                    alt="SUV Jetour Fast Travel Xauxa"
                    className="w-full h-80 object-cover"
                  />
                  <div className="p-6 bg-gradient-to-t from-crusoe-950 via-crusoe-950/90 to-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-bold text-crusoe-400 tracking-wider">Unidad Oficial</span>
                        <h3 className="text-xl font-extrabold text-white">SUV Jetour X70 FL</h3>
                      </div>
                      <span className="rounded-full bg-crusoe-500/20 px-3 py-1 text-xs font-bold text-crusoe-300 border border-crusoe-500/30">
                        2027 Modelo
                      </span>
                    </div>
                    <p className="text-xs text-crusoe-200 mt-2">
                      Aire acondicionado, asientos ergonómicos, maletero amplio, WiFi a bordo e higiene impecable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INVOICING / BOLETAS Y FACTURAS SECTION */}
        <section id="comprobantes" className="py-12 bg-crusoe-900 dark:bg-slate-900 text-white border-b border-crusoe-800 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-crusoe-700/80 dark:border-slate-700 bg-crusoe-950/90 dark:bg-slate-950/90 p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-crusoe-500/20 px-3 py-1 text-xs font-bold text-crusoe-300 border border-crusoe-500/30">
                  <FileCheck className="h-4 w-4 text-crusoe-400" />
                  <span>Comprobantes Fiscales Electrónicos</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Emitimos Boletas y Facturas Electrónicas
                </h2>
                <p className="text-xs sm:text-sm text-crusoe-200 dark:text-slate-300 leading-relaxed">
                  ¿Necesitas sustentar tus gastos de viaje? En <strong>Fast Travel Xauxa</strong> recopilamos tus datos tributarios (DNI para Boleta o RUC, Razón Social y Dirección Fiscal para Factura) al momento de tu reserva. El comprobante fiscal electrónico te es entregado directamente a tu celular vía WhatsApp.
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-crusoe-900 dark:bg-slate-800 p-4 border border-crusoe-700 dark:border-slate-700 text-center text-xs space-y-1">
                  <Building2 className="h-6 w-6 text-crusoe-400 mx-auto" />
                  <span className="font-bold block text-white">Entrega vía WhatsApp</span>
                  <span className="text-crusoe-300 dark:text-slate-400 text-[11px]">PDF y XML Oficial</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="como-funciona" className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-crusoe-600 dark:text-crusoe-400">Proceso Transparente</h2>
              <p className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1 sm:text-4xl">
                ¿Cómo funciona tu reserva en Fast Travel Xauxa?
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                Sin complicaciones ni tarifas ocultas. Coordinación directa por mensajes de WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-600 text-white font-extrabold text-lg mb-4 shadow-md">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Elige tu Servicio</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Selecciona traslado privado, compartido por S/20, excursión o renta por horas.
                </p>
              </div>

              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-600 text-white font-extrabold text-lg mb-4 shadow-md">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Fecha, Hora y Vuelo</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Ingresa tu aerolínea y fecha de traslado. Calculamos la tarifa de forma transparente.
                </p>
              </div>

              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-600 text-white font-extrabold text-lg mb-4 shadow-md">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Adelanto 50% y Comprobante</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Paga por Yape, Plin o BCP y sube tu comprobante. Solicita tu Boleta o Factura si la requieres.
                </p>
              </div>

              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-600 text-white font-extrabold text-lg mb-4 shadow-md">
                  4
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Confirmación y Viaje</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Recibes tu confirmación en WhatsApp. Te recibimos en puerta o con cartel en el aeropuerto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES CATALOG */}
        <section id="servicios" className="py-20 bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-crusoe-700 dark:text-crusoe-400">Catálogo Oficial</span>
                <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1 sm:text-4xl">
                  Nuestros Servicios de Transporte
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                Todas las tarifas son transparentes en Soles (PEN). Incluyen conductor profesional y atención personalizada.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Card 1: Aeropuerto Privado */}
              <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-100 dark:bg-crusoe-950 text-crusoe-700 dark:text-crusoe-300">
                      <Plane className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-crusoe-100 dark:bg-crusoe-950 px-3 py-1 text-xs font-bold text-crusoe-800 dark:text-crusoe-300">
                      Recomendado
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Aeropuerto Privado</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Servicio exclusivo puerta a puerta desde/hacia el Aeropuerto de Jauja ↔ Huancayo.
                  </p>
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-900 dark:text-slate-100">
                    <div className="flex justify-between font-semibold">
                      <span>Tarifa base Huancayo Centro:</span>
                      <span className="text-crusoe-700 dark:text-crusoe-400 text-base font-extrabold">S/ 80.00</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Chilca / Periferia:</span>
                      <span>+S/ 10.00 (S/ 90.00)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 pt-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Incluye Cartel de Bienvenida</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/reserva?servicio=privado-aeropuerto">
                    <Button className="w-full">Reservar Privado</Button>
                  </Link>
                </div>
              </div>

              {/* Card 2: Aeropuerto Compartido */}
              <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-100 dark:bg-crusoe-950 text-crusoe-700 dark:text-crusoe-300">
                      <Users className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-300">
                      Económico Executive
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Aeropuerto Compartido</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Viaje ejecutivo en SUV Jetour compartida. Máximo 4 pasajeros. Aeropuerto Jauja ↔ Huancayo.
                  </p>
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-900 dark:text-slate-100">
                    <div className="flex justify-between font-semibold">
                      <span>Precio por asiento:</span>
                      <span className="text-crusoe-700 dark:text-crusoe-400 text-base font-extrabold">S/ 20.00</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Cupo máximo:</span>
                      <span>4 pasajeros</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 pt-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Reserva garantizada</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/reserva?servicio=compartido-aeropuerto">
                    <Button variant="secondary" className="w-full">
                      Reservar Asiento S/20
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Card 3: Excursiones & Renta */}
              <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-100 dark:bg-crusoe-950 text-crusoe-700 dark:text-crusoe-300">
                      <Compass className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-3 py-1 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                      Turismo y Renta
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Excursiones / Renta</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Tours por el Valle del Mantaro o vehículo a disposición por horas con conductor privado.
                  </p>
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-900 dark:text-slate-100">
                    <div className="flex justify-between font-semibold">
                      <span>Tarifa base por hora:</span>
                      <span className="text-crusoe-700 dark:text-crusoe-400 text-base font-extrabold">S/ 50.00 / hora</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Flexibilidad de ruta:</span>
                      <span>100% Personalizable</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 pt-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Conductor local experto</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/reserva?servicio=excursion">
                    <Button variant="outline" className="w-full">
                      Cotizar Excursión
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FLEET SHOWCASE SECTION */}
        <section id="vehiculo" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-crusoe-600 dark:text-crusoe-400">Flota Oficial</span>
              <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1 sm:text-4xl">
                Nuestra Camioneta SUV Jetour X70 FL (2027)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                Imágenes reales de la unidad ejecutiva a tu servicio para un traslado confortable y seguro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800/60">
                <img src="/images/car/jetour-exterior-1.jpg" alt="Jetour Exterior" className="w-full h-56 object-cover hover:scale-105 transition-transform" />
                <div className="p-4">
                  <h4 className="font-bold text-slate-950 dark:text-white text-sm">Vista Exterior Elegante</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Carrocería impecable, amplio espacio y máximo confort en ruta.</p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800/60">
                <img src="/images/car/jetour-interior-1.jpg" alt="Jetour Interior" className="w-full h-56 object-cover hover:scale-105 transition-transform" />
                <div className="p-4">
                  <h4 className="font-bold text-slate-950 dark:text-white text-sm">Interior Ejecutivo</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Asientos ergonómicos de cuero, climatización y gran comodidad.</p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800/60">
                <img src="/images/car/jetour-front.jpg" alt="Jetour Frontal" className="w-full h-56 object-cover hover:scale-105 transition-transform" />
                <div className="p-4">
                  <h4 className="font-bold text-slate-950 dark:text-white text-sm">Seguridad y Mantenimiento</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Revisiones técnicas al día, SOAT vigente y desinfección en cada viaje.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="py-16 bg-crusoe-950 dark:bg-slate-950 text-white relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              ¿Listo para asegurar tu traslado con Fast Travel Xauxa?
            </h2>
            <p className="text-sm text-crusoe-200 dark:text-slate-300 mt-3 max-w-xl mx-auto">
              Realiza tu reserva ahora mismo y asegura el 50% de adelanto mediante Yape, Plin o Transferencia BCP. Coordinaciones únicamente por mensajes de WhatsApp ({BUSINESS_CONFIG.whatsappFormatted}).
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/reserva">
                <Button size="lg" className="shadow-xl">
                  Reservar Mi Traslado
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

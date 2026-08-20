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
import { SERVICES_CATALOG, BUSINESS_CONFIG, DESTINATIONS_CATALOG } from '@/lib/constants';
import { WelcomeModal } from '@/components/WelcomeModal';
import { DestinationCarousel } from '@/components/DestinationCarousel';

export default function HomePage() {
  return (
    <div className="site-page min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors text-slate-900 dark:text-slate-100">
      <WelcomeModal />
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-crusoe-950 via-crusoe-900 to-crusoe-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white py-16 lg:py-24">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-crusoe-500/15 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-crusoe-600/15 blur-3xl"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left text column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-crusoe-500/40 bg-crusoe-500/10 px-3.5 py-1.5 text-xs font-semibold text-crusoe-300">
                  <ShieldCheck className="h-4 w-4 text-crusoe-400" />
                  <span>Servicio Ejecutivo Oficial Jauja ↔ Huancayo</span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
                  Tu viaje comienza con <span className="text-crusoe-400">tranquilidad</span>.
                </h1>

                <p className="text-base sm:text-lg text-crusoe-100/90 max-w-2xl leading-relaxed">
                  Reserva con anticipación tu transporte privado o compartido desde y hacia el <strong className="text-white">Aeropuerto Francisco Carlé de Jauja</strong>. Viaja cómodo, climatizado y puntual en nuestra moderna flota <strong className="text-crusoe-300">SUV del año</strong>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link href="/reserva">
                    <Button size="lg" className="w-full sm:w-auto text-base shadow-xl shadow-crusoe-500/30">
                      <span>Reservar Traslado</span>
                      <ArrowRight className="h-5 w-5 ml-1" />
                    </Button>
                  </Link>
                  <a
                    href="#servicios"
                    className="inline-flex items-center justify-center rounded-xl border border-crusoe-600/60 bg-crusoe-900/50 px-6 py-3.5 text-base font-semibold text-crusoe-100 hover:bg-crusoe-800 transition-colors"
                  >
                    Ver Modalidades y Destinos
                  </a>
                </div>

                {/* Key features bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-semibold text-crusoe-200 border-t border-crusoe-800/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-crusoe-400 shrink-0" />
                    <span>Adelanto 20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-crusoe-400 shrink-0" />
                    <span>Reembolso 100% (1h)</span>
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

              {/* Right column: Interactive Destination Carousel */}
              <div className="lg:col-span-6 relative">
                <DestinationCarousel />
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
                  ¿Necesitas sustentar tus gastos de viaje? En <strong>Fast Travel Xauxa</strong> recopilamos tus datos tributarios (DNI para Boleta o RUC, Razón Social y Dirección Fiscal para Factura) al momento de tu reserva. El comprobante fiscal electrónico te es entregado directamente vía WhatsApp.
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
                Sin complicaciones ni intermediarios. Tarifas transparentes calculadas en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-600 text-white font-extrabold text-lg mb-4 shadow-md">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Elige tu Modalidad</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Selecciona traslado privado exclusivo o compartido en SUV del año.
                </p>
              </div>

              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-600 text-white font-extrabold text-lg mb-4 shadow-md">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Fecha, Hora y Vuelo</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Ingresa tu itinerario y el sistema calcula la tarifa exacta y el adelanto del 20%.
                </p>
              </div>

              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 p-6 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-600 text-white font-extrabold text-lg mb-4 shadow-md">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Adelanto y Comprobante</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Asegura tu reserva abonando el 20% por Yape, Plin o BCP y solicita Boleta o Factura.
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
                <span className="text-xs font-bold uppercase tracking-widest text-crusoe-700 dark:text-crusoe-400">Modalidades Oficiales</span>
                <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1 sm:text-4xl">
                  Servicios de Transporte
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                Unidades SUV del año climatizadas, asientos amplios y confortables, conductores profesionales y atención personalizada.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Card 1: Aeropuerto Privado */}
              <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-100 dark:bg-crusoe-950 text-crusoe-700 dark:text-crusoe-300">
                      <Car className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-crusoe-100 dark:bg-crusoe-950 px-3 py-1 text-xs font-bold text-crusoe-800 dark:text-crusoe-300">
                      Exclusivo y Climatizado
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Servicio Privado Exclusivo</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Servicio exclusivo para ti y tus acompañantes. Aire acondicionado, asientos amplios y confortables. Opción de parada en Plaza Constitución o traslado directo a tu domicilio u hotel.
                  </p>
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Camioneta SUV del año completa</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Traslado a Hotel / Domicilio o Plaza Constitución</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Recepción con Cartel de Bienvenida</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/reserva?servicio=privado-aeropuerto">
                    <Button className="w-full">Reservar Servicio Privado</Button>
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
                      Por Asiento
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Servicio Compartido</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Traslado en SUV del año compartida (máximo 4 pasajeros). Parada final establecida en Plaza Constitución (Centro de Huancayo).
                  </p>
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Parada final única: Plaza Constitución</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Máximo 4 pasajeros por unidad</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Asiento asegurado con 20% de adelanto</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/reserva?servicio=compartido-aeropuerto">
                    <Button variant="secondary" className="w-full">
                      Reservar Asiento Compartido
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
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Excursiones y Renta por Horas</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    Circuitos turísticos por el Valle del Mantaro, Tarma, La Merced y La Oroya con conductor profesional a tu disposición.
                  </p>
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Rutas 100% personalizables</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Conductor local experto</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-crusoe-600" />
                      <span>Unidad SUV del año con aire acondicionado</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/reserva?servicio=excursion">
                    <Button variant="outline" className="w-full">
                      Cotizar Excursión / Renta
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DESTINOS SECTION */}
        <section id="destinos" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-crusoe-600 dark:text-crusoe-400">Rutas Disponibles</span>
              <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1 sm:text-4xl">
                Nuestros Destinos Principales
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                Viaja desde y hacia el Aeropuerto de Jauja con total comodidad, climatización y seguridad.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {DESTINATIONS_CATALOG.map((dest) => (
                <div key={dest.code} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-800/60 flex flex-col justify-between group hover:shadow-md transition-shadow">
                  {dest.image && (
                    <div className="h-44 overflow-hidden relative">
                      <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-2.5 left-3 right-3">
                        <span className="text-[11px] font-bold text-crusoe-300 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                          Ruta Oficial
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-bold text-slate-950 dark:text-white text-base">{dest.name}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{dest.description}</p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <Link href="/reserva">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          <span>Ver Tarifas y Reservar</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
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
              Realiza tu reserva ahora mismo y asegura pagando el 20% de adelanto mediante Yape, Plin o Transferencia BCP, o paga después. Coordinaciones únicamente por mensajes de WhatsApp ({BUSINESS_CONFIG.whatsappFormatted}).
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

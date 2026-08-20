'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, ShieldCheck } from 'lucide-react';

interface DestinationSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  routeInfo: string;
}

const DESTINATION_SLIDES: DestinationSlide[] = [
  {
    id: 'plaza-constitucion',
    title: 'Plaza Constitución',
    subtitle: 'Centro Histórico y Financiero de Huancayo',
    tag: 'Parada Oficial y Punto de Encuentro',
    image: '/images/destinos/plaza_constitucion.jpg',
    routeInfo: 'Ruta directa Aeropuerto Jauja ↔ Huancayo Centro',
  },
  {
    id: 'huancayo',
    title: 'Huancayo y Valle del Mantaro',
    subtitle: 'Capital del Valle del Mantaro',
    tag: 'Traslado a Domicilio u Hotel',
    image: '/images/destinos/Huancayo.webp',
    routeInfo: 'Servicio exclusivo directo a su ubicación exacta',
  },
  {
    id: 'tarma',
    title: 'Tarma',
    subtitle: 'La Perla de los Andes',
    tag: 'Ruta Turística y Comercial',
    image: '/images/destinos/tarma.jpg',
    routeInfo: 'Traslado ejecutivo directo desde el Aeropuerto',
  },
  {
    id: 'la-merced',
    title: 'La Merced y Chanchamayo',
    subtitle: 'Puerta de Ingreso a la Selva Central',
    tag: 'Climatización y Máximo Confort',
    image: '/images/destinos/la_merced.jpg',
    routeInfo: 'Viaje seguro por carretera central en SUV del año',
  },
  {
    id: 'la-oroya',
    title: 'La Oroya',
    subtitle: 'Conexión y Cruce Central del Perú',
    tag: 'Servicio Corporativo',
    image: '/images/destinos/la_oroya.jpg',
    routeInfo: 'Puntualidad garantizada y facturación electrónica',
  },
];

export function DestinationCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % DESTINATION_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + DESTINATION_SLIDES.length) % DESTINATION_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % DESTINATION_SLIDES.length);
  };

  const currentSlide = DESTINATION_SLIDES[currentIndex];

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-crusoe-500/30 bg-slate-900 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide Image Container */}
      <div className="relative h-[380px] sm:h-[460px] w-full overflow-hidden">
        {DESTINATION_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover transform scale-105 transition-transform duration-1000 group-hover:scale-100"
            />
            {/* Gradient Overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-transparent"></div>
          </div>
        ))}

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-20 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-crusoe-400/40 bg-crusoe-950/80 px-3 py-1 text-[11px] font-bold text-crusoe-300 backdrop-blur-md">
            <MapPin className="h-3.5 w-3.5 text-crusoe-400 shrink-0" />
            <span>{currentSlide.tag}</span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentSlide.title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-slate-200 mt-0.5">
              {currentSlide.subtitle}
            </p>
          </div>

          <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-slate-300">
            <ShieldCheck className="h-4 w-4 text-crusoe-400 shrink-0" />
            <span>{currentSlide.routeInfo}</span>
          </div>
        </div>

        {/* Previous / Next Arrow Controls */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Destino anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 hover:bg-black/70 text-white p-2.5 backdrop-blur-sm border border-white/20 transition-all opacity-80 hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Siguiente destino"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-30 rounded-full bg-black/40 hover:bg-black/70 text-white p-2.5 backdrop-blur-sm border border-white/20 transition-all opacity-80 hover:opacity-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Indicators */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
          {DESTINATION_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir al destino ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? 'w-6 bg-crusoe-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

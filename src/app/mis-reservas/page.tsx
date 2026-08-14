'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, MapPin, ArrowRight, Car, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LocalDb } from '@/lib/storage/mock-db';
import { Reservation } from '@/lib/types';

export default function MyBookingsPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filtered, setFiltered] = useState<Reservation[]>([]);

  useEffect(() => {
    const list = LocalDb.getReservations();
    setReservations(list);
    setFiltered(list);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setFiltered(reservations);
      return;
    }
    const term = searchTerm.toLowerCase();
    const results = reservations.filter(
      (r) =>
        r.code.toLowerCase().includes(term) ||
        r.customer?.phone.includes(term) ||
        r.customer?.dni?.includes(term) ||
        r.customer?.full_name.toLowerCase().includes(term)
    );
    setFiltered(results);
  };

  return (
    <div className="min-h-screen bg-crusoe-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-crusoe-700">Consulta de Pasajero</span>
          <h1 className="text-3xl font-extrabold text-crusoe-950 mt-1">Mis Reservas</h1>
          <p className="text-xs text-crusoe-800 mt-1">
            Consulta el estado de tu viaje ingresando tu Código de Reserva, Número de Teléfono o DNI.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-3 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-crusoe-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (TFX-...), Teléfono o DNI..."
              className="w-full rounded-xl border border-crusoe-300 bg-white pl-10 pr-4 py-3 text-sm focus:border-crusoe-600 focus:outline-none shadow-sm"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </form>

        {/* List of Bookings */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-crusoe-200 bg-white p-10 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-crusoe-400 mx-auto" />
            <h3 className="font-bold text-base text-crusoe-950">No se encontraron reservas</h3>
            <p className="text-xs text-crusoe-800">
              Verifica el código ingresado o crea una nueva reserva en nuestra plataforma.
            </p>
            <Link href="/reserva">
              <Button size="sm" className="mt-2">
                Nueva Reserva
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((res) => (
              <div
                key={res.id}
                className="rounded-2xl border border-crusoe-200 bg-white p-5 shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 text-xs text-crusoe-950">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-base text-crusoe-900">{res.code}</span>
                    <Badge status={res.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-crusoe-800">
                    <MapPin className="h-3.5 w-3.5 text-crusoe-600 shrink-0" />
                    <span>
                      {res.origin} ➔ {res.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-crusoe-800">
                    <Calendar className="h-3.5 w-3.5 text-crusoe-600 shrink-0" />
                    <span>{new Date(res.scheduled_at).toLocaleString('es-PE')}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-0 pt-3 sm:pt-0 border-crusoe-100">
                  <div className="text-right">
                    <span className="text-[10px] text-crusoe-700 font-bold block uppercase">Total</span>
                    <span className="text-base font-extrabold text-crusoe-950">S/ {res.total_amount.toFixed(2)}</span>
                  </div>
                  <Link href={`/reserva/${res.code}`}>
                    <Button size="sm" variant="outline" className="text-xs py-1.5">
                      Ver Detalle
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

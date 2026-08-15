'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  Car,
  AlertCircle,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RepositoryService, getPassengerIdentity, savePassengerIdentity } from '@/lib/services/repository';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { Reservation } from '@/lib/types';

const DELETABLE_STATUSES = ['CANCELLED', 'PAYMENT_REJECTED', 'EXPIRED'];

export default function MyBookingsPage() {
  const [phone, setPhone] = useState<string>('');
  const [inputPhone, setInputPhone] = useState<string>('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Al montar: si ya hay teléfono guardado en este dispositivo, cargar automáticamente
  useEffect(() => {
    const savedPhone = getPassengerIdentity();
    if (savedPhone) {
      setPhone(savedPhone);
      setInputPhone(savedPhone);
      loadReservations(savedPhone);
    }
  }, []);

  const loadReservations = async (phoneNumber: string) => {
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length < 9) {
      setErrorMsg('Ingresa un número de teléfono válido de 9 dígitos.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const list = await RepositoryService.getReservationsByPhone(clean);
      setReservations(list);
      setSearched(true);
      savePassengerIdentity(clean);
      setPhone(clean);
    } catch (err) {
      setErrorMsg('Error al consultar tus reservas. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadReservations(inputPhone);
  };

  const handleDelete = async (res: Reservation) => {
    if (!DELETABLE_STATUSES.includes(res.status)) return;
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la reserva ${res.code}?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(res.id);
    try {
      const ok = await RepositoryService.deleteReservation(res.id, res.code);
      if (ok) {
        setReservations((prev) => prev.filter((r) => r.id !== res.id));
      } else {
        alert('No se pudo eliminar la reserva. Solo se pueden eliminar reservas Canceladas o Rechazadas.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-crusoe-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-crusoe-700">
            Fast Travel Xauxa — Portal del Pasajero
          </span>
          <h1 className="text-3xl font-extrabold text-crusoe-950 mt-1">Mis Reservas</h1>
          <p className="text-xs text-crusoe-800 mt-2 max-w-md mx-auto">
            Ingresa tu número de WhatsApp para ver el historial de tus viajes reservados. No necesitas crear una cuenta.
          </p>
        </div>

        {/* Search by phone */}
        <form onSubmit={handleSearch} className="mb-8 max-w-lg mx-auto">
          <label className="block text-xs font-bold text-crusoe-900 mb-2 text-center">
            Tu Número de WhatsApp (9 dígitos)
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-crusoe-500" />
              <input
                type="tel"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ej. 929667586"
                maxLength={9}
                className="w-full rounded-xl border border-crusoe-300 bg-white pl-10 pr-4 py-3 text-sm focus:border-crusoe-600 focus:outline-none shadow-sm"
              />
            </div>
            <Button type="submit" isLoading={loading}>
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
          {phone && (
            <p className="text-[11px] text-crusoe-700 text-center mt-2 font-semibold">
              📱 Mostrando reservas del número <strong>{phone}</strong>. Solo tú puedes ver tus reservas desde este dispositivo.
            </p>
          )}
        </form>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-800 max-w-lg mx-auto">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <>
            {reservations.length === 0 ? (
              <div className="rounded-3xl border border-crusoe-200 bg-white p-10 text-center space-y-4 shadow-sm">
                <Car className="h-12 w-12 text-crusoe-300 mx-auto" />
                <h3 className="font-bold text-base text-crusoe-950">
                  No encontramos reservas para el número {phone}
                </h3>
                <p className="text-xs text-crusoe-800 max-w-sm mx-auto">
                  Si hiciste tu reserva desde otro dispositivo o con un número distinto, ingrésalo arriba. O crea una nueva reserva.
                </p>
                <Link href="/reserva">
                  <Button size="sm" className="mt-2">
                    Hacer una Reserva Nueva
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-crusoe-800">
                    {reservations.length} {reservations.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
                  </span>
                  <Link href="/reserva">
                    <Button size="sm" variant="outline">
                      + Nueva Reserva
                    </Button>
                  </Link>
                </div>

                {reservations.map((res) => {
                  const isDeletable = DELETABLE_STATUSES.includes(res.status);
                  const isDeleting = deletingId === res.id;

                  return (
                    <div
                      key={res.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${
                        isDeletable ? 'border-red-200 opacity-80' : 'border-crusoe-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        {/* Left: Info */}
                        <div className="space-y-2 text-xs text-crusoe-950 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-extrabold text-base text-crusoe-900">{res.code}</span>
                            <Badge status={res.status} size="sm" />
                          </div>

                          <div className="flex items-center gap-2 text-crusoe-800">
                            <Car className="h-3.5 w-3.5 text-crusoe-600 shrink-0" />
                            <span className="font-semibold">{res.service?.name || 'Traslado'}</span>
                          </div>

                          <div className="flex items-center gap-2 text-crusoe-800">
                            <MapPin className="h-3.5 w-3.5 text-crusoe-600 shrink-0" />
                            <span>{res.origin} ➔ {res.destination}</span>
                          </div>

                          <div className="flex items-center gap-2 text-crusoe-800">
                            <Calendar className="h-3.5 w-3.5 text-crusoe-600 shrink-0" />
                            <span>{new Date(res.scheduled_at).toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'short' })}</span>
                          </div>

                          {/* Cancellation window info */}
                          {res.status === 'PENDING_PAYMENT' || res.status === 'PAYMENT_SUBMITTED' ? (
                            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 rounded-xl px-3 py-1.5 border border-amber-200 mt-1">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span className="font-semibold text-[11px]">
                                Puedes cancelar gratis durante los primeros 60 minutos desde la creación
                              </span>
                            </div>
                          ) : null}

                          {isDeletable && (
                            <div className="flex items-center gap-1.5 text-red-700 bg-red-50 rounded-xl px-3 py-1.5 border border-red-200 mt-1">
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="font-semibold text-[11px]">
                                {res.status === 'PAYMENT_REJECTED'
                                  ? 'Tu comprobante fue rechazado. Puedes eliminar esta reserva y crear una nueva.'
                                  : 'Esta reserva fue cancelada. Puedes eliminarla de tu historial.'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 border-t sm:border-0 pt-3 sm:pt-0 border-crusoe-100 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-crusoe-700 font-bold block uppercase">Total</span>
                            <span className="text-base font-extrabold text-crusoe-950">S/ {res.total_amount.toFixed(2)}</span>
                            <span className="text-[10px] text-crusoe-600 font-semibold block">Adelanto: S/ {res.deposit_amount.toFixed(2)}</span>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Link href={`/reserva/${res.code}`}>
                              <Button size="sm" variant="outline" className="text-xs w-full">
                                Ver Detalle
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>

                            {/* WhatsApp coordinator */}
                            <a
                              href={WhatsAppService.getCustomerSupportLink(res)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-crusoe-600 px-3 py-2 text-xs font-bold text-white hover:bg-crusoe-700 transition-colors"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Consultar por WhatsApp
                            </a>

                            {/* Delete only if cancelled/rejected */}
                            {isDeletable && (
                              <Button
                                size="sm"
                                variant="danger"
                                isLoading={isDeleting}
                                onClick={() => handleDelete(res)}
                                className="text-xs w-full"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar Reserva
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Initial state — not searched yet and no saved phone */}
        {!searched && !loading && !phone && (
          <div className="rounded-3xl border border-crusoe-200 bg-white p-10 text-center space-y-3 shadow-sm max-w-lg mx-auto">
            <Phone className="h-10 w-10 text-crusoe-400 mx-auto" />
            <h3 className="font-bold text-base text-crusoe-950">Ingresa tu número para continuar</h3>
            <p className="text-xs text-crusoe-800">
              Usa el mismo número de WhatsApp que registraste al hacer tu reserva.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

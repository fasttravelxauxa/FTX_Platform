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
  ShieldCheck,
  Info,
  Upload,
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
      setErrorMsg('Ingresa un número de WhatsApp válido de 9 dígitos.');
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
    } catch {
      setErrorMsg('Error al consultar tus reservas en el servidor. Inténtalo nuevamente.');
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8 text-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-crusoe-700 dark:text-crusoe-400">
            Fast Travel Xauxa — Portal del Pasajero
          </span>
          <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">Mis Reservas</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Ingresa tu número de WhatsApp para consultar en tiempo real el estado de tus traslados ejecutivos.
          </p>
        </div>

        {/* Search by phone */}
        <form onSubmit={handleSearch} className="mb-8 max-w-lg mx-auto">
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-2 text-center">
            Tu Número de WhatsApp (9 dígitos)
          </label>
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                inputMode="numeric"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Ej. 929667586"
                maxLength={9}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-4 py-3.5 text-sm font-semibold text-slate-950 dark:text-white focus:border-crusoe-600 focus:outline-none shadow-sm"
              />
            </div>
            <Button type="submit" isLoading={loading} size="lg">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
          </div>
          {phone && (
            <p className="text-[11px] text-crusoe-800 dark:text-crusoe-300 text-center mt-2.5 font-bold">
              📱 Mostrando viajes del número <strong>+51 {phone}</strong>
            </p>
          )}
        </form>

        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-4 text-xs font-semibold text-rose-900 dark:text-rose-200 max-w-lg mx-auto shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          <>
            {reservations.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center space-y-4 shadow-sm">
                <Car className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-950 dark:text-white">
                  No encontramos reservas para el número +51 {phone}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  Si registraste tu viaje con otro número o deseas programar un nuevo traslado, puedes hacerlo a continuación.
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
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {reservations.length} {reservations.length === 1 ? 'viaje encontrado' : 'viajes encontrados'}
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
                  const isShared = res.service_id === 'a2222222-2222-2222-2222-222222222222';

                  return (
                    <div
                      key={res.id}
                      className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all ${
                        isDeletable
                          ? 'border-rose-200 dark:border-rose-900/60 opacity-85'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        {/* Left: Info */}
                        <div className="space-y-2 text-xs text-slate-900 dark:text-slate-100 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-extrabold text-base text-slate-950 dark:text-white">{res.code}</span>
                            <Badge status={res.status} size="sm" />
                          </div>

                          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <Car className="h-3.5 w-3.5 text-crusoe-600 shrink-0" />
                            <span className="font-bold text-slate-950 dark:text-white">{res.service?.name || 'Traslado Ejecutivo'}</span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <MapPin className="h-3.5 w-3.5 text-crusoe-600 shrink-0" />
                            <span>{res.origin} ➔ {res.destination}</span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-crusoe-600 shrink-0" />
                            <span>{new Date(res.scheduled_at).toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'short' })}</span>
                          </div>

                          {/* Rule note for shared service */}
                          {isShared && (
                            <div className="flex items-start gap-1.5 text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-800 mt-1 font-medium text-[11px]">
                              <Info className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                              <span>
                                <strong>Reserva de Asiento Asegurada:</strong> La confirmación de salida del vehículo se activa al completarse un mínimo de 3 asientos reservados para tu turno.
                              </span>
                            </div>
                          )}

                          {isDeletable && (
                            <div className="flex items-center gap-1.5 text-rose-900 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 rounded-xl px-3 py-1.5 border border-rose-200 dark:border-rose-800 mt-1 font-medium text-[11px]">
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                              <span>
                                {res.status === 'PAYMENT_REJECTED'
                                  ? 'Tu comprobante fue rechazado. Puedes eliminar esta reserva y crear una nueva.'
                                  : 'Esta reserva fue cancelada. Puedes eliminarla de tu historial.'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">Total</span>
                            <span className="text-base font-extrabold text-slate-950 dark:text-white">S/ {res.total_amount.toFixed(2)}</span>
                            <span className="text-[10px] text-crusoe-800 dark:text-crusoe-400 font-bold block">Adelanto: S/ {res.deposit_amount.toFixed(2)}</span>
                          </div>

                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            {!res.payments?.[0]?.proofs?.[0] && !['CANCELLED', 'COMPLETED', 'PAYMENT_REJECTED'].includes(res.status) && (
                              <Link href={`/reserva/${res.code}`}>
                                <Button size="sm" className="text-xs w-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-bold">
                                  <Upload className="h-3.5 w-3.5" />
                                  Adjuntar Voucher
                                </Button>
                              </Link>
                            )}

                            <Link href={`/reserva/${res.code}`}>
                              <Button size="sm" variant="outline" className="text-xs w-full">
                                Ver Detalle
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>

                            <a
                              href={WhatsAppService.getCustomerSupportLink(res)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-crusoe-600 px-3 py-2 text-xs font-bold text-white hover:bg-crusoe-700 transition-colors shadow-sm"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>

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

        {/* Initial state — not searched yet */}
        {!searched && !loading && !phone && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center space-y-3 shadow-sm max-w-lg mx-auto">
            <Phone className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-950 dark:text-white">Ingresa tu número para consultar</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Usa el mismo número de WhatsApp que registraste al hacer tu reserva.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

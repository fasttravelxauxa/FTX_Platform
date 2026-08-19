'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
  Plane,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Phone,
  ArrowLeft,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RepositoryService } from '@/lib/services/repository';
import { Reservation } from '@/lib/types';
import { ReservationStateMachine } from '@/lib/services/reservation-state';
import { WhatsAppService } from '@/lib/services/whatsapp';

export default function ReservationDetailPage() {
  const params = useParams();
  const code = (params?.code as string) || '';

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [canRefund, setCanRefund] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  useEffect(() => {
    if (code) {
      RepositoryService.getReservationByCode(code).then((res) => {
        if (res) {
          setReservation(res);
          setCanRefund(ReservationStateMachine.isEligibleForRefund(res.created_at));
        }
        setLoading(false);
      });
    }
  }, [code]);

  const handleCancelReservation = async () => {
    if (!reservation) return;
    if (confirm('¿Estás seguro de cancelar esta reserva?')) {
      setCancelling(true);
      const updated: Reservation = {
        ...reservation,
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      };
      await RepositoryService.saveReservation(updated);
      setReservation(updated);
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/mis-reservas" className="inline-flex items-center gap-2 text-xs font-bold text-crusoe-700 dark:text-crusoe-400 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Reservas
          </Link>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Consulta de Pasajero</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-700 dark:text-slate-300 font-medium text-sm">Cargando reserva...</div>
        ) : !reservation ? (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-4 shadow-sm">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Reserva No Encontrada</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              No existe una reserva registrada con el código <strong>{code}</strong>.
            </p>
            <Link href="/reserva">
              <Button size="sm">Crear Nueva Reserva</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Status Box */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-crusoe-700 dark:text-crusoe-400">Código Oficial</span>
                  <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">{reservation.code}</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Creada el {new Date(reservation.created_at).toLocaleString('es-PE')}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2">
                  <Badge status={reservation.status} />
                  {reservation.payments?.[0] && (
                    <Badge type="payment" status={reservation.payments[0].status} size="sm" />
                  )}
                </div>
              </div>

              {/* Grid detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-xs text-slate-900 dark:text-slate-100 font-medium">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white">Origen y Destino:</span>
                      <span>
                        {reservation.origin} ➔ {reservation.destination}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white">Fecha y Hora Programada:</span>
                      <span>{new Date(reservation.scheduled_at).toLocaleString('es-PE')}</span>
                    </div>
                  </div>
                  {reservation.flight_airline && (
                    <div className="flex items-start gap-2.5">
                      <Plane className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-slate-950 dark:text-white">Aerolínea de Arribo (JAU):</span>
                        <span>
                          {reservation.flight_airline} {reservation.flight_number ? `— Vuelo ${reservation.flight_number}` : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Car className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white">Vehículo Asignado:</span>
                      <span>
                        {reservation.vehicle
                          ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.plate})`
                          : 'SUV Jetour Deluxe (Asignación oficial)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white">Tolerancia en Aeropuerto:</span>
                      <span>30 minutos tras el aterrizaje verificado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="mt-8 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-5 border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-950 dark:text-white mb-3">Desglose Monetario (PEN)</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Monto Total del Viaje:</span>
                    <span className="font-bold text-slate-950 dark:text-white">S/ {reservation.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-crusoe-800 dark:text-crusoe-400">
                    <span>Adelanto del 50%:</span>
                    <span className="font-bold">S/ {reservation.deposit_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-sm">
                    <span>Saldo Pendiente a Pagar al Abordar:</span>
                    <span>S/ {reservation.balance_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Voucher preview */}
              {reservation.payments?.[0]?.proofs?.[0] && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-xs text-slate-950 dark:text-white mb-3">Comprobante de Pago Adjuntado</h3>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/40">
                    <img
                      src={reservation.payments[0].proofs[0].file_path}
                      alt="Voucher adjunto"
                      className="h-20 w-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                    <div className="text-xs text-slate-900 dark:text-slate-100 space-y-1">
                      <span className="font-bold block">Voucher Enviado para Revisión</span>
                      <span className="block text-slate-600 dark:text-slate-400">
                        Referencia: {reservation.payments[0].proofs[0].reference_number || 'N/A'}
                      </span>
                      <span className="block text-slate-500 dark:text-slate-400 text-[11px]">
                        Enviado: {new Date(reservation.payments[0].proofs[0].uploaded_at).toLocaleString('es-PE')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                <a
                  href={WhatsAppService.getCustomerSupportLink(reservation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-crusoe-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-crusoe-600/20 hover:bg-crusoe-700"
                >
                  <Phone className="h-4 w-4" />
                  Consultar Operador por WhatsApp
                </a>

                {reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleCancelReservation}
                    disabled={!canRefund && reservation.status === 'CONFIRMED'}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar Reserva {canRefund && '(Devolución 100% activa)'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

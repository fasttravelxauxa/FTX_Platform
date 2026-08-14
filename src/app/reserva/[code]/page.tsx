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
import { LocalDb } from '@/lib/storage/mock-db';
import { Reservation } from '@/lib/types';
import { ReservationStateMachine } from '@/lib/services/reservation-state';
import { WhatsAppService } from '@/lib/services/whatsapp';

export default function ReservationDetailPage() {
  const params = useParams();
  const code = (params?.code as string) || '';

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [canRefund, setCanRefund] = useState<boolean>(false);

  useEffect(() => {
    if (code) {
      const res = LocalDb.getReservationByCode(code);
      if (res) {
        setReservation(res);
        setCanRefund(ReservationStateMachine.isEligibleForRefund(res.created_at));
      }
      setLoading(false);
    }
  }, [code]);

  const handleCancelReservation = () => {
    if (!reservation) return;
    if (confirm('¿Estás seguro de cancelar esta reserva?')) {
      const updated: Reservation = {
        ...reservation,
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      };
      LocalDb.saveReservation(updated);
      setReservation(updated);
    }
  };

  return (
    <div className="min-h-screen bg-crusoe-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/mis-reservas" className="inline-flex items-center gap-2 text-xs font-bold text-crusoe-700 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Reservas
          </Link>
          <span className="text-xs font-semibold text-crusoe-700">Consulta de Pasajero</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-crusoe-900 font-medium text-sm">Cargando reserva...</div>
        ) : !reservation ? (
          <div className="rounded-3xl border border-crusoe-200 bg-white p-10 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-crusoe-950">Reserva No Encontrada</h2>
            <p className="text-xs text-crusoe-800">
              No existe una reserva registrada con el código <strong>{code}</strong>.
            </p>
            <Link href="/reserva">
              <Button size="sm">Crear Nueva Reserva</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Status Box */}
            <div className="rounded-3xl border border-crusoe-200 bg-white p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-crusoe-100 pb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-crusoe-700">Código Oficial</span>
                  <h1 className="text-3xl font-extrabold text-crusoe-950 mt-1">{reservation.code}</h1>
                  <p className="text-xs text-crusoe-800 mt-1">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-xs text-crusoe-950">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-crusoe-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Origen y Destino:</span>
                      <span>
                        {reservation.origin} ➔ {reservation.destination}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-crusoe-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Fecha y Hora Programada:</span>
                      <span>{new Date(reservation.scheduled_at).toLocaleString('es-PE')}</span>
                    </div>
                  </div>
                  {reservation.flight_number && (
                    <div className="flex items-start gap-2.5">
                      <Plane className="h-4 w-4 text-crusoe-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Vuelo de Llegada (JAU):</span>
                        <span>
                          {reservation.flight_airline} — Vuelo {reservation.flight_number}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Car className="h-4 w-4 text-crusoe-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Vehículo Asignado:</span>
                      <span>
                        {reservation.vehicle
                          ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.plate})`
                          : 'SUV Jetour Deluxe (Asignación automática)'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-crusoe-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Tolerancia en Aeropuerto:</span>
                      <span>30 minutos tras el aterrizaje verificado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="mt-8 rounded-2xl bg-crusoe-50/80 p-5 border border-crusoe-200">
                <h3 className="font-bold text-sm text-crusoe-950 mb-3">Desglose Monetario (PEN)</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Monto Total del Viaje:</span>
                    <span className="font-bold">S/ {reservation.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-crusoe-800">
                    <span>Adelanto del 50%:</span>
                    <span className="font-bold text-crusoe-700">S/ {reservation.deposit_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-800 border-t border-crusoe-200 pt-2 font-bold text-sm">
                    <span>Saldo Pendiente a Pagar al Abordar:</span>
                    <span>S/ {reservation.balance_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Voucher preview */}
              {reservation.payments?.[0]?.proofs?.[0] && (
                <div className="mt-6 pt-6 border-t border-crusoe-100">
                  <h3 className="font-bold text-xs text-crusoe-950 mb-3">Comprobante de Pago Adjuntado</h3>
                  <div className="flex items-center gap-4 rounded-2xl border border-crusoe-200 p-3 bg-white">
                    <img
                      src={reservation.payments[0].proofs[0].file_path}
                      alt="Voucher adjunto"
                      className="h-20 w-20 object-cover rounded-xl border border-crusoe-200"
                    />
                    <div className="text-xs text-crusoe-900 space-y-1">
                      <span className="font-bold block">Voucher Enviado para Revisión</span>
                      <span className="block text-crusoe-800">
                        Referencia: {reservation.payments[0].proofs[0].reference_number || 'N/A'}
                      </span>
                      <span className="block text-gray-700">
                        Enviado: {new Date(reservation.payments[0].proofs[0].uploaded_at).toLocaleString('es-PE')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-crusoe-100 pt-6">
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

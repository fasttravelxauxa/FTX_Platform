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
  Upload,
  MessageSquare,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RepositoryService, generateUUID } from '@/lib/services/repository';
import { Reservation } from '@/lib/types';
import { ReservationStateMachine } from '@/lib/services/reservation-state';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { PAYMENT_METHODS_INFO, BUSINESS_CONFIG } from '@/lib/constants';

export default function ReservationDetailPage() {
  const params = useParams();
  const code = (params?.code as string) || '';

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [canRefund, setCanRefund] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Voucher upload state
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'plin' | 'bcp'>('yape');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [uploadingVoucher, setUploadingVoucher] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar los 5MB.');
        return;
      }
      setVoucherFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoucherPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation || !voucherFile) {
      alert('Por favor selecciona la imagen de tu voucher o captura de pago.');
      return;
    }

    setUploadingVoucher(true);
    setUploadSuccessMsg(null);

    try {
      const uploadedUrl = await RepositoryService.uploadVoucherImage(voucherFile, reservation.code);
      const finalUrl = uploadedUrl || voucherPreview || '';

      const paymentId = reservation.payments?.[0]?.id || generateUUID();
      const proofId = generateUUID();

      const updatedPayments = [
        {
          id: paymentId,
          reservation_id: reservation.id,
          amount: reservation.deposit_amount,
          payment_method: paymentMethod,
          status: 'SUBMITTED' as const,
          created_at: new Date().toISOString(),
          proofs: [
            {
              id: proofId,
              payment_id: paymentId,
              file_path: finalUrl,
              reference_number: referenceNumber.trim() || 'VOUCHER-POSTERIOR',
              uploaded_at: new Date().toISOString(),
            },
          ],
        },
      ];

      const updatedRes: Reservation = {
        ...reservation,
        status: 'PAYMENT_REVIEW',
        payments: updatedPayments,
        updated_at: new Date().toISOString(),
      };

      await RepositoryService.saveReservation(updatedRes);
      setReservation(updatedRes);
      setUploadSuccessMsg('¡Comprobante adjuntado con éxito! Tu pago ha sido enviado a revisión por el equipo de coordinación.');
      setVoucherFile(null);
      setVoucherPreview(null);
      setShowUploadForm(false);
    } catch (err: any) {
      alert('Error al subir el comprobante. Por favor inténtalo de nuevo.');
    } finally {
      setUploadingVoucher(false);
    }
  };

  const hasExistingProof = !!reservation?.payments?.[0]?.proofs?.[0];

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
                    <Car className="h-4 w-4 text-crusoe-600 dark:text-crusoe-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-slate-950 dark:text-white">Modalidad Contratada:</span>
                      <span className="font-extrabold text-crusoe-800 dark:text-crusoe-400">
                        {reservation.service_id === 'a2222222-2222-2222-2222-222222222222'
                          ? `Servicio Compartido • ${reservation.passengers_count || 1} Asiento(s) (S/ 20.00 c/u)`
                          : 'Servicio Privado Exclusivo SUV (Camioneta Completa)'}
                      </span>
                    </div>
                  </div>
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
                          : 'SUV Jetour X70 FL 2027 (Oficial)'}
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
                    <span>Adelanto requerido (20%):</span>
                    <span className="font-bold">S/ {reservation.deposit_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-sm">
                    <span>Saldo Pendiente a Pagar al Abordar (80%):</span>
                    <span>S/ {reservation.balance_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Success feedback when voucher is uploaded */}
              {uploadSuccessMsg && (
                <div className="mt-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p>{uploadSuccessMsg}</p>
                    <a
                      href={WhatsAppService.getAdminNewBookingAlertLink(reservation)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-crusoe-700 dark:text-crusoe-400 hover:underline"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Avisar a Coordinación por WhatsApp sobre el nuevo voucher
                    </a>
                  </div>
                </div>
              )}

              {/* Uploaded Voucher preview */}
              {hasExistingProof && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-xs text-slate-950 dark:text-white">Comprobante de Pago Adjuntado</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs py-1 px-2.5 h-auto"
                      onClick={() => setShowUploadForm(!showUploadForm)}
                    >
                      {showUploadForm ? 'Ocultar formulario' : 'Cambiar / Actualizar Voucher'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/40">
                    <img
                      src={reservation.payments![0].proofs![0].file_path}
                      alt="Voucher adjunto"
                      className="h-24 w-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90"
                      onClick={() => {
                        const url = reservation.payments?.[0]?.proofs?.[0]?.file_path;
                        if (url) window.open(url, '_blank');
                      }}
                    />
                    <div className="text-xs text-slate-900 dark:text-slate-100 space-y-1">
                      <span className="font-bold block text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Voucher Recibido
                      </span>
                      <span className="block text-slate-600 dark:text-slate-400">
                        Referencia: <strong>{reservation.payments![0].proofs![0].reference_number || 'N/A'}</strong>
                      </span>
                      <span className="block text-slate-500 dark:text-slate-400 text-[11px]">
                        Enviado: {new Date(reservation.payments![0].proofs![0].uploaded_at).toLocaleString('es-PE')}
                      </span>
                      <a
                        href={reservation.payments![0].proofs![0].file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-crusoe-700 dark:text-crusoe-400 hover:underline pt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver voucher en tamaño completo
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* POSTERIOR VOUCHER UPLOAD FORM: Active if no voucher or user clicked change */}
              {(!hasExistingProof || showUploadForm) && reservation.status !== 'CANCELLED' && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-sm">
                      <Upload className="h-5 w-5 text-amber-600 shrink-0" />
                      <span>{hasExistingProof ? 'Actualizar Voucher de Pago' : 'Adjuntar Voucher de Adelanto (20%)'}</span>
                    </div>

                    <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
                      Realiza el adelanto de <strong>S/ {reservation.deposit_amount.toFixed(2)}</strong> a nuestras cuentas oficiales y sube la captura de pantalla a continuación para confirmar tu servicio.
                    </p>

                    {/* Payment Account Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        onClick={() => setPaymentMethod('yape')}
                        className={`rounded-xl border p-3 cursor-pointer transition-all ${
                          paymentMethod === 'yape'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <span className="font-extrabold text-xs text-purple-700 dark:text-purple-400 block">YAPE OFICIAL</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">929 667 586</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block">Titular: JORGE TRU.</span>
                      </div>

                      <div
                        onClick={() => setPaymentMethod('plin')}
                        className={`rounded-xl border p-3 cursor-pointer transition-all ${
                          paymentMethod === 'plin'
                            ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <span className="font-extrabold text-xs text-sky-700 dark:text-sky-400 block">PLIN OFICIAL</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">929 667 586</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate" title="JORGE ANTONIO TRUCIOS MEZA">
                          Titular: JORGE ANTONIO TRUCIOS MEZA
                        </span>
                      </div>

                      <div
                        onClick={() => setPaymentMethod('bcp')}
                        className={`rounded-xl border p-3 cursor-pointer transition-all ${
                          paymentMethod === 'bcp'
                            ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/60 shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <span className="font-extrabold text-xs text-orange-700 dark:text-orange-400 block">TRANSFERENCIA BCP</span>
                        <span className="text-xs font-bold text-slate-950 dark:text-white block mt-0.5 font-mono">40002021972079</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-mono">CCI: 00240010202197207901</span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block truncate font-medium">
                          Titular: JORGE ANTONIO TRUCIOS MEZA
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
                      ℹ️ <strong>Canal de Pagos:</strong> Para validación de abonos Yape/Plin. Para reservas, consultas y modificaciones de itinerario contacte a la Central Oficial: <strong>+51 940 378 999</strong>.
                    </div>

                    <form onSubmit={handleUploadVoucher} className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                            Seleccionar Archivo (Captura / Foto) *
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            required
                            onChange={handleFileChange}
                            className="w-full text-xs text-slate-900 dark:text-slate-100 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-crusoe-600 file:text-white hover:file:bg-crusoe-700 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                            Nº de Operación / Referencia (Opcional)
                          </label>
                          <input
                            type="text"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="Ej. YAP-889102"
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-950 dark:text-white focus:border-crusoe-600"
                          />
                        </div>
                      </div>

                      {voucherPreview && (
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                          <img src={voucherPreview} alt="Vista previa" className="h-16 w-16 object-cover rounded-lg border" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Vista previa lista para enviar.
                          </span>
                        </div>
                      )}

                      <Button
                        type="submit"
                        isLoading={uploadingVoucher}
                        className="w-full sm:w-auto py-2.5 px-6 shadow-md"
                      >
                        <Upload className="h-4 w-4" />
                        Subir y Confirmar Voucher
                      </Button>
                    </form>
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
                  Consultar Operador por WhatsApp ({BUSINESS_CONFIG.whatsappFormatted})
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

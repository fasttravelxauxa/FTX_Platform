'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Car,
  Plane,
  Users,
  Compass,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Upload,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  FileText,
  FileCheck,
  Bell,
  Copy,
  Info,
  Phone,
  User,
  CreditCard,
  Building,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SERVICES_CATALOG, AIRLINES, DESTINATIONS_CATALOG, PAYMENT_METHODS_INFO, BUSINESS_CONFIG, MOBILITY_OPTIONS } from '@/lib/constants';
import { PricingService } from '@/lib/services/pricing';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { RepositoryService, savePassengerIdentity, generateUUID } from '@/lib/services/repository';
import { Reservation, PriceQuote, PaymentMethod, InvoiceType } from '@/lib/types';

const STEP_TITLES: { [key: number]: string } = {
  1: 'Servicio y Destino',
  2: 'Fecha y Aerolínea',
  3: 'Pasajero y Equipaje',
  4: 'Comprobante Fiscal',
  5: 'Cotización y Pago',
  6: 'Confirmación',
};

function BookingWizardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialService = searchParams.get('servicio') || '';

  // Wizard state (Fluid 6 steps)
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields — Service selection & City Destination
  const [serviceCode, setServiceCode] = useState<string>(initialService);
  const [mobilityCode, setMobilityCode] = useState<string>('suv-jetour');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState<string>('09:30');
  const [origin, setOrigin] = useState<string>('Aeropuerto de Jauja (JAU)');

  // Destination City Code & Exact Address
  const [destinationCityCode, setDestinationCityCode] = useState<string>('plaza-constitucion');
  const [exactAddress, setExactAddress] = useState<string>('');
  const [destination, setDestination] = useState<string>('Plaza Constitución (Huancayo)');

  const [passengersCount, setPassengersCount] = useState<number>(1);
  const [hoursCount, setHoursCount] = useState<number>(2);

  // Customer Contact info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerDni, setCustomerDni] = useState<string>('');
  const [customerTitle, setCustomerTitle] = useState<string>('Sr.');

  // Flight Info (Solo Aerolínea)
  const [airline, setAirline] = useState<string>('LATAM');
  const [notes, setNotes] = useState<string>('');
  const [luggageNotes, setLuggageNotes] = useState<string>('');

  // Boleta / Factura Details
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('ninguno');
  const [invoiceDni, setInvoiceDni] = useState<string>('');
  const [invoiceName, setInvoiceName] = useState<string>('');
  const [invoiceRuc, setInvoiceRuc] = useState<string>('');
  const [invoiceCompanyName, setInvoiceCompanyName] = useState<string>('');
  const [invoiceAddress, setInvoiceAddress] = useState<string>('');

  // Terms acceptance
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  // Payment method & Proof
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('yape');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null);

  // Real-time seat occupancy count for shared service
  const [sharedSeatsInfo, setSharedSeatsInfo] = useState<{ occupiedSeats: number; isDepartureConfirmed: boolean }>({
    occupiedSeats: 0,
    isDepartureConfirmed: false,
  });

  // Generated Quote & Final Reservation
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  // Scroll smoothly to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setErrorMsg(null);
  }, [step]);

  // Consultar ocupación en tiempo real para el servicio compartido
  useEffect(() => {
    if (serviceCode === 'compartido-aeropuerto' && scheduledDate) {
      RepositoryService.getSharedOccupiedSeatsCount(scheduledDate, scheduledTime).then(setSharedSeatsInfo);
    }
  }, [serviceCode, scheduledDate, scheduledTime]);

  // Update full destination string whenever destination city or exact address changes
  useEffect(() => {
    const destRoute = DESTINATIONS_CATALOG.find((d) => d.code === destinationCityCode);
    const destName = destRoute ? destRoute.name : 'Huancayo';
    if (exactAddress.trim()) {
      setDestination(`${destName} — ${exactAddress.trim()}`);
    } else {
      setDestination(destName);
    }
  }, [destinationCityCode, exactAddress]);

  // Recalculate quote whenever relevant fields change
  useEffect(() => {
    try {
      const q = PricingService.calculateQuote({
        serviceCode,
        origin,
        destination,
        destinationCode: destinationCityCode,
        passengersCount,
        hoursCount,
      });
      setQuote(q);
    } catch {
      // Ignorar cálculo incompleto
    }
  }, [serviceCode, origin, destination, destinationCityCode, passengersCount, hoursCount]);

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Adjunta una imagen JPG, PNG, WEBP o un PDF válido.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('El comprobante no debe superar los 5MB.');
      e.target.value = '';
      return;
    }

    setVoucherFile(file);
    setVoucherPreview(URL.createObjectURL(file));
    setErrorMsg(null);
  };

  const handleCreateReservation = async () => {
    if (!customerName || !customerPhone) {
      setErrorMsg('Por favor ingresa tu Nombre completo y Teléfono de WhatsApp.');
      setStep(3);
      return;
    }

    if (serviceCode === 'privado-aeropuerto' && !exactAddress.trim()) {
      setErrorMsg('Para el servicio privado debes ingresar la dirección exacta de destino (ej. Hotel Plaza Constitución, Av. Giráldez 123).');
      setStep(1);
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones para continuar.');
      setStep(5);
      return;
    }

    if (invoiceType === 'factura' && (!invoiceRuc || !invoiceCompanyName)) {
      setErrorMsg('Para Factura Electrónica debes ingresar el RUC y la Razón Social.');
      setStep(4);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // LÍMITE DIARIO: Máximo 2 reservas por día por teléfono
      const service = SERVICES_CATALOG.find((s) => s.code === serviceCode);
      const limitCheck = await RepositoryService.checkDailyLimit(customerPhone, service?.id || serviceCode);
      if (!limitCheck.allowed) {
        if (limitCheck.reason === 'servicio_duplicado_hoy') {
          setErrorMsg(
            `Ya tienes una reserva activa de "${service?.name}" para hoy. Puedes seleccionar otro servicio o reservar para una fecha distinta.`
          );
        } else {
          setErrorMsg(
            `Has alcanzado el límite de 2 reservas diarias para el número ${customerPhone}. Comunícate al WhatsApp 929 667 586 si requieres traslados adicionales.`
          );
        }
        setLoading(false);
        return;
      }

      savePassengerIdentity(customerPhone);

      const codeSeq = Math.floor(1000 + Math.random() * 9000);
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const code = `FTX-${todayStr}-${codeSeq}`;

      let finalVoucherUrl = voucherPreview;

      if (voucherFile) {
        const uploaded = await RepositoryService.uploadVoucherImage(voucherFile, code);
        if (uploaded) {
          finalVoucherUrl = uploaded;
        }
      }

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00-05:00`).toISOString();
      const customerId = generateUUID();
      const reservationId = generateUUID();
      const paymentId = generateUUID();
      const proofId = generateUUID();

      const newRes: Reservation = {
        id: reservationId,
        code,
        customer_id: customerId,
        customer: {
          id: customerId,
          role: 'CUSTOMER',
          full_name: customerName,
          phone: customerPhone,
          dni: customerDni,
          title_degree: customerTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        service_id: service?.id || 'a1111111-1111-1111-1111-111111111111',
        service,
        vehicle_id: 'b1111111-1111-1111-1111-111111111111',
        driver_id: undefined,
        status: finalVoucherUrl ? 'PAYMENT_SUBMITTED' : 'PENDING_PAYMENT',
        flight_airline: airline,
        flight_number: '',
        flight_arrival_time: scheduledAt,
        origin,
        destination,
        scheduled_at: scheduledAt,
        passengers_count: passengersCount,
        luggage_notes: luggageNotes,
        notes,
        subtotal: quote?.subtotal || 80,
        surcharges: quote?.surcharges || 0,
        total_amount: quote?.total || 80,
        deposit_amount: quote?.depositRequired || 40,
        balance_amount: quote?.balanceRemaining || 40,
        cancellation_deadline: new Date(Date.now() + 3600000).toISOString(),
        invoice_details: {
          type: invoiceType,
          dni: invoiceDni || customerDni,
          name: invoiceName || customerName,
          ruc: invoiceRuc,
          companyName: invoiceCompanyName,
          fiscalAddress: invoiceAddress,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        passengers: [
          {
            id: generateUUID(),
            reservation_id: reservationId,
            passenger_type: 'adulto',
            name: customerName,
            dni: customerDni,
          },
        ],
        payments: finalVoucherUrl
          ? [
              {
                id: paymentId,
                reservation_id: reservationId,
                amount: quote?.depositRequired || 40,
                payment_method: paymentMethod,
                status: 'SUBMITTED',
                created_at: new Date().toISOString(),
                proofs: [
                  {
                    id: proofId,
                    payment_id: paymentId,
                    file_path: finalVoucherUrl,
                    reference_number: referenceNumber || 'VOUCHER-MANUAL',
                    uploaded_at: new Date().toISOString(),
                  },
                ],
              },
            ]
          : [],
      };

      const saveResult = await RepositoryService.saveReservation(newRes);
      if (!saveResult.success) {
        setErrorMsg(saveResult.error || 'No se pudo guardar la reserva en Supabase. Inténtalo nuevamente.');
        setLoading(false);
        return;
      }

      if (saveResult.code) {
        newRes.code = saveResult.code;
      }
      setCreatedReservation(newRes);
      setStep(6);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMsg('Ocurrió un error inesperado al procesar tu reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-xl text-slate-900 dark:text-slate-100 transition-colors">
      {/* Progress Bar Header (6 pasos fluidos) */}
      {step < 6 && (
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-crusoe-700 dark:text-crusoe-400">
              Paso {step} de 5
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              {STEP_TITLES[step]}
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-crusoe-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-4 text-xs font-semibold text-rose-900 dark:text-rose-200 shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Selección de Servicio y Revelación Condicional de Destinos */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <Car className="h-6 w-6 text-crusoe-600" />
              1. Selecciona la Modalidad de tu Servicio
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Haz clic en la opción deseada para desplegar las tarifas y destinos correspondientes.
            </p>
          </div>

          {/* Tarjetas Principales de Modalidad */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SERVICES_CATALOG.filter((s) => s.code === 'privado-aeropuerto' || s.code === 'compartido-aeropuerto').map((srv) => {
              const isSelected = serviceCode === srv.code;

              return (
                <div
                  key={srv.code}
                  onClick={() => setServiceCode(srv.code)}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                    isSelected
                      ? 'border-crusoe-600 bg-crusoe-50/90 dark:bg-crusoe-950/80 dark:border-crusoe-500 shadow-md ring-2 ring-crusoe-600/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-crusoe-300 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-950 dark:text-white text-base">{srv.name}</h3>
                    <span className="text-xs font-extrabold text-crusoe-800 dark:text-crusoe-300 bg-crusoe-100/80 dark:bg-crusoe-900/60 px-2.5 py-1 rounded-lg shrink-0">
                      {srv.code === 'privado-aeropuerto' ? 'Vehículo Completo' : 'Por Asiento (S/ 20+)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed">{srv.description}</p>
                </div>
              );
            })}
          </div>

          {/* DESPLEGABLE CONDICIONAL TRAS HACER CLIC */}
          {serviceCode && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-crusoe-800 dark:text-crusoe-400 uppercase tracking-wider">
                  {serviceCode === 'privado-aeropuerto'
                    ? '📍 Destinos para Servicio Privado (Tarifa Vehículo SUV Completo)'
                    : '📍 Destinos para Servicio Compartido (Tarifa por Asiento)'}
                </span>
              </div>

              {/* Selector de Ciudad Destino */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {DESTINATIONS_CATALOG.map((dest) => (
                  <div
                    key={dest.code}
                    onClick={() => setDestinationCityCode(dest.code)}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                      destinationCityCode === dest.code
                        ? 'border-crusoe-600 bg-crusoe-50/90 dark:bg-crusoe-950/80 dark:border-crusoe-500 shadow-sm ring-2 ring-crusoe-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-950 dark:text-white text-sm">{dest.name}</span>
                      <span className="text-xs font-extrabold text-crusoe-800 dark:text-crusoe-300 bg-crusoe-100 dark:bg-crusoe-900/80 px-2.5 py-1 rounded-lg">
                        {serviceCode === 'privado-aeropuerto'
                          ? `S/ ${dest.privatePriceSuv.toFixed(2)} total`
                          : `S/ ${dest.sharedPricePerSeat.toFixed(2)} /asiento`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5">{dest.description}</p>
                  </div>
                ))}
              </div>

              {/* Selector de Movilidad / Tipo de Unidad para Privado */}
              {serviceCode === 'privado-aeropuerto' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-extrabold text-slate-950 dark:text-white">
                    🚘 Tipo de Movilidad Deseada
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {MOBILITY_OPTIONS.map((mob) => (
                      <div
                        key={mob.code}
                        onClick={() => setMobilityCode(mob.code)}
                        className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all text-left ${
                          mobilityCode === mob.code
                            ? 'border-crusoe-600 bg-crusoe-50/80 dark:bg-crusoe-950/70 shadow-sm ring-2 ring-crusoe-600/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-950 dark:text-white block">{mob.name}</span>
                          {mob.recommended && (
                            <span className="text-[9px] font-extrabold bg-crusoe-100 dark:bg-crusoe-900 text-crusoe-800 dark:text-crusoe-300 px-1.5 py-0.5 rounded">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-crusoe-700 dark:text-crusoe-400 font-semibold block mt-0.5">
                          Capacidad: {mob.capacity}
                        </span>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">{mob.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Campo de Dirección Exacta para Privado */}
              {serviceCode === 'privado-aeropuerto' && (
                <div className="rounded-2xl border-2 border-crusoe-200 dark:border-crusoe-800 bg-crusoe-50/60 dark:bg-crusoe-950/40 p-4 space-y-2">
                  <label className="block text-xs font-extrabold text-crusoe-950 dark:text-crusoe-200 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-crusoe-700 dark:text-crusoe-400" />
                    Dirección Exacta de Destino (Obligatorio para Servicio Privado) *
                  </label>
                  <input
                    type="text"
                    value={exactAddress}
                    onChange={(e) => setExactAddress(e.target.value)}
                    placeholder="Ej. Hotel Plaza Constitución, Av. Giráldez N° 123 (Ref. Frente a la Catedral)"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                  />
                  <span className="text-[11px] text-crusoe-800 dark:text-crusoe-300 block font-medium">
                    📌 En servicio privado exclusivo nuestro chofer te llevará directamente a la puerta de tu dirección indicada.
                  </span>
                </div>
              )}

              {/* Aviso para Compartido */}
              {serviceCode === 'compartido-aeropuerto' && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 p-4 text-xs text-amber-950 dark:text-amber-200 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                    <Info className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Estado de Confirmación de Transporte (Servicio Compartido):</span>
                  </div>
                  <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-300 dark:border-amber-700 p-3 space-y-1">
                    {sharedSeatsInfo.isDepartureConfirmed ? (
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-extrabold text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>¡Salida de Transporte Confirmada! (Se alcanzaron {sharedSeatsInfo.occupiedSeats} de 3 asientos mínimos)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span>
                          Asiento Reservado • Salida de Unidad pendiente ({sharedSeatsInfo.occupiedSeats} de 3 asientos mínimos reservados para esta fecha)
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
                    {BUSINESS_CONFIG.sharedServiceNotice}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              size="lg"
              disabled={!serviceCode}
              onClick={() => {
                if (serviceCode === 'privado-aeropuerto' && !exactAddress.trim()) {
                  setErrorMsg('Ingresa la dirección exacta de destino para tu servicio privado.');
                  return;
                }
                setStep(2);
              }}
              className="w-full sm:w-auto"
            >
              Siguiente: Fecha y Aerolínea
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Fecha, Hora y Aerolínea */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-crusoe-600" />
              2. Fecha, Hora y Aerolínea
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Monitoreamos los itinerarios de vuelo para esperarte a tiempo en el aeropuerto.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-2">Fecha del Traslado *</label>
              <input
                type="date"
                value={scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-2">Hora Programada / Llegada *</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-2">Aerolínea Comercial (Opcional)</label>
              <select
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
              >
                {AIRLINES.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(3)}>
              Siguiente: Datos del Pasajero
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Pasajero, Contacto y Equipaje */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <User className="h-6 w-6 text-crusoe-600" />
              3. Datos del Pasajero y Equipaje
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Tu número de WhatsApp será el canal directo para la confirmación de tu viaje.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">Trato / Título</label>
                <select
                  value={customerTitle}
                  onChange={(e) => setCustomerTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                >
                  <option value="Sr.">Sr.</option>
                  <option value="Sra.">Sra.</option>
                  <option value="Srta.">Srta.</option>
                  <option value="Ing.">Ing.</option>
                  <option value="Lic.">Lic.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Dra.">Dra.</option>
                  <option value="Mag.">Mag.</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">Nombre Completo *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza Ramos"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">WhatsApp / Celular (9 dígitos) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-500">+51</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="929667586"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-12 pr-4 py-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">DNI / Documento de Identidad</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={customerDni}
                  onChange={(e) => setCustomerDni(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                  placeholder="Ej. 44556677"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">Detalles de Equipaje</label>
                <input
                  type="text"
                  value={luggageNotes}
                  onChange={(e) => setLuggageNotes(e.target.value)}
                  placeholder="Ej. 2 maletas de 23kg"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">Cantidad de Pasajeros</label>
                <select
                  value={passengersCount}
                  onChange={(e) => setPassengersCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                >
                  <option value={1}>1 Pasajero / Asiento</option>
                  <option value={2}>2 Pasajeros / Asientos</option>
                  <option value={3}>3 Pasajeros / Asientos</option>
                  <option value={4}>4 Pasajeros (Máximo SUV)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button
              onClick={() => {
                if (!customerName.trim() || customerPhone.replace(/[^0-9]/g, '').length < 9) {
                  setErrorMsg('Ingresa tu nombre y un número de WhatsApp válido de 9 dígitos.');
                  return;
                }
                setStep(4);
              }}
            >
              Siguiente: Comprobante Fiscal
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Comprobante Fiscal */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-crusoe-600" />
              4. Comprobante de Pago (Boleta / Factura)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Emitimos comprobantes electrónicos autorizados por SUNAT.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'ninguno', label: 'Sin Comprobante' },
              { type: 'boleta', label: 'Boleta Electrónica' },
              { type: 'factura', label: 'Factura Electrónica' },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setInvoiceType(item.type as InvoiceType)}
                className={`rounded-2xl border-2 p-3.5 text-center text-xs font-extrabold transition-all ${
                  invoiceType === item.type
                    ? 'border-crusoe-600 bg-crusoe-50/90 dark:bg-crusoe-950 text-crusoe-950 dark:text-crusoe-200 shadow-sm ring-2 ring-crusoe-600/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {invoiceType === 'boleta' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Datos para Boleta Electrónica</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">DNI del Titular</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={invoiceDni || customerDni}
                    onChange={(e) => setInvoiceDni(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="8 dígitos"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-950 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={invoiceName || customerName}
                    onChange={(e) => setInvoiceName(e.target.value)}
                    placeholder="Nombre en la boleta"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-950 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {invoiceType === 'factura' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Datos para Factura Electrónica</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">RUC (11 dígitos) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    value={invoiceRuc}
                    onChange={(e) => setInvoiceRuc(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="20601234567"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-950 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Razón Social *</label>
                  <input
                    type="text"
                    value={invoiceCompanyName}
                    onChange={(e) => setInvoiceCompanyName(e.target.value)}
                    placeholder="Empresa S.A.C."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-950 dark:text-white font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Dirección Fiscal</label>
                  <input
                    type="text"
                    value={invoiceAddress}
                    onChange={(e) => setInvoiceAddress(e.target.value)}
                    placeholder="Av. Principal 123, Huancayo"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-950 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(5)}>
              Siguiente: Cotización y Pago
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Cotización, Términos y Pago del Adelanto */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-crusoe-600" />
              5. Resumen de Cotización y Pago
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Revisa tu cotización. Puedes abonar el adelanto del 20% por Yape o Plin para asegurar tu reserva, o reservar sin pago y pagarlo antes de la hora programada.
            </p>
          </div>

          {/* Resumen */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-5 space-y-3">
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span>Modalidad:</span>
              <span className="font-bold text-slate-950 dark:text-white">
                {serviceCode === 'privado-aeropuerto' ? 'Servicio Privado Exclusivo' : 'Servicio Compartido por Asiento'}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span>Destino:</span>
              <span className="font-bold text-slate-950 dark:text-white">{destination}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span>Monto Base del Servicio:</span>
              <span className="font-bold text-slate-950 dark:text-white">S/ {quote?.subtotal.toFixed(2) || '80.00'}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-950 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-3">
              <span>Monto Total del Viaje:</span>
              <span className="text-base text-crusoe-800 dark:text-crusoe-400 font-extrabold">S/ {quote?.total.toFixed(2) || '80.00'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-crusoe-200 dark:border-crusoe-800 bg-crusoe-50/80 dark:bg-crusoe-950/60 p-3 text-center">
                <span className="text-[10px] font-bold text-crusoe-800 dark:text-crusoe-300 uppercase block">Adelanto (20%)</span>
                <span className="text-lg font-extrabold text-crusoe-950 dark:text-crusoe-200">S/ {quote?.depositRequired.toFixed(2) || '16.00'}</span>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-center">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase block">Saldo al Abordar (80%)</span>
                <span className="text-lg font-extrabold text-slate-950 dark:text-white">S/ {quote?.balanceRemaining.toFixed(2) || '64.00'}</span>
              </div>
            </div>
          </div>

          {/* Selector de Método de Pago */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-950 dark:text-slate-200">Método de Pago para el Adelanto (opcional ahora)</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: 'yape', name: 'Yape' },
                { code: 'plin', name: 'Plin' },
                { code: 'bcp', name: 'BCP' },
              ].map((m) => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => setPaymentMethod(m.code as PaymentMethod)}
                  className={`rounded-2xl border-2 p-3 text-center text-xs font-extrabold transition-all ${
                    paymentMethod === m.code
                      ? 'border-crusoe-600 bg-crusoe-50/90 dark:bg-crusoe-950 text-crusoe-950 dark:text-crusoe-200 shadow-sm ring-2 ring-crusoe-600/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-crusoe-200 dark:border-crusoe-800 bg-crusoe-50/70 dark:bg-crusoe-950/60 p-4 text-center space-y-2">
              {paymentMethod === 'yape' && (
                <div>
                  <span className="text-xs font-bold text-crusoe-900 dark:text-crusoe-300 block uppercase">Número Oficial de Yape</span>
                  <span className="text-2xl font-extrabold text-crusoe-950 dark:text-crusoe-100 block mt-0.5">929 667 586</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block font-bold mt-1">Titular: JORGE TRU.</span>
                </div>
              )}
              {paymentMethod === 'plin' && (
                <div>
                  <span className="text-xs font-bold text-crusoe-900 dark:text-crusoe-300 block uppercase">Número Oficial de Plin</span>
                  <span className="text-2xl font-extrabold text-crusoe-950 dark:text-crusoe-100 block mt-0.5">929 667 586</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block font-bold mt-1">Titular: JORGE ANTONIO TRUCIOS MEZA</span>
                </div>
              )}
              {paymentMethod === 'bcp' && (
                <div className="space-y-2 text-xs text-slate-900 dark:text-slate-100 font-medium">
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl p-2.5 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold">
                    ✓ Cuenta Bancaria BCP Oficial Habilitada para Transferencias Directas e Interbancarias (CCI).
                  </div>
                  <div>
                    <span className="font-bold block text-slate-600 dark:text-slate-400">Titular de la Cuenta:</span>
                    <span className="font-bold text-crusoe-900 dark:text-crusoe-300 text-sm">JORGE ANTONIO TRUCIOS MEZA</span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-600 dark:text-slate-400">Número de Cuenta BCP:</span>
                    <span className="font-mono text-sm font-extrabold text-crusoe-950 dark:text-white select-all bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg inline-block">
                      40002021972079
                    </span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-600 dark:text-slate-400">CCI (Código de Cuenta Interbancario):</span>
                    <span className="font-mono text-xs font-extrabold text-crusoe-950 dark:text-white select-all bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg inline-block">
                      00240010202197207901
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Subir Voucher */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center bg-slate-50 dark:bg-slate-800/40">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleVoucherUpload}
                id="voucher-file-input"
                className="hidden"
              />
              <label htmlFor="voucher-file-input" className="cursor-pointer space-y-2 block">
                <Upload className="h-7 w-7 text-crusoe-600 mx-auto" />
                <span className="text-xs font-bold text-crusoe-800 dark:text-crusoe-300 block">
                  Toca aquí para adjuntar foto de comprobante de pago (Opcional)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">JPG, PNG o PDF (Máx. 5MB)</span>
              </label>
            </div>

            {voucherPreview && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center gap-3">
                <img src={voucherPreview} alt="Vista previa del comprobante" className="h-12 w-12 rounded-lg object-cover border" />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Comprobante seleccionado ✓</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{voucherFile?.name}</span>
                </div>
              </div>
            )}

            {/* Advertencia si NO sube comprobante */}
            {!voucherFile && (
              <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-xs">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <span>⚠️ Reserva sin comprobante de pago</span>
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  Puedes reservar sin subir el comprobante ahora, pero <strong>si no realizas el pago del adelanto (S/ {quote?.depositRequired.toFixed(2) || '16.00'}) antes de la fecha y hora programada de tu servicio</strong>, tu reserva será <strong>rechazada y eliminada automáticamente</strong>. Te recomendamos pagar lo antes posible para asegurar tu viaje.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-crusoe-600 focus:ring-crusoe-500 mt-0.5"
              />
              <span className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                Acepto los{' '}
                <Link href="/terminos" target="_blank" className="font-bold text-crusoe-700 dark:text-crusoe-400 underline">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/cancelaciones" target="_blank" className="font-bold text-crusoe-700 dark:text-crusoe-400 underline">
                  Política de Cancelación
                </Link>{' '}
                (Cancelación gratuita en los primeros 60 min).
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button size="lg" isLoading={loading} onClick={handleCreateReservation}>
              {voucherFile ? 'Confirmar y Enviar Reserva con Pago' : 'Reservar sin Pago (Pagar después)'}
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: Confirmación Final */}
      {step === 6 && createdReservation && (
        <div className="space-y-6 text-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crusoe-100 dark:bg-crusoe-900/60 text-crusoe-700 dark:text-crusoe-300 mx-auto shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-crusoe-800 dark:text-crusoe-400">
              ¡Reserva Registrada Exitosamente!
            </span>
            <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">{createdReservation.code}</h2>
            <div className="mt-2 flex justify-center">
              <Badge status={createdReservation.status} />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 p-5 text-xs text-amber-950 dark:text-amber-200 space-y-3 max-w-lg mx-auto text-left shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-sm">
              <Bell className="h-5 w-5 text-amber-600 animate-bounce shrink-0" />
              <span>Notificación Automática a Coordinación</span>
            </div>
            <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
              Haz clic en el botón verde a continuación para enviar la alerta de tu reserva <strong>{createdReservation.code}</strong> al WhatsApp oficial (<strong>929 667 586</strong>).
            </p>
            <div className="pt-1">
              <a
                href={WhatsAppService.getAdminNewBookingAlertLink(createdReservation)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-crusoe-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-crusoe-600/30 hover:bg-crusoe-700 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                Enviar Alerta al Administrador (WhatsApp 929 667 586)
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-5 text-left text-xs text-slate-900 dark:text-slate-100 space-y-2.5 max-w-lg mx-auto">
            <div className="flex justify-between">
              <span className="font-bold text-slate-600 dark:text-slate-400">Pasajero Principal:</span>
              <span className="font-bold text-slate-950 dark:text-white">{createdReservation.customer?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-600 dark:text-slate-400">Origen / Destino:</span>
              <span className="font-semibold text-slate-950 dark:text-white">
                {createdReservation.origin} ➔ {createdReservation.destination}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-600 dark:text-slate-400">Modalidad:</span>
              <span className="font-semibold text-slate-950 dark:text-white">
                {createdReservation.service_id === 'a1111111-1111-1111-1111-111111111111'
                  ? 'Servicio Privado Exclusivo SUV'
                  : 'Servicio Compartido por Asiento'}
              </span>
            </div>

            {createdReservation.service_id === 'a2222222-2222-2222-2222-222222222222' && (
              <div className="bg-amber-50 dark:bg-amber-950/60 rounded-xl p-2.5 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                ℹ️ <strong>Estado de tu Asiento:</strong> Tu cobro y lugar están 100% asegurados. La salida de la unidad se activa al completarse min. 3 asientos ocupados.
              </div>
            )}

            {createdReservation.payments && createdReservation.payments.length > 0 ? (
              <>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-sm text-slate-950 dark:text-white">
                  <span>Adelanto (20%):</span>
                  <span className="text-crusoe-800 dark:text-crusoe-400 font-extrabold">S/ {createdReservation.deposit_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 text-xs">
                  <span>Saldo a pagar al abordar (80%):</span>
                  <span className="font-bold text-slate-950 dark:text-white">S/ {createdReservation.balance_amount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-2">
                <div className="flex justify-between font-bold text-sm text-slate-950 dark:text-white">
                  <span>Total del Viaje:</span>
                  <span className="text-crusoe-800 dark:text-crusoe-400 font-extrabold">S/ {createdReservation.total_amount.toFixed(2)}</span>
                </div>
                <div className="rounded-xl border-2 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/60 p-3 text-[11px] text-rose-900 dark:text-rose-200 font-bold space-y-1">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>⚠️ Reserva SIN comprobante de pago adjunto</span>
                  </div>
                  <p className="font-medium leading-relaxed">
                    Debes realizar el pago del adelanto de <strong>S/ {createdReservation.deposit_amount.toFixed(2)}</strong> antes de la fecha y hora programada de tu servicio. De lo contrario, tu reserva será <strong>rechazada y eliminada</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 max-w-lg mx-auto">
            <Link href={`/reserva/${createdReservation.code}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Ver Estado de Mi Reserva
              </Button>
            </Link>
            <Link href="/mis-reservas" className="w-full sm:w-auto">
              <Button className="w-full">
                Ir a Mis Reservas
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingWizardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-6 text-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-crusoe-700 dark:text-crusoe-400">
            Fast Travel Xauxa — Servicio Ejecutivo & Turístico
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white mt-1">
            Asistente de Reserva y Cotización
          </h1>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-700 dark:text-slate-300 font-medium">Cargando asistente de reserva...</div>}>
          <BookingWizardForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

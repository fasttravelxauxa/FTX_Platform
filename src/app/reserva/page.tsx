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
  FileCheck,
  Building2,
  Copy,
  Info,
  User,
  CreditCard,
  Building,
  Check,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SERVICES_CATALOG, AIRLINES, DESTINATIONS_CATALOG, PAYMENT_METHODS_INFO, BUSINESS_CONFIG } from '@/lib/constants';
import { PricingService } from '@/lib/services/pricing';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { RepositoryService, savePassengerIdentity, generateUUID } from '@/lib/services/repository';
import { Reservation, PriceQuote, PaymentMethod, InvoiceType } from '@/lib/types';

const STEP_TITLES: { [key: number]: string } = {
  1: 'Modalidad y Destino',
  2: 'Fecha y Vuelo',
  3: 'Pasajero y Equipaje',
  4: 'Comprobante Fiscal',
  5: 'Cotización y Pago',
  6: 'Confirmación',
};

function BookingWizardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialService = searchParams.get('servicio') || 'privado-aeropuerto';

  // Wizard state (Fluid 6 steps)
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form Fields — Service selection & City Destination
  const [serviceCode, setServiceCode] = useState<string>(initialService);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState<string>('09:30');
  const [origin, setOrigin] = useState<string>('Aeropuerto de Jauja (JAU)');

  // Destination City Code, Huancayo dropoff mode & Exact Address
  const [destinationCityCode, setDestinationCityCode] = useState<string>('huancayo');
  const [huancayoDropoffType, setHuancayoDropoffType] = useState<'plaza' | 'custom_address'>('custom_address');
  const [exactAddress, setExactAddress] = useState<string>('');
  const [destination, setDestination] = useState<string>('Huancayo (Plaza Constitución / Domicilio)');

  const [passengersCount, setPassengersCount] = useState<number>(1);
  const [hoursCount, setHoursCount] = useState<number>(2);

  // Customer Contact info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerDni, setCustomerDni] = useState<string>('');
  const [customerTitle, setCustomerTitle] = useState<string>('Sr.');

  // Flight Info
  const [airline, setAirline] = useState<string>('LATAM');
  const [flightNumber, setFlightNumber] = useState<string>('');
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

  // Clear specific field error
  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Scroll smoothly to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setErrorMsg(null);
    setFieldErrors({});
  }, [step]);

  // Adjust defaults when serviceCode changes
  useEffect(() => {
    if (serviceCode === 'compartido-aeropuerto') {
      setDestinationCityCode('huancayo');
      setDestination('Plaza Constitución (Centro de Huancayo)');
    }
  }, [serviceCode]);

  // Consultar ocupación en tiempo real para el servicio compartido
  useEffect(() => {
    if (serviceCode === 'compartido-aeropuerto' && scheduledDate) {
      RepositoryService.getSharedOccupiedSeatsCount(scheduledDate, scheduledTime).then(setSharedSeatsInfo);
    }
  }, [serviceCode, scheduledDate, scheduledTime]);

  // Update full destination string whenever destination city or exact address changes
  useEffect(() => {
    if (serviceCode === 'compartido-aeropuerto') {
      setDestination('Plaza Constitución (Centro de Huancayo)');
      return;
    }

    const destRoute = DESTINATIONS_CATALOG.find((d) => d.code === destinationCityCode);
    const cityName = destRoute ? destRoute.name.split(' (')[0] : 'Huancayo';

    if (destinationCityCode === 'huancayo') {
      if (huancayoDropoffType === 'plaza') {
        setDestination('Plaza Constitución (Centro de Huancayo)');
      } else {
        setDestination(exactAddress.trim() ? `Huancayo — ${exactAddress.trim()}` : 'Huancayo (Dirección Particular)');
      }
    } else {
      setDestination(exactAddress.trim() ? `${cityName} — ${exactAddress.trim()}` : cityName);
    }
  }, [serviceCode, destinationCityCode, huancayoDropoffType, exactAddress]);

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
      // Incomplete calculation safe fallback
    }
  }, [serviceCode, origin, destination, destinationCityCode, passengersCount, hoursCount]);

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, voucher: 'Adjunte una imagen JPG, PNG, WEBP o un PDF válido.' }));
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, voucher: 'El comprobante no debe superar los 5MB.' }));
      e.target.value = '';
      return;
    }

    setVoucherFile(file);
    setVoucherPreview(URL.createObjectURL(file));
    clearFieldError('voucher');
  };

  // Validation function for each step
  const handleNextStep = (currentStep: number) => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!serviceCode) {
        errors.serviceCode = 'Seleccione una modalidad de servicio.';
      }
      if (serviceCode === 'privado-aeropuerto') {
        if (!destinationCityCode) {
          errors.destinationCityCode = 'Seleccione una ciudad de destino.';
        } else if (destinationCityCode === 'huancayo') {
          if (huancayoDropoffType === 'custom_address' && !exactAddress.trim()) {
            errors.exactAddress = 'Ingrese la dirección exacta de su hotel o domicilio en Huancayo.';
          }
        } else {
          if (!exactAddress.trim()) {
            errors.exactAddress = 'Ingrese la dirección o punto de llegada en el destino seleccionado.';
          }
        }
      }
    } else if (currentStep === 2) {
      if (!scheduledDate) {
        errors.scheduledDate = 'Seleccione la fecha de su viaje.';
      }
      if (!scheduledTime) {
        errors.scheduledTime = 'Seleccione la hora de llegada o salida.';
      }
    } else if (currentStep === 3) {
      if (!customerName.trim()) {
        errors.customerName = 'Ingrese sus nombres y apellidos completos.';
      }
      const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.length !== 9) {
        errors.customerPhone = 'Ingrese un número de WhatsApp válido de 9 dígitos.';
      }
      if (customerDni.trim() && customerDni.replace(/[^0-9]/g, '').length < 8) {
        errors.customerDni = 'El DNI debe tener al menos 8 dígitos.';
      }
    } else if (currentStep === 4) {
      if (invoiceType === 'factura') {
        const cleanRuc = invoiceRuc.replace(/[^0-9]/g, '');
        if (cleanRuc.length !== 11) {
          errors.invoiceRuc = 'El RUC debe tener exactamente 11 dígitos numéricos.';
        }
        if (!invoiceCompanyName.trim()) {
          errors.invoiceCompanyName = 'Ingrese la Razón Social de la empresa.';
        }
        if (!invoiceAddress.trim()) {
          errors.invoiceAddress = 'Ingrese la Dirección Fiscal de la empresa.';
        }
      } else if (invoiceType === 'boleta') {
        if (invoiceDni.trim() && invoiceDni.replace(/[^0-9]/g, '').length !== 8) {
          errors.invoiceDni = 'El DNI para la boleta debe tener 8 dígitos.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Smooth scroll to the first error field
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    setFieldErrors({});
    setStep(currentStep + 1);
  };

  const handleCreateReservation = async () => {
    const errors: Record<string, string> = {};

    if (!acceptedTerms) {
      errors.acceptedTerms = 'Debe aceptar los Términos y Condiciones para formalizar su reserva.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const el = document.getElementById('field-acceptedTerms');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setFieldErrors({});

    try {
      // LÍMITE DIARIO: Máximo 2 reservas por día por teléfono
      const service = SERVICES_CATALOG.find((s) => s.code === serviceCode);
      const limitCheck = await RepositoryService.checkDailyLimit(customerPhone, service?.id || serviceCode);
      if (!limitCheck.allowed) {
        if (limitCheck.reason === 'servicio_duplicado_hoy') {
          setErrorMsg(
            `Ya cuenta con una reserva activa de "${service?.name}" para hoy. Puede seleccionar otra modalidad o programar para otra fecha.`
          );
        } else {
          setErrorMsg(
            `Ha alcanzado el límite diario para el número ${customerPhone}. Comuníquese al WhatsApp de coordinación si requiere traslados adicionales.`
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
          full_name: customerTitle ? `${customerTitle} ${customerName}` : customerName,
          phone: customerPhone,
          dni: customerDni || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        service_id: service?.id || 'a1111111-1111-1111-1111-111111111111',
        service: service,
        origin,
        destination,
        scheduled_at: scheduledAt,
        flight_airline: airline || 'Particular',
        flight_number: flightNumber || undefined,
        status: voucherFile ? 'PAYMENT_SUBMITTED' : 'PENDING_PAYMENT',
        passengers_count: passengersCount,
        subtotal: quote?.subtotal || 80,
        surcharges: quote?.surcharges || 0,
        total_amount: quote?.total || 80,
        deposit_amount: quote?.depositRequired || 16,
        balance_amount: quote?.balanceRemaining || 64,
        invoice_details: {
          type: invoiceType,
          ruc: invoiceRuc || undefined,
          companyName: invoiceCompanyName || undefined,
          dni: invoiceDni || customerDni || undefined,
          name: invoiceName || customerName || undefined,
          fiscalAddress: invoiceAddress || undefined,
        },
        luggage_notes: luggageNotes || undefined,
        notes: notes || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payments: voucherFile
          ? [
              {
                id: paymentId,
                reservation_id: reservationId,
                amount: quote?.depositRequired || 16,
                payment_method: paymentMethod,
                status: 'SUBMITTED',
                created_at: new Date().toISOString(),
                proofs: [
                  {
                    id: proofId,
                    payment_id: paymentId,
                    file_path: finalVoucherUrl || '',
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
        setErrorMsg(saveResult.error || 'No se pudo registrar la reserva. Inténtelo nuevamente.');
        setLoading(false);
        return;
      }

      if (saveResult.code) {
        newRes.code = saveResult.code;
      }
      setCreatedReservation(newRes);
      setStep(6);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      setErrorMsg('Ocurrió un error inesperado al procesar su reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-xl text-slate-900 dark:text-slate-100 transition-colors">
      {/* Progress Bar Header */}
      {step < 6 && (
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-crusoe-700 dark:text-crusoe-400">
              Paso {step} de 5
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
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

      {/* STEP 1: Modalidad y Revelación de Destinos */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <Car className="h-6 w-6 text-crusoe-600" />
              1. Seleccione la Modalidad de Servicio
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Flota ejecutiva oficial en camioneta SUV del año con aire acondicionado y asientos confortables.
            </p>
          </div>

          {/* Tarjetas Principales de Modalidad */}
          <div id="field-serviceCode" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SERVICES_CATALOG.filter((s) => s.code === 'privado-aeropuerto' || s.code === 'compartido-aeropuerto').map((srv) => {
              const isSelected = serviceCode === srv.code;

              return (
                <div
                  key={srv.code}
                  onClick={() => {
                    setServiceCode(srv.code);
                    clearFieldError('serviceCode');
                  }}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                    isSelected
                      ? 'border-crusoe-600 bg-crusoe-50/90 dark:bg-crusoe-950/80 dark:border-crusoe-500 shadow-md ring-2 ring-crusoe-600/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-crusoe-300 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-950 dark:text-white text-base">{srv.name}</h3>
                    <span className="text-xs font-bold text-crusoe-800 dark:text-crusoe-300 bg-crusoe-100/80 dark:bg-crusoe-900/60 px-2.5 py-1 rounded-lg shrink-0">
                      {srv.code === 'privado-aeropuerto' ? 'Exclusivo SUV' : 'Por Asiento'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed">{srv.description}</p>
                </div>
              );
            })}
          </div>

          {fieldErrors.serviceCode && (
            <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {fieldErrors.serviceCode}
            </p>
          )}

          {/* DESPLEGABLE CONDICIONAL PARA SERVICIO PRIVADO */}
          {serviceCode === 'privado-aeropuerto' && (
            <div className="space-y-5 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
              <div>
                <span className="text-xs font-bold text-crusoe-800 dark:text-crusoe-400 uppercase tracking-wider block">
                  Destino del Servicio Privado Exclusivo
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Seleccione la ciudad o circuito turístico para su traslado:
                </p>
              </div>

              {/* Selector de Ciudad Destino */}
              <div id="field-destinationCityCode" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {DESTINATIONS_CATALOG.map((dest) => (
                  <div
                    key={dest.code}
                    onClick={() => {
                      setDestinationCityCode(dest.code);
                      clearFieldError('destinationCityCode');
                    }}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                      destinationCityCode === dest.code
                        ? 'border-crusoe-600 bg-crusoe-50/90 dark:bg-crusoe-950/80 dark:border-crusoe-500 shadow-sm ring-2 ring-crusoe-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-950 dark:text-white text-sm">{dest.name}</span>
                      <span className="text-xs font-bold text-crusoe-800 dark:text-crusoe-300 bg-crusoe-100 dark:bg-crusoe-900/80 px-2 py-0.5 rounded">
                        S/ {dest.privatePriceSuv.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5">{dest.description}</p>
                  </div>
                ))}
              </div>

              {fieldErrors.destinationCityCode && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {fieldErrors.destinationCityCode}
                </p>
              )}

              {/* Opciones de Parada para Huancayo */}
              {destinationCityCode === 'huancayo' && (
                <div className="rounded-2xl border border-crusoe-200 dark:border-crusoe-800 bg-crusoe-50/50 dark:bg-crusoe-950/40 p-4 space-y-3">
                  <span className="text-xs font-bold text-crusoe-950 dark:text-crusoe-200 block">
                    Punto de Llegada en Huancayo:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div
                      onClick={() => setHuancayoDropoffType('custom_address')}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        huancayoDropoffType === 'custom_address'
                          ? 'border-crusoe-600 bg-white dark:bg-slate-900 shadow-sm font-bold text-crusoe-900 dark:text-crusoe-300'
                          : 'border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs block font-bold">Dirección Exacta de Hotel / Domicilio</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Traslado puerta a puerta</span>
                    </div>

                    <div
                      onClick={() => setHuancayoDropoffType('plaza')}
                      className={`cursor-pointer rounded-xl border p-3 transition-all ${
                        huancayoDropoffType === 'plaza'
                          ? 'border-crusoe-600 bg-white dark:bg-slate-900 shadow-sm font-bold text-crusoe-900 dark:text-crusoe-300'
                          : 'border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-xs block font-bold">Plaza Constitución (Huancayo Centro)</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Punto central de la ciudad</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo de Dirección Exacta */}
              {(destinationCityCode !== 'huancayo' || huancayoDropoffType === 'custom_address') && (
                <div id="field-exactAddress" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-crusoe-600" />
                    Dirección Exacta de Destino o Referencia *
                  </label>
                  <input
                    type="text"
                    value={exactAddress}
                    onChange={(e) => {
                      setExactAddress(e.target.value);
                      clearFieldError('exactAddress');
                    }}
                    placeholder="Ej. Hotel de Turistas Huancayo / Jr. Ancash N° 123 (Ref. Frente a parque)"
                    className={`w-full rounded-xl border ${
                      fieldErrors.exactAddress ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm`}
                  />
                  {fieldErrors.exactAddress ? (
                    <p className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {fieldErrors.exactAddress}
                    </p>
                  ) : (
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
                      En servicio privado exclusivo su conductor lo llevará directamente a la puerta de la dirección indicada.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* DESPLEGABLE PARA SERVICIO COMPARTIDO */}
          {serviceCode === 'compartido-aeropuerto' && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
              <div className="rounded-2xl border border-crusoe-300 dark:border-crusoe-800 bg-crusoe-50/70 dark:bg-crusoe-950/40 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-crusoe-900 dark:text-crusoe-300 text-sm">
                    Ruta Compartida Oficial: Aeropuerto Jauja ➔ Plaza Constitución
                  </span>
                  <span className="font-bold text-crusoe-800 dark:text-crusoe-300 bg-crusoe-100 dark:bg-crusoe-900 px-2.5 py-1 rounded">
                    S/ 20.00 / asiento
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                  En la modalidad compartida, la parada final única establecida es en la <strong>Plaza Constitución (Centro de Huancayo)</strong>. Máximo 4 pasajeros por unidad SUV.
                </p>
              </div>

              {/* Aviso de confirmación compartida */}
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 p-4 text-xs text-amber-950 dark:text-amber-200 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Estado de Confirmación de Transporte:</span>
                </div>
                <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-300 dark:border-amber-700 p-3 space-y-1">
                  {sharedSeatsInfo.isDepartureConfirmed ? (
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Salida de Transporte Confirmada (Se alcanzaron {sharedSeatsInfo.occupiedSeats} de 3 asientos mínimos)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>
                        Asiento Reservado • Salida de Unidad sujeta a completar mínimo 3 asientos para la fecha programada.
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
                  {BUSINESS_CONFIG.sharedServiceNotice}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              size="lg"
              disabled={!serviceCode}
              onClick={() => handleNextStep(1)}
              className="w-full sm:w-auto"
            >
              <span>Siguiente: Fecha y Vuelo</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Fecha, Hora y Vuelo */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-crusoe-600" />
              2. Itinerario y Vuelo
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Monitoreamos los itinerarios aéreos para esperarlo puntualmente a su llegada.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div id="field-scheduledDate">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                Fecha del Traslado *
              </label>
              <input
                type="date"
                value={scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  clearFieldError('scheduledDate');
                }}
                className={`w-full rounded-xl border ${
                  fieldErrors.scheduledDate ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                } bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm`}
              />
              {fieldErrors.scheduledDate && (
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.scheduledDate}
                </p>
              )}
            </div>

            <div id="field-scheduledTime">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                Hora Programada / Llegada *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => {
                  setScheduledTime(e.target.value);
                  clearFieldError('scheduledTime');
                }}
                className={`w-full rounded-xl border ${
                  fieldErrors.scheduledTime ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                } bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm`}
              />
              {fieldErrors.scheduledTime && (
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.scheduledTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                Aerolínea (Opcional)
              </label>
              <select
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
              >
                {AIRLINES.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                Número de Vuelo (Opcional)
              </label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="Ej. LA 2105"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Atrás
            </Button>
            <Button onClick={() => handleNextStep(2)}>
              <span>Siguiente: Datos del Pasajero</span>
              <ArrowRight className="h-4 w-4 ml-1" />
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
              3. Datos del Pasajero Titular
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Ingrese datos completos y precisos para una coordinación formal y segura de su viaje.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  Trato / Título
                </label>
                <select
                  value={customerTitle}
                  onChange={(e) => setCustomerTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                >
                  <option value="Sr.">Sr.</option>
                  <option value="Sra.">Sra.</option>
                  <option value="Srta.">Srta.</option>
                  <option value="Ing.">Ing.</option>
                  <option value="Lic.">Lic.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Dra.">Dra.</option>
                </select>
              </div>

              <div id="field-customerName" className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  Nombres y Apellidos Completos *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    clearFieldError('customerName');
                  }}
                  placeholder="Ej. Carlos Mendoza Ramos"
                  className={`w-full rounded-xl border ${
                    fieldErrors.customerName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm`}
                />
                {fieldErrors.customerName && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.customerName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div id="field-customerPhone">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  WhatsApp / Teléfono (9 dígitos) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500">+51</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''));
                      clearFieldError('customerPhone');
                    }}
                    placeholder="929667586"
                    className={`w-full rounded-xl border ${
                      fieldErrors.customerPhone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-white dark:bg-slate-800 pl-12 pr-4 py-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm`}
                  />
                </div>
                {fieldErrors.customerPhone && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.customerPhone}
                  </p>
                )}
              </div>

              <div id="field-customerDni">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  DNI / Documento de Identidad
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={customerDni}
                  onChange={(e) => {
                    setCustomerDni(e.target.value.replace(/[^0-9A-Za-z]/g, ''));
                    clearFieldError('customerDni');
                  }}
                  placeholder="Ej. 44556677"
                  className={`w-full rounded-xl border ${
                    fieldErrors.customerDni ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm`}
                />
                {fieldErrors.customerDni && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.customerDni}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  Equipaje y Maletas
                </label>
                <input
                  type="text"
                  value={luggageNotes}
                  onChange={(e) => setLuggageNotes(e.target.value)}
                  placeholder="Ej. 2 maletas medianas"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  Cantidad de Pasajeros
                </label>
                <select
                  value={passengersCount}
                  onChange={(e) => setPassengersCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-950 dark:text-white font-medium focus:border-crusoe-600 shadow-sm"
                >
                  <option value={1}>1 Pasajero / Asiento</option>
                  <option value={2}>2 Pasajeros / Asientos</option>
                  <option value={3}>3 Pasajeros / Asientos</option>
                  <option value={4}>4 Pasajeros (Capacidad Máxima SUV)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Atrás
            </Button>
            <Button onClick={() => handleNextStep(3)}>
              <span>Siguiente: Comprobante Fiscal</span>
              <ArrowRight className="h-4 w-4 ml-1" />
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
              4. Comprobante Fiscal (Boleta / Factura)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Emitimos comprobantes electrónicos oficiales para sustento de gastos.
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
                onClick={() => {
                  setInvoiceType(item.type as InvoiceType);
                  setFieldErrors({});
                }}
                className={`rounded-2xl border-2 p-3.5 text-center text-xs font-bold transition-all ${
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
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Datos para Boleta Electrónica
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div id="field-invoiceDni">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DNI del Titular
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={invoiceDni || customerDni}
                    onChange={(e) => {
                      setInvoiceDni(e.target.value.replace(/[^0-9]/g, ''));
                      clearFieldError('invoiceDni');
                    }}
                    placeholder="8 dígitos"
                    className={`w-full rounded-xl border ${
                      fieldErrors.invoiceDni ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-950 dark:text-white font-medium`}
                  />
                  {fieldErrors.invoiceDni && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.invoiceDni}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={invoiceName || customerName}
                    onChange={(e) => setInvoiceName(e.target.value)}
                    placeholder="Nombre en la boleta"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-950 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {invoiceType === 'factura' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Datos para Factura Electrónica (Empresa)
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div id="field-invoiceRuc">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    RUC (11 dígitos) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    value={invoiceRuc}
                    onChange={(e) => {
                      setInvoiceRuc(e.target.value.replace(/[^0-9]/g, ''));
                      clearFieldError('invoiceRuc');
                    }}
                    placeholder="20601234567"
                    className={`w-full rounded-xl border ${
                      fieldErrors.invoiceRuc ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-950 dark:text-white font-medium`}
                  />
                  {fieldErrors.invoiceRuc && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.invoiceRuc}
                    </p>
                  )}
                </div>

                <div id="field-invoiceCompanyName">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    value={invoiceCompanyName}
                    onChange={(e) => {
                      setInvoiceCompanyName(e.target.value);
                      clearFieldError('invoiceCompanyName');
                    }}
                    placeholder="Empresa S.A.C."
                    className={`w-full rounded-xl border ${
                      fieldErrors.invoiceCompanyName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-950 dark:text-white font-medium`}
                  />
                  {fieldErrors.invoiceCompanyName && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.invoiceCompanyName}
                    </p>
                  )}
                </div>

                <div id="field-invoiceAddress" className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dirección Fiscal *
                  </label>
                  <input
                    type="text"
                    value={invoiceAddress}
                    onChange={(e) => {
                      setInvoiceAddress(e.target.value);
                      clearFieldError('invoiceAddress');
                    }}
                    placeholder="Av. Principal 123, Huancayo"
                    className={`w-full rounded-xl border ${
                      fieldErrors.invoiceAddress ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-950 dark:text-white font-medium`}
                  />
                  {fieldErrors.invoiceAddress && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.invoiceAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Atrás
            </Button>
            <Button onClick={() => handleNextStep(4)}>
              <span>Siguiente: Cotización y Pago</span>
              <ArrowRight className="h-4 w-4 ml-1" />
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
              5. Resumen de Cotización y Adelanto
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Revise el desglose de su viaje. Puede asegurar su cupo con el 20% de adelanto mediante Yape, Plin o Transferencia BCP, o formalizar ahora y transferir antes de su horario programado.
            </p>
          </div>

          {/* Resumen */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 p-5 space-y-3">
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span>Modalidad:</span>
              <span className="font-bold text-slate-950 dark:text-white">
                {serviceCode === 'privado-aeropuerto' ? 'Servicio Privado Exclusivo (SUV del Año)' : 'Servicio Compartido por Asiento'}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span>Ruta y Destino:</span>
              <span className="font-bold text-slate-950 dark:text-white">{destination}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
              <span>Pasajeros:</span>
              <span className="font-bold text-slate-950 dark:text-white">{passengersCount} persona(s)</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-950 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-3">
              <span>Monto Total del Traslado:</span>
              <span className="text-base text-crusoe-800 dark:text-crusoe-400 font-extrabold">
                S/ {quote?.total.toFixed(2) || '80.00'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-crusoe-200 dark:border-crusoe-800 bg-crusoe-50/80 dark:bg-crusoe-950/60 p-3 text-center">
                <span className="text-[10px] font-bold text-crusoe-800 dark:text-crusoe-300 uppercase block">
                  Adelanto (20%)
                </span>
                <span className="text-lg font-extrabold text-crusoe-950 dark:text-crusoe-200">
                  S/ {quote?.depositRequired.toFixed(2) || '16.00'}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-center">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase block">
                  Saldo al Abordar (80%)
                </span>
                <span className="text-lg font-extrabold text-slate-950 dark:text-white">
                  S/ {quote?.balanceRemaining.toFixed(2) || '64.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Método de Pago */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-950 dark:text-slate-200">
              Método de Pago para el Adelanto
            </label>
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
                  className={`rounded-2xl border-2 p-3 text-center text-xs font-bold transition-all ${
                    paymentMethod === m.code
                      ? 'border-crusoe-600 bg-crusoe-50/90 dark:bg-crusoe-950 text-crusoe-950 dark:text-crusoe-200 shadow-sm ring-2 ring-crusoe-600/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-crusoe-200 dark:border-crusoe-800 bg-crusoe-50/70 dark:bg-crusoe-950/60 p-4 text-center space-y-3">
              {paymentMethod === 'yape' && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-crusoe-900 dark:text-crusoe-300 block uppercase">
                    Número Oficial de Yape
                  </span>
                  <span className="text-2xl font-extrabold text-crusoe-950 dark:text-crusoe-100 block mt-0.5 font-mono">
                    929 667 586
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block font-bold">
                    Titular: JORGE TRU.
                  </span>

                  {PAYMENT_METHODS_INFO.yape.qrImage && (
                    <div className="pt-1 flex justify-center">
                      <img
                        src={PAYMENT_METHODS_INFO.yape.qrImage}
                        alt="QR Yape"
                        className="h-48 w-48 object-contain rounded-2xl bg-white p-2.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'plin' && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-crusoe-900 dark:text-crusoe-300 block uppercase">
                    Número Oficial de Plin
                  </span>
                  <span className="text-2xl font-extrabold text-crusoe-950 dark:text-crusoe-100 block mt-0.5 font-mono">
                    929 667 586
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 block font-bold">
                    Titular: JORGE ANTONIO TRUCIOS MEZA
                  </span>

                  {PAYMENT_METHODS_INFO.plin.qrImage && (
                    <div className="pt-1 flex justify-center">
                      <img
                        src={PAYMENT_METHODS_INFO.plin.qrImage}
                        alt="QR Plin"
                        className="h-48 w-48 object-contain rounded-2xl bg-white p-2.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'bcp' && (
                <div className="space-y-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium">
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl p-2.5 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold">
                    Cuenta Bancaria BCP Oficial para Transferencias Directas e Interbancarias (CCI).
                  </div>
                  <div>
                    <span className="font-bold block text-slate-600 dark:text-slate-400">Titular de la Cuenta:</span>
                    <span className="font-bold text-crusoe-900 dark:text-crusoe-300 text-sm">
                      JORGE ANTONIO TRUCIOS MEZA
                    </span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-600 dark:text-slate-400">Número de Cuenta BCP:</span>
                    <span className="font-mono text-sm font-bold text-crusoe-950 dark:text-white select-all bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg inline-block">
                      40002021972079
                    </span>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-600 dark:text-slate-400">CCI Interbancario:</span>
                    <span className="font-mono text-xs font-bold text-crusoe-950 dark:text-white select-all bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg inline-block">
                      00240010202197207901
                    </span>
                  </div>

                  {PAYMENT_METHODS_INFO.bcp.qrImage && (
                    <div className="pt-1 flex justify-center">
                      <img
                        src={PAYMENT_METHODS_INFO.bcp.qrImage}
                        alt="QR BCP"
                        className="h-48 w-48 object-contain rounded-2xl bg-white p-2.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Subir Voucher */}
            <div id="field-voucher" className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center bg-slate-50 dark:bg-slate-800/40">
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
                  Adjuntar foto de comprobante de pago (Opcional ahora)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">JPG, PNG o PDF (Máx. 5MB)</span>
              </label>
            </div>

            {fieldErrors.voucher && (
              <p className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldErrors.voucher}
              </p>
            )}

            {voucherPreview && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center gap-3">
                <img src={voucherPreview} alt="Vista previa del comprobante" className="h-12 w-12 rounded-lg object-cover border" />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Comprobante adjunto correctamente
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{voucherFile?.name}</span>
                </div>
              </div>
            )}

            {/* Advertencia si NO sube comprobante */}
            {!voucherFile && (
              <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Reserva con pago posterior</span>
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  Puede realizar su reserva sin comprobante inmediato. Tenga presente que <strong>si no se efectúa el adelanto (S/ {quote?.depositRequired.toFixed(2) || '16.00'}) antes de la hora programada de su traslado</strong>, la reserva no podrá ser atendida y se cancelará en el sistema.
                </p>
              </div>
            )}
          </div>

          <div id="field-acceptedTerms" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  clearFieldError('acceptedTerms');
                }}
                className="h-4 w-4 rounded border-slate-300 text-crusoe-600 focus:ring-crusoe-500 mt-0.5"
              />
              <span className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
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
            {fieldErrors.acceptedTerms && (
              <p className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {fieldErrors.acceptedTerms}
              </p>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Atrás
            </Button>
            <Button size="lg" isLoading={loading} onClick={handleCreateReservation}>
              <span>{voucherFile ? 'Confirmar y Enviar Reserva con Pago' : 'Formalizar Reserva (Pagar después)'}</span>
              <CheckCircle2 className="h-4 w-4 ml-1" />
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
              Reserva Registrada Exitosamente
            </span>
            <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">{createdReservation.code}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
              Guarde su código de reserva. Le hemos enviado el detalle formal a su WhatsApp.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-5 max-w-lg mx-auto text-left space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Titular:</span>
              <span className="font-bold text-slate-950 dark:text-white">{createdReservation.customer?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Modalidad:</span>
              <span className="font-bold text-slate-950 dark:text-white">{createdReservation.service?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Ruta y Destino:</span>
              <span className="font-bold text-slate-950 dark:text-white">{createdReservation.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Fecha y Hora:</span>
              <span className="font-bold text-slate-950 dark:text-white">
                {new Date(createdReservation.scheduled_at).toLocaleString('es-PE')}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold text-sm">
              <span>Total / Adelanto:</span>
              <span className="text-crusoe-800 dark:text-crusoe-400">
                S/ {createdReservation.total_amount.toFixed(2)} (Adelanto: S/ {createdReservation.deposit_amount.toFixed(2)})
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={`https://wa.me/51929667586?text=${encodeURIComponent(
                `Hola Fast Travel Xauxa, acabo de registrar mi reserva con código *${createdReservation.code}* a nombre de *${createdReservation.customer?.full_name}* para la fecha *${new Date(createdReservation.scheduled_at).toLocaleString('es-PE')}*. Destino: *${createdReservation.destination}*.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 text-xs font-bold shadow-lg"
            >
              <MessageSquare className="h-4 w-4" />
              Notificar a Coordinación por WhatsApp
            </a>

            <Link href={`/reserva/${createdReservation.code}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-xs py-3.5">
                Ver Estado y Voucher
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservaPage() {
  return (
    <div className="site-page min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-crusoe-100 dark:bg-crusoe-950 px-3.5 py-1 text-xs font-bold text-crusoe-800 dark:text-crusoe-300 border border-crusoe-300 dark:border-crusoe-800 mb-3">
              <ShieldCheck className="h-4 w-4 text-crusoe-600" />
              <span>Plataforma Oficial de Reserva Directa</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Reserva tu Traslado Ejecutivo
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
              Flota SUV del año climatizada, recepción en aeropuerto y conductores profesionales en todo el Valle del Mantaro.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border text-slate-500">
                Cargando plataforma de reserva...
              </div>
            }
          >
            <BookingWizardForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

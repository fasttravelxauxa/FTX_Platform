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
import { SERVICES_CATALOG, AIRLINES, DESTINATIONS_CATALOG, PAYMENT_METHODS_INFO, BUSINESS_CONFIG } from '@/lib/constants';
import { PricingService } from '@/lib/services/pricing';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { RepositoryService, savePassengerIdentity, generateUUID } from '@/lib/services/repository';
import { Reservation, PriceQuote, PaymentMethod, InvoiceType } from '@/lib/types';

const STEP_TITLES: { [key: number]: string } = {
  1: 'Tipo de Servicio',
  2: 'Fecha y Hora',
  3: 'Ruta y Destino',
  4: 'Aerolínea y Vuelo',
  5: 'Datos del Pasajero',
  6: 'Equipaje y Notas',
  7: 'Comprobante Fiscal',
  8: 'Cotización y Términos',
  9: 'Adelanto y Voucher',
  10: 'Confirmación',
};

function BookingWizardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialService = searchParams.get('servicio') || 'privado-aeropuerto';

  // Wizard state (Steps 1 to 10)
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [serviceCode, setServiceCode] = useState<string>(initialService);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState<string>('09:30');
  const [origin, setOrigin] = useState<string>('Aeropuerto de Jauja (JAU)');

  // Destination City Code & Exact Address
  const [destinationCityCode, setDestinationCityCode] = useState<string>('huancayo');
  const [exactAddress, setExactAddress] = useState<string>('');
  const [destination, setDestination] = useState<string>('Huancayo (Centro / El Tambo / Chilca)');

  const [passengersCount, setPassengersCount] = useState<number>(1);
  const [hoursCount, setHoursCount] = useState<number>(2);

  // Customer Contact info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerDni, setCustomerDni] = useState<string>('');
  const [customerTitle, setCustomerTitle] = useState<string>('Sr.');

  // Flight Info (Solo Aerolínea, Número de Vuelo Eliminado a Solicitud del Cliente)
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

  // Generated Quote & Final Reservation
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  // Scroll smoothly to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setErrorMsg(null);
  }, [step]);

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
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('El comprobante no debe superar los 5MB.');
        return;
      }
      setVoucherFile(file);
      setVoucherPreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleCreateReservation = async () => {
    if (!customerName || !customerPhone) {
      setErrorMsg('Por favor ingresa tu Nombre completo y Teléfono de WhatsApp.');
      setStep(5);
      return;
    }

    if (serviceCode === 'privado-aeropuerto' && !exactAddress.trim()) {
      setErrorMsg('Para el servicio privado debes ingresar la dirección exacta de destino (ej. Hotel Plaza Constitución, Av. Giráldez 123).');
      setStep(3);
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones para continuar.');
      setStep(8);
      return;
    }

    if (invoiceType === 'factura' && (!invoiceRuc || !invoiceCompanyName)) {
      setErrorMsg('Para Factura Electrónica debes ingresar el RUC y la Razón Social.');
      setStep(7);
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
        flight_number: '', // Número de vuelo eliminado a solicitud
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
      setStep(10);

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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xl text-slate-900">
      {/* Progress Bar Header */}
      {step < 10 && (
        <div className="mb-6 border-b border-slate-100 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-crusoe-800">
              Paso {step} de 9
            </span>
            <span className="text-xs font-extrabold text-slate-900">
              {STEP_TITLES[step]}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-crusoe-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 9) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-900 shadow-sm">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Seleccionar Servicio */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Car className="h-6 w-6 text-crusoe-600" />
              1. Selecciona tu Tipo de Servicio
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Traslados ejecutivos en SUV Jetour último modelo desde/hacia el Aeropuerto de Jauja.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {SERVICES_CATALOG.map((srv) => (
              <div
                key={srv.code}
                onClick={() => setServiceCode(srv.code)}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                  serviceCode === srv.code
                    ? 'border-crusoe-600 bg-crusoe-50/90 shadow-md ring-2 ring-crusoe-600/30'
                    : 'border-slate-200 hover:border-crusoe-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-950 text-base">{srv.name}</h3>
                  <span className="text-xs font-extrabold text-crusoe-800 bg-crusoe-100/80 px-2.5 py-1 rounded-lg shrink-0">
                    {srv.code === 'privado-aeropuerto'
                      ? 'Desde S/ 80.00'
                      : srv.code === 'compartido-aeropuerto'
                      ? 'Desde S/ 20.00 /asiento'
                      : 'S/ 50.00 /hora'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">{srv.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button size="lg" onClick={() => setStep(2)} className="w-full sm:w-auto">
              Siguiente: Fecha y Hora
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Fecha y Hora */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-crusoe-600" />
              2. Fecha y Hora Programada
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Ofrecemos 30 minutos de tolerancia tras el aterrizaje de tu vuelo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">Fecha del Traslado</label>
              <input
                type="date"
                value={scheduledDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">Hora Programada / Llegada</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(3)}>
              Siguiente: Ruta y Tarifas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Ruta y Destino con Tarifas Oficiales */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-crusoe-600" />
              3. Ciudad de Destino y Dirección Exacta
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Las tarifas varían según la ciudad de destino. En servicio privado requerimos la dirección exacta de llegada.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Punto de Origen</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm text-slate-950 font-medium"
              />
            </div>

            {/* Selector de Ciudad Destino */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Ciudad de Destino *</label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {DESTINATIONS_CATALOG.map((dest) => (
                  <div
                    key={dest.code}
                    onClick={() => setDestinationCityCode(dest.code)}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                      destinationCityCode === dest.code
                        ? 'border-crusoe-600 bg-crusoe-50/90 shadow-sm ring-2 ring-crusoe-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-950 text-sm">{dest.name}</span>
                      <span className="text-xs font-extrabold text-crusoe-800 bg-crusoe-100 px-2 py-0.5 rounded">
                        {serviceCode === 'privado-aeropuerto'
                          ? `S/ ${dest.privatePriceSuv.toFixed(2)}`
                          : `S/ ${dest.sharedPricePerSeat.toFixed(2)} /asiento`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5">{dest.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dirección exacta para servicio privado */}
            {serviceCode === 'privado-aeropuerto' && (
              <div className="rounded-2xl border-2 border-crusoe-200 bg-crusoe-50/60 p-4 space-y-2">
                <label className="block text-xs font-extrabold text-crusoe-950 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-crusoe-700" />
                  Dirección Exacta de Destino (Obligatorio para Privado) *
                </label>
                <input
                  type="text"
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  placeholder="Ej. Hotel Plaza Constitución, Av. Giráldez N° 123 (Ref. Frente a la Catedral)"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
                />
                <span className="text-[11px] text-crusoe-800 block font-medium">
                  📌 Al ser servicio privado exclusivo, nuestro conductor te dejará exactamente en la puerta de tu hotel o domicilio.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Cantidad de Pasajeros</label>
              <select
                value={passengersCount}
                onChange={(e) => setPassengersCount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
              >
                <option value={1}>1 Pasajero</option>
                <option value={2}>2 Pasajeros</option>
                <option value={3}>3 Pasajeros</option>
                <option value={4}>4 Pasajeros (Capacidad máxima SUV)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button
              onClick={() => {
                if (serviceCode === 'privado-aeropuerto' && !exactAddress.trim()) {
                  setErrorMsg('Ingresa la dirección exacta de destino para tu servicio privado.');
                  return;
                }
                setStep(4);
              }}
            >
              Siguiente: Aerolínea
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Aerolínea (Número de vuelo eliminado a solicitud) */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Plane className="h-6 w-6 text-crusoe-600" />
              4. Aerolínea de Llegada (Opcional)
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Indica la aerolínea en la que arribas al Aeropuerto de Jauja para coordinar tu recepción con el chofer.
            </p>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Aerolínea Comercial</label>
              <select
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
              >
                {AIRLINES.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(5)}>
              Siguiente: Pasajero
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Datos del Pasajero */}
      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <User className="h-6 w-6 text-crusoe-600" />
              5. Datos del Pasajero Principal
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Ingresa tus datos de contacto para la confirmación de la reserva.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">Trato / Título</label>
                <select
                  value={customerTitle}
                  onChange={(e) => setCustomerTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
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
                <label className="block text-xs font-bold text-slate-900 mb-1.5">Nombre Completo *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza Ramos"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">WhatsApp / Celular (9 dígitos) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-500">+51</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="929667586"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 py-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">DNI / Documento de Identidad</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={customerDni}
                  onChange={(e) => setCustomerDni(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                  placeholder="Ej. 44556677"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button
              onClick={() => {
                if (!customerName.trim() || customerPhone.replace(/[^0-9]/g, '').length < 9) {
                  setErrorMsg('Ingresa tu nombre y un número de WhatsApp válido de 9 dígitos.');
                  return;
                }
                setStep(6);
              }}
            >
              Siguiente: Equipaje
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: Equipaje y Notas */}
      {step === 6 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Info className="h-6 w-6 text-crusoe-600" />
              6. Equipaje e Instrucciones Especiales
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Maletera ejecutiva con capacidad para 4 maletas en la SUV Jetour.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Detalles de Equipaje</label>
              <input
                type="text"
                value={luggageNotes}
                onChange={(e) => setLuggageNotes(e.target.value)}
                placeholder="Ej. 2 maletas de 23kg y 1 equipaje de mano"
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">Notas adicionales para el conductor</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Viajo con un adulto mayor, requerimos asistencia."
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(5)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(7)}>
              Siguiente: Comprobante
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 7: Comprobante Fiscal */}
      {step === 7 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-crusoe-600" />
              7. Comprobante de Pago (Boleta / Factura)
            </h2>
            <p className="text-xs text-slate-600 mt-1">
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
                    ? 'border-crusoe-600 bg-crusoe-50/90 text-crusoe-950 shadow-sm ring-2 ring-crusoe-600/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {invoiceType === 'boleta' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">Datos para Boleta Electrónica</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">DNI del Titular</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={invoiceDni || customerDni}
                    onChange={(e) => setInvoiceDni(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="8 dígitos"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-950 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={invoiceName || customerName}
                    onChange={(e) => setInvoiceName(e.target.value)}
                    placeholder="Nombre en la boleta"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-950 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {invoiceType === 'factura' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">Datos para Factura Electrónica</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">RUC (11 dígitos) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    value={invoiceRuc}
                    onChange={(e) => setInvoiceRuc(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="20601234567"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-950 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Razón Social *</label>
                  <input
                    type="text"
                    value={invoiceCompanyName}
                    onChange={(e) => setInvoiceCompanyName(e.target.value)}
                    placeholder="Empresa S.A.C."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-950 font-medium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dirección Fiscal</label>
                  <input
                    type="text"
                    value={invoiceAddress}
                    onChange={(e) => setInvoiceAddress(e.target.value)}
                    placeholder="Av. Principal 123, Huancayo"
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-950 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(6)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(8)}>
              Siguiente: Cotización
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 8: Cotización y Términos */}
      {step === 8 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-crusoe-600" />
              8. Resumen de Cotización Oficial
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Abono del 50% de adelanto para reservar la unidad SUV y saldo a pagar al abordar.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-3">
            <div className="flex justify-between text-xs text-slate-700">
              <span>Tarifa Base ({destination}):</span>
              <span className="font-bold text-slate-950">S/ {quote?.subtotal.toFixed(2) || '80.00'}</span>
            </div>
            {quote && quote.surcharges > 0 && (
              <div className="flex justify-between text-xs text-slate-700">
                <span>Recargo por Cobertura Periférica:</span>
                <span className="font-bold text-slate-950">S/ {quote.surcharges.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-950 border-t border-slate-200 pt-3">
              <span>Monto Total del Traslado:</span>
              <span className="text-base text-crusoe-800">S/ {quote?.total.toFixed(2) || '80.00'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-crusoe-200 bg-crusoe-50/80 p-3 text-center">
                <span className="text-[10px] font-bold text-crusoe-800 uppercase block">Adelanto Requerido (50%)</span>
                <span className="text-lg font-extrabold text-crusoe-950">S/ {quote?.depositRequired.toFixed(2) || '40.00'}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Saldo al Abordar (50%)</span>
                <span className="text-lg font-extrabold text-slate-950">S/ {quote?.balanceRemaining.toFixed(2) || '40.00'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-crusoe-600 focus:ring-crusoe-500 mt-0.5"
              />
              <span className="text-xs text-slate-800 leading-relaxed">
                Acepto los{' '}
                <Link href="/terminos" target="_blank" className="font-bold text-crusoe-700 underline">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link href="/cancelaciones" target="_blank" className="font-bold text-crusoe-700 underline">
                  Política de Cancelación
                </Link>{' '}
                (Cancelación gratuita dentro de los 60 min).
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(7)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button
              onClick={() => {
                if (!acceptedTerms) {
                  setErrorMsg('Debes aceptar los Términos y Condiciones para continuar.');
                  return;
                }
                setStep(9);
              }}
            >
              Siguiente: Pago del Adelanto
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 9: Adelanto y Voucher */}
      {step === 9 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Upload className="h-6 w-6 text-crusoe-600" />
              9. Pago del Adelanto (50%)
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Abona <strong>S/ {quote?.depositRequired.toFixed(2) || '40.00'}</strong> vía Yape, Plin o BCP y adjunta la captura del comprobante.
            </p>
          </div>

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
                    ? 'border-crusoe-600 bg-crusoe-50/90 text-crusoe-950 shadow-sm ring-2 ring-crusoe-600/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-crusoe-200 bg-crusoe-50/70 p-5 text-center space-y-3">
            {paymentMethod === 'yape' && (
              <div>
                <span className="text-xs font-bold text-crusoe-900 block uppercase">Número Oficial de Yape</span>
                <span className="text-2xl font-extrabold text-crusoe-950 block mt-1">929 667 586</span>
                <span className="text-xs text-slate-700 block font-medium">Titular: Fast Travel Xauxa</span>
              </div>
            )}

            {paymentMethod === 'plin' && (
              <div>
                <span className="text-xs font-bold text-crusoe-900 block uppercase">Número Oficial de Plin</span>
                <span className="text-2xl font-extrabold text-crusoe-950 block mt-1">929 667 586</span>
                <span className="text-xs text-slate-700 block font-medium">Titular: Fast Travel Xauxa</span>
              </div>
            )}

            {paymentMethod === 'bcp' && (
              <div className="space-y-2 text-xs text-slate-900 font-medium">
                <div>
                  <span className="font-bold block">Cuenta Corriente BCP:</span>
                  <span className="font-mono text-sm font-bold text-crusoe-950">355-98765432-0-12</span>
                </div>
                <div>
                  <span className="font-bold block">CCI Interbancario:</span>
                  <span className="font-mono text-xs font-bold text-crusoe-950">002-355009876543201289</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900">Adjuntar Captura de Comprobante (Voucher)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-crusoe-500 transition-colors bg-slate-50">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleVoucherUpload}
                id="voucher-file-input"
                className="hidden"
              />
              <label htmlFor="voucher-file-input" className="cursor-pointer space-y-2 block">
                <Upload className="h-8 w-8 text-crusoe-600 mx-auto" />
                <span className="text-xs font-bold text-crusoe-800 block">
                  Toca aquí para seleccionar tu foto de comprobante
                </span>
                <span className="text-[11px] text-slate-500 block">Formatos: JPG, PNG o PDF (Máx. 5MB)</span>
              </label>
            </div>

            {voucherPreview && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-3">
                <img src={voucherPreview} alt="Vista previa del comprobante" className="h-12 w-12 rounded-lg object-cover border" />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-slate-900 block">Comprobante seleccionado</span>
                  <span className="text-slate-500 text-[11px]">{voucherFile?.name}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">Número de Operación / Referencia (Opcional)</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Ej. OP-12345678"
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm text-slate-950 font-medium focus:border-crusoe-600 shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setStep(8)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button size="lg" isLoading={loading} onClick={handleCreateReservation}>
              Confirmar y Enviar Reserva
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 10: Confirmación Final */}
      {step === 10 && createdReservation && (
        <div className="space-y-6 text-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crusoe-100 text-crusoe-700 mx-auto shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-crusoe-800">
              ¡Reserva Registrada Exitosamente!
            </span>
            <h2 className="text-3xl font-extrabold text-slate-950 mt-1">{createdReservation.code}</h2>
            <div className="mt-2 flex justify-center">
              <Badge status={createdReservation.status} />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-xs text-amber-950 space-y-3 max-w-lg mx-auto text-left shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
              <Bell className="h-5 w-5 text-amber-600 animate-bounce shrink-0" />
              <span>Notificación Automática a Coordinación</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-medium">
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left text-xs text-slate-900 space-y-2.5 max-w-lg mx-auto">
            <div className="flex justify-between">
              <span className="font-bold text-slate-600">Pasajero Principal:</span>
              <span className="font-bold text-slate-950">{createdReservation.customer?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-600">Origen / Destino:</span>
              <span className="font-semibold text-slate-950">
                {createdReservation.origin} ➔ {createdReservation.destination}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-slate-600">Fecha y Hora:</span>
              <span className="font-semibold text-slate-950">{new Date(createdReservation.scheduled_at).toLocaleString('es-PE')}</span>
            </div>

            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-slate-950">
              <span>Adelanto (50%):</span>
              <span className="text-crusoe-800 font-extrabold">S/ {createdReservation.deposit_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700 text-xs">
              <span>Saldo a pagar al abordar:</span>
              <span className="font-bold text-slate-950">S/ {createdReservation.balance_amount.toFixed(2)}</span>
            </div>
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-6 text-center">
          <span className="text-xs font-extrabold uppercase tracking-widest text-crusoe-700">
            Fast Travel Xauxa — Servicio Ejecutivo & Turístico
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
            Asistente de Reserva y Cotización
          </h1>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-700 font-medium">Cargando asistente de reserva...</div>}>
          <BookingWizardForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

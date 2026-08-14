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
  Building2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SERVICES_CATALOG, AIRLINES, PAYMENT_METHODS_INFO } from '@/lib/constants';
import { PricingService } from '@/lib/services/pricing';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { LocalDb } from '@/lib/storage/mock-db';
import { Reservation, PriceQuote, PaymentMethod, InvoiceType } from '@/lib/types';

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
  const [destination, setDestination] = useState<string>('Hotel Turístico, Plaza Constitución, Huancayo');
  const [passengersCount, setPassengersCount] = useState<number>(1);
  const [hoursCount, setHoursCount] = useState<number>(2);

  // Customer Contact info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerDni, setCustomerDni] = useState<string>('');
  const [customerTitle, setCustomerTitle] = useState<string>('Sr./Sra.');

  // Flight Info
  const [airline, setAirline] = useState<string>('LATAM');
  const [flightNumber, setFlightNumber] = useState<string>('LA 2145');
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

  // Recalculate quote whenever relevant fields change
  useEffect(() => {
    try {
      const q = PricingService.calculateQuote({
        serviceCode,
        origin,
        destination,
        passengersCount,
        hoursCount,
      });
      setQuote(q);
    } catch (err: any) {
      console.error('Error calculando cotización:', err);
    }
  }, [serviceCode, origin, destination, passengersCount, hoursCount]);

  // Handle Voucher file selection
  const handleVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('El archivo del comprobante no debe superar los 2MB.');
        return;
      }
      setErrorMsg(null);
      setVoucherFile(file);
      setVoucherPreview(URL.createObjectURL(file));
    }
  };

  // Submit and create reservation
  const handleCreateReservation = async () => {
    if (!customerName || !customerPhone) {
      setErrorMsg('Por favor ingresa tu Nombre completo y Teléfono.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }

    if (invoiceType === 'factura' && (!invoiceRuc || !invoiceCompanyName)) {
      setErrorMsg('Para Factura Electrónica debes ingresar el número de RUC y la Razón Social.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const codeSeq = Math.floor(1000 + Math.random() * 9000);
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const code = `TFX-${todayStr}-${codeSeq}`;

      const service = SERVICES_CATALOG.find((s) => s.code === serviceCode);
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00-05:00`).toISOString();

      const newRes: Reservation = {
        id: `res-${Date.now()}`,
        code,
        customer_id: `cust-${Date.now()}`,
        customer: {
          id: `cust-${Date.now()}`,
          role: 'CUSTOMER',
          full_name: customerName,
          phone: customerPhone,
          dni: customerDni,
          title_degree: customerTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        service_id: service?.id || 'srv-1',
        service,
        vehicle_id: 'veh-1',
        driver_id: 'usr-driver-1',
        status: voucherPreview ? 'PAYMENT_SUBMITTED' : 'PENDING_PAYMENT',
        flight_airline: airline,
        flight_number: flightNumber,
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
            passenger_type: 'adulto',
            name: customerName,
            dni: customerDni,
          },
        ],
        payments: voucherPreview
          ? [
              {
                id: `pay-${Date.now()}`,
                reservation_id: code,
                amount: quote?.depositRequired || 40,
                payment_method: paymentMethod,
                status: 'SUBMITTED',
                created_at: new Date().toISOString(),
                proofs: [
                  {
                    id: `prf-${Date.now()}`,
                    payment_id: `pay-${Date.now()}`,
                    file_path: voucherPreview,
                    reference_number: referenceNumber || 'VOUCHER-MANUAL',
                    uploaded_at: new Date().toISOString(),
                  },
                ],
              },
            ]
          : [],
      };

      // Save into LocalDb
      LocalDb.saveReservation(newRes);
      setCreatedReservation(newRes);
      setStep(10); // Final Confirmation Step

      // Trigger Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setErrorMsg('Ocurrió un error al procesar tu reserva. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-crusoe-200 bg-white p-6 sm:p-10 shadow-xl">
      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-medium text-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Seleccionar Servicio */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-crusoe-950 flex items-center gap-2">
            <Car className="h-5 w-5 text-crusoe-600" />
            1. Selecciona el Tipo de Servicio
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SERVICES_CATALOG.map((srv) => (
              <div
                key={srv.code}
                onClick={() => setServiceCode(srv.code)}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                  serviceCode === srv.code
                    ? 'border-crusoe-600 bg-crusoe-50/80 shadow-md ring-2 ring-crusoe-600/20'
                    : 'border-crusoe-200 hover:border-crusoe-400 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-crusoe-950 text-base">{srv.name}</h3>
                  <span className="text-sm font-extrabold text-crusoe-700">
                    {srv.code === 'compartido-aeropuerto'
                      ? 'S/ 20.00 /asiento'
                      : srv.price_unit === 'hourly'
                      ? 'S/ 50.00 /h'
                      : 'S/ 80.00 base'}
                  </span>
                </div>
                <p className="text-xs text-crusoe-800 mt-2 leading-relaxed">{srv.description}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setStep(2)}>
              Siguiente: Fecha y Hora
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Fecha y Hora */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-crusoe-950 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-crusoe-600" />
            2. Fecha y Hora Programada del Servicio
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Fecha del Traslado</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600 focus:ring-crusoe-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Hora Programada / Aterrizaje</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600 focus:ring-crusoe-500"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-crusoe-50 p-4 border border-crusoe-200 text-xs text-crusoe-800 flex items-start gap-2">
            <Clock className="h-4 w-4 text-crusoe-600 shrink-0 mt-0.5" />
            <span>
              <strong>Regla Operativa Aeroportuaria:</strong> Se otorga una tolerancia oficial de <strong>30 minutos</strong> posteriores al aterrizaje confirmado del vuelo.
            </span>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(3)}>
              Siguiente: Origen y Destino
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Origen y Destino */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-crusoe-950 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-crusoe-600" />
            3. Origen y Destino
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Lugar de Origen</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Ej. Aeropuerto Francisco Carlé de Jauja"
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Lugar de Destino / Dirección</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ej. Hotel Turístico, Jr. Ancash 450, Huancayo (o Chilca)"
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(4)}>
              Siguiente: Pasajeros
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Pasajeros y Datos Personales */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-crusoe-950 flex items-center gap-2">
            <Users className="h-5 w-5 text-crusoe-600" />
            4. Pasajeros y Datos de Contacto
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Nombre y Apellidos</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. María Elena Ramos"
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Teléfono WhatsApp (Coordinación)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ej. 929667586"
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              />
              <span className="text-[10px] text-crusoe-700 font-semibold block mt-1">
                Coordinación únicamente por mensajes de WhatsApp (No llamadas)
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Número de DNI</label>
              <input
                type="text"
                value={customerDni}
                onChange={(e) => setCustomerDni(e.target.value)}
                placeholder="Ej. 45678912"
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Título o Grado para Cartel (Opcional)</label>
              <input
                type="text"
                value={customerTitle}
                onChange={(e) => setCustomerTitle(e.target.value)}
                placeholder="Ej. Dra. / Ing. / Sr."
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Número de Pasajeros</label>
              <select
                value={passengersCount}
                onChange={(e) => setPassengersCount(parseInt(e.target.value))}
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              >
                <option value={1}>1 Pasajero</option>
                <option value={2}>2 Pasajeros</option>
                <option value={3}>3 Pasajeros</option>
                <option value={4}>4 Pasajeros (Máximo SUV Jetour)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(5)}>
              Siguiente: Información de Vuelo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Datos de Vuelo */}
      {step === 5 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-crusoe-950 flex items-center gap-2">
            <Plane className="h-5 w-5 text-crusoe-600" />
            5. Información del Vuelo (Aeropuerto Jauja)
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Aerolínea</label>
              <select
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              >
                {AIRLINES.map((a) => (
                  <option key={a.code} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-2">Número de Vuelo</label>
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="Ej. LA 2145"
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-crusoe-900 mb-2">Notas sobre Equipaje (Opcional)</label>
            <input
              type="text"
              value={luggageNotes}
              onChange={(e) => setLuggageNotes(e.target.value)}
              placeholder="Ej. 2 maletas grandes de 23kg y 1 maleta de mano"
              className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(6)}>
              Ver Cotización
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: Cotización y Comprobante Fiscal (Boleta / Factura) */}
      {step === 6 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-crusoe-950 flex items-center gap-2">
            <FileText className="h-5 w-5 text-crusoe-600" />
            6. Cotización Formal y Solicitud de Comprobante Fiscal
          </h2>

          <div className="rounded-2xl border-2 border-crusoe-300 bg-crusoe-50/60 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-crusoe-200 pb-3">
              <span className="font-bold text-crusoe-950">Resumen del Traslado:</span>
              <span className="text-xs font-semibold text-crusoe-700">{serviceCode}</span>
            </div>

            {quote?.details.map((detail, idx) => (
              <div key={idx} className="text-xs text-crusoe-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-crusoe-600 shrink-0" />
                <span>{detail}</span>
              </div>
            ))}

            <div className="border-t border-crusoe-200 pt-4 space-y-2 text-sm text-crusoe-950">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">S/ {quote?.subtotal.toFixed(2)}</span>
              </div>
              {quote?.surcharges! > 0 && (
                <div className="flex justify-between text-crusoe-700">
                  <span>Recargos Zona Periférica:</span>
                  <span className="font-semibold">+S/ {quote?.surcharges.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold text-crusoe-950 border-t border-crusoe-300 pt-2">
                <span>Monto Total:</span>
                <span className="text-crusoe-700">S/ {quote?.total.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="rounded-xl bg-crusoe-100 p-3 border border-crusoe-300 text-center">
                  <span className="block text-[11px] font-bold text-crusoe-800 uppercase">
                    Adelanto Requerido (50%)
                  </span>
                  <span className="text-xl font-extrabold text-crusoe-900">
                    S/ {quote?.depositRequired.toFixed(2)}
                  </span>
                </div>

                <div className="rounded-xl bg-gray-100 p-3 border border-gray-300 text-center">
                  <span className="block text-[11px] font-bold text-gray-700 uppercase">
                    Saldo al Abordar (50%)
                  </span>
                  <span className="text-xl font-extrabold text-gray-900">
                    S/ {quote?.balanceRemaining.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BOLETA / FACTURA SECTION */}
          <div className="rounded-2xl border border-crusoe-300 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-crusoe-600" />
              <h3 className="font-bold text-sm text-crusoe-950">¿Requieres Comprobante Fiscal? (Boleta / Factura Electrónica)</h3>
            </div>
            <p className="text-xs text-crusoe-800">
              Emitimos Boletas y Facturas Electrónicas. Ingresa tus datos tributarios aquí y la empresa emisora entregará tu comprobante fiscal directamente a tu celular vía WhatsApp.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceType('ninguno')}
                className={`rounded-xl border-2 p-3 text-xs font-bold transition-all ${
                  invoiceType === 'ninguno'
                    ? 'border-crusoe-600 bg-crusoe-50 text-crusoe-950'
                    : 'border-crusoe-200 bg-white text-gray-700'
                }`}
              >
                Sin Comprobante
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('boleta')}
                className={`rounded-xl border-2 p-3 text-xs font-bold transition-all ${
                  invoiceType === 'boleta'
                    ? 'border-crusoe-600 bg-crusoe-50 text-crusoe-950'
                    : 'border-crusoe-200 bg-white text-gray-700'
                }`}
              >
                Boleta de Venta
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('factura')}
                className={`rounded-xl border-2 p-3 text-xs font-bold transition-all ${
                  invoiceType === 'factura'
                    ? 'border-crusoe-600 bg-crusoe-50 text-crusoe-950'
                    : 'border-crusoe-200 bg-white text-gray-700'
                }`}
              >
                Factura Electrónica
              </button>
            </div>

            {invoiceType === 'boleta' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-crusoe-100">
                <div>
                  <label className="block text-xs font-bold text-crusoe-900 mb-1">DNI del Titular de la Boleta</label>
                  <input
                    type="text"
                    value={invoiceDni || customerDni}
                    onChange={(e) => setInvoiceDni(e.target.value)}
                    placeholder="Ej. 45678912"
                    className="w-full rounded-xl border border-crusoe-300 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-crusoe-900 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={invoiceName || customerName}
                    onChange={(e) => setInvoiceName(e.target.value)}
                    placeholder="Ej. María Elena Ramos"
                    className="w-full rounded-xl border border-crusoe-300 p-2.5 text-xs"
                  />
                </div>
              </div>
            )}

            {invoiceType === 'factura' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-crusoe-100">
                <div>
                  <label className="block text-xs font-bold text-crusoe-900 mb-1">Número de RUC (11 dígitos)</label>
                  <input
                    type="text"
                    value={invoiceRuc}
                    onChange={(e) => setInvoiceRuc(e.target.value)}
                    placeholder="Ej. 20601234567"
                    className="w-full rounded-xl border border-crusoe-300 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-crusoe-900 mb-1">Razón Social de la Empresa</label>
                  <input
                    type="text"
                    value={invoiceCompanyName}
                    onChange={(e) => setInvoiceCompanyName(e.target.value)}
                    placeholder="Ej. Corporación Andina S.A.C."
                    className="w-full rounded-xl border border-crusoe-300 p-2.5 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-crusoe-900 mb-1">Dirección Fiscal</label>
                  <input
                    type="text"
                    value={invoiceAddress}
                    onChange={(e) => setInvoiceAddress(e.target.value)}
                    placeholder="Ej. Av. Real 1020, Huancayo, Junín"
                    className="w-full rounded-xl border border-crusoe-300 p-2.5 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(5)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button onClick={() => setStep(7)}>
              Siguiente: Términos Legales
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 7: Términos Legal Versioning */}
      {step === 7 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-crusoe-950 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-crusoe-600" />
            7. Términos y Políticas del Servicio (v1.0)
          </h2>

          <div className="h-48 overflow-y-auto rounded-2xl border border-crusoe-200 bg-crusoe-50/50 p-4 text-xs text-crusoe-900 space-y-3 leading-relaxed">
            <p>
              <strong>1. Reserva y Adelanto:</strong> Para confirmar el servicio se requiere el abono del 50% del costo total. El saldo restante (50%) se abonará en efectivo o transferencia al abordar el vehículo.
            </p>
            <p>
              <strong>2. Política de Cancelación (60 min):</strong> El pasajero podrá cancelar la reserva y solicitar la devolución íntegra del adelanto dentro de los <strong>60 minutos</strong> posteriores a la creación de la reserva.
            </p>
            <p>
              <strong>3. Espera en Aeropuerto:</strong> Se otorga un periodo de tolerancia gratuito de <strong>30 minutos</strong> contados a partir de la hora confirmada de aterrizaje del vuelo.
            </p>
            <p>
              <strong>4. Emisión de Boletas y Facturas Electrónicas:</strong> La plataforma registra los datos fiscales ingresados por el usuario (DNI o RUC/Razón Social). La empresa emisora del servicio genera el comprobante tributario oficial y lo envía en formato PDF/XML directamente al WhatsApp registrado.
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="h-5 w-5 rounded border-crusoe-400 text-crusoe-600 focus:ring-crusoe-500"
            />
            <span className="text-xs font-semibold text-crusoe-950">
              He leído y acepto los Términos v1.0, la Política de Privacidad v1.0 y la Condición de Adelanto del 50%.
            </span>
          </label>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(6)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button disabled={!acceptedTerms} onClick={() => setStep(8)}>
              Siguiente: Instrucciones de Pago
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 8 & 9: Pago y Voucher Upload */}
      {(step === 8 || step === 9) && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-crusoe-950 flex items-center gap-2">
            <Upload className="h-5 w-5 text-crusoe-600" />
            8. Realiza el Pago del Adelanto (50% = S/ {quote?.depositRequired.toFixed(2)})
          </h2>

          {/* Selector Método */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod('yape')}
              className={`rounded-2xl border-2 p-3 font-bold text-xs transition-all ${
                paymentMethod === 'yape'
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : 'border-crusoe-200 bg-white text-crusoe-800'
              }`}
            >
              Yape
            </button>
            <button
              onClick={() => setPaymentMethod('plin')}
              className={`rounded-2xl border-2 p-3 font-bold text-xs transition-all ${
                paymentMethod === 'plin'
                  ? 'border-cyan-600 bg-cyan-50 text-cyan-900'
                  : 'border-crusoe-200 bg-white text-crusoe-800'
              }`}
            >
              Plin
            </button>
            <button
              onClick={() => setPaymentMethod('bcp')}
              className={`rounded-2xl border-2 p-3 font-bold text-xs transition-all ${
                paymentMethod === 'bcp'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-crusoe-200 bg-white text-crusoe-800'
              }`}
            >
              Transferencia BCP
            </button>
          </div>

          {/* Instrucciones según Método */}
          <div className="rounded-2xl bg-crusoe-50 border border-crusoe-200 p-5 text-xs text-crusoe-950 space-y-2">
            {paymentMethod === 'bcp' ? (
              <>
                <p className="font-bold text-sm text-crusoe-900">Datos para Transferencia BCP:</p>
                <p>
                  <strong>Número de Cuenta:</strong> {PAYMENT_METHODS_INFO.bcp.accountNumber}
                </p>
                <p>
                  <strong>CCI Interbancario:</strong> {PAYMENT_METHODS_INFO.bcp.cci}
                </p>
                <p>
                  <strong>Titular:</strong> {PAYMENT_METHODS_INFO.bcp.owner}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm text-crusoe-900">
                  Realiza tu pago vía {paymentMethod === 'yape' ? 'Yape' : 'Plin'} al número:
                </p>
                <p className="text-lg font-extrabold text-crusoe-700">
                  {PAYMENT_METHODS_INFO.yape.phone}
                </p>
                <p className="text-crusoe-800">Titular: {PAYMENT_METHODS_INFO.yape.owner}</p>
              </>
            )}
            <p className="text-[11px] text-crusoe-700 pt-1 font-semibold">
              Monto Exacto Adelanto 50%: <strong>S/ {quote?.depositRequired.toFixed(2)}</strong>
            </p>
          </div>

          {/* Adjuntar Comprobante */}
          <div className="space-y-4 pt-2">
            <label className="block text-xs font-bold text-crusoe-900">
              Adjunta la Imagen del Comprobante / Voucher (Máx 2MB)
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleVoucherChange}
              className="w-full text-xs text-crusoe-900 file:mr-4 file:rounded-xl file:border-0 file:bg-crusoe-600 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-white hover:file:bg-crusoe-700"
            />

            {voucherPreview && (
              <div className="mt-3 flex items-center gap-4 rounded-2xl border border-crusoe-300 p-3 bg-crusoe-50">
                <img src={voucherPreview} alt="Preview voucher" className="h-16 w-16 object-cover rounded-xl" />
                <div className="text-xs text-crusoe-900">
                  <span className="font-bold block text-crusoe-700">Comprobante Cargado</span>
                  <span>Nombre: {voucherFile?.name}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-crusoe-900 mb-1">
                Número de Operación / Referencia (Opcional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Ej. YAP-9812401"
                className="w-full rounded-xl border border-crusoe-300 p-3 text-sm focus:border-crusoe-600"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(7)}>
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button isLoading={loading} onClick={handleCreateReservation}>
              Enviar Reserva y Voucher
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 10: Confirmación Final */}
      {step === 10 && createdReservation && (
        <div className="space-y-6 text-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-crusoe-100 text-crusoe-600 mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-crusoe-700">
              Reserva Registrada Correctamente
            </span>
            <h2 className="text-3xl font-extrabold text-crusoe-950 mt-1">{createdReservation.code}</h2>
            <div className="mt-2 flex justify-center">
              <Badge status={createdReservation.status} />
            </div>
          </div>

          <div className="rounded-2xl border border-crusoe-200 bg-crusoe-50/70 p-6 text-left text-xs text-crusoe-900 space-y-2 max-w-lg mx-auto">
            <div className="flex justify-between">
              <span className="font-bold">Pasajero Principal:</span>
              <span>{createdReservation.customer?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Origen / Destino:</span>
              <span>
                {createdReservation.origin} ➔ {createdReservation.destination}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Fecha / Hora:</span>
              <span>{new Date(createdReservation.scheduled_at).toLocaleString('es-PE')}</span>
            </div>

            {createdReservation.invoice_details && createdReservation.invoice_details.type !== 'ninguno' && (
              <div className="border-t border-crusoe-200 pt-2 text-crusoe-800">
                <span className="font-bold text-crusoe-950 block">Comprobante Fiscal Solicitado:</span>
                <span>
                  {createdReservation.invoice_details.type.toUpperCase()} — {createdReservation.invoice_details.ruc ? `RUC ${createdReservation.invoice_details.ruc} (${createdReservation.invoice_details.companyName})` : `DNI ${createdReservation.invoice_details.dni}`}
                </span>
                <span className="text-[10px] text-crusoe-700 block italic">Se enviará el PDF/XML a tu WhatsApp.</span>
              </div>
            )}

            <div className="flex justify-between border-t border-crusoe-200 pt-2 font-bold text-sm text-crusoe-950">
              <span>Adelanto Enviado (50%):</span>
              <span className="text-crusoe-700">S/ {createdReservation.deposit_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Saldo a pagar al abordar:</span>
              <span>S/ {createdReservation.balance_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href={WhatsAppService.getAdminConfirmationLink(
                createdReservation,
                createdReservation.customer?.phone || PAYMENT_METHODS_INFO.yape.phone
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-crusoe-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-crusoe-600/30 hover:bg-crusoe-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Notificar Reserva por WhatsApp
            </a>
            <Link href={`/reserva/${createdReservation.code}`}>
              <Button variant="outline">Ver Estado de Mi Reserva</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingWizardPage() {
  return (
    <div className="min-h-screen bg-crusoe-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-crusoe-700">
            Fast Travel Xauxa — Servicio Ejecutivo
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-crusoe-950 mt-1">
            Asistente de Reserva y Cotización
          </h1>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-crusoe-900 font-medium">Cargando formulario de reserva...</div>}>
          <BookingWizardForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

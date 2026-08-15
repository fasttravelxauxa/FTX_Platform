'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Search,
  Filter,
  MessageSquare,
  Printer,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  FileCheck,
  Building2,
  Copy,
  LogOut,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LocalDb } from '@/lib/storage/mock-db';
import { RepositoryService } from '@/lib/services/repository';
import { Reservation, ReservationStatus } from '@/lib/types';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'reservas' | 'calendario' | 'vehiculos' | 'auditoria'>('reservas');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected reservation for review modal
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  useEffect(() => {
    checkAdminAuth();

    // Supabase Realtime para sincronizar PC y Celular al instante
    const supabase = createClient();
    if (supabase) {
      const channel = supabase
        .channel('admin_realtime_reservations')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reservations' },
          () => {
            console.log('[FTX Realtime] Cambio detectado en reservas, actualizando...');
            RepositoryService.getReservations().then(setReservations);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const checkAdminAuth = async () => {
    // 1. Check local session storage key
    if (typeof window !== 'undefined') {
      const isLocalAuth = localStorage.getItem('ftx_admin_auth');
      if (isLocalAuth === 'true') {
        setAuthChecking(false);
        await refreshData();
        return;
      }
    }

    // 2. Check Supabase Auth session if local key is absent
    try {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthChecking(false);
          await refreshData();
          return;
        }
      }
    } catch (err) {
      console.warn('Error verificando usuario Supabase:', err);
    }

    // 3. Unauthenticated -> redirect to login
    router.push('/admin/login');
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ftx_admin_auth');
    }

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Error al cerrar sesión de Supabase:', err);
    }

    router.push('/admin/login');
  };

  const refreshData = async () => {
    const list = await RepositoryService.getReservations();
    setReservations(list);
  };

  // KPIs
  const totalIncome = reservations
    .filter((r) => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
    .reduce((acc, r) => acc + r.deposit_amount, 0);

  const pendingReviewCount = reservations.filter((r) => r.status === 'PAYMENT_REVIEW' || r.status === 'PAYMENT_SUBMITTED').length;
  const confirmedCount = reservations.filter((r) => r.status === 'CONFIRMED').length;
  const inProgressCount = reservations.filter((r) => r.status === 'IN_PROGRESS').length;

  // Filtered reservations
  const filteredList = reservations.filter((r) => {
    const matchesStatus = filterStatus === 'TODOS' || r.status === filterStatus;
    const matchesSearch =
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer?.phone.includes(searchTerm) ||
      r.invoice_details?.ruc?.includes(searchTerm) ||
      r.invoice_details?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Approve Payment Proof
  const handleApprovePayment = async (res: Reservation) => {
    const updated: Reservation = {
      ...res,
      status: 'CONFIRMED',
      updated_at: new Date().toISOString(),
    };
    if (updated.payments?.[0]) {
      updated.payments[0].status = 'APPROVED';
    }
    await RepositoryService.saveReservation(updated);
    await refreshData();
    setShowReviewModal(false);
    alert(`Pago aprobado con éxito para la reserva ${res.code}. El estado cambió a CONFIRMED.`);
  };

  // Reject Payment Proof
  const handleRejectPayment = async (res: Reservation) => {
    if (!rejectionReason.trim()) {
      alert('Por favor ingresa el motivo del rechazo.');
      return;
    }
    const updated: Reservation = {
      ...res,
      status: 'PAYMENT_REJECTED',
      notes: `Rechazo de comprobante: ${rejectionReason}`,
      updated_at: new Date().toISOString(),
    };
    if (updated.payments?.[0]) {
      updated.payments[0].status = 'REJECTED';
    }
    await RepositoryService.saveReservation(updated);
    await refreshData();
    setShowReviewModal(false);
    setRejectionReason('');
    alert(`Comprobante rechazado para ${res.code}.`);
  };

  // Copy invoicing data helper
  const copyInvoiceInfo = (res: Reservation) => {
    if (!res.invoice_details || res.invoice_details.type === 'ninguno') return;
    const info = res.invoice_details.type === 'factura'
      ? `FACTURA: RUC ${res.invoice_details.ruc} - ${res.invoice_details.companyName} - Dir: ${res.invoice_details.fiscalAddress}`
      : `BOLETA: DNI ${res.invoice_details.dni} - ${res.invoice_details.name}`;
    navigator.clipboard.writeText(info);
    alert(`Datos tributarios copiados al portapapeles:\n${info}`);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-crusoe-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-500 text-crusoe-950 font-bold mb-4 animate-bounce">
          <Car className="h-7 w-7" />
        </div>
        <p className="text-sm font-semibold text-crusoe-200">Verificando sesión administrativa de Fast Travel Xauxa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crusoe-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Admin Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-crusoe-200 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-crusoe-700">
              Panel Operativo — Fast Travel Xauxa
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-crusoe-950 mt-1">
              Control de Reservas y Emisión de Comprobantes
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Link href="/reserva">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Nueva Reserva
              </Button>
            </Link>
            <Button size="sm" variant="danger" onClick={handleLogout} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-crusoe-200 bg-white p-5 shadow-sm">
            <span className="text-[11px] font-bold text-crusoe-700 uppercase tracking-wider">Pagos en Revisión</span>
            <p className="text-3xl font-extrabold text-indigo-900 mt-1">{pendingReviewCount}</p>
            <span className="text-[10px] text-indigo-700 mt-1 block">Requieren validación admin</span>
          </div>

          <div className="rounded-2xl border border-crusoe-200 bg-white p-5 shadow-sm">
            <span className="text-[11px] font-bold text-crusoe-700 uppercase tracking-wider">Viajes Confirmados</span>
            <p className="text-3xl font-extrabold text-crusoe-900 mt-1">{confirmedCount}</p>
            <span className="text-[10px] text-crusoe-700 mt-1 block">SUV Jetour programada</span>
          </div>

          <div className="rounded-2xl border border-crusoe-200 bg-white p-5 shadow-sm">
            <span className="text-[11px] font-bold text-crusoe-700 uppercase tracking-wider">Viajes en Curso</span>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1">{inProgressCount}</p>
            <span className="text-[10px] text-emerald-800 mt-1 block">Unidades en servicio</span>
          </div>

          <div className="rounded-2xl border border-crusoe-200 bg-white p-5 shadow-sm">
            <span className="text-[11px] font-bold text-crusoe-700 uppercase tracking-wider">Ingresos por Adelantos</span>
            <p className="text-3xl font-extrabold text-crusoe-950 mt-1">S/ {totalIncome.toFixed(2)}</p>
            <span className="text-[10px] text-crusoe-700 mt-1 block">Adelantos verificados (50%)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex border-b border-crusoe-200 gap-6 text-sm font-bold text-crusoe-900">
          <button
            onClick={() => setActiveTab('reservas')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'reservas' ? 'border-crusoe-600 text-crusoe-700' : 'border-transparent text-gray-700 hover:text-crusoe-800'
            }`}
          >
            Gestión de Reservas
          </button>
          <button
            onClick={() => setActiveTab('calendario')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'calendario' ? 'border-crusoe-600 text-crusoe-700' : 'border-transparent text-gray-700 hover:text-crusoe-800'
            }`}
          >
            Calendario Operativo
          </button>
          <button
            onClick={() => setActiveTab('vehiculos')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'vehiculos' ? 'border-crusoe-600 text-crusoe-700' : 'border-transparent text-gray-700 hover:text-crusoe-800'
            }`}
          >
            Flota SUV Jetour
          </button>
        </div>

        {/* TAB 1: RESERVAS */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-crusoe-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-crusoe-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código, cliente, teléfono, RUC o Razón Social..."
                  className="w-full rounded-xl border border-crusoe-300 pl-10 pr-4 py-2.5 text-xs focus:border-crusoe-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-crusoe-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-crusoe-300 p-2.5 text-xs font-semibold focus:border-crusoe-600"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="PAYMENT_REVIEW">En Revisión de Pago</option>
                  <option value="CONFIRMED">Confirmadas</option>
                  <option value="ASSIGNED">Conductor Asignado</option>
                  <option value="IN_PROGRESS">En Curso</option>
                  <option value="COMPLETED">Completadas</option>
                  <option value="CANCELLED">Canceladas</option>
                </select>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="overflow-x-auto rounded-2xl border border-crusoe-200 bg-white shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-crusoe-100/60 text-crusoe-950 font-bold uppercase tracking-wider border-b border-crusoe-200">
                  <tr>
                    <th className="p-4">Código / Pasajero</th>
                    <th className="p-4">Servicio / Vuelo</th>
                    <th className="p-4">Comprobante Fiscal</th>
                    <th className="p-4">Monto / Adelanto</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-crusoe-100 text-crusoe-900">
                  {filteredList.map((res) => (
                    <tr key={res.id} className="hover:bg-crusoe-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-extrabold block text-crusoe-950 text-sm">{res.code}</span>
                        <span className="font-semibold block">{res.customer?.full_name}</span>
                        <span className="text-gray-700 block">{res.customer?.phone}</span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold block text-crusoe-800">{res.service?.name}</span>
                        {res.flight_number && (
                          <span className="text-[11px] text-gray-700 block">
                            {res.flight_airline} ({res.flight_number})
                          </span>
                        )}
                        <span className="text-[10px] text-gray-600 block truncate max-w-xs">
                          {res.origin} ➔ {res.destination}
                        </span>
                      </td>

                      <td className="p-4">
                        {res.invoice_details && res.invoice_details.type !== 'ninguno' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-bold text-crusoe-900 bg-crusoe-100 px-2 py-0.5 rounded text-[11px]">
                              <FileCheck className="h-3 w-3 text-crusoe-700" />
                              {res.invoice_details.type.toUpperCase()}
                            </span>
                            {res.invoice_details.type === 'factura' ? (
                              <div className="text-[11px]">
                                <span className="font-bold block text-crusoe-950">RUC: {res.invoice_details.ruc}</span>
                                <span className="block text-gray-800 truncate max-w-[180px]">{res.invoice_details.companyName}</span>
                              </div>
                            ) : (
                              <div className="text-[11px]">
                                <span className="font-bold block text-crusoe-950">DNI: {res.invoice_details.dni}</span>
                              </div>
                            )}
                            <button
                              onClick={() => copyInvoiceInfo(res)}
                              className="text-[10px] text-crusoe-700 hover:underline font-bold flex items-center gap-1"
                            >
                              <Copy className="h-2.5 w-2.5" />
                              Copiar datos
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-[11px]">Sin comprobante fiscal</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className="font-extrabold text-crusoe-950 block">Total: S/ {res.total_amount.toFixed(2)}</span>
                        <span className="text-crusoe-700 font-bold block">Adelanto: S/ {res.deposit_amount.toFixed(2)}</span>
                      </td>

                      <td className="p-4">
                        <Badge status={res.status} size="sm" />
                      </td>

                      <td className="p-4 text-right space-x-2">
                        {/* Review Voucher button */}
                        {res.payments?.[0]?.proofs?.[0] && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedRes(res);
                              setShowReviewModal(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Voucher
                          </Button>
                        )}

                        {/* Reception Poster Button */}
                        <Link href={`/admin/cartel/${res.code}`}>
                          <Button size="sm" variant="outline" title="Generar Cartel para Aeropuerto">
                            <Printer className="h-3.5 w-3.5" />
                            Cartel
                          </Button>
                        </Link>

                        {/* WhatsApp Link */}
                        <a
                          href={WhatsAppService.getAdminConfirmationLink(res, res.customer?.phone || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-crusoe-700 hover:underline p-1"
                          title="Enviar confirmación por WhatsApp (Sólo mensajes)"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>

                        {/* Delete button — solo para reservas canceladas o rechazadas */}
                        {['CANCELLED', 'PAYMENT_REJECTED', 'EXPIRED'].includes(res.status) && (
                          <Button
                            size="sm"
                            variant="danger"
                            title="Eliminar reserva cancelada o rechazada"
                            onClick={async () => {
                              if (!window.confirm(`¿Eliminar definitivamente la reserva ${res.code}?`)) return;
                              await RepositoryService.deleteReservation(res.id, res.code);
                              await refreshData();
                            }}
                          >
                            🗑️
                          </Button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CALENDARIO OPERATIVO */}
        {activeTab === 'calendario' && (
          <div className="rounded-3xl border border-crusoe-200 bg-white p-8 space-y-6 shadow-md">
            <h2 className="text-xl font-bold text-crusoe-950">Calendario de Salidas y Recepción Aeropuerto</h2>
            <div className="space-y-4">
              {reservations.map((res) => (
                <div key={res.id} className="rounded-2xl border border-crusoe-200 bg-crusoe-50/70 p-4 flex items-center justify-between">
                  <div className="space-y-1 text-xs">
                    <span className="font-extrabold text-sm text-crusoe-900">{res.code}</span>
                    <span className="block font-semibold">
                      {new Date(res.scheduled_at).toLocaleString('es-PE')} — {res.customer?.full_name}
                    </span>
                    <span className="text-gray-800 block">
                      Ruta: {res.origin} ➔ {res.destination}
                    </span>
                  </div>
                  <Badge status={res.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FLOTA */}
        {activeTab === 'vehiculos' && (
          <div className="rounded-3xl border border-crusoe-200 bg-white p-8 space-y-6 shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-crusoe-950">Vehículos Registrados</h2>
                <p className="text-xs text-crusoe-800">SUV Jetour último modelo activa para el servicio.</p>
              </div>
              <Button size="sm">Registrar Vehículo</Button>
            </div>

            <div className="rounded-2xl border border-crusoe-200 p-5 bg-crusoe-50 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-base text-crusoe-950">Jetour X70 Plus SUV Deluxe (2026)</span>
                <span className="block text-xs text-crusoe-800">Placa: W4X-892 — Capacidad: 4 Pasajeros</span>
                <span className="text-[11px] font-bold text-crusoe-700 block mt-1">SOAT Rímac: Vigente hasta Abril 2027</span>
              </div>
              <Badge status="CONFIRMED" size="sm" />
            </div>
          </div>
        )}

        {/* REVIEW PAYMENT VOUCHER MODAL */}
        {showReviewModal && selectedRes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-crusoe-100 pb-3">
                <h3 className="font-bold text-base text-crusoe-950">Revisión de Comprobante — {selectedRes.code}</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-gray-700 hover:text-black">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-crusoe-900">
                <div className="flex justify-between">
                  <span className="font-bold">Cliente:</span>
                  <span>{selectedRes.customer?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Adelanto Requerido (50%):</span>
                  <span className="font-extrabold text-crusoe-700">S/ {selectedRes.deposit_amount.toFixed(2)}</span>
                </div>

                {selectedRes.invoice_details && selectedRes.invoice_details.type !== 'ninguno' && (
                  <div className="rounded-xl bg-crusoe-50 p-3 border border-crusoe-200">
                    <span className="font-bold text-crusoe-950 block">Datos para Boleta / Factura Electrónica:</span>
                    <span>
                      {selectedRes.invoice_details.type === 'factura'
                        ? `FACTURA: RUC ${selectedRes.invoice_details.ruc} - ${selectedRes.invoice_details.companyName} (${selectedRes.invoice_details.fiscalAddress})`
                        : `BOLETA: DNI ${selectedRes.invoice_details.dni} - ${selectedRes.invoice_details.name}`}
                    </span>
                  </div>
                )}

                {selectedRes.payments?.[0]?.proofs?.[0] && (
                  <div className="pt-2">
                    <span className="font-bold block mb-2">Voucher Adjunto:</span>
                    <img
                      src={selectedRes.payments[0].proofs[0].file_path}
                      alt="Voucher de pago"
                      className="max-h-60 w-full object-contain rounded-xl border border-crusoe-200 bg-gray-50"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-crusoe-900 mb-1">Motivo de Rechazo (si corresponde):</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ej. Imagen ilegible / Monto incompleto"
                    className="w-full rounded-xl border border-crusoe-300 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-crusoe-100 pt-4">
                <Button variant="danger" size="sm" onClick={() => handleRejectPayment(selectedRes)}>
                  Rechazar Comprobante
                </Button>
                <Button size="sm" onClick={() => handleApprovePayment(selectedRes)}>
                  Aprobar Adelanto y Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

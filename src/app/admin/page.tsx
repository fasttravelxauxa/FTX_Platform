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
  Phone,
  UserCheck,
  Trash2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RepositoryService } from '@/lib/services/repository';
import { Reservation, ReservationStatus, Profile } from '@/lib/types';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'reservas' | 'pasajeros' | 'calendario' | 'vehiculos'>('reservas');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected reservation for review modal
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAuth();

    // Supabase Realtime para sincronización en tiempo real
    const supabase = createClient();
    if (supabase) {
      const channel = supabase
        .channel('admin_realtime_reservations')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reservations' },
          () => {
            console.log('[FTX Realtime] Cambio detectado en reservas, actualizando...');
            refreshData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const checkAdminAuth = async () => {
    if (typeof window !== 'undefined') {
      const isLocalAuth = localStorage.getItem('ftx_admin_auth');
      if (isLocalAuth === 'true') {
        setAuthChecking(false);
        await refreshData();
        return;
      }
    }

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
      console.warn('Error al cerrar sesión:', err);
    }

    router.push('/admin/login');
  };

  const refreshData = async () => {
    const list = await RepositoryService.getReservations();
    const profiles = await RepositoryService.getProfiles();
    setReservations(list);
    setProfilesList(profiles);
  };

  const handleStatusChange = async (reservationId: string, newStatus: ReservationStatus, notes?: string) => {
    setUpdatingId(reservationId);
    const result = await RepositoryService.updateReservationStatus(reservationId, newStatus, notes);

    if (result.success) {
      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, status: newStatus, notes: notes || r.notes } : r))
      );
      if (selectedRes && selectedRes.id === reservationId) {
        setSelectedRes((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setShowReviewModal(false);
      setRejectionReason('');
    } else {
      alert(`Error al actualizar estado en Supabase: ${result.error}`);
    }
    setUpdatingId(null);
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

  // Calculate Passenger Directory from Supabase profiles list (Persistent)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const passengerSummaries = profilesList.map((prof) => {
    const profPhone = prof.phone?.replace(/[^0-9]/g, '') || '';
    const profReservations = reservations.filter((r) => r.customer_id === prof.id || r.customer?.phone?.replace(/[^0-9]/g, '') === profPhone);

    const totalBookings = profReservations.length;
    const confirmedBookings = profReservations.filter((r) => ['CONFIRMED', 'COMPLETED', 'IN_PROGRESS'].includes(r.status)).length;
    
    const todayActiveBookings = profReservations.filter((r) => {
      const createdDate = new Date(r.created_at);
      return (
        createdDate >= todayStart &&
        createdDate <= todayEnd &&
        !['CANCELLED', 'PAYMENT_REJECTED', 'EXPIRED'].includes(r.status)
      );
    }).length;

    const latestRes = profReservations[0];

    return {
      id: prof.id,
      phone: profPhone,
      name: prof.full_name || 'Pasajero',
      dni: prof.dni || undefined,
      title: prof.title_degree || 'Sr.',
      totalBookings,
      confirmedBookings,
      todayActiveBookings,
      lastBookingDate: latestRes ? latestRes.created_at : prof.created_at,
      latestCode: latestRes ? latestRes.code : 'Sin reserva activa',
    };
  });

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crusoe-500 text-slate-950 font-bold mb-4 animate-bounce">
          <Car className="h-7 w-7" />
        </div>
        <p className="text-sm font-semibold text-slate-200">Verificando sesión administrativa de Fast Travel Xauxa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Admin Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-crusoe-700 dark:text-crusoe-400">
              Panel de Control — Fast Travel Xauxa
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white mt-1">
              Operaciones, Reservas y Clientes
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
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pagos en Revisión</span>
            <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{pendingReviewCount}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">Requieren validación</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Viajes Confirmados</span>
            <p className="text-3xl font-extrabold text-crusoe-800 dark:text-crusoe-400 mt-1">{confirmedCount}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">SUV Jetour programada</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Clientes en Supabase</span>
            <p className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">{passengerSummaries.length}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">Perfiles registrados</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ingresos por Adelantos</span>
            <p className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">S/ {totalIncome.toFixed(2)}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">Adelantos verificados (50%)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-extrabold text-slate-700 dark:text-slate-300 overflow-x-auto">
          <button
            onClick={() => setActiveTab('reservas')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reservas' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Gestión de Reservas ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('pasajeros')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'pasajeros' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Directorio de Pasajeros ({passengerSummaries.length})
          </button>
          <button
            onClick={() => setActiveTab('calendario')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'calendario' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Calendario Operativo
          </button>
          <button
            onClick={() => setActiveTab('vehiculos')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'vehiculos' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Flota SUV Jetour
          </button>
        </div>

        {/* TAB 1: RESERVAS */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código, cliente, teléfono, RUC o Razón Social..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-950 dark:text-white font-medium focus:border-crusoe-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-crusoe-600"
                >
                  <option value="TODOS">Todos los Estados</option>
                  <option value="PAYMENT_REVIEW">En Revisión de Pago</option>
                  <option value="CONFIRMED">Confirmadas</option>
                  <option value="ASSIGNED">Conductor Asignado</option>
                  <option value="IN_PROGRESS">En Curso</option>
                  <option value="COMPLETED">Completadas</option>
                  <option value="CANCELLED">Canceladas</option>
                  <option value="PAYMENT_REJECTED">Pago Rechazado</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-950 dark:text-white font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Código / Pasajero</th>
                    <th className="p-4">Servicio / Ruta</th>
                    <th className="p-4">Comprobante Fiscal</th>
                    <th className="p-4">Monto / Adelanto</th>
                    <th className="p-4">Cambiar Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold text-sm">
                        No se encontraron reservas con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <span className="font-extrabold block text-slate-950 dark:text-white text-sm">{res.code}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{res.customer?.full_name}</span>
                          <span className="text-slate-600 dark:text-slate-400 block text-[11px]">{res.customer?.phone}</span>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-slate-950 dark:text-white block">{res.service?.name || 'Traslado'}</span>
                          <span className="text-slate-600 dark:text-slate-400 block text-[11px]">
                            {res.origin} ➔ {res.destination}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                            {new Date(res.scheduled_at).toLocaleString('es-PE')}
                          </span>
                        </td>

                        <td className="p-4">
                          {res.invoice_details && res.invoice_details.type !== 'ninguno' ? (
                            <div className="space-y-1">
                              <span className="font-extrabold text-crusoe-800 dark:text-crusoe-400 uppercase block">
                                {res.invoice_details.type}
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 block text-[11px]">
                                {res.invoice_details.ruc ? `RUC: ${res.invoice_details.ruc}` : `DNI: ${res.invoice_details.dni}`}
                              </span>
                              <button
                                onClick={() => copyInvoiceInfo(res)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-crusoe-700 dark:text-crusoe-400 hover:underline"
                              >
                                <Copy className="h-3 w-3" />
                                Copiar Datos
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">No solicitado</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="font-extrabold text-slate-950 dark:text-white block text-sm">
                            S/ {res.total_amount.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-crusoe-700 dark:text-crusoe-400 block">
                            Adelanto: S/ {res.deposit_amount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            Saldo: S/ {res.balance_amount.toFixed(2)}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1.5">
                            <Badge status={res.status} size="sm" />
                            <select
                              value={res.status}
                              disabled={updatingId === res.id}
                              onChange={(e) =>
                                handleStatusChange(res.id, e.target.value as ReservationStatus)
                              }
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-1.5 text-[11px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-crusoe-600 shadow-sm"
                            >
                              <option value="PENDING_PAYMENT">Esperando Pago</option>
                              <option value="PAYMENT_SUBMITTED">Comprobante Enviado</option>
                              <option value="PAYMENT_REVIEW">En Revisión</option>
                              <option value="CONFIRMED">✅ Confirmada</option>
                              <option value="ASSIGNED">🚗 Chofer Asignado</option>
                              <option value="IN_PROGRESS">🚀 En Curso</option>
                              <option value="COMPLETED">🏁 Completada</option>
                              <option value="PAYMENT_REJECTED">❌ Pago Rechazado</option>
                              <option value="CANCELLED">🚫 Cancelada</option>
                            </select>
                          </div>
                        </td>

                        <td className="p-4 text-right space-x-2">
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

                          <Link href={`/admin/cartel/${res.code}`}>
                            <Button size="sm" variant="outline" title="Generar Cartel para Aeropuerto">
                              <Printer className="h-3.5 w-3.5" />
                              Cartel
                            </Button>
                          </Link>

                          <a
                            href={WhatsAppService.getAdminConfirmationLink(res, res.customer?.phone || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl bg-crusoe-100 dark:bg-crusoe-950 p-2 text-xs font-bold text-crusoe-900 dark:text-crusoe-200 hover:bg-crusoe-200 transition-colors"
                            title="Enviar confirmación por WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </a>

                          {['CANCELLED', 'PAYMENT_REJECTED', 'EXPIRED'].includes(res.status) && (
                            <Button
                              size="sm"
                              variant="danger"
                              title="Eliminar reserva cancelada"
                              onClick={async () => {
                                if (!window.confirm(`¿Eliminar la reserva ${res.code}? (El perfil del usuario permanecerá en el Directorio de Supabase)`)) return;
                                await RepositoryService.deleteReservation(res.id, res.code);
                                await refreshData();
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DIRECTORIO DE PASAJEROS */}
        {activeTab === 'pasajeros' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Directorio Oficial de Pasajeros</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Perfiles persistentes en Supabase. Aunque se elimine una reserva cancelada, el perfil del pasajero se mantiene registrado.
                </p>
              </div>
              <span className="text-xs font-extrabold text-crusoe-800 dark:text-crusoe-300 bg-crusoe-50 dark:bg-crusoe-950 border border-crusoe-200 dark:border-crusoe-800 px-3 py-1.5 rounded-xl">
                {passengerSummaries.length} Clientes Registrados
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-950 dark:text-white font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Pasajero / Trato</th>
                    <th className="p-4">WhatsApp / Teléfono</th>
                    <th className="p-4">DNI</th>
                    <th className="p-4">Historial de Viajes</th>
                    <th className="p-4">Límite Diario (Hoy)</th>
                    <th className="p-4">Última Reserva</th>
                    <th className="p-4 text-right">Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {passengerSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-bold text-sm">
                        Aún no hay perfiles registrados en la base de datos de Supabase.
                      </td>
                    </tr>
                  ) : (
                    passengerSummaries.map((pass) => (
                      <tr key={pass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">{pass.title || 'Sr.'}</span>
                          <span className="font-extrabold text-slate-950 dark:text-white text-sm block">{pass.name}</span>
                        </td>

                        <td className="p-4">
                          <span className="font-mono font-bold text-slate-950 dark:text-white text-sm block">+51 {pass.phone}</span>
                        </td>

                        <td className="p-4">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{pass.dni || 'No registrado'}</span>
                        </td>

                        <td className="p-4">
                          <span className="font-extrabold text-slate-950 dark:text-white block">{pass.totalBookings} reservas registradas</span>
                          <span className="text-xs text-crusoe-700 dark:text-crusoe-400 font-semibold block">{pass.confirmedBookings} completadas</span>
                        </td>

                        <td className="p-4">
                          {pass.todayActiveBookings === 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                              0/2 hoy (2 disponibles)
                            </span>
                          )}
                          {pass.todayActiveBookings === 1 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                              1/2 hoy (1 disponible)
                            </span>
                          )}
                          {pass.todayActiveBookings >= 2 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2.5 py-1 text-[11px] font-bold text-rose-800 dark:text-rose-300">
                              2/2 hoy (Límite alcanzado)
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="font-extrabold text-slate-950 dark:text-white block">{pass.latestCode}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            {new Date(pass.lastBookingDate).toLocaleDateString('es-PE')}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <a
                            href={`https://wa.me/51${pass.phone}?text=${encodeURIComponent(
                              `Hola ${pass.name}, te saludamos de Fast Travel Xauxa respecto a tus reservas ejecutivas.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-crusoe-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-crusoe-700 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CALENDARIO OPERATIVO */}
        {activeTab === 'calendario' && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6 shadow-md">
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Calendario de Salidas y Recepción Aeropuerto</h2>
            <div className="space-y-4">
              {reservations.map((res) => (
                <div key={res.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <span className="font-extrabold text-sm text-slate-950 dark:text-white">{res.code}</span>
                    <span className="block font-bold text-slate-900 dark:text-slate-100">
                      {new Date(res.scheduled_at).toLocaleString('es-PE')} — {res.customer?.full_name}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 block">
                      Ruta: {res.origin} ➔ {res.destination}
                    </span>
                  </div>
                  <Badge status={res.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FLOTA */}
        {activeTab === 'vehiculos' && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6 shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Vehículos Registrados</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">SUV Jetour último modelo activa para el servicio.</p>
              </div>
              <Button size="sm">Registrar Vehículo</Button>
            </div>

            <div className="rounded-2xl border border-crusoe-200 dark:border-crusoe-800 p-5 bg-crusoe-50/70 dark:bg-crusoe-950/50 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-base text-slate-950 dark:text-white">Jetour X70 Plus SUV Deluxe (2026)</span>
                <span className="block text-xs text-slate-700 dark:text-slate-300 font-medium">Placa: W4X-892 — Capacidad: 4 Pasajeros</span>
                <span className="text-[11px] font-bold text-crusoe-800 dark:text-crusoe-300 block mt-1">SOAT Rímac: Vigente hasta Abril 2027</span>
              </div>
              <Badge status="CONFIRMED" size="sm" />
            </div>
          </div>
        )}

        {/* REVIEW PAYMENT VOUCHER MODAL */}
        {showReviewModal && selectedRes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-950 dark:text-white">Revisión de Comprobante — {selectedRes.code}</h3>
                <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Cliente:</span>
                  <span className="font-bold text-slate-950 dark:text-white">{selectedRes.customer?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Teléfono:</span>
                  <span>{selectedRes.customer?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Monto del Adelanto:</span>
                  <span className="font-extrabold text-crusoe-800 dark:text-crusoe-400 text-sm">
                    S/ {selectedRes.deposit_amount.toFixed(2)}
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 p-2 text-center space-y-2">
                  <img
                    src={selectedRes.payments?.[0]?.proofs?.[0]?.file_path}
                    alt="Voucher de pago"
                    className="max-h-72 w-auto mx-auto rounded-xl object-contain"
                  />
                  {selectedRes.payments?.[0]?.proofs?.[0]?.file_path && (
                    <a
                      href={selectedRes.payments[0].proofs[0].file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-crusoe-700 dark:text-crusoe-400 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir imagen completa en Supabase Storage
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Motivo de rechazo (solo si no es válido):
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ej. Monto incompleto o captura ilegible"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={updatingId === selectedRes.id}
                  onClick={() => handleStatusChange(selectedRes.id, 'PAYMENT_REJECTED', `Motivo: ${rejectionReason}`)}
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar Pago
                </Button>

                <Button
                  size="sm"
                  isLoading={updatingId === selectedRes.id}
                  onClick={() => handleStatusChange(selectedRes.id, 'CONFIRMED')}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aprobar Pago y Confirmar
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

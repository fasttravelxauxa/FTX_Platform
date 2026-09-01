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
  Edit3,
  Check,
  TrendingUp,
  DollarSign,
  PieChart,
  CalendarDays,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RepositoryService } from '@/lib/services/repository';
import { Reservation, ReservationStatus, Profile, Vehicle, VehicleStatus, LedgerEntry } from '@/lib/types';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'reservas' | 'calendario' | 'finanzas' | 'pasajeros' | 'vehiculos'>('reservas');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [passengerSearch, setPassengerSearch] = useState<string>('');

  // Finance tab period filter
  const [financePeriod, setFinancePeriod] = useState<'hoy' | 'semana' | 'mes' | 'anio' | 'todos'>('mes');

  // Calendar filter
  const [calendarDateFilter, setCalendarDateFilter] = useState<string>('');

  // Selected reservation for review modal
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New vehicle modal
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [newVehicleBrand, setNewVehicleBrand] = useState<string>('Jetour');
  const [newVehicleModel, setNewVehicleModel] = useState<string>('X70 FL');
  const [newVehicleYear, setNewVehicleYear] = useState<number>(2027);
  const [newVehiclePlate, setNewVehiclePlate] = useState<string>('');
  const [newVehicleCapacity, setNewVehicleCapacity] = useState<number>(4);

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
    const vehicles = await RepositoryService.getVehicles();
    const ledger = await RepositoryService.getFinancialLedger();
    setReservations(list);
    setProfilesList(profiles);
    setVehiclesList(vehicles);
    setLedgerEntries(ledger);
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
      // Si se completó, recargar el libro contable
      if (newStatus === 'COMPLETED') {
        const updatedLedger = await RepositoryService.getFinancialLedger();
        setLedgerEntries(updatedLedger);
      }
    } else {
      alert(`Error al actualizar estado en Supabase: ${result.error}`);
    }
    setUpdatingId(null);
  };

  const handleDeleteProfile = async (pass: { id: string; name: string; phone: string }) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar a "${pass.name}" (+51 ${pass.phone}) del Directorio de Pasajeros?\n\nEsta acción eliminará su perfil y todas sus reservas vinculadas en Supabase.`
    );
    if (!confirmed) return;

    const res = await RepositoryService.deleteProfile(pass.id);
    if (res.success) {
      setProfilesList((prev) => prev.filter((p) => p.id !== pass.id));
      setReservations((prev) =>
        prev.filter((r) => r.customer_id !== pass.id && r.customer?.phone?.replace(/[^0-9]/g, '') !== pass.phone)
      );
      alert(`Perfil de "${pass.name}" y sus registros fueron eliminados correctamente de Supabase.`);
    } else {
      alert(
        `No se pudo eliminar el perfil: ${res.error}\n\nNota: Si es un error de permisos en Supabase, asegúrate de ejecutar el script "fix_delete_cascade_and_policies.sql" en el SQL Editor de Supabase.`
      );
    }
  };

  const handleDeleteReservation = async (res: Reservation) => {
    if (res.status === 'COMPLETED') {
      const confirmCompleted = window.confirm(
        `ATENCIÓN: La reserva ${res.code} está marcada como COMPLETADA y sus ingresos ya fueron asentados en el Libro Contable Histórico.\n\n¿Deseas depurarla de la lista operativa? Los ingresos contables seguirán registrados de forma permanente.`
      );
      if (!confirmCompleted) return;
    } else {
      if (!window.confirm(`¿Eliminar la reserva ${res.code} de Supabase?`)) return;
    }

    const ok = await RepositoryService.deleteReservation(res.id, res.code);
    if (ok) {
      setReservations((prev) => prev.filter((r) => r.id !== res.id));
      if (selectedRes && selectedRes.id === res.id) {
        setShowReviewModal(false);
      }
      alert(`Reserva ${res.code} eliminada de la lista operativa.`);
    } else {
      alert(`Error al eliminar la reserva ${res.code}.`);
    }
  };

  const handleFilterPassengerReservations = (phone: string) => {
    setSearchTerm(phone);
    setActiveTab('reservas');
  };

  const handleVehicleStatusChange = async (vehicleId: string, newStatus: VehicleStatus) => {
    await RepositoryService.updateVehicleStatus(vehicleId, newStatus);
    setVehiclesList((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v))
    );
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehiclePlate.trim()) {
      alert('Ingresa la placa de la unidad');
      return;
    }

    const newVehicle: Vehicle = {
      id: crypto.randomUUID(),
      brand: newVehicleBrand.trim(),
      model: newVehicleModel.trim(),
      year: Number(newVehicleYear),
      plate: newVehiclePlate.trim().toUpperCase(),
      capacity: Number(newVehicleCapacity),
      status: 'AVAILABLE',
      photo_urls: ['/images/banners/auto_sinfondo.png'],
      created_at: new Date().toISOString(),
    };

    await RepositoryService.saveVehicle(newVehicle);
    setVehiclesList((prev) => [newVehicle, ...prev]);
    setShowVehicleModal(false);
    setNewVehiclePlate('');
    alert(`Unidad ${newVehicle.brand} ${newVehicle.model} (${newVehicle.plate}) registrada exitosamente.`);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (!window.confirm(`¿Eliminar la unidad ${vehicle.brand} ${vehicle.model} (${vehicle.plate})?`)) return;
    await RepositoryService.deleteVehicle(vehicle.id);
    setVehiclesList((prev) => prev.filter((v) => v.id !== vehicle.id));
  };

  const handleDeleteLedgerEntry = async (entry: LedgerEntry) => {
    if (!window.confirm(`¿Eliminar definitivamente el servicio ${entry.reservation_code} (${entry.customer_name}) del historial de liquidación y de todos los registros del sistema?\n\nEsta acción recalculará los ingresos y purgará los datos de forma permanente e irrecuperable.`)) {
      return;
    }

    try {
      await RepositoryService.deleteLedgerEntry(entry.reservation_code, entry.id);
      setLedgerEntries((prev) => prev.filter((e) => e.reservation_code !== entry.reservation_code));
      setReservations((prev) => prev.filter((r) => r.code !== entry.reservation_code));
      alert(`El registro ${entry.reservation_code} ha sido purgado completamente del sistema.`);
    } catch (err: any) {
      alert(`Error al eliminar: ${err?.message || 'Error desconocido'}`);
    }
  };

  // KPIs
  const totalIncome = reservations
    .filter((r) => r.status === 'CONFIRMED' || r.status === 'COMPLETED')
    .reduce((acc, r) => acc + r.deposit_amount, 0);

  const pendingReviewCount = reservations.filter((r) => r.status === 'PAYMENT_REVIEW' || r.status === 'PAYMENT_SUBMITTED').length;
  const confirmedCount = reservations.filter((r) => r.status === 'CONFIRMED').length;
  const pendingPaymentCount = reservations.filter((r) => r.status === 'PENDING_PAYMENT' || r.status === 'DRAFT').length;

  // Filtered reservations for the main table
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

  const passengerSummaries = profilesList
    .filter((prof) => {
      const pName = (prof.full_name || '').toLowerCase();
      const pPhone = (prof.phone || '').toLowerCase();
      const pDni = (prof.dni || '').toLowerCase();
      const s = passengerSearch.toLowerCase();
      return pName.includes(s) || pPhone.includes(s) || pDni.includes(s);
    })
    .map((prof) => {
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

  // Financial calculations based on financePeriod
  const now = new Date();
  const getPeriodStartDate = () => {
    const d = new Date(now);
    if (financePeriod === 'hoy') {
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (financePeriod === 'semana') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // lunes de esta semana
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (financePeriod === 'mes') {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (financePeriod === 'anio') {
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return new Date(0); // todos
  };

  const periodStartDate = getPeriodStartDate();

  // Combinar todos los viajes completados del Libro Contable Histórico Inmutable y de las reservas activas
  const allCompletedTripsMap = new Map<string, LedgerEntry>();

  // 1. Asientos guardados en el Libro Contable Histórico
  ledgerEntries.forEach((entry) => {
    allCompletedTripsMap.set(entry.reservation_code, entry);
  });

  // 2. Asientos de reservas activas completadas (para sincronía inmediata)
  reservations
    .filter((r) => r.status === 'COMPLETED')
    .forEach((r) => {
      const isShared = r.service_id === 'a2222222-2222-2222-2222-222222222222';
      if (!allCompletedTripsMap.has(r.code)) {
        allCompletedTripsMap.set(r.code, {
          id: r.id,
          reservation_code: r.code,
          service_type: isShared ? 'compartido' : 'privado',
          service_name: r.service?.name || (isShared ? 'Servicio Compartido' : 'Servicio Privado Exclusivo'),
          origin: r.origin,
          destination: r.destination,
          scheduled_at: r.scheduled_at,
          completed_at: r.updated_at || r.created_at,
          passengers_count: r.passengers_count || 1,
          customer_name: r.customer?.full_name || 'Pasajero',
          customer_phone: r.customer?.phone || '',
          total_amount: Number(r.total_amount || 0),
          deposit_amount: Number(r.deposit_amount || 0),
          balance_amount: Number(r.balance_amount || 0),
          payment_method: r.payments?.[0]?.payment_method || 'yape',
          created_at: r.created_at,
        });
      }
    });

  const allCompletedTrips = Array.from(allCompletedTripsMap.values()).sort(
    (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  );

  const completedTripsInPeriod = allCompletedTrips.filter((entry) => {
    const tripDate = new Date(entry.scheduled_at || entry.completed_at);
    return tripDate >= periodStartDate;
  });

  const totalCompletedRevenue = completedTripsInPeriod.reduce((acc, r) => acc + r.total_amount, 0);
  const totalCompletedDeposits = completedTripsInPeriod.reduce((acc, r) => acc + r.deposit_amount, 0);
  const totalCompletedBalances = completedTripsInPeriod.reduce((acc, r) => acc + r.balance_amount, 0);

  const confirmedTrips = reservations.filter(
    (r) =>
      ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status) &&
      new Date(r.scheduled_at || r.created_at) >= periodStartDate
  );
  const projectedRevenue = confirmedTrips.reduce((acc, r) => acc + r.total_amount, 0);
  const confirmedDeposits = confirmedTrips.reduce((acc, r) => acc + r.deposit_amount, 0);

  const privateCompletedRevenue = completedTripsInPeriod
    .filter((r) => r.service_type === 'privado')
    .reduce((acc, r) => acc + r.total_amount, 0);

  const sharedCompletedRevenue = completedTripsInPeriod
    .filter((r) => r.service_type === 'compartido')
    .reduce((acc, r) => acc + r.total_amount, 0);

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
              Operaciones, Reservas y Flota
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Vouchers por Revisar</span>
            <p className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{pendingReviewCount}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">Requieren verificación</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Viajes Confirmados</span>
            <p className="text-3xl font-extrabold text-crusoe-800 dark:text-crusoe-400 mt-1">{confirmedCount}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">SUV Jetour programada</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Sin Adelanto</span>
            <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">{pendingPaymentCount}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">Esperando pago del 20%</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Adelantos Verificados</span>
            <p className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1">S/ {totalIncome.toFixed(2)}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">Recaudado (20%)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-extrabold text-slate-700 dark:text-slate-300 overflow-x-auto">
          <button
            onClick={() => setActiveTab('reservas')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reservas' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            Gestión de Reservas ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('calendario')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'calendario' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendario Operativo
          </button>
          <button
            onClick={() => setActiveTab('finanzas')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'finanzas' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Finanzas e Ingresos
          </button>
          <button
            onClick={() => setActiveTab('pasajeros')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'pasajeros' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Directorio de Pasajeros ({profilesList.length})
          </button>
          <button
            onClick={() => setActiveTab('vehiculos')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'vehiculos' ? 'border-crusoe-600 text-crusoe-800 dark:text-crusoe-400' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Car className="h-4 w-4" />
            Flota de Unidades ({vehiclesList.length})
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
                  <option value="PENDING_PAYMENT">Esperando Pago (Sin Adelanto)</option>
                  <option value="PAYMENT_SUBMITTED">Comprobante Enviado</option>
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

            {/* Vista Móvil: Tarjetas Responsive */}
            <div className="space-y-4 md:hidden">
              {filteredList.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-slate-500 font-bold text-xs">
                  No se encontraron reservas con los filtros aplicados.
                </div>
              ) : (
                filteredList.map((res) => {
                  const hasVoucher = Boolean(res.payments?.[0]?.proofs?.[0]);
                  const isUnpaid = !hasVoucher && (res.status === 'PENDING_PAYMENT' || res.status === 'DRAFT');

                  return (
                    <div
                      key={res.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div>
                          <span className="font-extrabold text-sm text-slate-950 dark:text-white block">{res.code}</span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{res.customer?.full_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{res.customer?.phone}</span>
                        </div>
                        <Badge status={res.status} size="sm" />
                      </div>

                      <div className="space-y-1 text-xs">
                        {res.service_id === 'a2222222-2222-2222-2222-222222222222' ? (
                          <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">
                            Servicio Compartido • {res.passengers_count || 1} Asiento(s) (S/ 20.00 c/u)
                          </span>
                        ) : (
                          <span className="font-extrabold text-slate-950 dark:text-white block text-xs">
                            Servicio Privado Exclusivo SUV
                          </span>
                        )}
                        <span className="text-slate-600 dark:text-slate-400 block text-[11px]">
                          {res.origin} ➔ {res.destination}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                          {new Date(res.scheduled_at).toLocaleString('es-PE')}
                        </span>
                      </div>

                      {/* Monto y Adelanto en Móvil */}
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Total del Viaje</span>
                          <span className="font-extrabold text-slate-950 dark:text-white text-sm">S/ {res.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          {isUnpaid ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 dark:text-rose-300">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              Falta adelanto: S/ {res.deposit_amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                              <Check className="h-3 w-3 shrink-0" />
                              Adelanto: S/ {res.deposit_amount.toFixed(2)}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Saldo: S/ {res.balance_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Selector de Estado */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado de la Reserva</label>
                        <select
                          value={res.status}
                          disabled={updatingId === res.id}
                          onChange={(e) => handleStatusChange(res.id, e.target.value as ReservationStatus)}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:border-crusoe-600 shadow-sm"
                        >
                          <option value="PENDING_PAYMENT">Esperando Pago (Sin Adelanto)</option>
                          <option value="PAYMENT_SUBMITTED">Comprobante Enviado</option>
                          <option value="PAYMENT_REVIEW">En Revisión</option>
                          <option value="CONFIRMED">Confirmada</option>
                          <option value="ASSIGNED">Chofer Asignado</option>
                          <option value="IN_PROGRESS">En Curso</option>
                          <option value="COMPLETED">Completada</option>
                          <option value="PAYMENT_REJECTED">Pago Rechazado</option>
                          <option value="CANCELLED">Cancelada</option>
                        </select>
                      </div>

                      {/* Acciones en Móvil */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          variant={hasVoucher ? 'primary' : 'secondary'}
                          onClick={() => {
                            setSelectedRes(res);
                            setShowReviewModal(true);
                          }}
                          className="w-full text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {hasVoucher ? 'Ver Voucher' : 'Detalles'}
                        </Button>

                        <Link href={`/admin/cartel/${res.code}`} className="w-full">
                          <Button size="sm" variant="outline" className="w-full text-xs">
                            <Printer className="h-3.5 w-3.5" />
                            Cartel
                          </Button>
                        </Link>

                        {isUnpaid ? (
                          <a
                            href={WhatsAppService.getPaymentReminderLink(res)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-2 text-xs font-bold text-white shadow-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Cobrar Adelanto por WhatsApp
                          </a>
                        ) : (
                          <a
                            href={WhatsAppService.getAdminConfirmationLink(res, res.customer?.phone || '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Confirmar Viaje por WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Vista PC: Tabla de Escritorio */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-950 dark:text-white font-extrabold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Código / Pasajero</th>
                    <th className="p-4">Servicio / Ruta</th>
                    <th className="p-4">Comprobante Fiscal</th>
                    <th className="p-4">Monto / Adelanto</th>
                    <th className="p-4">Estado</th>
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
                    filteredList.map((res) => {
                      const hasVoucher = Boolean(res.payments?.[0]?.proofs?.[0]);
                      const isUnpaid = !hasVoucher && (res.status === 'PENDING_PAYMENT' || res.status === 'DRAFT');

                      return (
                        <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <span className="font-extrabold block text-slate-950 dark:text-white text-sm">{res.code}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{res.customer?.full_name}</span>
                            <span className="text-slate-600 dark:text-slate-400 block text-[11px] font-mono">{res.customer?.phone}</span>
                          </td>

                          <td className="p-4">
                            {res.service_id === 'a2222222-2222-2222-2222-222222222222' ? (
                              <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">
                                Servicio Compartido • {res.passengers_count || 1} Asiento(s) (S/ 20.00 c/u)
                              </span>
                            ) : (
                              <span className="font-extrabold text-slate-950 dark:text-white block text-xs">
                                Servicio Privado Exclusivo SUV
                              </span>
                            )}
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
                            {isUnpaid ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                Falta adelanto: S/ {res.deposit_amount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                                <Check className="h-3 w-3 shrink-0" />
                                Adelanto: S/ {res.deposit_amount.toFixed(2)}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
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
                                <option value="CONFIRMED">Confirmada</option>
                                <option value="ASSIGNED">Chofer Asignado</option>
                                <option value="IN_PROGRESS">En Curso</option>
                                <option value="COMPLETED">Completada</option>
                                <option value="PAYMENT_REJECTED">Pago Rechazado</option>
                                <option value="CANCELLED">Cancelada</option>
                              </select>
                            </div>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              <Button
                                size="sm"
                                variant={hasVoucher ? 'primary' : 'secondary'}
                                onClick={() => {
                                  setSelectedRes(res);
                                  setShowReviewModal(true);
                                }}
                                title="Ver todos los detalles y comprobante"
                                className="text-xs py-1.5 px-2.5"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>{hasVoucher ? 'Voucher' : 'Detalles'}</span>
                              </Button>

                              <Link href={`/admin/cartel/${res.code}`}>
                                <Button size="sm" variant="outline" title="Generar Cartel para Aeropuerto" className="text-xs py-1.5 px-2.5">
                                  <Printer className="h-3.5 w-3.5" />
                                  <span>Cartel</span>
                                </Button>
                              </Link>

                              {isUnpaid ? (
                                <a
                                  href={WhatsAppService.getPaymentReminderLink(res)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors"
                                  title="Cobrar adelanto por WhatsApp"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>Cobrar</span>
                                </a>
                              ) : (
                                <a
                                  href={WhatsAppService.getAdminConfirmationLink(res, res.customer?.phone || '')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors"
                                  title="Confirmar viaje por WhatsApp"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>Confirmar</span>
                                </a>
                              )}

                              <Button
                                size="sm"
                                variant="danger"
                                title="Eliminar reserva"
                                onClick={() => handleDeleteReservation(res)}
                                className="py-1.5 px-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CALENDARIO OPERATIVO CON ACCIONES DIRECTAS */}
        {activeTab === 'calendario' && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Calendario Operativo y Recepción de Vuelos</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Gestiona las salidas del día y marca rápidamente si el viaje fue completado (cobro 100%) o cancelado.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={calendarDateFilter}
                  onChange={(e) => setCalendarDateFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs font-bold text-slate-900 dark:text-white"
                />
                {calendarDateFilter && (
                  <Button size="sm" variant="outline" onClick={() => setCalendarDateFilter('')}>
                    Limpiar Filtro
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {reservations
                .filter((r) => {
                  if (!calendarDateFilter) return true;
                  const resDate = new Date(r.scheduled_at).toISOString().split('T')[0];
                  return resDate === calendarDateFilter;
                })
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                .length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-bold text-xs">
                  No hay traslados programados para la fecha seleccionada.
                </div>
              ) : (
                reservations
                  .filter((r) => {
                    if (!calendarDateFilter) return true;
                    const resDate = new Date(r.scheduled_at).toISOString().split('T')[0];
                    return resDate === calendarDateFilter;
                  })
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                  .map((res) => {
                    const isCompleted = res.status === 'COMPLETED';
                    const isCancelled = res.status === 'CANCELLED' || res.status === 'PAYMENT_REJECTED';

                    return (
                      <div
                        key={res.id}
                        className={`rounded-2xl border p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                          isCompleted
                            ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : isCancelled
                            ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-70'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 shadow-sm'
                        }`}
                      >
                        <div className="space-y-1.5 text-xs flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-950 dark:text-white font-mono">{res.code}</span>
                            <span className="font-extrabold text-crusoe-800 dark:text-crusoe-300 bg-crusoe-100 dark:bg-crusoe-900/80 px-2.5 py-0.5 rounded-lg text-xs">
                              {new Date(res.scheduled_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <Badge status={res.status} size="sm" />
                          </div>

                          <div className="text-slate-900 dark:text-slate-100 font-bold">
                            {new Date(res.scheduled_at).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • Pasajero: <span className="text-crusoe-900 dark:text-crusoe-200">{res.customer?.full_name}</span> ({res.customer?.phone})
                          </div>

                          <div className="text-slate-600 dark:text-slate-400">
                            <strong>Ruta:</strong> {res.origin} ➔ {res.destination}
                            {res.flight_airline && (
                              <span> • Vuelo: {res.flight_airline} {res.flight_number ? `(${res.flight_number})` : ''}</span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-700 dark:text-slate-300 font-bold pt-1">
                            Total: S/ {res.total_amount.toFixed(2)} | Adelanto: S/ {res.deposit_amount.toFixed(2)} | Saldo a cobrar: S/ {res.balance_amount.toFixed(2)}
                          </div>
                        </div>

                        {/* Botones de acción directa del calendario */}
                        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-slate-700">
                          {res.status !== 'COMPLETED' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={async () => {
                                if (window.confirm(`¿Confirmar que el viaje ${res.code} fue realizado con éxito y se cobró el saldo de S/ ${res.balance_amount.toFixed(2)}?`)) {
                                  await handleStatusChange(res.id, 'COMPLETED');
                                }
                              }}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Marcar Completado (100%)
                            </Button>
                          )}

                          {res.status === 'PENDING_PAYMENT' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(res.id, 'CONFIRMED')}
                              className="text-xs"
                            >
                              Confirmar Adelanto
                            </Button>
                          )}

                          {!isCompleted && !isCancelled && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                const reason = prompt('Ingrese el motivo de cancelación:');
                                if (reason) handleStatusChange(res.id, 'CANCELLED', reason);
                              }}
                              className="text-xs"
                            >
                              Cancelar
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedRes(res);
                              setShowReviewModal(true);
                            }}
                            className="text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detalles
                          </Button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FINANZAS E INGRESOS (DIARIO, SEMANAL, MENSUAL, ANUAL) */}
        {activeTab === 'finanzas' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-crusoe-600" />
                  Registro Financiero y Reporte de Ingresos
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Balance consolidado de viajes completados, adelantos recibidos por Yape/Plin/BCP y saldos cobrados al abordar.
                </p>
              </div>

              {/* Selector de Rango Temporal */}
              <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
                {[
                  { key: 'hoy', label: 'Hoy (Diario)' },
                  { key: 'semana', label: 'Esta Semana' },
                  { key: 'mes', label: 'Este Mes' },
                  { key: 'anio', label: 'Este Año' },
                  { key: 'todos', label: 'Histórico' },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setFinancePeriod(p.key as any)}
                    className={`rounded-lg px-3 py-1.5 transition-all ${
                      financePeriod === p.key
                        ? 'bg-white dark:bg-slate-900 text-crusoe-800 dark:text-crusoe-400 shadow-sm font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarjetas de Resumen Financiero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40 p-5 shadow-sm">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Ingreso Total Generado (100%)
                </span>
                <p className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1 font-mono">
                  S/ {totalCompletedRevenue.toFixed(2)}
                </p>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 block font-semibold">
                  {completedTripsInPeriod.length} viajes completados exitosamente
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <span className="text-[11px] font-bold text-crusoe-800 dark:text-crusoe-400 uppercase tracking-wider block">
                  Adelantos Cobrados (20%)
                </span>
                <p className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1 font-mono">
                  S/ {totalCompletedDeposits.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Recibido por Yape, Plin o BCP
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Saldos Cobrados al Abordar (80%)
                </span>
                <p className="text-3xl font-extrabold text-slate-950 dark:text-white mt-1 font-mono">
                  S/ {totalCompletedBalances.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Cobrado por chofer al abordar
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                  Ticket Promedio
                </span>
                <p className="text-3xl font-extrabold text-indigo-950 dark:text-indigo-100 mt-1 font-mono">
                  S/ {(completedTripsInPeriod.length > 0 ? totalCompletedRevenue / completedTripsInPeriod.length : 0).toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Promedio por servicio
                </span>
              </div>
            </div>

            {/* Desglose por Servicio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <span className="font-extrabold text-sm text-slate-950 dark:text-white block">
                  Ingresos por Modalidad de Servicio
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">Servicio Privado Exclusivo SUV</span>
                    <span className="font-extrabold text-crusoe-800 dark:text-crusoe-400">
                      S/ {privateCompletedRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">Servicio Compartido por Asiento</span>
                    <span className="font-extrabold text-crusoe-800 dark:text-crusoe-400">
                      S/ {sharedCompletedRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
                <span className="font-extrabold text-sm text-slate-950 dark:text-white block">
                  Proyección de Viajes Próximos Confirmados
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">Viajes Confirmados por Realizar</span>
                    <span className="font-extrabold text-slate-950 dark:text-white">{confirmedTrips.length} traslados</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span className="font-bold">Monto Total Proyectado a Recaudar</span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      S/ {projectedRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla Detallada de Viajes del Periodo con Opción de Purgado */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden">
              <div className="p-4 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-extrabold text-xs text-slate-950 dark:text-white uppercase tracking-wider flex justify-between items-center">
                <span>Historial de Liquidación del Periodo ({completedTripsInPeriod.length} viajes completados)</span>
                <span className="text-[10px] text-slate-500 font-normal lowercase bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                  opción de purgado total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5">Código / Pasajero</th>
                      <th className="p-3.5">Fecha y Hora</th>
                      <th className="p-3.5">Modalidad / Ruta</th>
                      <th className="p-3.5 text-right">Adelanto (20%)</th>
                      <th className="p-3.5 text-right">Saldo al Abordar (80%)</th>
                      <th className="p-3.5 text-right">Total Cobrado (100%)</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {completedTripsInPeriod.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-bold text-xs">
                          No hay viajes marcados como completados en este periodo.
                        </td>
                      </tr>
                    ) : (
                      completedTripsInPeriod.map((res) => (
                        <tr key={res.reservation_code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3.5">
                            <span className="font-extrabold text-slate-950 dark:text-white block">{res.reservation_code}</span>
                            <span className="text-slate-600 dark:text-slate-400 block text-[11px]">{res.customer_name} ({res.customer_phone})</span>
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300">
                            {new Date(res.scheduled_at).toLocaleString('es-PE')}
                          </td>
                          <td className="p-3.5">
                            {res.service_type === 'compartido' ? (
                              <span className="font-extrabold text-crusoe-700 dark:text-crusoe-400 block text-xs">
                                Servicio Compartido • {res.passengers_count || 1} Asiento(s) (S/ 20 c/u)
                              </span>
                            ) : (
                              <span className="font-extrabold text-slate-950 dark:text-white block text-xs">
                                Servicio Privado Exclusivo SUV
                              </span>
                            )}
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                              {res.origin} ➔ {res.destination}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-crusoe-800 dark:text-crusoe-400">
                            S/ {res.deposit_amount.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                            S/ {res.balance_amount.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-extrabold text-emerald-800 dark:text-emerald-400 text-sm">
                            S/ {res.total_amount.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right">
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleDeleteLedgerEntry(res)}
                              className="text-[11px] py-1 px-2.5 h-auto shadow-sm inline-flex items-center gap-1 font-bold"
                              title="Eliminar definitivamente este servicio del historial contable y purgar todos sus datos"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Eliminar</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIRECTORIO DE PASAJEROS */}
        {activeTab === 'pasajeros' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Directorio Oficial de Pasajeros</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Gestiona los perfiles de clientes registrados en Supabase. Puedes contactar, filtrar viajes o eliminar perfiles.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={passengerSearch}
                  onChange={(e) => setPassengerSearch(e.target.value)}
                  placeholder="Buscar pasajero..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2 text-xs text-slate-950 dark:text-white"
                />
              </div>
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
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {passengerSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-bold text-sm">
                        No se encontraron pasajeros con el criterio de búsqueda.
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
                          <button
                            onClick={() => handleFilterPassengerReservations(pass.phone)}
                            className="text-left group cursor-pointer"
                            title="Haz clic para ver las reservas de este pasajero"
                          >
                            <span className="font-extrabold text-slate-950 dark:text-white block group-hover:text-crusoe-600 transition-colors underline">
                              {pass.totalBookings} reservas registradas
                            </span>
                            <span className="text-xs text-crusoe-700 dark:text-crusoe-400 font-semibold block">{pass.confirmedBookings} completadas</span>
                          </button>
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

                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleFilterPassengerReservations(pass.phone)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Ver reservas de este cliente"
                          >
                            <Eye className="h-3.5 w-3.5 text-crusoe-600 dark:text-crusoe-400" />
                            <span>Reservas</span>
                          </button>

                          <a
                            href={`https://wa.me/51${pass.phone}?text=${encodeURIComponent(
                              `Hola ${pass.name}, le saludamos de Fast Travel Xauxa respecto a sus traslados programados.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl bg-crusoe-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-crusoe-700 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          <Button
                            size="sm"
                            variant="danger"
                            title="Eliminar pasajero del directorio"
                            onClick={() => handleDeleteProfile(pass)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: FLOTA */}
        {activeTab === 'vehiculos' && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6 shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Flota de Unidades Oficiales</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">Camioneta SUV Jetour X70 FL (2027) y unidades operativas para el servicio.</p>
              </div>
              <Button size="sm" onClick={() => setShowVehicleModal(true)}>
                <Plus className="h-4 w-4" />
                Registrar Unidad
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehiclesList.map((veh) => (
                <div
                  key={veh.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/80 dark:bg-slate-800/60 flex flex-col justify-between gap-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-base text-slate-950 dark:text-white block">
                        {veh.brand} {veh.model} ({veh.year})
                      </span>
                      <span className="text-xs font-mono font-bold text-crusoe-800 dark:text-crusoe-400 block mt-0.5">
                        Placa: {veh.plate} • Capacidad: {veh.capacity} pasajeros
                      </span>
                      <span className="text-[11px] font-bold text-crusoe-800 dark:text-crusoe-300 block mt-1">
                        SOAT & Revisión Técnica: Vigente 2026-2027
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <select
                        value={veh.status}
                        onChange={(e) => handleVehicleStatusChange(veh.id, e.target.value as VehicleStatus)}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-xs font-bold text-slate-900 dark:text-white focus:border-crusoe-600"
                      >
                        <option value="AVAILABLE">Disponible</option>
                        <option value="IN_SERVICE">En Servicio</option>
                        <option value="MAINTENANCE">Mantenimiento</option>
                        <option value="UNAVAILABLE">No Disponible</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteVehicle(veh)}
                      className="text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar Unidad
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEW MODAL */}
        {showReviewModal && selectedRes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-widest text-crusoe-700 dark:text-crusoe-400">
                    Ficha Operativa de Reserva
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-0.5">
                    {selectedRes.code}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={selectedRes.status} />
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-950 flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Grid with full reservation details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                {/* Client / Passenger Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2.5">
                  <span className="font-extrabold text-slate-950 dark:text-white block text-xs uppercase tracking-wider">
                    Pasajero Titular
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Nombre Completo:</span>
                    <span className="font-bold text-slate-950 dark:text-white text-right">{selectedRes.customer?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">DNI / Documento:</span>
                    <span className="font-bold text-slate-950 dark:text-white">{selectedRes.customer?.dni || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Teléfono WhatsApp:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-950 dark:text-white font-mono">{selectedRes.customer?.phone}</span>
                      <a
                        href={`https://wa.me/51${(selectedRes.customer?.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[11px] font-extrabold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Chat
                      </a>
                    </div>
                  </div>
                </div>

                {/* Route & Trip Info */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2.5">
                  <span className="font-extrabold text-slate-950 dark:text-white block text-xs uppercase tracking-wider">
                    Itinerario y Vuelo
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Modalidad:</span>
                    <span className="font-bold text-slate-950 dark:text-white text-right">
                      {selectedRes.service_id === 'a2222222-2222-2222-2222-222222222222'
                        ? `Servicio Compartido (${selectedRes.passengers_count || 1} Asiento(s) - S/ 20.00 c/u)`
                        : 'Servicio Privado Exclusivo SUV Jetour (Camioneta Completa)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 block text-[11px]">Ruta de Traslado:</span>
                    <span className="font-bold text-slate-950 dark:text-white block mt-0.5">
                      {selectedRes.origin} ➔ {selectedRes.destination}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Fecha y Hora:</span>
                    <span className="font-bold text-slate-950 dark:text-white">{new Date(selectedRes.scheduled_at).toLocaleString('es-PE')}</span>
                  </div>
                  {selectedRes.flight_airline && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Vuelo de Arribo:</span>
                      <span className="font-bold text-slate-950 dark:text-white">
                        {selectedRes.flight_airline} {selectedRes.flight_number ? `(${selectedRes.flight_number})` : ''}
                      </span>
                    </div>
                  )}
                  {selectedRes.luggage_notes && (
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400 text-[11px] block">Equipaje:</span>
                      <span className="text-slate-800 dark:text-slate-200 text-[11px]">{selectedRes.luggage_notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoicing and Financial Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                {/* Invoicing */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-950 dark:text-white block text-xs uppercase tracking-wider">
                      Comprobante Fiscal
                    </span>
                    {selectedRes.invoice_details && selectedRes.invoice_details.type !== 'ninguno' && (
                      <button
                        onClick={() => copyInvoiceInfo(selectedRes)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-crusoe-700 dark:text-crusoe-400 hover:underline"
                      >
                        <Copy className="h-3 w-3" />
                        Copiar Datos
                      </button>
                    )}
                  </div>
                  {selectedRes.invoice_details && selectedRes.invoice_details.type !== 'ninguno' ? (
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Tipo:</span>
                        <span className="font-extrabold uppercase text-crusoe-800 dark:text-crusoe-400">
                          {selectedRes.invoice_details.type}
                        </span>
                      </div>
                      {selectedRes.invoice_details.ruc && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">RUC:</span>
                          <span className="font-mono font-bold">{selectedRes.invoice_details.ruc}</span>
                        </div>
                      )}
                      {selectedRes.invoice_details.companyName && (
                        <div>
                          <span className="text-slate-600 dark:text-slate-400 block">Razón Social:</span>
                          <span className="font-bold text-slate-950 dark:text-white block">{selectedRes.invoice_details.companyName}</span>
                        </div>
                      )}
                      {selectedRes.invoice_details.dni && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">DNI:</span>
                          <span className="font-mono font-bold">{selectedRes.invoice_details.dni}</span>
                        </div>
                      )}
                      {selectedRes.invoice_details.name && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Nombre Boleta:</span>
                          <span className="font-bold">{selectedRes.invoice_details.name}</span>
                        </div>
                      )}
                      {selectedRes.invoice_details.fiscalAddress && (
                        <div>
                          <span className="text-slate-600 dark:text-slate-400 block">Dirección Fiscal:</span>
                          <span className="text-slate-800 dark:text-slate-200 block">{selectedRes.invoice_details.fiscalAddress}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 italic text-[11px]">No solicitó comprobante fiscal (Solo ticket de servicio).</p>
                  )}
                </div>

                {/* Financial breakdown */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
                  <span className="font-extrabold text-slate-950 dark:text-white block text-xs uppercase tracking-wider">
                    Liquidación Monetaria
                  </span>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Monto Total del Viaje:</span>
                    <span className="font-bold text-slate-950 dark:text-white text-sm">S/ {selectedRes.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-crusoe-800 dark:text-crusoe-400 font-bold">
                    <span>Adelanto (20%):</span>
                    <span>S/ {selectedRes.deposit_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-slate-100 border-t border-slate-200 dark:border-slate-700 pt-2 font-extrabold">
                    <span>Saldo a cobrar al abordar (80%):</span>
                    <span className="text-sm">S/ {selectedRes.balance_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* VOUCHER INSPECTION SECTION */}
              <div className="rounded-2xl border-2 border-crusoe-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                    Comprobante / Voucher de Adelanto
                  </span>
                  {selectedRes.payments?.[0]?.proofs?.[0] ? (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                      Voucher Adjuntado
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full">
                      Sin Adelanto (Falta S/ {selectedRes.deposit_amount.toFixed(2)})
                    </span>
                  )}
                </div>

                {selectedRes.payments?.[0]?.proofs?.[0] ? (
                  <div className="space-y-3">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 p-3 text-center space-y-2">
                      <img
                        src={selectedRes.payments[0].proofs![0].file_path}
                        alt="Voucher de pago"
                        className="max-h-80 w-auto mx-auto rounded-xl object-contain shadow-md cursor-pointer hover:opacity-95"
                        onClick={() => {
                          const url = selectedRes.payments?.[0]?.proofs?.[0]?.file_path;
                          if (url) window.open(url, '_blank');
                        }}
                      />
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">
                          Método: <strong className="uppercase">{selectedRes.payments[0].payment_method || 'Yape'}</strong> | Ref: <strong>{selectedRes.payments[0].proofs![0].reference_number || 'N/A'}</strong>
                        </span>
                        <a
                          href={selectedRes.payments[0].proofs![0].file_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-crusoe-700 dark:text-crusoe-400 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir original en pestaña nueva
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Motivo de rechazo (opcional, solo si el voucher no es válido):
                      </label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ej. Monto incompleto, voucher falso o captura ilegible"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-950 dark:text-white focus:border-crusoe-600"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 p-4 space-y-3">
                    <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
                      El pasajero reservó sin adjuntar voucher de adelanto (S/ {selectedRes.deposit_amount.toFixed(2)}). Puede contactarlo por WhatsApp para solicitarle el abono antes de confirmar.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={WhatsAppService.getPaymentReminderLink(selectedRes)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Cobrar Adelanto por WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción del Modal */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {selectedRes.status !== 'COMPLETED' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(selectedRes.id, 'COMPLETED')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar Completado (100%)
                    </Button>
                  )}
                  {selectedRes.status !== 'CONFIRMED' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(selectedRes.id, 'CONFIRMED')}
                    >
                      Confirmar Reserva
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleStatusChange(selectedRes.id, 'PAYMENT_REJECTED', rejectionReason || 'Comprobante observado')}
                  >
                    Rechazar Comprobante
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowReviewModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL REGISTRO DE VEHÍCULO */}
        {showVehicleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-950 dark:text-white">Registrar Nueva Unidad a la Flota</h3>
                <button onClick={() => setShowVehicleModal(false)} className="text-slate-500 hover:text-slate-950 font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateVehicle} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    value={newVehicleBrand}
                    onChange={(e) => setNewVehicleBrand(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Modelo</label>
                  <input
                    type="text"
                    required
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Año</label>
                    <input
                      type="number"
                      required
                      value={newVehicleYear}
                      onChange={(e) => setNewVehicleYear(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Capacidad Pasajeros</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10}
                      value={newVehicleCapacity}
                      onChange={(e) => setNewVehicleCapacity(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">Placa de Rodaje *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. W4Z-892"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono font-extrabold uppercase"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowVehicleModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Guardar Unidad
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

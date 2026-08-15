import { createClient } from '../supabase/client';
import { LocalDb } from '../storage/mock-db';
import { Reservation } from '../types';

const FTX_PHONE_KEY = 'ftx_passenger_phone';

/**
 * Guardar el teléfono del pasajero en localStorage para identificación futura
 */
export function savePassengerIdentity(phone: string) {
  if (typeof window !== 'undefined' && phone) {
    localStorage.setItem(FTX_PHONE_KEY, phone.replace(/[^0-9]/g, ''));
  }
}

/**
 * Obtener el teléfono del pasajero guardado en este dispositivo
 */
export function getPassengerIdentity(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FTX_PHONE_KEY);
}

export class RepositoryService {
  /**
   * Obtener lista completa de reservas (Admin)
   */
  public static async getReservations(): Promise<Reservation[]> {
    const supabase = createClient();
    if (!supabase) return LocalDb.getReservations();

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[FTX] Error Supabase getReservations:', error.message);
        return LocalDb.getReservations();
      }

      return (data ?? []) as Reservation[];
    } catch (err: any) {
      console.error('[FTX] Excepción getReservations:', err?.message);
      return LocalDb.getReservations();
    }
  }

  /**
   * Obtener reservas filtradas por teléfono del pasajero (Vista del Pasajero)
   */
  public static async getReservationsByPhone(phone: string): Promise<Reservation[]> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const supabase = createClient();

    if (!supabase) {
      const all = LocalDb.getReservations();
      return all.filter((r) => r.customer?.phone?.replace(/[^0-9]/g, '') === cleanPhone);
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), payments(*, proofs:payment_proofs(*))')
        .eq('customer:profiles!customer_id.phone', cleanPhone)
        .order('created_at', { ascending: false });

      if (error || !data) {
        // Fallback: buscar en LocalDb
        const all = LocalDb.getReservations();
        return all.filter((r) => r.customer?.phone?.replace(/[^0-9]/g, '') === cleanPhone);
      }

      return data as Reservation[];
    } catch {
      const all = LocalDb.getReservations();
      return all.filter((r) => r.customer?.phone?.replace(/[^0-9]/g, '') === cleanPhone);
    }
  }

  /**
   * Buscar reserva por código FTX-YYYYMMDD-NNNN o por teléfono/DNI
   */
  public static async getReservationByCode(code: string): Promise<Reservation | undefined> {
    const supabase = createClient();
    if (!supabase) return LocalDb.getReservationByCode(code);

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .ilike('code', code)
        .maybeSingle();

      if (error || !data) return LocalDb.getReservationByCode(code);
      return data as Reservation;
    } catch {
      return LocalDb.getReservationByCode(code);
    }
  }

  /**
   * LÍMITE ANTI-ABUSO: Verificar si el pasajero ya tiene 2 reservas en el día de hoy
   * Se compara por número de teléfono + fecha actual (hora Lima)
   */
  public static async checkDailyLimit(phone: string, serviceCode: string): Promise<{
    allowed: boolean;
    reason?: string;
    todayCount: number;
  }> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const supabase = createClient();

    if (!supabase) {
      // Sin Supabase, verificar en LocalDb
      const all = LocalDb.getReservations();
      const todayRes = all.filter((r) => {
        const created = new Date(r.created_at);
        return (
          r.customer?.phone?.replace(/[^0-9]/g, '') === cleanPhone &&
          created >= todayStart &&
          created <= todayEnd &&
          !['CANCELLED', 'PAYMENT_REJECTED', 'EXPIRED'].includes(r.status)
        );
      });
      if (todayRes.length >= 2) {
        return { allowed: false, reason: 'límite_diario_alcanzado', todayCount: todayRes.length };
      }
      const sameType = todayRes.filter((r) => r.service_id === serviceCode || r.service?.code === serviceCode);
      if (sameType.length >= 1) {
        return { allowed: false, reason: 'servicio_duplicado_hoy', todayCount: todayRes.length };
      }
      return { allowed: true, todayCount: todayRes.length };
    }

    try {
      // Buscar reservas de hoy del mismo teléfono
      const { data, error } = await supabase
        .from('reservations')
        .select('id, service_id, status, created_at, customer:profiles!customer_id(phone)')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .not('status', 'in', '("CANCELLED","PAYMENT_REJECTED","EXPIRED")');

      if (error || !data) {
        return { allowed: true, todayCount: 0 };
      }

      const passengerReservations = (data as any[]).filter(
        (r) => r.customer?.phone?.replace(/[^0-9]/g, '') === cleanPhone
      );

      if (passengerReservations.length >= 2) {
        return {
          allowed: false,
          reason: 'límite_diario_alcanzado',
          todayCount: passengerReservations.length,
        };
      }

      // Verificar duplicado del mismo tipo de servicio en el día
      const sameServiceToday = passengerReservations.filter((r) => r.service_id === serviceCode);
      if (sameServiceToday.length >= 1) {
        return {
          allowed: false,
          reason: 'servicio_duplicado_hoy',
          todayCount: passengerReservations.length,
        };
      }

      return { allowed: true, todayCount: passengerReservations.length };
    } catch (err: any) {
      console.warn('[FTX] Error en checkDailyLimit:', err?.message);
      return { allowed: true, todayCount: 0 };
    }
  }

  /**
   * Guardar o actualizar reserva — guarda perfil + reserva en Supabase
   */
  public static async saveReservation(reservation: Reservation): Promise<{ savedToCloud: boolean }> {
    LocalDb.saveReservation(reservation);

    const supabase = createClient();
    if (!supabase) return { savedToCloud: false };

    try {
      // Paso 1: Upsert perfil del cliente
      await supabase.from('profiles').upsert({
        id: reservation.customer_id,
        role: 'CUSTOMER',
        full_name: reservation.customer?.full_name || 'Pasajero',
        phone: reservation.customer?.phone?.replace(/[^0-9]/g, '') || '',
        dni: reservation.customer?.dni ?? null,
        title_degree: reservation.customer?.title_degree ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // Paso 2: Upsert reserva
      const { error: reservationError } = await supabase.from('reservations').upsert({
        id: reservation.id,
        code: reservation.code,
        customer_id: reservation.customer_id,
        service_id: reservation.service_id,
        vehicle_id: reservation.vehicle_id ?? null,
        driver_id: reservation.driver_id ?? null,
        status: reservation.status,
        flight_airline: reservation.flight_airline ?? null,
        flight_number: reservation.flight_number ?? null,
        flight_arrival_time: reservation.flight_arrival_time ?? null,
        origin: reservation.origin,
        destination: reservation.destination,
        scheduled_at: reservation.scheduled_at,
        passengers_count: reservation.passengers_count,
        luggage_notes: reservation.luggage_notes ?? null,
        notes: reservation.notes ?? null,
        subtotal: reservation.subtotal,
        surcharges: reservation.surcharges,
        total_amount: reservation.total_amount,
        deposit_amount: reservation.deposit_amount,
        balance_amount: reservation.balance_amount,
        invoice_type: reservation.invoice_details?.type || 'ninguno',
        invoice_dni: reservation.invoice_details?.dni ?? null,
        invoice_name: reservation.invoice_details?.name ?? null,
        invoice_ruc: reservation.invoice_details?.ruc ?? null,
        invoice_company_name: reservation.invoice_details?.companyName ?? null,
        invoice_address: reservation.invoice_details?.fiscalAddress ?? null,
        cancellation_deadline: reservation.cancellation_deadline ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (reservationError) {
        console.error('[FTX] Error upsert reservación:', reservationError.message, reservationError.code);
        return { savedToCloud: false };
      }

      console.log('[FTX] ✅ Guardada en Supabase:', reservation.code);
      return { savedToCloud: true };
    } catch (err: any) {
      console.error('[FTX] Excepción saveReservation:', err?.message);
      return { savedToCloud: false };
    }
  }

  /**
   * Eliminar reserva cancelada o rechazada
   * Solo permitido si el estado es CANCELLED, PAYMENT_REJECTED o EXPIRED
   */
  public static async deleteReservation(reservationId: string, code: string): Promise<boolean> {
    // Eliminar en LocalDb
    LocalDb.deleteReservation(reservationId);

    const supabase = createClient();
    if (!supabase) return true;

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId)
        .in('status', ['CANCELLED', 'PAYMENT_REJECTED', 'EXPIRED']);

      if (error) {
        console.error('[FTX] Error eliminando reserva:', error.message);
        return false;
      }

      console.log('[FTX] 🗑️ Reserva eliminada:', code);
      return true;
    } catch (err: any) {
      console.error('[FTX] Excepción deleteReservation:', err?.message);
      return false;
    }
  }

  /**
   * Subir comprobante de pago al bucket 'vouchers' de Supabase Storage
   */
  public static async uploadVoucherImage(file: File, reservationCode: string): Promise<string | null> {
    const supabase = createClient();
    if (!supabase) return URL.createObjectURL(file);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reservationCode}_${Date.now()}.${fileExt}`;
      const filePath = `vouchers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('[FTX] Error subiendo voucher:', uploadError.message);
        return URL.createObjectURL(file);
      }

      const { data: signedUrlData } = await supabase.storage
        .from('vouchers')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      return signedUrlData?.signedUrl || URL.createObjectURL(file);
    } catch (err: any) {
      console.error('[FTX] Excepción uploadVoucher:', err?.message);
      return URL.createObjectURL(file);
    }
  }
}

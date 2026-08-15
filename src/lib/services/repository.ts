import { createClient } from '../supabase/client';
import { LocalDb } from '../storage/mock-db';
import { Reservation } from '../types';

export class RepositoryService {
  /**
   * Obtener lista completa de reservas
   */
  public static async getReservations(): Promise<Reservation[]> {
    const supabase = createClient();
    if (!supabase) {
      console.warn('[FTX] Supabase no configurado, usando LocalDb');
      return LocalDb.getReservations();
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[FTX] Error al leer reservas de Supabase:', error.message, '| Usando LocalDb');
        return LocalDb.getReservations();
      }

      if (!data || data.length === 0) {
        // Supabase está vacío, mostrar LocalDb como fallback temporal
        const local = LocalDb.getReservations();
        return local.length > 0 ? local : [];
      }

      return data as Reservation[];
    } catch (err: any) {
      console.error('[FTX] Excepción inesperada al leer de Supabase:', err?.message);
      return LocalDb.getReservations();
    }
  }

  /**
   * Buscar reserva por código FTX-YYYYMMDD-NNNN
   */
  public static async getReservationByCode(code: string): Promise<Reservation | undefined> {
    const supabase = createClient();
    if (!supabase) {
      return LocalDb.getReservationByCode(code);
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .ilike('code', code)
        .single();

      if (error || !data) {
        console.warn('[FTX] Reserva no encontrada en Supabase, buscando en LocalDb:', code);
        return LocalDb.getReservationByCode(code);
      }

      return data as Reservation;
    } catch {
      return LocalDb.getReservationByCode(code);
    }
  }

  /**
   * Guardar o actualizar reserva - primero Supabase, luego LocalDb como respaldo
   */
  public static async saveReservation(reservation: Reservation): Promise<{ savedToCloud: boolean }> {
    // Siempre guardar en LocalDb para acceso inmediato offline
    LocalDb.saveReservation(reservation);

    const supabase = createClient();
    if (!supabase) {
      console.warn('[FTX] Sin conexión a Supabase, solo guardado en LocalDb');
      return { savedToCloud: false };
    }

    try {
      // Paso 1: Insertar o actualizar perfil del cliente
      const profilePayload = {
        id: reservation.customer_id,
        role: 'CUSTOMER' as const,
        full_name: reservation.customer?.full_name || 'Pasajero',
        phone: reservation.customer?.phone || '',
        dni: reservation.customer?.dni,
        title_degree: reservation.customer?.title_degree,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileError) {
        console.error('[FTX] Error guardando perfil en Supabase:', profileError.message);
      }

      // Paso 2: Insertar o actualizar la reserva
      const reservationPayload = {
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
      };

      const { error: reservationError } = await supabase
        .from('reservations')
        .upsert(reservationPayload, { onConflict: 'id' });

      if (reservationError) {
        console.error('[FTX] Error guardando reserva en Supabase:', reservationError.message, reservationError.code);
        return { savedToCloud: false };
      }

      console.log('[FTX] ✅ Reserva guardada en Supabase correctamente:', reservation.code);
      return { savedToCloud: true };
    } catch (err: any) {
      console.error('[FTX] Excepción al guardar reserva en Supabase:', err?.message);
      return { savedToCloud: false };
    }
  }

  /**
   * Subir comprobante de pago al bucket 'vouchers' de Supabase Storage
   */
  public static async uploadVoucherImage(file: File, reservationCode: string): Promise<string | null> {
    const supabase = createClient();
    if (!supabase) {
      return URL.createObjectURL(file);
    }

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
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 días

      return signedUrlData?.signedUrl || URL.createObjectURL(file);
    } catch (err: any) {
      console.error('[FTX] Excepción al subir voucher:', err?.message);
      return URL.createObjectURL(file);
    }
  }
}

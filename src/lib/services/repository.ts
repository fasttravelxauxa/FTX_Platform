import { createClient } from '../supabase/client';
import { LocalDb } from '../storage/mock-db';
import { Reservation, Vehicle, Profile, AuditLog } from '../types';

export class RepositoryService {
  /**
   * Obtener lista completa de reservas (para Admin o Búsqueda)
   */
  public static async getReservations(): Promise<Reservation[]> {
    const supabase = createClient();
    if (!supabase) {
      return LocalDb.getReservations();
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:profiles!customer_id(*),
          service:services(*),
          vehicle:vehicles(*),
          payments(*, proofs:payment_proofs(*))
        `)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Supabase fetch error, fallback to LocalDb:', error);
        return LocalDb.getReservations();
      }

      return data as Reservation[];
    } catch (err) {
      return LocalDb.getReservations();
    }
  }

  /**
   * Buscar reserva por código TFX-YYYYMMDD-NNNN
   */
  public static async getReservationByCode(code: string): Promise<Reservation | undefined> {
    const supabase = createClient();
    if (!supabase) {
      return LocalDb.getReservationByCode(code);
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          customer:profiles!customer_id(*),
          service:services(*),
          vehicle:vehicles(*),
          payments(*, proofs:payment_proofs(*))
        `)
        .ilike('code', code)
        .single();

      if (error || !data) {
        return LocalDb.getReservationByCode(code);
      }

      return data as Reservation;
    } catch {
      return LocalDb.getReservationByCode(code);
    }
  }

  /**
   * Guardar o actualizar reserva
   */
  public static async saveReservation(reservation: Reservation): Promise<void> {
    // Save to LocalDb for immediate offline resilience
    LocalDb.saveReservation(reservation);

    const supabase = createClient();
    if (!supabase) return;

    try {
      // Upsert into Supabase reservations table
      await supabase.from('reservations').upsert({
        id: reservation.id,
        code: reservation.code,
        customer_id: reservation.customer_id,
        service_id: reservation.service_id,
        vehicle_id: reservation.vehicle_id,
        driver_id: reservation.driver_id,
        status: reservation.status,
        flight_airline: reservation.flight_airline,
        flight_number: reservation.flight_number,
        flight_arrival_time: reservation.flight_arrival_time,
        origin: reservation.origin,
        destination: reservation.destination,
        scheduled_at: reservation.scheduled_at,
        passengers_count: reservation.passengers_count,
        luggage_notes: reservation.luggage_notes,
        notes: reservation.notes,
        subtotal: reservation.subtotal,
        surcharges: reservation.surcharges,
        total_amount: reservation.total_amount,
        deposit_amount: reservation.deposit_amount,
        balance_amount: reservation.balance_amount,
        invoice_type: reservation.invoice_details?.type || 'ninguno',
        invoice_dni: reservation.invoice_details?.dni,
        invoice_name: reservation.invoice_details?.name,
        invoice_ruc: reservation.invoice_details?.ruc,
        invoice_company_name: reservation.invoice_details?.companyName,
        invoice_address: reservation.invoice_details?.fiscalAddress,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error sincronizando reserva con Supabase:', err);
    }
  }

  /**
   * Subir comprobante / voucher a Supabase Storage bucket 'vouchers'
   */
  public static async uploadVoucherImage(file: File, reservationCode: string): Promise<string | null> {
    const supabase = createClient();
    if (!supabase) {
      // Return local object URL for offline testing
      return URL.createObjectURL(file);
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${reservationCode}_${Date.now()}.${fileExt}`;
      const filePath = `vouchers/${fileName}`;

      const { data, error } = await supabase.storage
        .from('vouchers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Error subiendo voucher a Supabase Storage:', error);
        return URL.createObjectURL(file);
      }

      // Generate signed URL valid for 7 days
      const { data: signedUrlData } = await supabase.storage
        .from('vouchers')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      return signedUrlData?.signedUrl || URL.createObjectURL(file);
    } catch (err) {
      console.error('Excepción al subir voucher:', err);
      return URL.createObjectURL(file);
    }
  }
}

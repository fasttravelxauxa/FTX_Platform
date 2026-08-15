import { createClient } from '../supabase/client';
import { LocalDb } from '../storage/mock-db';
import { Reservation, InvoiceDetails } from '../types';

const FTX_PHONE_KEY = 'ftx_passenger_phone';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

/**
 * Normalizar fila de Supabase a objeto Reservation tipado
 */
function mapRowToReservation(row: any): Reservation {
  const invoiceDetails: InvoiceDetails = row.invoice_details || {
    type: row.invoice_type || 'ninguno',
    dni: row.invoice_dni || undefined,
    name: row.invoice_name || undefined,
    ruc: row.invoice_ruc || undefined,
    companyName: row.invoice_company_name || undefined,
    fiscalAddress: row.invoice_address || undefined,
  };

  return {
    ...row,
    subtotal: Number(row.subtotal || 0),
    surcharges: Number(row.surcharges || 0),
    total_amount: Number(row.total_amount || 0),
    deposit_amount: Number(row.deposit_amount || 0),
    balance_amount: Number(row.balance_amount || 0),
    passengers_count: Number(row.passengers_count || 1),
    invoice_details: invoiceDetails,
    customer: row.customer || {
      id: row.customer_id,
      role: 'CUSTOMER',
      full_name: 'Pasajero',
      phone: '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  };
}

export class RepositoryService {
  /**
   * Obtener lista completa de reservas (Admin)
   */
  public static async getReservations(): Promise<Reservation[]> {
    const supabase = createClient();
    if (!supabase) {
      console.warn('[FTX] Supabase no configurado, leyendo LocalDb');
      return LocalDb.getReservations();
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FTX] Error Supabase getReservations:', error.message, error.details);
        return LocalDb.getReservations();
      }

      const mapped = (data ?? []).map(mapRowToReservation);
      console.log(`[FTX] Sincronizadas ${mapped.length} reservas desde Supabase`);
      return mapped;
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
      // 1. Buscar perfiles asociados al teléfono
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone);

      if (profileErr) {
        console.warn('[FTX] Error buscando perfil por teléfono:', profileErr.message);
      }

      const profileIds = (profiles || []).map((p) => p.id);

      if (profileIds.length === 0) {
        // Fallback a LocalDb si no hay perfiles en Supabase
        const all = LocalDb.getReservations();
        return all.filter((r) => r.customer?.phone?.replace(/[^0-9]/g, '') === cleanPhone);
      }

      // 2. Buscar reservas de esos perfiles
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .in('customer_id', profileIds)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[FTX] Error obteniendo reservas por phone:', error?.message);
        const all = LocalDb.getReservations();
        return all.filter((r) => r.customer?.phone?.replace(/[^0-9]/g, '') === cleanPhone);
      }

      return data.map(mapRowToReservation);
    } catch (err: any) {
      console.error('[FTX] Excepción getReservationsByPhone:', err?.message);
      const all = LocalDb.getReservations();
      return all.filter((r) => r.customer?.phone?.replace(/[^0-9]/g, '') === cleanPhone);
    }
  }

  /**
   * Buscar reserva por código FTX-YYYYMMDD-NNNN o ID
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

      if (error || !data) {
        return LocalDb.getReservationByCode(code);
      }
      return mapRowToReservation(data);
    } catch {
      return LocalDb.getReservationByCode(code);
    }
  }

  /**
   * LÍMITE ANTI-ABUSO: Verificar si el pasajero ya tiene 2 reservas en el día de hoy
   */
  public static async checkDailyLimit(phone: string, serviceIdOrCode: string): Promise<{
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
      const sameType = todayRes.filter((r) => r.service_id === serviceIdOrCode || r.service?.code === serviceIdOrCode);
      if (sameType.length >= 1) {
        return { allowed: false, reason: 'servicio_duplicado_hoy', todayCount: todayRes.length };
      }
      return { allowed: true, todayCount: todayRes.length };
    }

    try {
      const { data: profiles } = await supabase.from('profiles').select('id').eq('phone', cleanPhone);
      const profileIds = (profiles || []).map((p) => p.id);

      if (profileIds.length === 0) {
        return { allowed: true, todayCount: 0 };
      }

      const { data, error } = await supabase
        .from('reservations')
        .select('id, service_id, status, created_at')
        .in('customer_id', profileIds)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .not('status', 'in', '("CANCELLED","PAYMENT_REJECTED","EXPIRED")');

      if (error || !data) {
        return { allowed: true, todayCount: 0 };
      }

      if (data.length >= 2) {
        return {
          allowed: false,
          reason: 'límite_diario_alcanzado',
          todayCount: data.length,
        };
      }

      const sameServiceToday = data.filter((r) => r.service_id === serviceIdOrCode);
      if (sameServiceToday.length >= 1) {
        return {
          allowed: false,
          reason: 'servicio_duplicado_hoy',
          todayCount: data.length,
        };
      }

      return { allowed: true, todayCount: data.length };
    } catch (err: any) {
      console.warn('[FTX] Error en checkDailyLimit:', err?.message);
      return { allowed: true, todayCount: 0 };
    }
  }

  /**
   * Guardar o actualizar reserva — guarda perfil + reserva + pagos en Supabase
   */
  public static async saveReservation(reservation: Reservation): Promise<{ savedToCloud: boolean; code?: string }> {
    // 1. Asegurar UUIDs válidos para PostgreSQL
    const customerId = isUUID(reservation.customer_id) ? reservation.customer_id : generateUUID();
    const reservationId = isUUID(reservation.id) ? reservation.id : generateUUID();
    const serviceId = isUUID(reservation.service_id)
      ? reservation.service_id
      : 'a1111111-1111-1111-1111-111111111111'; // Aeropuerto privado por defecto
    const vehicleId = isUUID(reservation.vehicle_id)
      ? reservation.vehicle_id
      : 'b1111111-1111-1111-1111-111111111111'; // Jetour SUV por defecto
    const driverId = isUUID(reservation.driver_id) ? reservation.driver_id : null;

    const normalizedReservation: Reservation = {
      ...reservation,
      id: reservationId,
      customer_id: customerId,
      service_id: serviceId,
      vehicle_id: vehicleId,
      driver_id: driverId || undefined,
      customer: {
        ...(reservation.customer || {
          id: customerId,
          role: 'CUSTOMER',
          full_name: 'Pasajero',
          phone: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        id: customerId,
      },
    };

    // Guardar en cache local siempre
    LocalDb.saveReservation(normalizedReservation);

    const supabase = createClient();
    if (!supabase) {
      console.warn('[FTX] Supabase cliente no disponible, guardado sólo en LocalDb');
      return { savedToCloud: false, code: normalizedReservation.code };
    }

    try {
      // Paso 1: Upsert perfil del cliente
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: customerId,
        role: 'CUSTOMER',
        full_name: reservation.customer?.full_name || 'Pasajero',
        phone: reservation.customer?.phone?.replace(/[^0-9]/g, '') || '',
        dni: reservation.customer?.dni ?? null,
        title_degree: reservation.customer?.title_degree ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (profileError) {
        console.error('[FTX] Error upsert perfil:', profileError.message, profileError.details);
      }

      // Paso 2: Upsert reserva
      const { data: savedRes, error: reservationError } = await supabase.from('reservations').upsert({
        id: reservationId,
        code: reservation.code,
        customer_id: customerId,
        service_id: serviceId,
        vehicle_id: vehicleId,
        driver_id: driverId,
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
      }, { onConflict: 'id' }).select('code').maybeSingle();

      if (reservationError) {
        console.error('[FTX] Error upsert reservación en Supabase:', reservationError.message, reservationError.details);
        return { savedToCloud: false, code: normalizedReservation.code };
      }

      // Paso 3: Guardar pagos y comprobantes si existen
      if (reservation.payments && reservation.payments.length > 0) {
        for (const payment of reservation.payments) {
          const paymentId = isUUID(payment.id) ? payment.id : generateUUID();
          const { error: payError } = await supabase.from('payments').upsert({
            id: paymentId,
            reservation_id: reservationId,
            amount: payment.amount,
            payment_method: payment.payment_method,
            status: payment.status || 'SUBMITTED',
            created_at: payment.created_at || new Date().toISOString(),
          }, { onConflict: 'id' });

          if (payError) {
            console.error('[FTX] Error upsert pago:', payError.message);
          }

          if (payment.proofs && payment.proofs.length > 0) {
            for (const proof of payment.proofs) {
              const proofId = isUUID(proof.id) ? proof.id : generateUUID();
              const { error: proofError } = await supabase.from('payment_proofs').upsert({
                id: proofId,
                payment_id: paymentId,
                file_path: proof.file_path,
                reference_number: proof.reference_number ?? null,
                uploaded_at: proof.uploaded_at || new Date().toISOString(),
              }, { onConflict: 'id' });

              if (proofError) {
                console.error('[FTX] Error upsert comprobante:', proofError.message);
              }
            }
          }
        }
      }

      const finalCode = savedRes?.code || normalizedReservation.code;
      console.log('[FTX] ✅ Reserva sincronizada en Supabase con éxito:', finalCode);
      return { savedToCloud: true, code: finalCode };
    } catch (err: any) {
      console.error('[FTX] Excepción saveReservation:', err?.message);
      return { savedToCloud: false, code: normalizedReservation.code };
    }
  }

  /**
   * Eliminar reserva cancelada o rechazada
   */
  public static async deleteReservation(reservationId: string, code: string): Promise<boolean> {
    LocalDb.deleteReservation(reservationId);

    const supabase = createClient();
    if (!supabase) return true;

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

      if (error) {
        console.error('[FTX] Error eliminando reserva:', error.message);
        return false;
      }

      console.log('[FTX] 🗑️ Reserva eliminada de Supabase:', code);
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
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanCode = reservationCode.replace(/[^a-zA-Z0-9_-]/g, '');
      const fileName = `${cleanCode}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('[FTX] Error subiendo voucher a Storage:', uploadError.message);
        return URL.createObjectURL(file);
      }

      const { data: publicUrlData } = supabase.storage
        .from('vouchers')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl || URL.createObjectURL(file);
    } catch (err: any) {
      console.error('[FTX] Excepción uploadVoucher:', err?.message);
      return URL.createObjectURL(file);
    }
  }
}

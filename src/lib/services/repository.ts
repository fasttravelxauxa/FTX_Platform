import { createClient } from '../supabase/client';
import { Reservation, InvoiceDetails, Profile, ReservationStatus, Vehicle, VehicleStatus } from '../types';

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
 * Guardar teléfono del pasajero en dispositivo para auto-completar en Mis Reservas
 */
export function savePassengerIdentity(phone: string) {
  if (typeof window !== 'undefined' && phone) {
    localStorage.setItem(FTX_PHONE_KEY, phone.replace(/[^0-9]/g, ''));
  }
}

/**
 * Obtener teléfono del pasajero guardado en este dispositivo
 */
export function getPassengerIdentity(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FTX_PHONE_KEY);
}

/**
 * Mapear fila de PostgreSQL/Supabase al objeto de dominio Reservation
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
    payments: Array.isArray(row.payments) ? row.payments : [],
  };
}

export class RepositoryService {
  /**
   * Obtener perfiles de pasajeros almacenados en Supabase
   */
  public static async getProfiles(): Promise<Profile[]> {
    const supabase = createClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FTX Repository] Error al consultar perfiles:', error.message);
        return [];
      }

      return (data || []) as Profile[];
    } catch (err: any) {
      console.error('[FTX Repository] Excepción en getProfiles:', err?.message);
      return [];
    }
  }

  /**
   * Actualizar estado de una reserva en Supabase
   */
  public static async updateReservationStatus(
    reservationId: string,
    status: ReservationStatus,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Sin conexión a Supabase' };

    try {
      const payload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (notes !== undefined) {
        payload.notes = notes;
      }

      const { error } = await supabase
        .from('reservations')
        .update(payload)
        .eq('id', reservationId);

      if (error) {
        console.error('[FTX Repository] Error al actualizar estado de reserva:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[FTX Repository] Excepción al actualizar estado:', err?.message);
      return { success: false, error: err?.message };
    }
  }

  /**
   * Obtener todas las reservas (Panel de Administración) directamente desde Supabase
   */
  public static async getReservations(): Promise<Reservation[]> {
    const supabase = createClient();
    if (!supabase) {
      console.error('[FTX Repository] Cliente de Supabase no inicializado (Verifica variables en Vercel / .env.local)');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FTX Repository] Error al consultar reservas en Supabase:', error.message, error.details);
        return [];
      }

      return (data ?? []).map(mapRowToReservation);
    } catch (err: any) {
      console.error('[FTX Repository] Excepción en getReservations:', err?.message);
      return [];
    }
  }

  /**
   * Obtener reservas de un pasajero por su número de WhatsApp
   */
  public static async getReservationsByPhone(phone: string): Promise<Reservation[]> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const supabase = createClient();

    if (!supabase || !cleanPhone) {
      return [];
    }

    try {
      // 1. Buscar perfiles asociados al teléfono
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone);

      if (profileErr) {
        console.error('[FTX Repository] Error al buscar perfil por teléfono:', profileErr.message);
        return [];
      }

      const profileIds = (profiles || []).map((p) => p.id);
      if (profileIds.length === 0) {
        return [];
      }

      // 2. Buscar reservas de esos perfiles
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .in('customer_id', profileIds)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('[FTX Repository] Error al consultar reservas del teléfono:', error?.message);
        return [];
      }

      return data.map(mapRowToReservation);
    } catch (err: any) {
      console.error('[FTX Repository] Excepción en getReservationsByPhone:', err?.message);
      return [];
    }
  }

  /**
   * Buscar reserva individual por código FTX-YYYYMMDD-NNNN
   */
  public static async getReservationByCode(code: string): Promise<Reservation | null> {
    const supabase = createClient();
    if (!supabase || !code) return null;

    try {
      const cleanCode = code.trim().toUpperCase();
      const { data, error } = await supabase
        .from('reservations')
        .select('*, customer:profiles!customer_id(*), service:services(*), vehicle:vehicles(*), payments(*, proofs:payment_proofs(*))')
        .ilike('code', cleanCode)
        .maybeSingle();

      if (error) {
        console.error('[FTX Repository] Error al buscar reserva por código:', error.message);
        return null;
      }

      return data ? mapRowToReservation(data) : null;
    } catch (err: any) {
      console.error('[FTX Repository] Excepción en getReservationByCode:', err?.message);
      return null;
    }
  }

  /**
   * Consultar cuántos asientos del servicio compartido están reservados para una fecha y hora específica
   */
  public static async getSharedOccupiedSeatsCount(
    scheduledDate: string,
    scheduledTime: string
  ): Promise<{ occupiedSeats: number; isDepartureConfirmed: boolean }> {
    const supabase = createClient();
    if (!supabase) return { occupiedSeats: 0, isDepartureConfirmed: false };

    try {
      const dayStart = new Date(`${scheduledDate}T00:00:00-05:00`).toISOString();
      const dayEnd = new Date(`${scheduledDate}T23:59:59-05:00`).toISOString();

      const { data, error } = await supabase
        .from('reservations')
        .select('passengers_count, status')
        .eq('service_id', 'a2222222-2222-2222-2222-222222222222')
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)
        .not('status', 'in', '("CANCELLED","PAYMENT_REJECTED","EXPIRED")');

      if (error || !data) {
        return { occupiedSeats: 0, isDepartureConfirmed: false };
      }

      const totalSeats = data.reduce((sum, r) => sum + (Number(r.passengers_count) || 1), 0);
      return {
        occupiedSeats: totalSeats,
        isDepartureConfirmed: totalSeats >= 3,
      };
    } catch (err) {
      console.warn('[FTX Repository] Error al calcular asientos ocupados:', err);
      return { occupiedSeats: 0, isDepartureConfirmed: false };
    }
  }

  /**
   * LÍMITE ANTI-ABUSO: Validar máximo 2 reservas por día y evitar duplicados del mismo tipo
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
      return { allowed: true, todayCount: 0 };
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
      console.warn('[FTX Repository] Error en checkDailyLimit:', err?.message);
      return { allowed: true, todayCount: 0 };
    }
  }

  /**
   * Guardar o actualizar reserva (100% en la Nube Supabase)
   */
  public static async saveReservation(reservation: Reservation): Promise<{
    success: boolean;
    code: string;
    error?: string;
  }> {
    const supabase = createClient();
    if (!supabase) {
      return {
        success: false,
        code: reservation.code,
        error: 'No hay conexión con la base de datos central de Supabase. Revisa las variables de entorno.',
      };
    }

    // 1. Asegurar identificadores UUID válidos
    const customerId = isUUID(reservation.customer_id) ? reservation.customer_id : generateUUID();
    const reservationId = isUUID(reservation.id) ? reservation.id : generateUUID();
    const serviceId = isUUID(reservation.service_id)
      ? reservation.service_id
      : 'a1111111-1111-1111-1111-111111111111';
    const vehicleId = isUUID(reservation.vehicle_id)
      ? reservation.vehicle_id
      : 'b1111111-1111-1111-1111-111111111111';
    const driverId = isUUID(reservation.driver_id) ? reservation.driver_id : null;

    try {
      // Paso 1: Guardar Perfil del Pasajero
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: customerId,
          role: 'CUSTOMER',
          full_name: reservation.customer?.full_name || 'Pasajero',
          phone: reservation.customer?.phone?.replace(/[^0-9]/g, '') || '',
          dni: reservation.customer?.dni ?? null,
          title_degree: reservation.customer?.title_degree ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (profileError) {
        console.error('[FTX Repository] Error al guardar perfil:', profileError.message);
        return { success: false, code: reservation.code, error: `Error en perfil: ${profileError.message}` };
      }

      // Paso 2: Guardar Reserva en Supabase
      const { data: savedRes, error: resError } = await supabase
        .from('reservations')
        .upsert(
          {
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
          },
          { onConflict: 'id' }
        )
        .select('code')
        .maybeSingle();

      if (resError) {
        console.error('[FTX Repository] Error al guardar reserva:', resError.message, resError.details);
        return { success: false, code: reservation.code, error: `Error en reserva: ${resError.message}` };
      }

      // Paso 3: Guardar Pasajeros si existen
      if (reservation.passengers && reservation.passengers.length > 0) {
        for (const passenger of reservation.passengers) {
          const passId = isUUID(passenger.id) ? passenger.id : generateUUID();
          await supabase.from('reservation_passengers').upsert(
            {
              id: passId,
              reservation_id: reservationId,
              passenger_type: passenger.passenger_type || 'adulto',
              name: passenger.name,
              dni: passenger.dni ?? null,
            },
            { onConflict: 'id' }
          );
        }
      }

      // Paso 4: Guardar Pagos y Comprobantes si existen
      if (reservation.payments && reservation.payments.length > 0) {
        for (const payment of reservation.payments) {
          const paymentId = isUUID(payment.id) ? payment.id : generateUUID();
          const { error: payErr } = await supabase.from('payments').upsert(
            {
              id: paymentId,
              reservation_id: reservationId,
              amount: payment.amount,
              payment_method: payment.payment_method || 'yape',
              status: payment.status || 'SUBMITTED',
              created_at: payment.created_at || new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

          if (payErr) {
            console.error('[FTX Repository] Error al guardar pago:', payErr.message);
          }

          if (payment.proofs && payment.proofs.length > 0) {
            for (const proof of payment.proofs) {
              const proofId = isUUID(proof.id) ? proof.id : generateUUID();
              await supabase.from('payment_proofs').upsert(
                {
                  id: proofId,
                  payment_id: paymentId,
                  file_path: proof.file_path,
                  reference_number: proof.reference_number ?? null,
                  uploaded_at: proof.uploaded_at || new Date().toISOString(),
                },
                { onConflict: 'id' }
              );
            }
          }
        }
      }

      const finalCode = savedRes?.code || reservation.code;
      console.log('[FTX Repository] Reserva sincronizada en la nube con éxito:', finalCode);
      return { success: true, code: finalCode };
    } catch (err: any) {
      console.error('[FTX Repository] Excepción crítica al guardar reserva:', err?.message);
      return { success: false, code: reservation.code, error: err?.message || 'Error desconocido' };
    }
  }

  /**
   * Eliminar reserva cancelada o rechazada en la nube
   */
  public static async deleteReservation(reservationId: string, code: string): Promise<boolean> {
    const supabase = createClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('reservations').delete().eq('id', reservationId);

      if (error) {
        console.error('[FTX Repository] Error al eliminar reserva:', error.message);
        return false;
      }

      console.log('[FTX Repository] Reserva eliminada de Supabase:', code);
      return true;
    } catch (err: any) {
      console.error('[FTX Repository] Excepción al eliminar reserva:', err?.message);
      return false;
    }
  }

  /**
   * Eliminar un perfil de pasajero de Supabase
   */
  public static async deleteProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (!supabase) return { success: false, error: 'Sin conexión a Supabase' };

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) {
        console.error('[FTX Repository] Error al eliminar perfil:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[FTX Repository] Excepción al eliminar perfil:', err?.message);
      return { success: false, error: err?.message };
    }
  }

  /**
   * Obtener lista de vehículos registrados
   */
  public static async getVehicles(): Promise<Vehicle[]> {
    const supabase = createClient();
    if (!supabase) {
      return [
        {
          id: 'b1111111-1111-1111-1111-111111111111',
          brand: 'Jetour',
          model: 'X70 FL (Modelo 2027)',
          year: 2027,
          plate: 'W4X-892',
          capacity: 4,
          status: 'AVAILABLE',
          photo_urls: ['/images/banners/auto_sinfondo.png'],
          created_at: new Date().toISOString(),
        },
      ];
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return [
          {
            id: 'b1111111-1111-1111-1111-111111111111',
            brand: 'Jetour',
            model: 'X70 FL (Modelo 2027)',
            year: 2027,
            plate: 'W4X-892',
            capacity: 4,
            status: 'AVAILABLE',
            photo_urls: ['/images/banners/auto_sinfondo.png'],
            created_at: new Date().toISOString(),
          },
        ];
      }

      return data as Vehicle[];
    } catch (err) {
      console.warn('[FTX Repository] Excepción en getVehicles:', err);
      return [
        {
          id: 'b1111111-1111-1111-1111-111111111111',
          brand: 'Jetour',
          model: 'X70 FL (Modelo 2027)',
          year: 2027,
          plate: 'W4X-892',
          capacity: 4,
          status: 'AVAILABLE',
          photo_urls: ['/images/banners/auto_sinfondo.png'],
          created_at: new Date().toISOString(),
        },
      ];
    }
  }

  /**
   * Guardar o actualizar vehículo
   */
  public static async saveVehicle(vehicle: Vehicle): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (!supabase) return { success: true };

    try {
      const { error } = await supabase.from('vehicles').upsert(
        {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          plate: vehicle.plate,
          capacity: vehicle.capacity,
          status: vehicle.status,
          photo_urls: vehicle.photo_urls || [],
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('[FTX Repository] Error al guardar vehículo:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.warn('[FTX Repository] Excepción en saveVehicle:', err?.message);
      return { success: false, error: err?.message };
    }
  }

  /**
   * Actualizar estado de un vehículo
   */
  public static async updateVehicleStatus(
    vehicleId: string,
    status: VehicleStatus
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    if (!supabase) return { success: true };

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status })
        .eq('id', vehicleId);

      if (error) {
        console.warn('[FTX Repository] Error al actualizar estado de vehículo:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Eliminar un vehículo
   */
  public static async deleteVehicle(vehicleId: string): Promise<boolean> {
    const supabase = createClient();
    if (!supabase) return true;

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Subir comprobante al bucket 'vouchers' de Supabase Storage
   */
  public static async uploadVoucherImage(file: File, reservationCode: string): Promise<string | null> {
    const supabase = createClient();
    if (!supabase) return null;

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const cleanCode = reservationCode.replace(/[^a-zA-Z0-9_-]/g, '');
      const fileName = `${cleanCode}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vouchers')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        console.error('[FTX Repository] Error al subir voucher a Storage:', uploadError.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from('vouchers').getPublicUrl(filePath);
      return publicUrlData.publicUrl || null;
    } catch (err: any) {
      console.error('[FTX Repository] Excepción en uploadVoucherImage:', err?.message);
      return null;
    }
  }
}

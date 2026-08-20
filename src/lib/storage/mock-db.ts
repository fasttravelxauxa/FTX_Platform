import { Reservation, Vehicle, Profile, AuditLog, RestrictionRecord } from '../types';
import { SERVICES_CATALOG } from '../constants';

const STORAGE_KEYS = {
  RESERVATIONS: 'ftx_reservations_v3',
  VEHICLES: 'ftx_vehicles_v3',
  PROFILES: 'ftx_profiles_v3',
  AUDIT: 'ftx_audit_v3',
  RESTRICTIONS: 'ftx_restrictions_v3',
};

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'usr-admin-1',
    role: 'ADMIN',
    full_name: 'Administración Fast Travel Xauxa',
    phone: '929667586',
    dni: '44556677',
    title_degree: 'Coordinación Operativa',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    brand: 'Jetour',
    model: 'X70 FL (Modelo 2027)',
    year: 2027,
    plate: 'W4X-892',
    capacity: 4,
    status: 'AVAILABLE',
    photo_urls: [
      '/images/banners/auto_sinfondo.png',
    ],
    documents: [
      {
        id: 'doc-1',
        vehicle_id: 'b1111111-1111-1111-1111-111111111111',
        document_type: 'SOAT Ejecutivo Rímac',
        document_number: 'SOA-2026-9921',
        expires_at: '2027-04-15',
        status: 'VIGENTE',
      },
      {
        id: 'doc-2',
        vehicle_id: 'b1111111-1111-1111-1111-111111111111',
        document_type: 'Revisión Técnica MTC',
        document_number: 'REV-99120-JUNIN',
        expires_at: '2027-02-28',
        status: 'VIGENTE',
      },
    ],
    created_at: new Date().toISOString(),
  },
];

const INITIAL_RESERVATIONS: Reservation[] = [];

export class LocalDb {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  public static getReservations(): Reservation[] {
    if (!this.isBrowser()) return INITIAL_RESERVATIONS;
    const data = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
      return INITIAL_RESERVATIONS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_RESERVATIONS;
    }
  }

  public static getReservationByCode(code: string): Reservation | undefined {
    const list = this.getReservations();
    return list.find((r) => r.code.toUpperCase() === code.toUpperCase());
  }

  public static saveReservation(reservation: Reservation): void {
    const list = this.getReservations();
    const index = list.findIndex((r) => r.id === reservation.id);
    if (index >= 0) {
      list[index] = { ...reservation, updated_at: new Date().toISOString() };
    } else {
      list.unshift(reservation);
    }
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(list));
    }
    this.addAuditLog('Guardo/Actualizó Reserva', 'Reservation', reservation.id, { code: reservation.code, status: reservation.status });
  }

  public static deleteReservation(reservationId: string): void {
    const list = this.getReservations();
    const filtered = list.filter((r) => r.id !== reservationId);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(filtered));
    }
    this.addAuditLog('Eliminó Reserva', 'Reservation', reservationId, {});
  }


  public static getVehicles(): Vehicle[] {
    if (!this.isBrowser()) return INITIAL_VEHICLES;
    const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
      return INITIAL_VEHICLES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_VEHICLES;
    }
  }

  public static getProfiles(): Profile[] {
    if (!this.isBrowser()) return INITIAL_PROFILES;
    const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
      return INITIAL_PROFILES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_PROFILES;
    }
  }

  public static addAuditLog(action: string, entity: string, entity_id?: string, metadata?: Record<string, any>): void {
    if (!this.isBrowser()) return;
    const logs: AuditLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]');
    logs.unshift({
      id: `aud-${Date.now()}`,
      actor_name: 'Administrador Fast Travel Xauxa',
      action,
      entity,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs.slice(0, 100)));
  }

  public static getAuditLogs(): AuditLog[] {
    if (!this.isBrowser()) return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]');
  }
}

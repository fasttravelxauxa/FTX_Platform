import { Reservation, Vehicle, Profile, AuditLog, RestrictionRecord } from '../types';
import { SERVICES_CATALOG } from '../constants';

const STORAGE_KEYS = {
  RESERVATIONS: 'ftx_reservations_v2',
  VEHICLES: 'ftx_vehicles_v2',
  PROFILES: 'ftx_profiles_v2',
  AUDIT: 'ftx_audit_v2',
  RESTRICTIONS: 'ftx_restrictions_v2',
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
  {
    id: 'usr-driver-1',
    role: 'DRIVER',
    full_name: 'Carlos Alberto Mendoza',
    phone: '954887711',
    dni: '10982345',
    title_degree: 'Conductor Ejecutivo Senior',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-cust-1',
    role: 'CUSTOMER',
    full_name: 'Dra. María Elena Ramos',
    phone: '987654321',
    dni: '45678912',
    title_degree: 'Dra.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-cust-2',
    role: 'CUSTOMER',
    full_name: 'Ing. Fernando Quispe (Corporación Andina)',
    phone: '912345678',
    dni: '71234567',
    title_degree: 'Ing.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    brand: 'Jetour',
    model: 'X70 Plus SUV Deluxe',
    year: 2026,
    plate: 'W4X-892',
    capacity: 4,
    status: 'AVAILABLE',
    photo_urls: [
      '/images/car/jetour-exterior-1.jpg',
      '/images/car/jetour-front.jpg',
      '/images/car/jetour-interior-1.jpg',
      '/images/car/jetour-side.jpg',
    ],
    documents: [
      {
        id: 'doc-1',
        vehicle_id: 'veh-1',
        document_type: 'SOAT Ejecutivo Rímac',
        document_number: 'SOA-2026-9921',
        expires_at: '2027-04-15',
        status: 'VIGENTE',
      },
      {
        id: 'doc-2',
        vehicle_id: 'veh-1',
        document_type: 'Revisión Técnica MTC',
        document_number: 'REV-99120-JUNIN',
        expires_at: '2027-02-28',
        status: 'VIGENTE',
      },
    ],
    created_at: new Date().toISOString(),
  },
];

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    code: 'TFX-20260814-0001',
    customer_id: 'usr-cust-1',
    customer: INITIAL_PROFILES[2],
    service_id: SERVICES_CATALOG[0].id,
    service: SERVICES_CATALOG[0],
    vehicle_id: 'veh-1',
    vehicle: INITIAL_VEHICLES[0],
    driver_id: 'usr-driver-1',
    driver: INITIAL_PROFILES[1],
    status: 'CONFIRMED',
    flight_airline: 'LATAM Airlines',
    flight_number: 'LA 2145',
    flight_arrival_time: '2026-08-15T09:30:00-05:00',
    origin: 'Aeropuerto de Jauja (JAU)',
    destination: 'Hotel Turístico, Jr. Ancash 450, Centro de Huancayo',
    scheduled_at: '2026-08-15T09:30:00-05:00',
    passengers_count: 2,
    luggage_notes: '2 maletas grandes de 23kg',
    notes: 'Solicita cartel de bienvenida a nombre de Dra. María Elena Ramos. Requiere Boleta de Venta.',
    subtotal: 80.00,
    surcharges: 0.00,
    total_amount: 80.00,
    deposit_amount: 40.00,
    balance_amount: 40.00,
    invoice_details: {
      type: 'boleta',
      dni: '45678912',
      name: 'Dra. María Elena Ramos',
    },
    cancellation_deadline: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    passengers: [
      { passenger_type: 'adulto', name: 'Dra. María Elena Ramos', dni: '45678912' },
      { passenger_type: 'adulto', name: 'Dr. Roberto Mendoza', dni: '10293847' },
    ],
    payments: [
      {
        id: 'pay-1',
        reservation_id: 'res-1',
        amount: 40.00,
        payment_method: 'yape',
        status: 'APPROVED',
        created_at: new Date(Date.now() - 7000000).toISOString(),
        proofs: [
          {
            id: 'prf-1',
            payment_id: 'pay-1',
            file_path: '/images/car/jetour-front.jpg',
            reference_number: 'YAP-9812401',
            uploaded_at: new Date(Date.now() - 7000000).toISOString(),
          },
        ],
      },
    ],
  },
  {
    id: 'res-2',
    code: 'TFX-20260814-0002',
    customer_id: 'usr-cust-2',
    customer: INITIAL_PROFILES[3],
    service_id: SERVICES_CATALOG[0].id,
    service: SERVICES_CATALOG[0],
    vehicle_id: 'veh-1',
    vehicle: INITIAL_VEHICLES[0],
    driver_id: 'usr-driver-1',
    driver: INITIAL_PROFILES[1],
    status: 'PAYMENT_REVIEW',
    flight_airline: 'SKY Airline',
    flight_number: 'H2 5100',
    flight_arrival_time: '2026-08-15T11:15:00-05:00',
    origin: 'Aeropuerto de Jauja (JAU)',
    destination: 'Chilca / Azapampa, Huancayo',
    scheduled_at: '2026-08-15T11:15:00-05:00',
    passengers_count: 1,
    subtotal: 80.00,
    surcharges: 10.00,
    total_amount: 90.00,
    deposit_amount: 45.00,
    balance_amount: 45.00,
    invoice_details: {
      type: 'factura',
      ruc: '20601234567',
      companyName: 'Corporación Andina del Centro S.A.C.',
      fiscalAddress: 'Av. Real 1020, Huancayo',
    },
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 900000).toISOString(),
    passengers: [
      { passenger_type: 'adulto', name: 'Ing. Fernando Quispe', dni: '71234567' },
    ],
    payments: [
      {
        id: 'pay-2',
        reservation_id: 'res-2',
        amount: 45.00,
        payment_method: 'bcp',
        status: 'UNDER_REVIEW',
        created_at: new Date(Date.now() - 900000).toISOString(),
        proofs: [
          {
            id: 'prf-2',
            payment_id: 'pay-2',
            file_path: '/images/car/jetour-exterior-1.jpg',
            reference_number: 'BCP-8812001',
            uploaded_at: new Date(Date.now() - 900000).toISOString(),
          },
        ],
      },
    ],
  },
];

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

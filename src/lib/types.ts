export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'DRIVER' | 'CUSTOMER';

export type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'IN_SERVICE' | 'MAINTENANCE' | 'UNAVAILABLE';

export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'UNAVAILABLE';

export type ReservationStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_REVIEW'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'READY'
  | 'PICKUP'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW'
  | 'PAYMENT_REJECTED'
  | 'RESCHEDULED'
  | 'OPERATIONAL_EXCEPTION';

export type PaymentStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 'yape' | 'plin' | 'bcp';

export type InvoiceType = 'ninguno' | 'boleta' | 'factura';

export interface InvoiceDetails {
  type: InvoiceType;
  dni?: string;
  name?: string;
  ruc?: string;
  companyName?: string;
  fiscalAddress?: string;
}

export interface Profile {
  id: string;
  user_id?: string;
  role: UserRole;
  full_name: string;
  phone: string;
  dni?: string;
  title_degree?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  description: string;
  base_price: number;
  price_unit: 'fixed' | 'hourly';
  active: boolean;
  icon?: string;
}

export interface TariffRule {
  id: string;
  service_id: string;
  origin_zone?: string;
  destination_zone?: string;
  base_amount: number;
  unit: string;
  minimum_units: number;
  surcharge: number;
  currency: 'PEN';
  active: boolean;
}

export interface PriceQuote {
  serviceCode: string;
  subtotal: number;
  surcharges: number;
  discounts: number;
  total: number;
  depositRequired: number; // 20%
  balanceRemaining: number; // 80%
  currency: 'PEN';
  details: string[];
  invoiceDetails?: InvoiceDetails;
}

export interface ReservationPassenger {
  id?: string;
  reservation_id?: string;
  passenger_type: 'adulto' | 'niño' | 'infante';
  name: string;
  dni?: string;
}

export interface FlightInfo {
  airline: string;
  flightNumber: string;
  arrivalTime?: string;
}

export interface Reservation {
  id: string;
  code: string;
  customer_id: string;
  customer?: Profile;
  service_id: string;
  service?: Service;
  vehicle_id?: string;
  vehicle?: Vehicle;
  driver_id?: string;
  driver?: Profile;
  status: ReservationStatus;
  flight_airline?: string;
  flight_number?: string;
  flight_arrival_time?: string;
  origin: string;
  destination: string;
  scheduled_at: string;
  passengers_count: number;
  luggage_notes?: string;
  notes?: string;
  subtotal: number;
  surcharges: number;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  cancellation_deadline?: string;
  invoice_details?: InvoiceDetails;
  created_at: string;
  updated_at: string;
  passengers?: ReservationPassenger[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  reservation_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  created_at: string;
  proofs?: PaymentProof[];
}

export interface PaymentProof {
  id: string;
  payment_id: string;
  file_path: string;
  reference_number?: string;
  uploaded_at: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  capacity: number;
  status: VehicleStatus;
  photo_urls: string[];
  documents?: VehicleDocument[];
  created_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: string;
  document_number?: string;
  expires_at: string;
  file_url?: string;
  status: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface RestrictionRecord {
  id: string;
  profile_id: string;
  reason: string;
  status: string;
  created_by?: string;
  notes?: string;
  created_at: string;
  expires_at?: string;
}

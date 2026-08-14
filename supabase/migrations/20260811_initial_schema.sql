-- Database Schema for Fast Travel Xauxa MVP
-- Migration date: 2026-08-14

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER');
CREATE TYPE vehicle_status AS ENUM ('AVAILABLE', 'RESERVED', 'IN_SERVICE', 'MAINTENANCE', 'UNAVAILABLE');
CREATE TYPE driver_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'UNAVAILABLE');
CREATE TYPE reservation_status AS ENUM (
  'DRAFT',
  'PENDING_PAYMENT',
  'PAYMENT_SUBMITTED',
  'PAYMENT_REVIEW',
  'CONFIRMED',
  'ASSIGNED',
  'READY',
  'PICKUP',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
  'NO_SHOW',
  'PAYMENT_REJECTED',
  'RESCHEDULED',
  'OPERATIONAL_EXCEPTION'
);
CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
);
CREATE TYPE payment_method AS ENUM ('yape', 'plin', 'bcp');

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'CUSTOMER',
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  dni VARCHAR(20),
  title_degree VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number VARCHAR(50),
  status driver_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand VARCHAR(100) NOT NULL DEFAULT 'Jetour',
  model VARCHAR(100) NOT NULL DEFAULT 'SUV Último Modelo',
  year INT DEFAULT 2026,
  plate VARCHAR(20) NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 4,
  status vehicle_status DEFAULT 'AVAILABLE',
  photo_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Documents Table
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_number VARCHAR(100),
  expires_at DATE,
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'VIGENTE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  base_price NUMERIC(10, 2) NOT NULL,
  price_unit VARCHAR(50) DEFAULT 'fixed',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tariff Rules Table
CREATE TABLE IF NOT EXISTS public.tariff_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  origin_zone VARCHAR(100),
  destination_zone VARCHAR(100),
  base_amount NUMERIC(10, 2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'service',
  minimum_units INT DEFAULT 1,
  surcharge NUMERIC(10, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'PEN',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence for Reservation Code
CREATE SEQUENCE IF NOT EXISTS reservation_code_seq START WITH 1;

-- Function to generate code TFX-YYYYMMDD-NNNN
CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := 'TFX-' || TO_CHAR(NOW() AT TIME ZONE 'America/Lima', 'YYYYMMDD') || '-' || LPAD(NEXTVAL('reservation_code_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reservations Table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  status reservation_status DEFAULT 'PENDING_PAYMENT',
  flight_airline VARCHAR(100),
  flight_number VARCHAR(50),
  flight_arrival_time TIMESTAMPTZ,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  passengers_count INT DEFAULT 1,
  luggage_notes TEXT,
  notes TEXT,
  subtotal NUMERIC(10, 2) NOT NULL,
  surcharges NUMERIC(10, 2) DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2) NOT NULL,
  balance_amount NUMERIC(10, 2) NOT NULL,
  invoice_type VARCHAR(20) DEFAULT 'ninguno', -- ninguno, boleta, factura
  invoice_dni VARCHAR(20),
  invoice_name VARCHAR(255),
  invoice_ruc VARCHAR(20),
  invoice_company_name VARCHAR(255),
  invoice_address TEXT,
  cancellation_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_reservation_code
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION generate_reservation_code();

-- Reservation Passengers Table
CREATE TABLE IF NOT EXISTS public.reservation_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  passenger_type VARCHAR(20) DEFAULT 'adulto',
  name VARCHAR(150),
  dni VARCHAR(20)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Proofs Table
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  reference_number VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Reviews Table
CREATE TABLE IF NOT EXISTS public.payment_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES public.profiles(id),
  status payment_status NOT NULL,
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservation Status History Table
CREATE TABLE IF NOT EXISTS public.reservation_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  previous_status reservation_status,
  new_status reservation_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Documents & Consent Records
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restriction Records Table
CREATE TABLE IF NOT EXISTS public.restriction_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id),
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariff_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restriction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

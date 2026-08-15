-- ==============================================================================
-- FAST TRAVEL XAUXA — SCRIPT DEFINITIVO DE INSTALACIÓN (SUPABASE)
-- Copiar y pegar todo este script en Supabase > SQL Editor > New Query > Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
    CREATE TYPE vehicle_status AS ENUM ('AVAILABLE', 'RESERVED', 'IN_SERVICE', 'MAINTENANCE', 'UNAVAILABLE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
    CREATE TYPE driver_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'UNAVAILABLE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM (
      'DRAFT', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_REVIEW',
      'CONFIRMED', 'ASSIGNED', 'READY', 'PICKUP', 'IN_PROGRESS',
      'COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW', 'PAYMENT_REJECTED',
      'RESCHEDULED', 'OPERATIONAL_EXCEPTION'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REFUNDED', 'PARTIALLY_REFUNDED'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('yape', 'plin', 'bcp');
  END IF;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_dni ON public.profiles(dni);

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

CREATE SEQUENCE IF NOT EXISTS reservation_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'FTX-' || TO_CHAR(NOW() AT TIME ZONE 'America/Lima', 'YYYYMMDD') || '-' || LPAD(NEXTVAL('reservation_code_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  surcharges NUMERIC(10, 2) DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  invoice_type VARCHAR(20) DEFAULT 'ninguno',
  invoice_dni VARCHAR(20),
  invoice_name VARCHAR(255),
  invoice_ruc VARCHAR(20),
  invoice_company_name VARCHAR(255),
  invoice_address TEXT,
  cancellation_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_reservation_code ON public.reservations;
CREATE TRIGGER trigger_reservation_code
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION generate_reservation_code();

CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON public.reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_code ON public.reservations(code);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_scheduled_at ON public.reservations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);

CREATE TABLE IF NOT EXISTS public.reservation_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  passenger_type VARCHAR(20) DEFAULT 'adulto',
  name VARCHAR(150),
  dni VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'yape',
  status payment_status DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  reference_number VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed oficial
INSERT INTO public.services (id, code, name, description, base_price, price_unit, active)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'privado-aeropuerto', 'Aeropuerto Privado', 'Servicio exclusivo puerta a puerta desde/hacia el Aeropuerto de Jauja. Máximo confort, puntualidad y recepción personalizada.', 80.00, 'fixed', true),
  ('a2222222-2222-2222-2222-222222222222', 'compartido-aeropuerto', 'Aeropuerto Compartido', 'Viaje ejecutivo en SUV compartida (máximo 4 pasajeros). Ruta directa Aeropuerto Jauja ↔ Plaza Constitución (Huancayo).', 20.00, 'fixed', true),
  ('a3333333-3333-3333-3333-333333333333', 'excursion', 'Excursiones Turísticas', 'Recorridos personalizados por el Valle del Mantaro, Ingenio, Concepción, Chupaca y atractivos turísticos locales.', 50.00, 'hourly', true),
  ('a4444444-4444-4444-4444-444444444444', 'visita-local', 'Visitas Locales', 'Traslados para reuniones ejecutivas, eventos familiares, compras o gestiones en Huancayo y alrededores.', 50.00, 'hourly', true),
  ('a5555555-5555-5555-5555-555555555555', 'renta-horas', 'Renta por Horas con Conductor', 'Vehículo SUV Jetour a tu completa disposición por el tiempo que requieras para moverte con total libertad.', 50.00, 'hourly', true)
ON CONFLICT (code) DO UPDATE 
SET base_price = EXCLUDED.base_price, name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.vehicles (id, brand, model, year, plate, capacity, status, photo_urls)
VALUES 
  ('b1111111-1111-1111-1111-111111111111', 'Jetour', 'X70 Plus SUV Deluxe', 2026, 'W4X-892', 4, 'AVAILABLE', ARRAY['/images/car/jetour-exterior-1.jpg', '/images/car/jetour-front.jpg', '/images/car/jetour-interior-1.jpg'])
ON CONFLICT (plate) DO UPDATE 
SET model = EXCLUDED.model, brand = EXCLUDED.brand;

-- RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "services_select_public" ON public.services;
CREATE POLICY "services_select_public" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "services_all_public" ON public.services;
CREATE POLICY "services_all_public" ON public.services FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vehicles_select_public" ON public.vehicles;
CREATE POLICY "vehicles_select_public" ON public.vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "vehicles_all_public" ON public.vehicles;
CREATE POLICY "vehicles_all_public" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_insert_public" ON public.profiles;
CREATE POLICY "profiles_insert_public" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_update_public" ON public.profiles;
CREATE POLICY "profiles_update_public" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reservations_select_public" ON public.reservations;
CREATE POLICY "reservations_select_public" ON public.reservations FOR SELECT USING (true);
DROP POLICY IF EXISTS "reservations_insert_public" ON public.reservations;
CREATE POLICY "reservations_insert_public" ON public.reservations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "reservations_update_public" ON public.reservations;
CREATE POLICY "reservations_update_public" ON public.reservations FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "reservations_delete_public" ON public.reservations;
CREATE POLICY "reservations_delete_public" ON public.reservations FOR DELETE USING (true);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select_public" ON public.payments;
CREATE POLICY "payments_select_public" ON public.payments FOR SELECT USING (true);
DROP POLICY IF EXISTS "payments_insert_public" ON public.payments;
CREATE POLICY "payments_insert_public" ON public.payments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "payments_update_public" ON public.payments;
CREATE POLICY "payments_update_public" ON public.payments FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "payments_delete_public" ON public.payments;
CREATE POLICY "payments_delete_public" ON public.payments FOR DELETE USING (true);

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proofs_select_public" ON public.payment_proofs;
CREATE POLICY "proofs_select_public" ON public.payment_proofs FOR SELECT USING (true);
DROP POLICY IF EXISTS "proofs_insert_public" ON public.payment_proofs;
CREATE POLICY "proofs_insert_public" ON public.payment_proofs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "proofs_update_public" ON public.payment_proofs;
CREATE POLICY "proofs_update_public" ON public.payment_proofs FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "proofs_delete_public" ON public.payment_proofs;
CREATE POLICY "proofs_delete_public" ON public.payment_proofs FOR DELETE USING (true);

ALTER TABLE public.reservation_passengers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "passengers_select_public" ON public.reservation_passengers;
CREATE POLICY "passengers_select_public" ON public.reservation_passengers FOR SELECT USING (true);
DROP POLICY IF EXISTS "passengers_insert_public" ON public.reservation_passengers;
CREATE POLICY "passengers_insert_public" ON public.reservation_passengers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "passengers_update_public" ON public.reservation_passengers;
CREATE POLICY "passengers_update_public" ON public.reservation_passengers FOR UPDATE USING (true) WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vouchers', 'vouchers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "storage_vouchers_insert" ON storage.objects;
CREATE POLICY "storage_vouchers_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vouchers');

DROP POLICY IF EXISTS "storage_vouchers_select" ON storage.objects;
CREATE POLICY "storage_vouchers_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'vouchers');

DROP POLICY IF EXISTS "storage_vouchers_update" ON storage.objects;
CREATE POLICY "storage_vouchers_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'vouchers');

-- Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

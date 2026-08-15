-- ============================================================
-- RLS POLICIES & CONFIGURACIÓN COMPLETA PARA FAST TRAVEL XAUXA
-- Copiar y ejecutar TODO este script en Supabase > SQL Editor > New Query
-- ============================================================

-- 0. HABILITAR UUID Y STORAGE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Corregir trigger de generación de código (para no sobreescribir códigos válidos)
CREATE OR REPLACE FUNCTION generate_reservation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'FTX-' || TO_CHAR(NOW() AT TIME ZONE 'America/Lima', 'YYYYMMDD') || '-' || LPAD(NEXTVAL('reservation_code_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. SERVICES: Lectura y escritura
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de servicios" ON public.services;
CREATE POLICY "Lectura pública de servicios" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Modificación de servicios" ON public.services;
CREATE POLICY "Modificación de servicios" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- 2. VEHICLES: Lectura y escritura
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de vehículos" ON public.vehicles;
CREATE POLICY "Lectura pública de vehículos" ON public.vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Modificación de vehículos" ON public.vehicles;
CREATE POLICY "Modificación de vehículos" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

-- 3. PROFILES: SELECT, INSERT, UPDATE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de perfiles" ON public.profiles;
CREATE POLICY "Lectura pública de perfiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar perfil sin autenticación" ON public.profiles;
CREATE POLICY "Insertar perfil sin autenticación" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar perfil" ON public.profiles;
CREATE POLICY "Actualizar perfil" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);

-- 4. RESERVATIONS: SELECT, INSERT, UPDATE, DELETE
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leer reservas" ON public.reservations;
DROP POLICY IF EXISTS "Leer reserva por código" ON public.reservations;
CREATE POLICY "Leer reservas" ON public.reservations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar reserva sin autenticación" ON public.reservations;
CREATE POLICY "Insertar reserva sin autenticación" ON public.reservations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin puede actualizar reservas" ON public.reservations;
DROP POLICY IF EXISTS "Actualizar reservas" ON public.reservations;
CREATE POLICY "Actualizar reservas" ON public.reservations FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Eliminar reservas canceladas o rechazadas" ON public.reservations;
CREATE POLICY "Eliminar reservas canceladas o rechazadas" ON public.reservations FOR DELETE USING (true);

-- 5. PAYMENTS: SELECT, INSERT, UPDATE, DELETE
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de pagos" ON public.payments;
CREATE POLICY "Lectura pública de pagos" ON public.payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar pago sin autenticación" ON public.payments;
CREATE POLICY "Insertar pago sin autenticación" ON public.payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar pagos" ON public.payments;
CREATE POLICY "Actualizar pagos" ON public.payments FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Eliminar pagos" ON public.payments;
CREATE POLICY "Eliminar pagos" ON public.payments FOR DELETE USING (true);

-- 6. PAYMENT_PROOFS: SELECT, INSERT, UPDATE, DELETE
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de comprobantes" ON public.payment_proofs;
CREATE POLICY "Lectura pública de comprobantes" ON public.payment_proofs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar comprobante sin autenticación" ON public.payment_proofs;
CREATE POLICY "Insertar comprobante sin autenticación" ON public.payment_proofs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar comprobantes" ON public.payment_proofs;
CREATE POLICY "Actualizar comprobantes" ON public.payment_proofs FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Eliminar comprobantes" ON public.payment_proofs;
CREATE POLICY "Eliminar comprobantes" ON public.payment_proofs FOR DELETE USING (true);

-- 7. RESERVATION_PASSENGERS: SELECT, INSERT, UPDATE, DELETE
ALTER TABLE public.reservation_passengers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de pasajeros" ON public.reservation_passengers;
CREATE POLICY "Lectura pública de pasajeros" ON public.reservation_passengers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar pasajeros sin autenticación" ON public.reservation_passengers;
CREATE POLICY "Insertar pasajeros sin autenticación" ON public.reservation_passengers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar pasajeros" ON public.reservation_passengers;
CREATE POLICY "Actualizar pasajeros" ON public.reservation_passengers FOR UPDATE USING (true) WITH CHECK (true);

-- 8. CONFIGURAR STORAGE BUCKET 'vouchers'
INSERT INTO storage.buckets (id, name, public)
VALUES ('vouchers', 'vouchers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Subir vouchers públicamente" ON storage.objects;
CREATE POLICY "Subir vouchers públicamente" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vouchers');

DROP POLICY IF EXISTS "Lectura pública de vouchers" ON storage.objects;
CREATE POLICY "Lectura pública de vouchers" ON storage.objects
  FOR SELECT USING (bucket_id = 'vouchers');

DROP POLICY IF EXISTS "Actualizar vouchers" ON storage.objects;
CREATE POLICY "Actualizar vouchers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'vouchers');

-- 9. HABILITAR REALTIME EN RESERVAS
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

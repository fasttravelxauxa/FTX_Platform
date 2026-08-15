-- ============================================================
-- RLS POLICIES para Fast Travel Xauxa
-- Ejecutar en Supabase > SQL Editor > New Query
-- ============================================================

-- 1. SERVICES: Lectura pública (para mostrar tarifas en la web)
DROP POLICY IF EXISTS "Lectura pública de servicios" ON public.services;
CREATE POLICY "Lectura pública de servicios"
  ON public.services FOR SELECT
  USING (true);

-- 2. VEHICLES: Lectura pública (para mostrar la flota)
DROP POLICY IF EXISTS "Lectura pública de vehículos" ON public.vehicles;
CREATE POLICY "Lectura pública de vehículos"
  ON public.vehicles FOR SELECT
  USING (true);

-- 3. RESERVATIONS: Cualquier persona puede crear una reserva (sin login)
DROP POLICY IF EXISTS "Insertar reserva sin autenticación" ON public.reservations;
CREATE POLICY "Insertar reserva sin autenticación"
  ON public.reservations FOR INSERT
  WITH CHECK (true);

-- 4. RESERVATIONS: Cualquier persona puede leer una reserva por su código (para consultar su reserva)
DROP POLICY IF EXISTS "Leer reserva por código" ON public.reservations;
CREATE POLICY "Leer reserva por código"
  ON public.reservations FOR SELECT
  USING (true);

-- 5. RESERVATIONS: Solo usuarios autenticados (admin) pueden actualizar el estado
DROP POLICY IF EXISTS "Admin puede actualizar reservas" ON public.reservations;
CREATE POLICY "Admin puede actualizar reservas"
  ON public.reservations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 6. PROFILES: Inserción pública (para crear perfil de pasajero al reservar)
DROP POLICY IF EXISTS "Insertar perfil sin autenticación" ON public.profiles;
CREATE POLICY "Insertar perfil sin autenticación"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- 7. PROFILES: Lectura pública
DROP POLICY IF EXISTS "Lectura pública de perfiles" ON public.profiles;
CREATE POLICY "Lectura pública de perfiles"
  ON public.profiles FOR SELECT
  USING (true);

-- 8. PAYMENTS: Inserción pública (para registrar el voucher al reservar)
DROP POLICY IF EXISTS "Insertar pago sin autenticación" ON public.payments;
CREATE POLICY "Insertar pago sin autenticación"
  ON public.payments FOR INSERT
  WITH CHECK (true);

-- 9. PAYMENTS: Lectura pública
DROP POLICY IF EXISTS "Lectura pública de pagos" ON public.payments;
CREATE POLICY "Lectura pública de pagos"
  ON public.payments FOR SELECT
  USING (true);

-- 10. PAYMENT_PROOFS: Inserción pública (para adjuntar foto del voucher)
DROP POLICY IF EXISTS "Insertar comprobante sin autenticación" ON public.payment_proofs;
CREATE POLICY "Insertar comprobante sin autenticación"
  ON public.payment_proofs FOR INSERT
  WITH CHECK (true);

-- 11. PAYMENT_PROOFS: Lectura pública
DROP POLICY IF EXISTS "Lectura pública de comprobantes" ON public.payment_proofs;
CREATE POLICY "Lectura pública de comprobantes"
  ON public.payment_proofs FOR SELECT
  USING (true);

-- 12. RESERVATION_PASSENGERS: Inserción pública
DROP POLICY IF EXISTS "Insertar pasajeros sin autenticación" ON public.reservation_passengers;
CREATE POLICY "Insertar pasajeros sin autenticación"
  ON public.reservation_passengers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura pública de pasajeros" ON public.reservation_passengers;
CREATE POLICY "Lectura pública de pasajeros"
  ON public.reservation_passengers FOR SELECT
  USING (true);

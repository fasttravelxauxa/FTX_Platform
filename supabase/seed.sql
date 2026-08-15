-- Seed Data Script for Fast Travel Xauxa (Ejecutar en Supabase SQL Editor)

-- 1. Insertar Servicios Oficiales
INSERT INTO public.services (id, code, name, description, base_price, price_unit, active)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'privado-aeropuerto', 'Aeropuerto Privado', 'Servicio exclusivo puerta a puerta desde/hacia el Aeropuerto de Jauja. Máximo confort, puntualidad y recepción personalizada.', 80.00, 'fixed', true),
  ('a2222222-2222-2222-2222-222222222222', 'compartido-aeropuerto', 'Aeropuerto Compartido', 'Viaje ejecutivo en SUV compartida (máximo 4 pasajeros). Ruta directa Aeropuerto Jauja ↔ Plaza Constitución (Huancayo).', 20.00, 'fixed', true),
  ('a3333333-3333-3333-3333-333333333333', 'excursion', 'Excursiones Turísticas', 'Recorridos personalizados por el Valle del Mantaro, Ingenio, Concepción, Chupaca y atractivos turísticos locales.', 50.00, 'hourly', true),
  ('a4444444-4444-4444-4444-444444444444', 'visita-local', 'Visitas Locales', 'Traslados para reuniones ejecutivas, eventos familiares, compras o gestiones en Huancayo y alrededores.', 50.00, 'hourly', true),
  ('a5555555-5555-5555-5555-555555555555', 'renta-horas', 'Renta por Horas con Conductor', 'Vehículo SUV Jetour a tu completa disposición por el tiempo que requieras para moverte con total libertad.', 50.00, 'hourly', true)
ON CONFLICT (code) DO UPDATE 
SET base_price = EXCLUDED.base_price, name = EXCLUDED.name;

-- 2. Insertar Vehículo SUV Jetour
INSERT INTO public.vehicles (id, brand, model, year, plate, capacity, status, photo_urls)
VALUES 
  ('b1111111-1111-1111-1111-111111111111', 'Jetour', 'X70 Plus SUV Deluxe', 2026, 'W4X-892', 4, 'AVAILABLE', ARRAY['/images/car/jetour-exterior-1.jpg', '/images/car/jetour-front.jpg', '/images/car/jetour-interior-1.jpg'])
ON CONFLICT (plate) DO UPDATE 
SET model = EXCLUDED.model;

-- 3. Insertar Perfil de Administrador
INSERT INTO public.profiles (id, role, full_name, phone, dni, title_degree)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', 'ADMIN', 'Administración Fast Travel Xauxa', '929667586', '44556677', 'Coordinación Operativa'),
  ('c2222222-2222-2222-2222-222222222222', 'CUSTOMER', 'Dra. María Elena Ramos', '987654321', '45678912', 'Dra.'),
  ('c3333333-3333-3333-3333-333333333333', 'CUSTOMER', 'Ing. Fernando Quispe (Corporación Andina)', '912345678', '71234567', 'Ing.')
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Reservas de Ejemplo
INSERT INTO public.reservations (
  id, code, customer_id, service_id, vehicle_id, status, flight_airline, flight_number, origin, destination, scheduled_at, passengers_count, subtotal, surcharges, total_amount, deposit_amount, balance_amount, invoice_type, invoice_dni, invoice_name, invoice_ruc, invoice_company_name, invoice_address
)
VALUES 
  (
    'd1111111-1111-1111-1111-111111111111',
    'FTX-20260814-0001',
    'c2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'CONFIRMED',
    'LATAM Airlines',
    'LA 2145',
    'Aeropuerto de Jauja (JAU)',
    'Hotel Turístico, Jr. Ancash 450, Centro de Huancayo',
    NOW() + INTERVAL '1 day',
    2,
    80.00,
    0.00,
    80.00,
    40.00,
    40.00,
    'boleta',
    '45678912',
    'Dra. María Elena Ramos',
    NULL,
    NULL,
    NULL
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    'FTX-20260814-0002',
    'c3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'PAYMENT_REVIEW',
    'SKY Airline',
    'H2 5100',
    'Aeropuerto de Jauja (JAU)',
    'Chilca / Azapampa, Huancayo',
    NOW() + INTERVAL '1 day 2 hours',
    1,
    80.00,
    10.00,
    90.00,
    45.00,
    45.00,
    'factura',
    NULL,
    NULL,
    '20601234567',
    'Corporación Andina del Centro S.A.C.',
    'Av. Real 1020, Huancayo'
  )
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- FAST TRAVEL XAUXA — SCRIPT DE CORRECCIÓN DE BORRADO EN CASCADA Y POLÍTICAS RLS
-- Copiar y pegar todo este script en Supabase > SQL Editor > New Query > Run
-- ==============================================================================

-- 1. Habilitar la política de eliminación en la tabla de perfiles (profiles)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_delete_public" ON public.profiles;
CREATE POLICY "profiles_delete_public" ON public.profiles FOR DELETE USING (true);

-- 2. Asegurar que las reservas se eliminen en cascada cuando se borra un perfil
ALTER TABLE public.reservations 
  DROP CONSTRAINT IF EXISTS reservations_customer_id_fkey,
  ADD CONSTRAINT reservations_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Asegurar cascada en pasajeros adicionales
ALTER TABLE public.reservation_passengers 
  DROP CONSTRAINT IF EXISTS reservation_passengers_reservation_id_fkey,
  ADD CONSTRAINT reservation_passengers_reservation_id_fkey 
    FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 4. Asegurar cascada en pagos
ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS payments_reservation_id_fkey,
  ADD CONSTRAINT payments_reservation_id_fkey 
    FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE CASCADE;

-- 5. Asegurar cascada en comprobantes de pago
ALTER TABLE public.payment_proofs 
  DROP CONSTRAINT IF EXISTS payment_proofs_payment_id_fkey,
  ADD CONSTRAINT payment_proofs_payment_id_fkey 
    FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;

-- 6. Crear tabla del Libro Contable Histórico Inmutable (accounting_ledger)
CREATE TABLE IF NOT EXISTS public.accounting_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_code VARCHAR(50) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  service_name VARCHAR(150) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  passengers_count INT DEFAULT 1,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2) NOT NULL,
  balance_amount NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'yape',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para reportes contables ultra rápidos
CREATE INDEX IF NOT EXISTS idx_accounting_scheduled_at ON public.accounting_ledger(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_accounting_created_at ON public.accounting_ledger(created_at);

-- Políticas RLS para accounting_ledger
ALTER TABLE public.accounting_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounting_select_public" ON public.accounting_ledger;
CREATE POLICY "accounting_select_public" ON public.accounting_ledger FOR SELECT USING (true);
DROP POLICY IF EXISTS "accounting_insert_public" ON public.accounting_ledger;
CREATE POLICY "accounting_insert_public" ON public.accounting_ledger FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "accounting_update_public" ON public.accounting_ledger;
CREATE POLICY "accounting_update_public" ON public.accounting_ledger FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "accounting_delete_public" ON public.accounting_ledger;
CREATE POLICY "accounting_delete_public" ON public.accounting_ledger FOR DELETE USING (true);

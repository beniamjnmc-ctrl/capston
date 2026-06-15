-- ========================================
-- OdonTool — Migración de inventario a Supabase
-- Ejecutar DESPUÉS de supabase_setup.sql
-- ========================================
-- Copia todo este archivo en: Supabase → SQL Editor → New query → Run

-- ========================================
-- 1. INVENTARIO POR CLÍNICA (reemplaza localStorage)
-- ========================================
CREATE TABLE IF NOT EXISTS public.clinic_inventories (
  clinic_key   TEXT PRIMARY KEY,
  clinic_name  TEXT NOT NULL,
  data         JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.clinic_inventories IS 'Inventario completo por sucursal (products, boxes, kits, historial, etc.)';
COMMENT ON COLUMN public.clinic_inventories.clinic_key IS 'loBarnechea | alcantara';
COMMENT ON COLUMN public.clinic_inventories.data IS 'JSON con products, boxes, procedures (kits), purchaseOrders, attendHistory, transferHistory';

ALTER TABLE public.clinic_inventories ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. RLS — clinic_inventories
-- ========================================
DROP POLICY IF EXISTS "Authenticated users can read clinic inventories" ON public.clinic_inventories;
CREATE POLICY "Authenticated users can read clinic inventories"
  ON public.clinic_inventories FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert clinic inventories" ON public.clinic_inventories;
CREATE POLICY "Authenticated users can insert clinic inventories"
  ON public.clinic_inventories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update clinic inventories" ON public.clinic_inventories;
CREATE POLICY "Authenticated users can update clinic inventories"
  ON public.clinic_inventories FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ========================================
-- 3. RLS — Evitar que usuarios cambien su propio rol
-- ========================================
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prevent_profile_role_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- Permitir que admins actualicen perfiles de otros (p. ej. cambiar rol)
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ========================================
-- 4. RLS — procedures: clínicos pueden registrar atenciones
-- ========================================
DROP POLICY IF EXISTS "Authenticated users can insert procedures" ON public.procedures;
CREATE POLICY "Authenticated users can insert procedures"
  ON public.procedures FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ========================================
-- 5. Trigger updated_at en clinic_inventories
-- ========================================
DROP TRIGGER IF EXISTS update_clinic_inventories_updated_at ON public.clinic_inventories;
CREATE TRIGGER update_clinic_inventories_updated_at
  BEFORE UPDATE ON public.clinic_inventories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 6. Verificación (opcional — revisa el resultado en la pestaña Results)
-- ========================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'procedures', 'clinic_inventories', 'audit_log')
ORDER BY table_name;

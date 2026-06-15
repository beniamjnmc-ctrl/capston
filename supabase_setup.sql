-- ========================================
-- MIGRACIÓN A SUPABASE
-- Script SQL para crear tablas y políticas
-- ========================================

-- ========================================
-- 1. TABLA DE PERFILES DE USUARIOS
-- ========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'clinico' CHECK (role IN ('admin', 'clinico', 'asistente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Comentarios para claridad
COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios extendidos con información adicional';
COMMENT ON COLUMN public.profiles.role IS 'Rol del usuario: admin, clinico o asistente';

-- ========================================
-- 2. TABLA DE PROCEDIMIENTOS/PRODUCCIÓN
-- ========================================
CREATE TABLE IF NOT EXISTS public.procedures (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  year INT NOT NULL,
  month TEXT NOT NULL,
  month_key TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(code, month_key, year)
);

COMMENT ON TABLE public.procedures IS 'Registro de procedimientos/servicios clínicos realizados';
COMMENT ON COLUMN public.procedures.code IS 'Código único del procedimiento';
COMMENT ON COLUMN public.procedures.month_key IS 'Clave del mes (01-12)';

-- ========================================
-- 3. TABLA DE AUDITORÍA (opcional pero recomendado)
-- ========================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.audit_log IS 'Registro de auditoría de cambios en el sistema';

-- ========================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS)
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA PROFILES
CREATE POLICY "Users can read their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles" 
  ON public.profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- POLÍTICAS PARA PROCEDURES
CREATE POLICY "Authenticated users can read procedures" 
  ON public.procedures FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert procedures" 
  ON public.procedures FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin can update procedures" 
  ON public.procedures FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- POLÍTICAS PARA AUDIT_LOG
CREATE POLICY "Admin can read audit logs" 
  ON public.audit_log FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ========================================
-- 5. FUNCIÓN PARA ACTUALIZAR PERFILES AL REGISTRARSE
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'clinico'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ejecutar la función al crear usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 6. FUNCIÓN PARA ACTUALIZAR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 7. DATOS INICIALES (OPCIONAL)
-- ========================================
-- Una vez que hayas creado usuarios en Authentication, 
-- ejecuta esto para crear sus perfiles.
-- REEMPLAZA los UUIDs con los IDs reales de los usuarios

-- Ejemplo (descomentar y actualizar con UUIDs reales):
/*
INSERT INTO public.profiles (id, email, name, phone, role)
VALUES 
  ('user-uuid-1', 'admin@auil.cl', 'Administrador Auil', '+56900000000', 'admin'),
  ('user-uuid-2', 'doctor@auil.cl', 'Dr. Roberto Auil', '+56911111111', 'clinico'),
  ('user-uuid-3', 'asistente@auil.cl', 'Asistente Dental', '+56922222222', 'asistente')
ON CONFLICT (id) DO NOTHING;
*/

-- ========================================
-- FIN DEL SCRIPT
-- ========================================

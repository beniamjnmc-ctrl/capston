-- ========================================
-- TABLAS ADICIONALES PARA INVENTARIO
-- Ejecuta este script en Supabase SQL Editor
-- ========================================

-- ========================================
-- 1. TABLA DE CLÍNICAS
-- ========================================
CREATE TABLE IF NOT EXISTS public.clinics (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.clinics IS 'Clínicas disponibles en el sistema';
COMMENT ON COLUMN public.clinics.id IS 'Identificador único (ej: loBarnechea, alcantara)';

-- Insertar clínicas iniciales
INSERT INTO public.clinics (id, name, address, phone, email)
VALUES 
  ('loBarnechea', 'Clínica Lo Barnechea', 'Lo Barnechea, Santiago', '+56922222222', 'clinica@lobarnechea.cl'),
  ('alcantara', 'Clínica Alcántara', 'Alcántara, Santiago', '+56933333333', 'clinica@alcantara.cl')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. TABLA DE ITEMS DE INVENTARIO
-- ========================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id VARCHAR(50) NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  product_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity_bodega INTEGER DEFAULT 0,
  quantity_consultorio1 INTEGER DEFAULT 0,
  quantity_consultorio2 INTEGER DEFAULT 0,
  quantity_consultorio3 INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 2,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(clinic_id, product_code)
);

COMMENT ON TABLE public.inventory_items IS 'Items de inventario por clínica';
COMMENT ON COLUMN public.inventory_items.product_code IS 'Código único del producto (ej: 1110, 2330)';
COMMENT ON COLUMN public.inventory_items.minimum_stock IS 'Cantidad mínima para alertas';

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic_id ON public.inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_code ON public.inventory_items(product_code);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry_date ON public.inventory_items(expiry_date);

-- ========================================
-- 3. TABLA DE HISTORIAL DE INVENTARIO
-- ========================================
CREATE TABLE IF NOT EXISTS public.inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'move'
  old_quantity INTEGER,
  new_quantity INTEGER,
  location VARCHAR(100), -- 'bodega', 'consultorio1', 'consultorio2', 'consultorio3'
  change_reason VARCHAR(255),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.inventory_history IS 'Historial de cambios en inventario para auditoría';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_inventory_history_item_id ON public.inventory_history(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_changed_at ON public.inventory_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_inventory_history_changed_by ON public.inventory_history(changed_by);

-- ========================================
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. POLÍTICAS PARA CLINICS
-- ========================================

-- Todos los usuarios autenticados pueden ver clínicas
CREATE POLICY "Authenticated users can view clinics" 
  ON public.clinics FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Solo admin puede crear clínicas
CREATE POLICY "Admin can create clinics" 
  ON public.clinics FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Solo admin puede actualizar clínicas
CREATE POLICY "Admin can update clinics" 
  ON public.clinics FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ========================================
-- 6. POLÍTICAS PARA INVENTORY_ITEMS
-- ========================================

-- Usuarios autenticados pueden ver items de inventario
CREATE POLICY "Authenticated users can view inventory items" 
  ON public.inventory_items FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Admin y clinico pueden crear items
CREATE POLICY "Admin and clinico can create inventory items" 
  ON public.inventory_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'clinico')
    )
  );

-- Admin y clinico pueden actualizar items
CREATE POLICY "Admin and clinico can update inventory items" 
  ON public.inventory_items FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'clinico')
    )
  );

-- Solo admin puede eliminar items
CREATE POLICY "Admin can delete inventory items" 
  ON public.inventory_items FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ========================================
-- 7. POLÍTICAS PARA INVENTORY_HISTORY
-- ========================================

-- Usuarios autenticados pueden ver historial
CREATE POLICY "Authenticated users can view inventory history" 
  ON public.inventory_history FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Cuando se actualiza inventario, se crea un registro en el historial
CREATE POLICY "System can insert inventory history" 
  ON public.inventory_history FOR INSERT 
  WITH CHECK (true);

-- Solo admin puede ver y descargar reportes
CREATE POLICY "Admin can view audit history" 
  ON public.inventory_history FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ========================================
-- 8. TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- ========================================

-- Función para registrar cambios en inventory_items
CREATE OR REPLACE FUNCTION public.log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Detectar qué cantidad cambió
    IF NEW.quantity_bodega != OLD.quantity_bodega THEN
      INSERT INTO public.inventory_history 
        (inventory_item_id, action, old_quantity, new_quantity, location, changed_by)
      VALUES 
        (NEW.id, 'update', OLD.quantity_bodega, NEW.quantity_bodega, 'bodega', auth.uid());
    END IF;
    
    IF NEW.quantity_consultorio1 != OLD.quantity_consultorio1 THEN
      INSERT INTO public.inventory_history 
        (inventory_item_id, action, old_quantity, new_quantity, location, changed_by)
      VALUES 
        (NEW.id, 'update', OLD.quantity_consultorio1, NEW.quantity_consultorio1, 'consultorio1', auth.uid());
    END IF;

    IF NEW.quantity_consultorio2 != OLD.quantity_consultorio2 THEN
      INSERT INTO public.inventory_history 
        (inventory_item_id, action, old_quantity, new_quantity, location, changed_by)
      VALUES 
        (NEW.id, 'update', OLD.quantity_consultorio2, NEW.quantity_consultorio2, 'consultorio2', auth.uid());
    END IF;

    IF NEW.quantity_consultorio3 != OLD.quantity_consultorio3 THEN
      INSERT INTO public.inventory_history 
        (inventory_item_id, action, old_quantity, new_quantity, location, changed_by)
      VALUES 
        (NEW.id, 'update', OLD.quantity_consultorio3, NEW.quantity_consultorio3, 'consultorio3', auth.uid());
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.inventory_history 
      (inventory_item_id, action, new_quantity, location, changed_by)
    VALUES 
      (NEW.id, 'create', NEW.quantity_bodega, 'bodega', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.inventory_history 
      (inventory_item_id, action, old_quantity, location, changed_by)
    VALUES 
      (OLD.id, 'delete', OLD.quantity_bodega, 'bodega', auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para logs
DROP TRIGGER IF EXISTS trigger_log_inventory_change ON public.inventory_items;
CREATE TRIGGER trigger_log_inventory_change
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.log_inventory_change();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_inventory_updated_at ON public.inventory_items;
CREATE TRIGGER trigger_update_inventory_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_updated_at();

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
-- ✅ Resultado esperado:
-- - 3 tablas creadas: clinics, inventory_items, inventory_history
-- - 2 clínicas insertadas
-- - RLS habilitado
-- - Políticas de seguridad creadas
-- - Triggers de auditoría configurados

# 🚀 Plan Completo de Migración a Supabase - Capston Dental

**Fecha**: 2024-2025  
**Proyecto**: OdonTool - Sistema de Inventario de Clínica Dental  
**Estado**: Migración Parcial - 40% Completada  
**Próximo Paso**: Ejecutar Scripts SQL y Migrar Inventario

---

## 📊 Estado Actual de la Migración

### ✅ COMPLETADO (40%)
- ✅ Proyecto Supabase creado
- ✅ SQL scripts generados (`supabase_setup.sql`, `import_procedures.sql`)
- ✅ Clientes Supabase configurados (`utils/supabase/`)
- ✅ `login.js` actualizado a Supabase Auth
- ✅ `.env.example` creado
- ✅ Dependencias instaladas
- ✅ Documentación inicial

### ❌ PENDIENTE (60%)
- ❌ Ejecutar scripts SQL en Supabase Console
- ❌ Crear usuarios de prueba
- ❌ Migrar sistema de inventario a base de datos
- ❌ Actualizar API routes (CSV → Supabase)
- ❌ Migrar data de localStorage → Supabase
- ❌ Testing y validación
- ❌ Despliegue a producción

---

## 🎯 Fases de Migración

### FASE 1: Configuración de Base de Datos (1 hora)

#### Paso 1.1: Ejecutar Script SQL Principal
1. Ve a https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona proyecto: **rsbqobnwcsksuzxqvgfm**
4. Ve a **SQL Editor** → **New Query**
5. Abre el archivo `supabase_setup.sql`
6. Copia TODO el contenido
7. Pégalo en el editor SQL de Supabase
8. Haz clic en **▶ Run**
9. Espera a que se complete (deberías ver ✓ sin errores)

**Resultado esperado**: 
- ✓ Tabla `profiles` creada
- ✓ Tabla `procedures` creada
- ✓ Tabla `audit_log` creada
- ✓ Row Level Security (RLS) habilitado

#### Paso 1.2: Crear Usuarios de Prueba
1. Ve a **Authentication** → **Users** → **Add User**
2. Crear usuario 1:
   - Email: `admin@auil.cl`
   - Password: `Admin123!SupabaseSecure`
   - Haz clic en **Create User**
3. Crear usuario 2:
   - Email: `doctor@auil.cl`
   - Password: `Doctor123!SupabaseSecure`
4. Crear usuario 3:
   - Email: `asistente@auil.cl`
   - Password: `Asistente123!SupabaseSecure`

#### Paso 1.3: Copiar UUIDs de Usuarios
1. Ve a **Authentication** → **Users**
2. Para cada usuario creado, copia el UUID (columna ID)
3. Anota los 3 UUIDs en un archivo temporal

Ejemplo:
```
admin: 550e8400-e29b-41d4-a716-446655440001
doctor: 550e8400-e29b-41d4-a716-446655440002
asistente: 550e8400-e29b-41d4-a716-446655440003
```

#### Paso 1.4: Insertar Perfiles de Usuarios
1. Ve a **SQL Editor** → **New Query**
2. Reemplaza los UUIDs con los reales
3. Ejecuta este script:

```sql
INSERT INTO public.profiles (id, email, name, phone, role)
VALUES 
  ('UUID-ADMIN-AQUI', 'admin@auil.cl', 'Administrador Auil', '+56900000000', 'admin'),
  ('UUID-DOCTOR-AQUI', 'doctor@auil.cl', 'Dr. Roberto Auil', '+56911111111', 'clinico'),
  ('UUID-ASISTENTE-AQUI', 'asistente@auil.cl', 'Asistente Dental', '+56922222222', 'asistente')
ON CONFLICT (id) DO NOTHING;
```

#### Paso 1.5: Importar Procedimientos
1. Ve a **SQL Editor** → **New Query**
2. Abre `import_procedures.sql`
3. Copia TODO el contenido
4. Pégalo en Supabase SQL Editor
5. Haz clic en **▶ Run**

**Resultado esperado**: ~50 procedimientos importados

#### Paso 1.6: Verificar la Configuración
Ejecuta estas queries para verificar:

```sql
-- Verificar perfiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Verificar procedimientos
SELECT COUNT(*) as total_procedures FROM public.procedures;

-- Ver datos de ejemplo
SELECT * FROM public.profiles LIMIT 5;
```

---

### FASE 2: Crear Tablas Adicionales Necesarias (30 minutos)

La migración del inventario requiere nuevas tablas. Ejecuta este script SQL:

```sql
-- Tabla para inventario de productos
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id VARCHAR(50) NOT NULL, -- 'loBarnechea' o 'alcantara'
  product_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity_bodega INTEGER DEFAULT 0,
  quantity_consultorio1 INTEGER DEFAULT 0,
  quantity_consultorio2 INTEGER DEFAULT 0,
  quantity_consultorio3 INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 2,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(clinic_id, product_code)
);

-- Tabla para auditar cambios de inventario
CREATE TABLE IF NOT EXISTS public.inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  action VARCHAR(50), -- 'create', 'update', 'delete'
  old_quantity INTEGER,
  new_quantity INTEGER,
  location VARCHAR(100),
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para almacenar clinicas
CREATE TABLE IF NOT EXISTS public.clinics (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar clínicas de ejemplo
INSERT INTO public.clinics (id, name, address, phone)
VALUES 
  ('loBarnechea', 'Clínica Lo Barnechea', 'Lo Barnechea, Santiago', '+56922222222'),
  ('alcantara', 'Clínica Alcántara', 'Alcántara, Santiago', '+56933333333')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

-- Policy para inventory_items: usuarios pueden ver items de sus clínicas
CREATE POLICY "users_can_view_clinic_inventory" ON public.inventory_items
  FOR SELECT USING (true);

-- Policy para crear items
CREATE POLICY "users_can_create_inventory" ON public.inventory_items
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'clinico')
    )
  );

-- Policy para actualizar items
CREATE POLICY "users_can_update_inventory" ON public.inventory_items
  FOR UPDATE USING (true);

-- Policy para inventory_history
CREATE POLICY "users_can_view_inventory_history" ON public.inventory_history
  FOR SELECT USING (true);
```

---

### FASE 3: Migrar Sistema de Inventario (4-6 horas)

#### Paso 3.1: Crear API Route para Inventario

**Archivo**: `pages/api/inventory/items.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { method } = req

  // Verificar autenticación
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    switch (method) {
      case 'GET':
        return await getInventoryItems(req, res, user)
      case 'POST':
        return await createInventoryItem(req, res, user)
      case 'PUT':
        return await updateInventoryItem(req, res, user)
      case 'DELETE':
        return await deleteInventoryItem(req, res, user)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function getInventoryItems(req, res, user) {
  const { clinicId } = req.query

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('clinic_id', clinicId)

  if (error) throw error
  return res.status(200).json(data)
}

async function createInventoryItem(req, res, user) {
  const { clinicId, productCode, productName, category } = req.body

  const { data, error } = await supabase
    .from('inventory_items')
    .insert([{
      clinic_id: clinicId,
      product_code: productCode,
      product_name: productName,
      category: category,
      created_by: user.id
    }])
    .select()

  if (error) throw error
  return res.status(201).json(data[0])
}

async function updateInventoryItem(req, res, user) {
  const { id, ...updates } = req.body

  const { data, error } = await supabase
    .from('inventory_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (error) throw error
  return res.status(200).json(data[0])
}

async function deleteInventoryItem(req, res, user) {
  const { id } = req.body

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) throw error
  return res.status(204).send('')
}
```

#### Paso 3.2: Crear API Route para Procedimientos

**Archivo**: `pages/api/procedures/index.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['POST', 'GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    if (req.method === 'POST') {
      return await createProcedure(req, res, user)
    } else {
      return await getProcedures(req, res)
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function createProcedure(req, res, user) {
  const { code, description, quantity, date } = req.body

  // Validar entrada
  if (!code || !description || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Insertar en procedimientos
  const { data, error } = await supabase
    .from('procedures')
    .insert([{
      code,
      description,
      quantity: parseInt(quantity),
      date: date || new Date().toISOString(),
      recorded_by: user.id
    }])
    .select()

  if (error) throw error

  return res.status(201).json({
    success: true,
    procedure: data[0]
  })
}

async function getProcedures(req, res) {
  const { startDate, endDate } = req.query

  let query = supabase.from('procedures').select('*')

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)

  const { data, error } = await query.order('date', { ascending: false })

  if (error) throw error
  return res.status(200).json(data)
}
```

#### Paso 3.3: Actualizar `pages/api/append-production.js`

Reemplaza el contenido actual con:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    const entries = Array.isArray(req.body.entries) ? req.body.entries : []
    
    if (entries.length === 0) {
      return res.status(400).json({ error: 'No entries provided' })
    }

    // Insertar todos los procedimientos en Supabase
    const { data, error } = await supabase
      .from('procedures')
      .insert(
        entries.map(entry => ({
          code: entry.code || '9999',
          description: entry.description || 'Procedimiento',
          quantity: parseInt(entry.quantity) || 1,
          date: entry.date || new Date().toISOString(),
          recorded_by: user.id
        }))
      )
      .select()

    if (error) throw error

    return res.status(200).json({
      success: true,
      appended: data.length
    })
  } catch (error) {
    console.error('Error appending procedures:', error)
    return res.status(500).json({ error: error.message })
  }
}
```

---

### FASE 4: Actualizar Frontend (3-4 horas)

#### Paso 4.1: Actualizar `pages/_app.js`

El archivo debe obtener datos de Supabase. Aquí está la estructura mejorada:

```javascript
// En la sección useEffect que carga inventarios
useEffect(() => {
  const loadInventories = async () => {
    try {
      // Obtener de Supabase en lugar de localStorage
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')

      if (error) throw error

      // Organizar por clínica
      const organized = {
        loBarnechea: { products: [], boxes: [] },
        alcantara: { products: [], boxes: [] }
      }

      data?.forEach(item => {
        const clinic = item.clinic_id
        if (!organized[clinic].products) organized[clinic].products = []
        organized[clinic].products.push(item)
      })

      setInventories(organized)
    } catch (error) {
      console.error('Error loading inventories:', error)
      // Fallback a localStorage si hay error
      const stored = localStorage.getItem('odontool-multiclinic')
      if (stored) {
        setInventories(JSON.parse(stored))
      }
    }
    setLoading(false)
  }

  if (user) {
    loadInventories()
  }
}, [user, supabase])
```

#### Paso 4.2: Crear Hook para API de Inventario

**Archivo**: `utils/hooks/useInventoryAPI.js`

```javascript
import { useCallback } from 'react'
import { createClient } from '../supabase/client'

export function useInventoryAPI() {
  const supabase = createClient()

  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [supabase])

  const addInventoryItem = useCallback(async (clinicId, item) => {
    const token = await getAuthToken()
    const response = await fetch('/api/inventory/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        clinicId,
        ...item
      })
    })
    
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }, [getAuthToken])

  const updateInventoryItem = useCallback(async (id, updates) => {
    const token = await getAuthToken()
    const response = await fetch('/api/inventory/items', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id, ...updates })
    })
    
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }, [getAuthToken])

  const deleteInventoryItem = useCallback(async (id) => {
    const token = await getAuthToken()
    const response = await fetch('/api/inventory/items', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    })
    
    if (!response.ok) throw new Error(await response.text())
  }, [getAuthToken])

  const logProcedure = useCallback(async (code, description, quantity) => {
    const token = await getAuthToken()
    const response = await fetch('/api/procedures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code, description, quantity })
    })
    
    if (!response.ok) throw new Error(await response.text())
    return response.json()
  }, [getAuthToken])

  return {
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    logProcedure
  }
}
```

#### Paso 4.3: Crear `.env.local`

**Archivo**: `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://rsbqobnwcsksuzxqvgfm.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_JBMzN8OcZG2ET9YFHibodg_dl-lxq6y
SUPABASE_SERVICE_ROLE_KEY=[Tu service role key de Supabase]
```

Para obtener el Service Role Key:
1. Ve a https://app.supabase.com
2. Proyecto: rsbqobnwcsksuzxqvgfm
3. **Settings** → **API**
4. Copia el **service_role key** (debajo de "Project API keys")

---

### FASE 5: Testing (2-3 horas)

#### Test 5.1: Autenticación
```bash
# Probar login con un usuario de prueba
# Email: admin@auil.cl
# Password: Admin123!SupabaseSecure
```

#### Test 5.2: Inventario
- [ ] Crear nuevo producto
- [ ] Actualizar cantidad
- [ ] Cambiar ubicación
- [ ] Ver alertas de vencimiento
- [ ] Ver alertas de stock bajo

#### Test 5.3: Procedimientos
- [ ] Registrar procedimiento
- [ ] Ver historial
- [ ] Generar reporte

#### Test 5.4: Usuarios
- [ ] Registrar nuevo usuario
- [ ] Cambiar contraseña
- [ ] Editar perfil
- [ ] Cerrar sesión

---

### FASE 6: Despliegue a Producción (1 hora)

#### Paso 6.1: Verificar Vercel
1. Ve a https://vercel.com
2. Selecciona el proyecto capston
3. Haz clic en **Settings** → **Environment Variables**
4. Agrega las variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

#### Paso 6.2: Deploy
```bash
git add .
git commit -m "feat: Complete Supabase migration"
git push origin main
```

Vercel automáticamente desplegará los cambios.

---

## 🔍 Checklist de Verificación

### Base de Datos
- [ ] Tablas creadas en Supabase
- [ ] RLS habilitado
- [ ] Usuarios de prueba creados
- [ ] Perfiles de usuarios insertados
- [ ] Procedimientos importados (~50)
- [ ] Clínicas configuradas

### API
- [ ] `/api/inventory/items` funciona
- [ ] `/api/procedures` funciona
- [ ] `/api/append-production` usa Supabase
- [ ] Autenticación verificada en APIs
- [ ] Errores capturados correctamente

### Frontend
- [ ] Login funciona con Supabase Auth
- [ ] Registro de usuarios funciona
- [ ] Inventario carga de Supabase
- [ ] Crear/editar/borrar productos funciona
- [ ] Registrar procedimientos funciona
- [ ] Historial visible

### Despliegue
- [ ] Variables de entorno en Vercel
- [ ] Deploy completado sin errores
- [ ] Funciona en producción
- [ ] Base de datos remota accesible

---

## ⚠️ Posibles Problemas y Soluciones

### Problema: "NEXT_PUBLIC_SUPABASE_URL is undefined"
**Solución**: Verifica que `.env.local` existe con las variables correctas

### Problema: "Unauthorized" en API calls
**Solución**: Verifica que el token se envía correctamente en headers

### Problema: "RLS policy violation"
**Solución**: Revisa las policies en Supabase, asegúrate que el usuario tiene permisos

### Problema: Datos no persisten después de refresh
**Solución**: Verifica que los datos se guardan en Supabase, no solo en localStorage

### Problema: Session expires demasiado rápido
**Solución**: Configura la duración de sesión en Supabase Auth settings

---

## 📞 Próximos Pasos

1. **Hoy**: Ejecutar scripts SQL (Fase 1)
2. **Mañana**: Crear tablas adicionales y APIs (Fases 2-3)
3. **Próxima semana**: Actualizar frontend (Fase 4)
4. **Siguiente**: Testing completo (Fase 5)
5. **Final**: Deploy a producción (Fase 6)

---

## 📚 Recursos Útiles

- [Documentación Supabase](https://supabase.io/docs)
- [Supabase SQL](https://supabase.io/docs/guides/database)
- [Supabase Auth](https://supabase.io/docs/guides/auth)
- [Next.js + Supabase](https://supabase.io/docs/guides/getting-started/quickstarts/nextjs)
- [RLS Policies](https://supabase.io/docs/guides/database/postgres/row-level-security)

---

**Última actualización**: 2024-2025  
**Versión**: 1.0  
**Responsable**: Benjamin J. Mendez Cabrera

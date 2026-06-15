# 🚀 Guía de Migración a Supabase - Paso a Paso

## FASE 1: Crear Tablas en Supabase Console

### Paso 1: Acceder a Supabase
1. Ve a https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: **rsbqobnwcsksuzxqvgfm**

### Paso 2: Ejecutar el script SQL
1. En la consola de Supabase, ve a **SQL Editor**
2. Haz clic en **+ New Query**
3. Copia todo el contenido del archivo `supabase_setup.sql`
4. Pégalo en el editor
5. Haz clic en el botón **▶ Run** (esquina superior derecha)
6. Espera a que se complete (deberías ver mensajes de éxito)

✅ **Resultado esperado**: Se crearán 3 tablas: `profiles`, `procedures`, `audit_log`

---

## FASE 2: Crear Usuarios en Supabase Auth

### Paso 3: Crear los 3 usuarios de prueba
1. En Supabase Console, ve a **Authentication** → **Users**
2. Haz clic en **+ Add User**
3. Crear usuario 1:
   - Email: `admin@auil.cl`
   - Password: `Admin123!` (o la que prefieras)
   - Haz clic en **Create User**

4. Repetir para los otros dos usuarios:
   - Email: `doctor@auil.cl`, Password: `Doctor123!`
   - Email: `asistente@auil.cl`, Password: `Asistente123!`

### Paso 4: Obtener los UUIDs
1. Ve a **Authentication** → **Users**
2. Copia los UUIDs (ID) de cada usuario
3. Anota los en algún lado - los necesitarás en el siguiente paso

---

## FASE 3: Insertar Datos Iniciales

### Paso 5: Ejecutar insert de perfiles
1. En **SQL Editor**, crea una nueva query
2. Reemplaza `user-uuid-1`, `user-uuid-2`, `user-uuid-3` con los UUIDs reales
3. Copia y ejecuta esto:

```sql
INSERT INTO public.profiles (id, email, name, phone, role)
VALUES 
  ('USER-UUID-1-AQUI', 'admin@auil.cl', 'Administrador Auil', '+56900000000', 'admin'),
  ('USER-UUID-2-AQUI', 'doctor@auil.cl', 'Dr. Roberto Auil', '+56911111111', 'clinico'),
  ('USER-UUID-3-AQUI', 'asistente@auil.cl', 'Asistente Dental', '+56922222222', 'asistente')
ON CONFLICT (id) DO NOTHING;
```

### Paso 6: Importar procedimientos (opcional pero importante)
1. Descarga el CSV de procedimientos: `Consolidado de Producción Clínica Auil 2024-2025 1.csv`
2. En Supabase Console, ve a **Table Editor**
3. Selecciona la tabla `procedures`
4. Haz clic en **Insert** → **Insert row** (o usa el botón de importación)
5. Importa los datos del CSV

**Alternativa más rápida**: Usa el script SQL proporcionado (ver archivo `import_procedures.sql`)

---

## FASE 4: Verificar que todo funciona

### Paso 7: Test de conexión
1. En Supabase Console, ve a **SQL Editor**
2. Ejecuta esta query:

```sql
SELECT id, email, name, role FROM public.profiles;
```

Deberías ver los 3 usuarios creados.

3. Ejecuta esta otra:

```sql
SELECT COUNT(*) as total_procedures FROM public.procedures;
```

Deberías ver la cantidad de procedimientos importados.

---

## FASE 5: Actualizar el código del proyecto

Tu código ya ha sido actualizado con:
- ✅ `login.js` - Usa autenticación real de Supabase
- ✅ `useSupabaseAuth.js` - Hook con funciones mejoradas
- ✅ Gestión de sesiones automática

Los cambios incluyen:
- Login con Supabase Auth (no localStorage)
- Validación en tiempo real
- Sincronización automática de sesiones
- Mejor manejo de errores

---

## FASE 6: Probar la aplicación

### Paso 8: Iniciar el servidor
```powershell
npm run dev
```

### Paso 9: Probar login
1. Ve a http://localhost:3000/login
2. Prueba login con:
   - Email: `admin@auil.cl`
   - Password: `Admin123!`

Deberías entrar sin ver el código de verificación (ese fue el flujo anterior con localStorage).

---

## ⚠️ Importante

### Variables de Entorno
Tu `.env.local` ya está configurado correctamente:
```
NEXT_PUBLIC_SUPABASE_URL=https://rsbqobnwcsksuzxqvgfm.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_JBMzN8OcZG2ET9YFHibodg_dl-lxq6y
```

### Políticas de Seguridad (RLS)
El script SQL crea políticas que:
- Cada usuario solo ve su propio perfil
- Solo admins pueden actualizar procedimientos
- Los datos están protegidos

### Próximos pasos después de esto
1. Actualizar `inventory.js` para cargar procedimientos desde Supabase
2. Crear módulo de edición de procedimientos
3. Agregar más validaciones y auditoría
4. Configurar backups automáticos en Supabase

---

¿Dudas? Revisá la documentación oficial: https://supabase.com/docs

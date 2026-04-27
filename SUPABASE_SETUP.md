# Integración con Supabase

Este proyecto ha sido configurado para funcionar con Supabase. Sigue los pasos a continuación para completar la instalación.

## Paso 1: Instalar dependencias

Ejecuta el siguiente comando en tu terminal:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Paso 2: Variables de entorno

Ya está creado el archivo `.env.local` con tus credenciales de Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Importante**: Estas variables ya contienen tus credenciales reales. No compartas este archivo en repositorios públicos.

## Paso 3: Archivos creados

Se han creado los siguientes archivos de configuración:

### `/utils/supabase/server.js`
Cliente de Supabase para uso en Server Components (acceso a datos del lado del servidor).

### `/utils/supabase/client.js`
Cliente de Supabase para uso en el navegador (componentes cliente).

### `/utils/supabase/middleware.js`
Middleware para mantener las sesiones actualizadas automáticamente.

### `/middleware.js` (raíz del proyecto)
Archivo de middleware de Next.js que usa el middleware de Supabase.

### `/utils/supabase/useSupabaseAuth.js`
Hook personalizado con funciones de autenticación listos para usar.

## Paso 4: Ejemplo de uso

### Uso en Server Components:

```javascript
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function MyPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Obtener datos
  const { data: items } = await supabase
    .from('mi_tabla')
    .select('*')

  return <div>{/* Usar items */}</div>
}
```

### Uso en Client Components:

```javascript
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const supabase = createClient()
  const [items, setItems] = useState([])

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from('mi_tabla').select('*')
      setItems(data || [])
    }

    fetchItems()
  }, [supabase])

  return <div>{/* Usar items */}</div>
}
```

### Usando el hook de autenticación:

```javascript
'use client'

import useSupabaseAuth from '@/utils/supabase/useSupabaseAuth'

export default function LoginPage() {
  const { login, register, logout, user, loading } = useSupabaseAuth()

  const handleLogin = async (email, password) => {
    try {
      await login(email, password)
    } catch (error) {
      console.error('Error logging in:', error)
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      {user ? (
        <div>
          <p>Bienvenido, {user.email}</p>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      ) : (
        <button onClick={() => handleLogin('user@example.com', 'password')}>
          Iniciar sesión
        </button>
      )}
    </div>
  )
}
```

## Paso 5: Instalar Supabase Agent Skills (Opcional)

Para mejores herramientas de IA con Supabase, ejecuta:

```bash
npx skills add supabase/agent-skills
```

## Próximos pasos

1. Instala las dependencias con `npm install`
2. Crea tus tablas en el dashboard de Supabase
3. Actualiza tu código para usar los clientes de Supabase
4. Prueba la conexión en desarrollo con `npm run dev`

## Recursos

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Guía de Next.js con Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Referencia de la API de Supabase](https://supabase.com/docs/reference/javascript/introduction)

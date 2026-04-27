// EJEMPLO: Cómo integrar Supabase con el contexto de autenticación
// Este archivo muestra cómo actualizar _app.js para usar Supabase

import { useEffect, useState } from 'react'
import { createClient as createSupabaseClient } from '@/utils/supabase/client'

export default function useSupabaseAuth() {
  const [supabase] = useState(() => createSupabaseClient())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión activa
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription?.unsubscribe()
  }, [supabase])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const register = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    supabase,
    user,
    loading,
    login,
    register,
    logout,
  }
}

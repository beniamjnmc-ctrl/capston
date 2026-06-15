// ========================================
// EJEMPLO: Cargar procedimientos desde Supabase
// ========================================
// Agrega esto a tu inventory.js para cargar procedimientos desde Supabase

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

// Dentro del componente Inventory:
export default function Inventory() {
  const [supabase] = useState(() => createClient())
  const [procedures, setProcedures] = useState([])
  const [loading, setLoading] = useState(true)

  // Cargar procedimientos desde Supabase
  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        // Obtener todos los procedimientos
        const { data, error } = await supabase
          .from('procedures')
          .select('*')
          .order('year', { ascending: false })
          .order('month_key', { ascending: false })

        if (error) throw error

        setProcedures(data || [])
      } catch (error) {
        console.error('Error loading procedures:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProcedures()
  }, [supabase])

  // Función para agregar nuevo procedimiento
  const addProcedure = async (newProcedure) => {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .insert([newProcedure])
        .select()

      if (error) throw error

      setProcedures([...procedures, data[0]])
      return true
    } catch (error) {
      console.error('Error adding procedure:', error)
      return false
    }
  }

  // Función para actualizar procedimiento
  const updateProcedure = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error

      setProcedures(procedures.map(p => p.id === id ? data[0] : p))
      return true
    } catch (error) {
      console.error('Error updating procedure:', error)
      return false
    }
  }

  // Función para eliminar procedimiento
  const deleteProcedure = async (id) => {
    try {
      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProcedures(procedures.filter(p => p.id !== id))
      return true
    } catch (error) {
      console.error('Error deleting procedure:', error)
      return false
    }
  }

  // Filtrar procedimientos por mes
  const getProceduresByMonth = (month, year) => {
    return procedures.filter(p => p.month_key === month && p.year === year)
  }

  // Obtener resumen de procedimientos
  const getProcedureSummary = () => {
    const summary = {}
    procedures.forEach(proc => {
      const key = `${proc.year}-${proc.month_key}`
      if (!summary[key]) {
        summary[key] = {
          month: proc.month,
          year: proc.year,
          total: 0,
          procedures: []
        }
      }
      summary[key].total += proc.quantity
      summary[key].procedures.push(proc)
    })
    return summary
  }

  return (
    // Tu JSX aquí, usando 'procedures', 'addProcedure', 'updateProcedure', etc.
    <div>
      {loading ? <p>Cargando procedimientos...</p> : <p>Procedimientos: {procedures.length}</p>}
    </div>
  )
}

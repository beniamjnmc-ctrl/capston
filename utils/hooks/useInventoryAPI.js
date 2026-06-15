import { useCallback } from 'react'
import { createClient } from '../supabase/client'

export function useInventoryAPI() {
  const supabase = createClient()

  /**
   * Obtiene el token de la sesión actual
   */
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No active session')
    }
    return session.access_token
  }, [supabase])

  /**
   * Obtiene una lista de items de inventario para una clínica
   */
  const getInventoryItems = useCallback(async (clinicId) => {
    const token = await getAuthToken()
    const response = await fetch(`/api/inventory/items?clinicId=${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch inventory items')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Crea un nuevo item de inventario
   */
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
        productCode: item.productCode,
        productName: item.productName,
        category: item.category,
        quantityBodega: item.quantityBodega,
        minimumStock: item.minimumStock
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create inventory item')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Actualiza un item de inventario existente
   */
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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update inventory item')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Elimina un item de inventario
   */
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

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete inventory item')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Registra un nuevo procedimiento
   */
  const logProcedure = useCallback(async (code, description, quantity, date) => {
    const token = await getAuthToken()
    const response = await fetch('/api/procedures', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code,
        description,
        quantity: parseInt(quantity) || 1,
        date: date || new Date().toISOString()
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to log procedure')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Obtiene procedimientos con filtros opcionales
   */
  const getProcedures = useCallback(async (filters = {}) => {
    const token = await getAuthToken()
    const params = new URLSearchParams()

    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.code) params.append('code', filters.code)
    if (filters.limit) params.append('limit', filters.limit)

    const response = await fetch(`/api/procedures?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch procedures')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Obtiene la lista de todos los usuarios (solo admin)
   */
  const getUsers = useCallback(async () => {
    const token = await getAuthToken()
    const response = await fetch('/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch users')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Crea un nuevo usuario (solo admin)
   */
  const createUser = useCallback(async (email, password, name, phone, role) => {
    const token = await getAuthToken()
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, password, name, phone, role })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create user')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Actualiza un usuario existente (solo admin)
   */
  const updateUser = useCallback(async (userId, updates) => {
    const token = await getAuthToken()
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId, ...updates })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update user')
    }

    return response.json()
  }, [getAuthToken])

  /**
   * Elimina un usuario (solo admin)
   */
  const deleteUser = useCallback(async (userId) => {
    const token = await getAuthToken()
    const response = await fetch('/api/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete user')
    }

    return response.json()
  }, [getAuthToken])

  return {
    // Inventory
    getInventoryItems,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    // Procedures
    logProcedure,
    getProcedures,
    // Users
    getUsers,
    createUser,
    updateUser,
    deleteUser
  }
}

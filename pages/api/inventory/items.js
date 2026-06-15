import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { method } = req

  // Verificar autenticación usando el token del header
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' })
  }

  try {
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Obtener el perfil del usuario para verificar el rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    switch (method) {
      case 'GET':
        return await getInventoryItems(req, res, user, profile)
      case 'POST':
        return await createInventoryItem(req, res, user, profile)
      case 'PUT':
        return await updateInventoryItem(req, res, user, profile)
      case 'DELETE':
        return await deleteInventoryItem(req, res, user, profile)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function getInventoryItems(req, res, user, profile) {
  const { clinicId } = req.query

  if (!clinicId) {
    return res.status(400).json({ error: 'clinicId is required' })
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('product_name', { ascending: true })

  if (error) throw error

  return res.status(200).json({
    success: true,
    data: data || []
  })
}

async function createInventoryItem(req, res, user, profile) {
  // Solo admin y clinico pueden crear
  if (!['admin', 'clinico'].includes(profile?.role)) {
    return res.status(403).json({ error: 'Unauthorized: only admin or clinico can create' })
  }

  const { clinicId, productCode, productName, category, quantityBodega, minimumStock } = req.body

  if (!clinicId || !productCode || !productName) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .insert([{
      clinic_id: clinicId,
      product_code: productCode,
      product_name: productName,
      category: category || 'General',
      quantity_bodega: quantityBodega || 0,
      minimum_stock: minimumStock || 2,
      created_by: user.id
    }])
    .select()

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Product code already exists for this clinic' })
    }
    throw error
  }

  return res.status(201).json({
    success: true,
    data: data[0]
  })
}

async function updateInventoryItem(req, res, user, profile) {
  // Solo admin y clinico pueden actualizar
  if (!['admin', 'clinico'].includes(profile?.role)) {
    return res.status(403).json({ error: 'Unauthorized: only admin or clinico can update' })
  }

  const { id, ...updates } = req.body

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()

  if (error) throw error

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Item not found' })
  }

  return res.status(200).json({
    success: true,
    data: data[0]
  })
}

async function deleteInventoryItem(req, res, user, profile) {
  // Solo admin puede eliminar
  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: only admin can delete' })
  }

  const { id } = req.body

  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) throw error

  return res.status(200).json({ success: true })
}

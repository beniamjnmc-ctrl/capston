import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ACTIVE_ROLES = ['admin', 'clinico', 'asistente']

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No authorization token' })

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single()

    switch (req.method) {
      case 'GET':    return await getProducts(req, res)
      case 'POST':   return await addProduct(req, res, user, profile)
      case 'PUT':    return await editProduct(req, res, user, profile)
      case 'DELETE': return await deleteProduct(req, res, user, profile)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (err) {
    console.error('Items API error:', err)
    return res.status(500).json({ error: err.message })
  }
}

async function insertAuditLog({ userId, userName, action, clinicKey, itemName, details }) {
  await supabase.from('audit_log').insert([{
    user_id:    userId,
    user_name:  userName,
    action,
    table_name: 'clinic_inventories',
    record_id:  clinicKey,
    clinic_key: clinicKey,
    item_name:  itemName,
    details,
  }])
}

async function readClinicData(clinicKey) {
  const { data, error } = await supabase
    .from('clinic_inventories')
    .select('data')
    .eq('clinic_key', clinicKey)
    .single()
  if (error) throw error
  return data?.data || {}
}

async function writeClinicData(clinicKey, newData) {
  const { error } = await supabase
    .from('clinic_inventories')
    .update({ data: newData })
    .eq('clinic_key', clinicKey)
  if (error) throw error
}

async function getProducts(req, res) {
  const { clinicKey } = req.query
  if (!clinicKey) return res.status(400).json({ error: 'clinicKey is required' })
  const clinicData = await readClinicData(clinicKey)
  return res.status(200).json({ success: true, products: clinicData.products || [] })
}

async function addProduct(req, res, user, profile) {
  if (!ACTIVE_ROLES.includes(profile?.role)) {
    return res.status(403).json({ error: 'Sin permiso para agregar insumos' })
  }
  const { clinicKey, product } = req.body
  if (!clinicKey || !product?.nombre) {
    return res.status(400).json({ error: 'clinicKey y product.nombre son requeridos' })
  }
  const clinicData = await readClinicData(clinicKey)
  const newProduct = { id: Date.now(), ...product }
  clinicData.products = [...(clinicData.products || []), newProduct]
  await writeClinicData(clinicKey, clinicData)
  await insertAuditLog({
    userId:    user.id,
    userName:  profile?.name || user.email,
    action:    'agregar_insumo',
    clinicKey,
    itemName:  newProduct.nombre,
    details:   { producto_agregado: newProduct },
  })
  return res.status(201).json({ success: true, product: newProduct })
}

async function editProduct(req, res, user, profile) {
  if (!ACTIVE_ROLES.includes(profile?.role)) {
    return res.status(403).json({ error: 'Sin permiso para editar insumos' })
  }
  const { clinicKey, productId, changes } = req.body
  if (!clinicKey || !productId || !changes) {
    return res.status(400).json({ error: 'clinicKey, productId y changes son requeridos' })
  }
  const clinicData = await readClinicData(clinicKey)
  const idx = (clinicData.products || []).findIndex(p => p.id == productId)
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' })

  const oldProduct = { ...clinicData.products[idx] }
  const updated = { ...oldProduct, ...changes }
  clinicData.products[idx] = updated
  await writeClinicData(clinicKey, clinicData)
  await insertAuditLog({
    userId:    user.id,
    userName:  profile?.name || user.email,
    action:    'editar_insumo',
    clinicKey,
    itemName:  updated.nombre,
    details:   { anterior: oldProduct, nuevo: updated },
  })
  return res.status(200).json({ success: true, product: updated })
}

async function deleteProduct(req, res, user, profile) {
  if (!ACTIVE_ROLES.includes(profile?.role)) {
    return res.status(403).json({ error: 'Sin permiso para eliminar insumos' })
  }
  const { clinicKey, productId } = req.body
  if (!clinicKey || !productId) {
    return res.status(400).json({ error: 'clinicKey y productId son requeridos' })
  }
  const clinicData = await readClinicData(clinicKey)
  const product = (clinicData.products || []).find(p => p.id == productId)
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' })

  clinicData.products = clinicData.products.filter(p => p.id != productId)
  await writeClinicData(clinicKey, clinicData)
  await insertAuditLog({
    userId:    user.id,
    userName:  profile?.name || user.email,
    action:    'eliminar_insumo',
    clinicKey,
    itemName:  product.nombre,
    details:   { producto_eliminado: product },
  })
  return res.status(200).json({ success: true })
}

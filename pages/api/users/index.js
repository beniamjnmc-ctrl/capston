import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' })
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Obtener el perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Solo admin puede gestionar usuarios
    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: only admin can manage users' })
    }

    switch (req.method) {
      case 'GET':
        return await getUsers(res)
      case 'POST':
        return await createUser(req, res, user)
      case 'PUT':
        return await updateUser(req, res, user)
      case 'DELETE':
        return await deleteUser(req, res, user)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function getUsers(res) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, phone, role, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  return res.status(200).json({
    success: true,
    count: data?.length || 0,
    users: data || []
  })
}

async function createUser(req, res, user) {
  const { email, password, name, phone, role } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' })
  }

  // Crear usuario en Auth
  const { data: { user: newUser }, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      phone: phone || ''
    }
  })

  if (signUpError) throw signUpError

  // El perfil se crea automáticamente por el trigger, pero podemos asegurarnos
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ name, phone: phone || '', role: role || 'clinico' })
    .eq('id', newUser.id)
    .select()

  if (profileError) throw profileError

  return res.status(201).json({
    success: true,
    user: profile[0]
  })
}

async function updateUser(req, res, user) {
  const { userId, name, phone, role } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(name && { name }),
      ...(phone && { phone }),
      ...(role && { role })
    })
    .eq('id', userId)
    .select()

  if (error) throw error

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.status(200).json({
    success: true,
    user: data[0]
  })
}

async function deleteUser(req, res, user) {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  // Eliminar usuario de Auth (también elimina el perfil por CASCADE)
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) throw error

  return res.status(200).json({ success: true })
}

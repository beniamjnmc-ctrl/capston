import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No authorization token' })

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'pendiente') {
      return res.status(403).json({ error: 'Sin permiso para ver el historial de inventario' })
    }

    const { clinicKey, action, desde, hasta, page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))
    const offset = (pageNum - 1) * limitNum

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    if (clinicKey) query = query.eq('clinic_key', clinicKey)
    if (action)    query = query.eq('action', action)
    if (desde)     query = query.gte('created_at', desde)
    if (hasta)     query = query.lte('created_at', hasta)

    const { data, error, count } = await query
    if (error) throw error

    return res.status(200).json({
      success: true,
      records: data || [],
      total:   count || 0,
      page:    pageNum,
      pages:   Math.ceil((count || 0) / limitNum),
    })
  } catch (err) {
    console.error('Audit log API error:', err)
    return res.status(500).json({ error: err.message })
  }
}

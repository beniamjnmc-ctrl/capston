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

    if (req.method === 'POST') {
      return await createProcedure(req, res, user, profile)
    } else {
      return await getProcedures(req, res, user, profile)
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function createProcedure(req, res, user, profile) {
  const { code, description, quantity, date, month, monthKey, year } = req.body

  // Validar campos requeridos
  if (!code || !description) {
    return res.status(400).json({ error: 'code and description are required' })
  }

  const parsedQuantity = parseInt(quantity) || 1
  const procedureDate = date || new Date().toISOString()
  const currentDate = new Date(procedureDate)

  const { data, error } = await supabase
    .from('procedures')
    .insert([{
      code,
      description,
      quantity: parsedQuantity,
      date: procedureDate,
      year: year || currentDate.getFullYear(),
      month: month || getMonthName(currentDate.getMonth()),
      month_key: monthKey || String(currentDate.getMonth() + 1).padStart(2, '0')
    }])
    .select()

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Procedure already exists for this month and code' })
    }
    throw error
  }

  return res.status(201).json({
    success: true,
    procedure: data[0]
  })
}

async function getProcedures(req, res, user, profile) {
  const { startDate, endDate, code, limit = '100' } = req.query

  let query = supabase.from('procedures').select('*')

  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)
  if (code) query = query.eq('code', code)

  const { data, error } = await query
    .order('date', { ascending: false })
    .limit(parseInt(limit))

  if (error) throw error

  return res.status(200).json({
    success: true,
    count: data?.length || 0,
    data: data || []
  })
}

function getMonthName(monthIndex) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return months[monthIndex]
}

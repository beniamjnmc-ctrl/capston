import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No authorization token' })
  }

  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const entries = Array.isArray(req.body.entries) ? req.body.entries : []
    if (entries.length === 0) {
      return res.status(400).json({ error: 'No entries provided' })
    }

    // Preparar datos para insertar en Supabase
    const procedures = entries.map(entry => {
      const date = new Date(entry.date || new Date().toISOString())
      return {
        year: entry.year || date.getFullYear(),
        month: entry.month || monthNames[date.getMonth()],
        month_key: entry.monthKey || String(date.getMonth() + 1).padStart(2, '0'),
        code: String(entry.code || '9999'),
        description: String(entry.description || 'Procedimiento'),
        quantity: Number(entry.quantity) || 1,
        date: entry.date || date.toISOString()
      }
    })

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('procedures')
      .insert(procedures)
      .select()

    if (error) {
      // Si hay conflicto de unicidad, ignorar y devolver los que se insertaron
      if (error.code === '23505') {
        return res.status(200).json({
          success: true,
          appended: procedures.length,
          message: 'Some entries may have been duplicates and were skipped'
        })
      }
      throw error
    }

    return res.status(200).json({
      success: true,
      appended: data?.length || procedures.length
    })
  } catch (error) {
    console.error('Error appending procedures to Supabase:', error)
    return res.status(500).json({ error: error.message || 'Unable to append procedures' })
  }
}

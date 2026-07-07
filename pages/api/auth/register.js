import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const allowedDomains = ['auil.cl', 'gmail.com', 'alumnos.uai.cl']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { nombre, email, password } = req.body

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos' })
  }

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain || !allowedDomains.includes(domain)) {
    return res.status(400).json({
      error: `Dominio no permitido. Solo se aceptan: ${allowedDomains.map(d => '@' + d).join(', ')}`,
    })
  }

  try {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { name: nombre },
    })

    if (error) {
      console.error('Supabase invite error:', JSON.stringify(error, null, 2))
      if (
        error.message?.toLowerCase().includes('already registered') ||
        error.message?.toLowerCase().includes('already been invited') ||
        error.status === 422
      ) {
        return res.status(409).json({ error: 'Este correo ya está registrado' })
      }
      throw error
    }

    return res.status(201).json({
      message: 'Revisa tu correo para completar el registro. Te enviamos un enlace de confirmación.',
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Error al crear la cuenta. Intenta de nuevo.' })
  }
}
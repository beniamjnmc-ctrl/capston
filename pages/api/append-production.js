import fs from 'fs'
import path from 'path'

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const entries = Array.isArray(req.body.entries) ? req.body.entries : []
  if (entries.length === 0) {
    return res.status(400).json({ error: 'No entries provided' })
  }

  const csvPath = path.join(process.cwd(), 'Consolidado de Producción Clínica Auil 2024-2025 1.csv')
  try {
    const lines = entries.map(entry => {
      const date = new Date(entry.date || new Date().toISOString())
      const year = date.getFullYear()
      const month = monthNames[date.getMonth()] || 'Enero'
      const code = String(entry.code || '9999').replace(/;/g, ',')
      const description = String(entry.description || 'Procedimiento').replace(/;/g, ',')
      const quantity = Number(entry.quantity) || 1
      return `${year};${month};${code};${description};${quantity}`
    }).join('\n') + '\n'

    await fs.promises.appendFile(csvPath, lines, 'utf8')
    return res.status(200).json({ success: true, appended: entries.length })
  } catch (error) {
    console.error('Error appending production CSV:', error)
    return res.status(500).json({ error: 'Unable to append to CSV file' })
  }
}

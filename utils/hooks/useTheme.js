import { useState, useEffect } from 'react'

const STORAGE_KEY = 'odontool-theme'

export function useTheme() {
  // null hasta que corre en cliente — evita mismatch de hidratación SSR
  const [theme, setTheme] = useState(null)

  useEffect(() => {
    let initial
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'light') {
        initial = saved
        // _document.js ya lo aplicó; reconfirmamos por si acaso
        document.documentElement.setAttribute('data-theme', saved)
      } else {
        initial = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        // Sin override manual → el @media query controla; eliminamos el atributo
        document.documentElement.removeAttribute('data-theme')
      }
    } catch {
      initial = 'light'
    }
    setTheme(initial)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { sessionStorage.setItem(STORAGE_KEY, next) } catch {}
    // Notifica al useEffect de colores Recharts en Dashboard
    window.dispatchEvent(new Event('odontool-theme-change'))
  }

  return { theme, toggleTheme }
}

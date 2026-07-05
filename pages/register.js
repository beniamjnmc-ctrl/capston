import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import styles from '../styles/Login.module.css'
import ThemeToggle from '../components/ThemeToggle'

const ALLOWED_DOMAINS = ['auil.cl', 'gmail.com', 'alumnos.uai.cl']

export default function Register() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [done, setDone] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!form.email) {
      e.email = 'El correo es requerido'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Correo inválido'
    } else {
      const domain = form.email.split('@')[1]?.toLowerCase()
      if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
        e.email = `Dominio no permitido. Solo: ${ALLOWED_DOMAINS.map(d => '@' + d).join(', ')}`
      }
    }
    if (!form.password) {
      e.password = 'La contraseña es requerida'
    } else if (form.password.length < 8) {
      e.password = 'Mínimo 8 caracteres'
    }
    if (form.password !== form.confirm) e.confirm = 'Las contraseñas no coinciden'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    setApiError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, email: form.email, password: form.password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setApiError(json.error || 'Error al crear la cuenta')
        setLoading(false)
        return
      }

      setSuccess(json.message || 'Revisa tu correo para completar el registro.')
      setDone(true)
      setLoading(false)
    } catch {
      setApiError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  return (
    <>
      <Head>
        <title>OdonTool — Crear cuenta</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 10 }}>
          <ThemeToggle />
        </div>

        <div className={styles.card}>
          <img src="/logo-odontool.svg" alt="OdonTool" className={styles.cardLogo} style={{ width: 56, height: 56 }} />
          <h2 className={styles.cardTitle}>Crear cuenta en OdonTool</h2>
          <p className={styles.cardSub}>Solo correos @auil.cl, @gmail.com o @alumnos.uai.cl</p>

          {success && (
            <div className={styles.successMsg}>
              <span>✓</span> {success}
            </div>
          )}

          {!done && (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label className={styles.label}>Nombre completo</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`}
                  placeholder="Juan Pérez"
                  value={form.nombre}
                  onChange={set('nombre')}
                  disabled={loading}
                />
                {errors.nombre && <span className={styles.error}>{errors.nombre}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Correo institucional</label>
                <input
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="usuario@auil.cl"
                  value={form.email}
                  onChange={set('email')}
                  disabled={loading}
                />
                {errors.email && <span className={styles.error}>{errors.email}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Contraseña</label>
                <div className={styles.inputWrap}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    placeholder="Mín. 8 caracteres"
                    value={form.password}
                    onChange={set('password')}
                    disabled={loading}
                  />
                  <button type="button" className={styles.togglePass} onClick={() => setShowPass(v => !v)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span className={styles.error}>{errors.password}</span>}
                {form.password && (
                  <div className={styles.passStrength}>
                    <div className={styles.passStrengthBar}>
                      <div
                        className={styles.passStrengthFill}
                        style={{
                          width: form.password.length < 6 ? '25%' : form.password.length < 10 ? '60%' : '100%',
                          background: form.password.length < 6 ? 'var(--danger)' : form.password.length < 10 ? 'var(--warning)' : 'var(--success)',
                        }}
                      />
                    </div>
                    <span className={styles.passStrengthLabel}>
                      {form.password.length < 6 ? 'Débil' : form.password.length < 10 ? 'Media' : 'Fuerte'}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Confirmar contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`${styles.input} ${errors.confirm ? styles.inputError : ''}`}
                  placeholder="Repite tu contraseña"
                  value={form.confirm}
                  onChange={set('confirm')}
                  disabled={loading}
                />
                {errors.confirm && <span className={styles.error}>{errors.confirm}</span>}
              </div>

              {apiError && (
                <p className={styles.error} style={{ textAlign: 'center', marginBottom: '8px' }}>
                  {apiError}
                </p>
              )}

              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : 'Crear cuenta'}
              </button>

              <p className={styles.switchText}>
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className={styles.switchBtn}>
                  Inicia sesión
                </Link>
              </p>
            </form>
          )}

          {done && (
            <p className={styles.switchText} style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link href="/login" className={styles.switchBtn}>
                Volver al inicio de sesión
              </Link>
            </p>
          )}
        </div>

        <Link href="/" className={styles.backLink}>← Volver al inicio</Link>
      </div>
    </>
  )
}
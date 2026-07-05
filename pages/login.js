import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '../utils/supabase/client'
import styles from '../styles/Login.module.css'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [tab, setTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          router.push('/inventory')
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    if (typeof window !== 'undefined') {
      checkSession()
    }
  }, [supabase, router])

  const validateLogin = () => {
    const e = {}
    if (!loginForm.email) e.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(loginForm.email)) e.email = 'Correo inválido'
    if (!loginForm.password) e.password = 'La contraseña es requerida'
    return e
  }

  const validateRegister = () => {
    const e = {}
    if (!registerForm.name) e.name = 'El nombre es requerido'
    if (!registerForm.email) e.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(registerForm.email)) e.email = 'Correo inválido'
    if (!registerForm.phone) e.phone = 'El teléfono es requerido'
    if (!registerForm.password) e.password = 'La contraseña es requerida'
    else if (registerForm.password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (registerForm.password !== registerForm.confirm) e.confirm = 'Las contraseñas no coinciden'
    return e
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = validateLogin()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      })

      if (error) {
        setLoading(false)
        setErrors({ email: error.message || 'Credenciales incorrectas.' })
        console.error('Login error:', error)
        return
      }

      setSuccess('¡Bienvenido! Accediendo al sistema...')
      setLoading(false)

    } catch (error) {
      setLoading(false)
      setErrors({ email: 'Error en el servidor. Intenta de nuevo.' })
      console.error('Login error:', error)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validateRegister()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          data: {
            name: registerForm.name,
            phone: registerForm.phone,
          },
        },
      })

      if (error) {
        setLoading(false)
        setErrors({ email: error.message || 'Error al registrar la cuenta.' })
        return
      }

      setLoading(false)
      setSuccess('¡Cuenta creada con éxito! Por favor, verifica tu correo para confirmar tu cuenta.')
      setRegisterForm({ name: '', email: '', phone: '', password: '', confirm: '' })

      setTimeout(() => {
        setTab('login')
        setSuccess('')
      }, 3000)

    } catch (error) {
      setLoading(false)
      setErrors({ email: 'Error en el servidor. Intenta de nuevo.' })
      console.error('Register error:', error)
    }
  }

  const switchTab = (t) => {
    setTab(t)
    setErrors({})
    setSuccess('')
  }

  return (
    <>
      <Head>
        <title>OdonTool — {tab === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 10 }}>
          <ThemeToggle />
        </div>

        <div className={styles.card}>
          <img src="/logo-odontool.svg" alt="OdonTool" className={styles.cardLogo} />
          <h2 className={styles.cardTitle}>Ingresa a OdonTool</h2>
          <p className={styles.cardSub}>Clínica Auil</p>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
              onClick={() => switchTab('login')}
            >
              Iniciar Sesión
            </button>
            <button
              className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
              onClick={() => switchTab('register')}
            >
              Registrarse
            </button>
          </div>

          {success && (
            <div className={styles.successMsg}>
              <span>✓</span> {success}
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className={styles.form} noValidate>
              <div className={styles.field}>
                <label className={styles.label}>Correo institucional</label>
                <input
                  type="email"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="nombre@auil.cl"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                />
                {errors.email && <span className={styles.error}>{errors.email}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Contraseña</label>
                <div className={styles.inputWrap}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                  <button type="button" className={styles.togglePass} onClick={() => setShowPass(!showPass)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <span className={styles.error}>{errors.password}</span>}
              </div>

              <div className={styles.forgotRow}>
                <a href="#" className={styles.forgotLink}>¿Olvidaste tu contraseña? Recupérala aquí</a>
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? <span className={styles.spinner}></span> : 'Iniciar sesión'}
              </button>

              <p className={styles.switchText}>
                ¿No tienes cuenta?{' '}
                <Link href="/register" className={styles.switchBtn}>
                  Regístrate aquí
                </Link>
              </p>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className={styles.form} noValidate>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Crear cuenta</h1>
                <p className={styles.formSub}>Registro exclusivo para personal de Clínica Auil</p>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nombre completo</label>
                <input
                  type="text"
                  className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                  placeholder="Juan Pérez"
                  value={registerForm.name}
                  onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                />
                {errors.name && <span className={styles.error}>{errors.name}</span>}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Correo corporativo</label>
                  <input
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    placeholder="usuario@auil.cl"
                    value={registerForm.email}
                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                  {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Teléfono</label>
                  <input
                    type="tel"
                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                    placeholder="+56 9 1234 5678"
                    value={registerForm.phone}
                    onChange={e => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                  {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Contraseña</label>
                  <div className={styles.inputWrap}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                      placeholder="Mín. 8 caracteres"
                      value={registerForm.password}
                      onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                    <button type="button" className={styles.togglePass} onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <span className={styles.error}>{errors.password}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Confirmar contraseña</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`${styles.input} ${errors.confirm ? styles.inputError : ''}`}
                    placeholder="Repite tu contraseña"
                    value={registerForm.confirm}
                    onChange={e => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                  />
                  {errors.confirm && <span className={styles.error}>{errors.confirm}</span>}
                </div>
              </div>

              {registerForm.password && (
                <div className={styles.passStrength}>
                  <div className={styles.passStrengthBar}>
                    <div
                      className={styles.passStrengthFill}
                      style={{
                        width: registerForm.password.length < 6 ? '25%' : registerForm.password.length < 10 ? '60%' : '100%',
                        background: registerForm.password.length < 6 ? 'var(--danger)' : registerForm.password.length < 10 ? 'var(--warning)' : 'var(--success)'
                      }}
                    ></div>
                  </div>
                  <span className={styles.passStrengthLabel}>
                    {registerForm.password.length < 6 ? 'Débil' : registerForm.password.length < 10 ? 'Media' : 'Fuerte'}
                  </span>
                </div>
              )}

              <div className={styles.termsRow}>
                <input type="checkbox" id="terms" className={styles.checkbox} />
                <label htmlFor="terms" className={styles.termsLabel}>
                  Acepto los <a href="#" className={styles.termsLink}>términos y condiciones</a>
                </label>
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? <span className={styles.spinner}></span> : 'Crear mi cuenta'}
              </button>

              <p className={styles.switchText}>
                ¿Ya tienes cuenta?{' '}
                <button type="button" className={styles.switchBtn} onClick={() => switchTab('login')}>
                  Inicia sesión aquí
                </button>
              </p>
            </form>
          )}
        </div>

        <Link href="/" className={styles.backLink}>← Volver al inicio</Link>
      </div>
    </>
  )
}

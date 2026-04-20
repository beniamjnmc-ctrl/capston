import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/Login.module.css'

export default function Login() {
  const router = useRouter()
  const [tab, setTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (router.query.tab === 'register') setTab('register')
  }, [router.query])

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
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSuccess('¡Bienvenido de vuelta! Redirigiendo...')
    setTimeout(() => router.push('/'), 2000)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const errs = validateRegister()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSuccess('¡Cuenta creada con éxito! Ya puedes iniciar sesión.')
    setTimeout(() => {
      setTab('login')
      setSuccess('')
      setRegisterForm({ name: '', email: '', phone: '', password: '', confirm: '' })
    }, 2500)
  }

  const switchTab = (t) => {
    setTab(t)
    setErrors({})
    setSuccess('')
  }

  return (
    <>
      <Head>
        <title>DentalArte — {tab === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        {/* LEFT PANEL */}
        <div className={styles.leftPanel}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>✦</span>
            <span>DentalArte</span>
          </Link>
          <div className={styles.leftContent}>
            <div className={styles.leftQuote}>
              <span className={styles.leftQuoteMark}>"</span>
              <p>Tu sonrisa es nuestra mayor recompensa. En DentalArte cuidamos cada detalle de tu salud bucal.</p>
              <div className={styles.leftQuoteAuthor}>
                <div className={styles.leftAvatar}>DG</div>
                <div>
                  <div className={styles.leftName}>Dra. González</div>
                  <div className={styles.leftRole}>Directora Clínica</div>
                </div>
              </div>
            </div>
            <div className={styles.leftStats}>
              <div className={styles.leftStat}><span>15+</span> Años</div>
              <div className={styles.leftStat}><span>8.4K</span> Pacientes</div>
              <div className={styles.leftStat}><span>★ 4.9</span> Google</div>
            </div>
          </div>
          <div className={styles.leftDecor1}></div>
          <div className={styles.leftDecor2}></div>
        </div>

        {/* RIGHT PANEL */}
        <div className={styles.rightPanel}>
          <Link href="/" className={styles.backLink}>← Volver al inicio</Link>

          <div className={styles.formWrap}>
            {/* TABS */}
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

            {/* SUCCESS MESSAGE */}
            {success && (
              <div className={styles.successMsg}>
                <span>✓</span> {success}
              </div>
            )}

            {/* LOGIN FORM */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className={styles.form} noValidate>
                <div className={styles.formHeader}>
                  <h1 className={styles.formTitle}>Bienvenido de vuelta</h1>
                  <p className={styles.formSub}>Ingresa a tu área de paciente</p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Correo electrónico</label>
                  <input
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    placeholder="tu@correo.com"
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
                  <a href="#" className={styles.forgotLink}>¿Olvidaste tu contraseña?</a>
                </div>

                <button type="submit" className={styles.btnSubmit} disabled={loading}>
                  {loading ? <span className={styles.spinner}></span> : 'Iniciar Sesión'}
                </button>

                <p className={styles.switchText}>
                  ¿No tienes cuenta?{' '}
                  <button type="button" className={styles.switchBtn} onClick={() => switchTab('register')}>
                    Regístrate aquí
                  </button>
                </p>
              </form>
            )}

            {/* REGISTER FORM */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className={styles.form} noValidate>
                <div className={styles.formHeader}>
                  <h1 className={styles.formTitle}>Crear cuenta</h1>
                  <p className={styles.formSub}>Únete a nuestra comunidad de pacientes</p>
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
                    <label className={styles.label}>Correo electrónico</label>
                    <input
                      type="email"
                      className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                      placeholder="tu@correo.com"
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
                          background: registerForm.password.length < 6 ? '#ef4444' : registerForm.password.length < 10 ? '#f59e0b' : '#10b981'
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
                    Acepto los <a href="#" className={styles.termsLink}>términos y condiciones</a> y la{' '}
                    <a href="#" className={styles.termsLink}>política de privacidad</a>
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
        </div>
      </div>
    </>
  )
}

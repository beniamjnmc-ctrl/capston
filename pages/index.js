import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Landing.module.css'
import ThemeToggle from '../components/ThemeToggle'

// Métricas del mockup — fácil de editar sin tocar el JSX
const DEMO_METRICS = [
  { label: 'Insumos críticos',     value: 13,   valClass: styles.valDanger  },
  { label: 'Próximos a vencer',    value: 1,    valClass: styles.valWarning },
  { label: 'Atenciones totales',   value: 4216, valClass: styles.valSuccess },
]

const FEATURES = [
  {
    title: 'Trazabilidad total',
    desc:  'Cada insumo tiene historial completo desde la compra hasta el box: quién lo usó, cuándo y en qué procedimiento.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    title: 'Kits de procedimiento',
    desc:  'Define los insumos de cada procedimiento una sola vez. Al registrar la atención, el stock de todos los insumos se descuenta automáticamente.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    title: 'Alertas de stock',
    desc:  'Aviso automático antes de llegar al mínimo configurado por box. Nunca más una atención interrumpida por falta de material.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
]

// Puntos del gráfico de área decorativo (viewBox 800×100, Y invertido)
const CHART_POINTS = '0,88 72,76 144,82 216,64 288,54 360,48 432,36 504,42 576,28 648,32 720,18 800,12'

export default function Landing() {
  return (
    <>
      <Head>
        <title>OdonTool — Inventario clínico sin sorpresas de stock</title>
        <meta name="description" content="OdonTool centraliza la bodega y los boxes de tu clínica dental, descuenta insumos por procedimiento y alerta antes de cualquier quiebre de stock." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <span>🦷</span> OdonTool
          </Link>

          <div className={styles.navLinks}>
            <a href="#mockup">Producto</a>
            <a href="#features">Cómo funciona</a>
            <a href="#features">Clientes</a>
          </div>

          <Link href="/login" className={styles.btnPrimary}>
            Iniciar sesión
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Usado en producción por Clínica Auil
          </div>

          <h1 className={styles.heroTitle}>
            Inventario clínico<br />sin sorpresas de stock
          </h1>

          <p className={styles.heroSub}>
            Centraliza bodega y boxes, descuenta insumos automáticamente
            con Kits de Procedimiento y recibe alertas antes de cualquier
            quiebre de stock.
          </p>

          <div className={styles.heroCtas}>
            <a href="mailto:contacto@odontool.cl" className={styles.btnPrimary}>
              Solicitar demo
            </a>
            <a href="#features" className={styles.btnOutline}>
              Ver cómo funciona
            </a>
          </div>
        </div>
      </section>

      {/* ── MOCKUP DEL PRODUCTO ───────────────────────────────── */}
      <section id="mockup" className={styles.mockupSection}>
        <div className={styles.mockupWrap}>
          <p className={styles.sectionEyebrow}>Vista previa del dashboard</p>
          <h2 className={styles.sectionTitle}>Todo el inventario, en una sola pantalla</h2>

          <div className={styles.browser}>
            {/* Barra decorativa de ventana de navegador */}
            <div className={styles.browserBar}>
              <span className={styles.dot} style={{ background: '#ff5f57' }} />
              <span className={styles.dot} style={{ background: '#febc2e' }} />
              <span className={styles.dot} style={{ background: '#28c840' }} />
              <div className={styles.browserUrl}>odontool.cl/inventory</div>
            </div>

            <div className={styles.browserContent}>
              {/* KPIs */}
              <div className={styles.kpiRow}>
                {DEMO_METRICS.map((m) => (
                  <div key={m.label} className={styles.kpiCard}>
                    <div className={styles.kpiCardLabel}>{m.label}</div>
                    <div className={`${styles.kpiCardVal} ${m.valClass}`}>
                      {m.value.toLocaleString('es-CL')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráfico de área (SVG estático decorativo) */}
              <div className={styles.chartHeader}>Flujo de Atenciones — 2024</div>
              <svg
                className={styles.chartSvg}
                viewBox="0 0 800 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="landingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   style={{ stopColor: 'var(--brand)', stopOpacity: 0.25 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--brand)', stopOpacity: 0 }}    />
                  </linearGradient>
                </defs>
                {/* Área rellena */}
                <polygon
                  points={`0,100 ${CHART_POINTS} 800,100`}
                  fill="url(#landingAreaGrad)"
                />
                {/* Línea */}
                <polyline
                  points={CHART_POINTS}
                  fill="none"
                  style={{ stroke: 'var(--brand)' }}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" className={styles.featuresSection}>
        <p className={styles.sectionEyebrow}>Por qué OdonTool</p>
        <h2 className={styles.sectionTitle}>Diseñado para el flujo real de una clínica</h2>

        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIconWrap}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>🦷</span>
          <span>OdonTool © {new Date().getFullYear()} — Todos los derechos reservados</span>
        </div>
      </footer>
    </>
  )
}

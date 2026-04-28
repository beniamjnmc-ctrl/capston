import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useApp } from './_app'
import styles from '../styles/Home.module.css'

export default function Home() {
  const router = useRouter()
  const { user } = useApp()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <Head>
        <title>OdonTool — Gestión de Inventario Dental</title>
        <meta name="description" content="Sistema inteligente de gestión de inventario para clínicas odontológicas. Controla 7 boxes, procedimientos y atenciones." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* NAV */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo} style={{ fontSize: '28px' }}>
            <span className={styles.logoIcon}>🦷</span>
            <span className={styles.logoText} style={{ fontWeight: '800' }}>OdonTool</span>
          </Link>

          <div className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ''}`}>
            <Link href="#funciones" onClick={() => setMenuOpen(false)}>Funciones</Link>
            <Link href="#boxes" onClick={() => setMenuOpen(false)}>7 Boxes</Link>
            <Link href="#procedimientos" onClick={() => setMenuOpen(false)}>Procedimientos</Link>
            <Link href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
          </div>

          <div className={styles.navActions}>
            {user ? (
              <Link href="/inventory" className={styles.btnPrimary}>
                Ir al inventario
              </Link>
            ) : (
              <>
                <Link href="/login" className={styles.btnOutline}>Iniciar Sesión</Link>
                <Link href="/login?tab=register" className={styles.btnPrimary}>Registrarse</Link>
              </>
            )}
          </div>

          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroDecorCircle}></div>
        <div className={styles.heroDecorLine}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>★</span> Control Total — Clínica Auil
          </div>
          <h1 className={styles.heroTitle} style={{ fontSize: '72px', lineHeight: '1', marginBottom: '30px' }}>
            OdonTool:<br />
            <em>inventario</em><br />
            inteligente.
          </h1>
          <p className={styles.heroSub} style={{ fontSize: '20px', maxWidth: '600px' }}>
            Optimiza la gestión de insumos, procedimientos y stock de tus 7 boxes automáticamente con el respaldo del modelo ROP.
          </p>
          <div className={styles.heroCTA}>
            <Link href="/login?tab=register" className={styles.btnHero}>
              Comenzar ahora
              <span>→</span>
            </Link>
            <a href="#funciones" className={styles.btnHeroGhost}>
              Ver funciones
            </a>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>7</span>
              <span className={styles.statLabel}>Boxes independientes</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.stat}>
              <span className={styles.statNum}>20+</span>
              <span className={styles.statLabel}>Insumos controlados</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.stat}>
              <span className={styles.statNum}>Real-time</span>
              <span className={styles.statLabel}>Sincronización</span>
            </div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardTop}>
              <div className={styles.heroCardIcon}>📊</div>
              <div>
                <div className={styles.heroCardTitle}>Dashboard</div>
                <div className={styles.heroCardSub}>Stock · Alertas · Transferencias</div>
              </div>
            </div>
            <div className={styles.heroCardBar}>
              <div className={styles.heroCardBarFill}></div>
            </div>
            <div className={styles.heroCardFoot}>Actualizado en tiempo real</div>
          </div>
          <div className={styles.heroOrbOuter}>
            <div className={styles.heroOrb}></div>
          </div>
          <div className={styles.heroFloatBadge}>
            <span>⚡</span> Local First
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className={styles.services}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Funciones principales</span>
            <h2 className={styles.sectionTitle}>Todo lo que necesitas<br /><em>para gestionar tu inventario</em></h2>
          </div>
          <div className={styles.servicesGrid}>
            {features.map((f, i) => (
              <div key={i} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{f.icon}</div>
                <h3 className={styles.serviceName}>{f.name}</h3>
                <p className={styles.serviceDesc}>{f.desc}</p>
                <div className={styles.serviceArrow}>→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOXES */}
      <section id="boxes" className={styles.about}>
        <div className="container">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutLeft}>
              <div className={styles.aboutImgWrap}>
                <div className={styles.aboutImgPlaceholder}>
                  <span>📦</span>
                </div>
                <div className={styles.aboutImgBadge}>
                  <span className={styles.aboutBadgeNum}>7</span>
                  <span className={styles.aboutBadgeText}>Boxes</span>
                </div>
              </div>
            </div>
            <div className={styles.aboutRight}>
              <span className={styles.sectionLabel}>Arquitectura</span>
              <h2 className={styles.sectionTitle}>7 Boxes independientes<br /><em>+ Bodega central</em></h2>
              <p className={styles.aboutText}>
                Cada box tiene su propio inventario con stock mínimo óptimo. Los insumos se transfieren manualmente desde la bodega general cuando es necesario.
              </p>
              <p className={styles.aboutText}>
                El sistema detecta automáticamente qué boxes necesitan reabastecimiento y alerta sobre vencimientos próximos.
              </p>
              <div className={styles.aboutFeatures}>
                {boxFeatures.map((f, i) => (
                  <div key={i} className={styles.feature}>
                    <div className={styles.featureCheck}>✓</div>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCEDIMIENTOS */}
      <section id="procedimientos" className={styles.services} style={{ backgroundColor: 'var(--bg-secondary)', padding: '80px 0' }}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Procedimientos y Kits</span>
            <h2 className={styles.sectionTitle}>Control automático<br /><em>de descuentos de inventario</em></h2>
          </div>
          <div className={styles.servicesGrid}>
            {procedures.map((p, i) => (
              <div key={i} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{p.icon}</div>
                <h3 className={styles.serviceName}>{p.name}</h3>
                <p className={styles.serviceDesc}>{p.desc}</p>
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--primary)' }}>
                  📦 Descuenta: {p.insumos}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>¿Listo para gestionar<br /><em>tu inventario?</em></h2>
              <p className={styles.ctaSub}>Crea tu cuenta y accede al dashboard completo.</p>
              <Link href="/login?tab=register" className={styles.btnHero}>
                Comenzar ahora <span>→</span>
              </Link>
            </div>
            <div className={styles.ctaDecor}>🦷</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <span className={styles.logoIcon}>🦷</span>
                <span className={styles.logoText}>OdonTool</span>
              </div>
              <p>Sistema inteligente de gestión de inventario para la Clínica Auil. Desarrollado por Grupo 9 | UAI.</p>
            </div>
            <div className={styles.footerCol}>
              <h4>Funciones</h4>
              <ul>
                <li>Dashboard en tiempo real</li>
                <li>Gestión de 7 boxes</li>
                <li>Alertas de vencimiento</li>
                <li>Transferencias controladas</li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>Contacto</h4>
              <ul>
                <li>📍 Santiago, Chile</li>
                <li>📞 +56 2 XXXX XXXX</li>
                <li>✉️ contacto@odontool.cl</li>
                <li>🕐 Disponible 24/7</li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 OdonTool. Todos los derechos reservados.</span>
            {user && <Link href="/inventory">Ir al inventario</Link>}
          </div>
        </div>
      </footer>
    </>
  )
}

const features = [
  { icon: '📊', name: 'Dashboard en vivo', desc: 'Visualiza el estado completo de tu inventario con KPIs, alertas críticas y stock de boxes en tiempo real.' },
  { icon: '📦', name: 'Gestión de 7 Boxes', desc: 'Cada box con su propio stock independiente. Detecta automáticamente cuál necesita reabastecimiento.' },
  { icon: '⇄', name: 'Transferencias manuales', desc: 'Controla cada movimiento desde bodega hacia los boxes. Historial completo de todas las operaciones.' },
  { icon: '⚠️', name: 'Alertas inteligentes', desc: 'Vencimientos próximos, stock bajo y necesidades de reabastecimiento. Todo en un solo lugar.' },
  { icon: '✦', name: 'Kits de Procedimientos', desc: 'Define procedimientos con sus insumos específicos. Descuenta automáticamente al registrar atenciones.' },
  { icon: '📝', name: 'Historial completo', desc: 'Registro de todas las atenciones y movimientos. Trazabilidad total de tu inventario.' },
]

const boxFeatures = [
  'Stock independiente por box',
  'Mínimo óptimo configurabe',
  'Detección automática de necesidades',
  'Transferencias desde bodega',
  'Set base por consulta configurado',
  'Alertas de vencimiento por ubicación',
]

const procedures = [
  { 
    icon: '📋', 
    name: 'Consulta / Revisión', 
    desc: 'Procedimiento base y fundamental. Incluye exclusivamente los insumos del set.',
    insumos: '2 Mascarillas, 2 Guantes, 1 Pechera, 2 Boquillas'
  },
  { 
    icon: '💉', 
    name: 'Anestesia Infiltrativa', 
    desc: 'Infiltrativa o troncular. Añade la protección base a los carpules y agujas.',
    insumos: 'Set Básico + Anestesia + Agujas'
  },
  { 
    icon: '✨', 
    name: 'Obturación con Resina', 
    desc: 'Tratamiento restaurador con resina compuesta y pinceles.',
    insumos: 'Set Básico + Resina + Pinceles'
  },
  { 
    icon: '🌀', 
    name: 'Impresión con Silicona', 
    desc: 'Toma de modelos de la cavidad oral del paciente.',
    insumos: 'Set Básico + Silicona + Oclufast'
  },
  { 
    icon: '💎', 
    name: 'Blanqueamiento Dental', 
    desc: 'Tratamiento estético avanzado con protección gingival completa.',
    insumos: 'Set Básico + Separador, Pincel, Jeringa, Protector'
  },
  { 
    icon: '🔧', 
    name: 'Personalizado', 
    desc: 'Define tus propios procedimientos con los insumos específicos que uses.',
    insumos: 'Insumos a medida'
  },
]
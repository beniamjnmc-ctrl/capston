import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import styles from '../styles/Home.module.css'

export default function Home() {
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
        <title>DentalArte — Clínica Odontológica</title>
        <meta name="description" content="Clínica odontológica de excelencia. Tu sonrisa, nuestra pasión." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* NAV */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.logoText}>DentalArte</span>
          </Link>

          <div className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ''}`}>
            <Link href="#servicios" onClick={() => setMenuOpen(false)}>Servicios</Link>
            <Link href="#nosotros" onClick={() => setMenuOpen(false)}>Nosotros</Link>
            <Link href="#testimonios" onClick={() => setMenuOpen(false)}>Testimonios</Link>
            <Link href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
          </div>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.btnOutline}>Iniciar Sesión</Link>
            <Link href="/login?tab=register" className={styles.btnPrimary}>Registrarse</Link>
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
            <span>★</span> Clínica de Excelencia — Santiago, Chile
          </div>
          <h1 className={styles.heroTitle}>
            Tu sonrisa,<br />
            <em>nuestra obra</em><br />
            maestra.
          </h1>
          <p className={styles.heroSub}>
            Combinamos tecnología de vanguardia con el arte de la odontología para crear sonrisas que transforman vidas.
          </p>
          <div className={styles.heroCTA}>
            <Link href="/login?tab=register" className={styles.btnHero}>
              Agenda tu cita
              <span>→</span>
            </Link>
            <a href="#servicios" className={styles.btnHeroGhost}>
              Conoce más
            </a>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>15+</span>
              <span className={styles.statLabel}>Años de experiencia</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.stat}>
              <span className={styles.statNum}>8.400</span>
              <span className={styles.statLabel}>Pacientes satisfechos</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.stat}>
              <span className={styles.statNum}>98%</span>
              <span className={styles.statLabel}>Tasa de éxito</span>
            </div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardTop}>
              <div className={styles.heroCardIcon}>🦷</div>
              <div>
                <div className={styles.heroCardTitle}>Próxima cita</div>
                <div className={styles.heroCardSub}>Dra. González · Hoy 15:30</div>
              </div>
            </div>
            <div className={styles.heroCardBar}>
              <div className={styles.heroCardBarFill}></div>
            </div>
            <div className={styles.heroCardFoot}>Confirmada ✓</div>
          </div>
          <div className={styles.heroOrbOuter}>
            <div className={styles.heroOrb}></div>
          </div>
          <div className={styles.heroFloatBadge}>
            <span>⭐ 4.9</span> Google Reviews
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="servicios" className={styles.services}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Nuestros Servicios</span>
            <h2 className={styles.sectionTitle}>Atención integral<br /><em>para toda la familia</em></h2>
          </div>
          <div className={styles.servicesGrid}>
            {services.map((s, i) => (
              <div key={i} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{s.icon}</div>
                <h3 className={styles.serviceName}>{s.name}</h3>
                <p className={styles.serviceDesc}>{s.desc}</p>
                <div className={styles.serviceArrow}>→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="nosotros" className={styles.about}>
        <div className="container">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutLeft}>
              <div className={styles.aboutImgWrap}>
                <div className={styles.aboutImgPlaceholder}>
                  <span>🦷</span>
                </div>
                <div className={styles.aboutImgBadge}>
                  <span className={styles.aboutBadgeNum}>2009</span>
                  <span className={styles.aboutBadgeText}>Desde</span>
                </div>
              </div>
            </div>
            <div className={styles.aboutRight}>
              <span className={styles.sectionLabel}>Sobre Nosotros</span>
              <h2 className={styles.sectionTitle}>Más que una clínica,<br /><em>somos tu familia</em></h2>
              <p className={styles.aboutText}>
                En DentalArte creemos que una sonrisa saludable es el inicio de una vida plena. Por eso, cada tratamiento lo realizamos con la máxima precisión, tecnología de última generación y una atención cálida y personalizada.
              </p>
              <p className={styles.aboutText}>
                Nuestro equipo de especialistas está comprometido con tu bienestar dental desde el primer día, acompañándote en cada etapa de tu tratamiento.
              </p>
              <div className={styles.aboutFeatures}>
                {features.map((f, i) => (
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

      {/* TESTIMONIALS */}
      <section id="testimonios" className={styles.testimonials}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className={styles.sectionLabel}>Testimonios</span>
            <h2 className={styles.sectionTitle}>Lo que dicen<br /><em>nuestros pacientes</em></h2>
          </div>
          <div className={styles.testimonialsGrid}>
            {testimonials.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>{'★'.repeat(t.stars)}</div>
                <p className={styles.testimonialText}>"{t.text}"</p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>{t.name[0]}</div>
                  <div>
                    <div className={styles.testimonialName}>{t.name}</div>
                    <div className={styles.testimonialRole}>{t.role}</div>
                  </div>
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
              <h2 className={styles.ctaTitle}>¿Listo para transformar<br /><em>tu sonrisa?</em></h2>
              <p className={styles.ctaSub}>Regístrate hoy y agenda tu primera consulta sin costo.</p>
              <Link href="/login?tab=register" className={styles.btnHero}>
                Comenzar ahora <span>→</span>
              </Link>
            </div>
            <div className={styles.ctaDecor}>✦</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <span className={styles.logoIcon}>✦</span>
                <span className={styles.logoText}>DentalArte</span>
              </div>
              <p>Tu salud dental es nuestra prioridad. Cuidamos tu sonrisa con pasión y excelencia.</p>
            </div>
            <div className={styles.footerCol}>
              <h4>Servicios</h4>
              <ul>
                <li>Ortodoncia</li>
                <li>Implantes</li>
                <li>Blanqueamiento</li>
                <li>Odontología General</li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>Contacto</h4>
              <ul>
                <li>📍 Av. Providencia 1234, Santiago</li>
                <li>📞 +56 2 2345 6789</li>
                <li>✉️ hola@dentalarte.cl</li>
                <li>🕐 Lun–Vie 9:00–19:00</li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 DentalArte. Todos los derechos reservados.</span>
            <Link href="/login">Área de Pacientes</Link>
          </div>
        </div>
      </footer>
    </>
  )
}

const services = [
  { icon: '🦷', name: 'Odontología General', desc: 'Revisiones, limpiezas y tratamientos preventivos para mantener tu salud bucal en óptimas condiciones.' },
  { icon: '😁', name: 'Ortodoncia', desc: 'Alineadores invisibles y brackets de última generación para una sonrisa perfectamente alineada.' },
  { icon: '✨', name: 'Blanqueamiento Dental', desc: 'Tratamientos profesionales que devuelven la luminosidad y blancura natural a tu sonrisa.' },
  { icon: '🔩', name: 'Implantes Dentales', desc: 'Soluciones permanentes y naturales para reemplazar dientes perdidos con tecnología de precisión.' },
  { icon: '👶', name: 'Odontopediatría', desc: 'Atención especializada y amigable para los más pequeños de la familia desde su primera visita.' },
  { icon: '💎', name: 'Estética Dental', desc: 'Carillas, diseño de sonrisa y tratamientos cosméticos para una imagen radiante y segura.' },
]

const features = [
  'Equipamiento de última generación',
  'Equipo de especialistas certificados',
  'Atención personalizada y sin dolor',
  'Planes de pago flexibles',
]

const testimonials = [
  { stars: 5, text: 'El mejor servicio dental que he recibido. El equipo es increíblemente profesional y amable. Mi tratamiento de ortodoncia superó todas mis expectativas.', name: 'Valentina R.', role: 'Paciente — Ortodoncia' },
  { stars: 5, text: 'Tenía mucho miedo al dentista hasta que vine a DentalArte. La Dra. González me hizo sentir completamente tranquila durante todo el proceso.', name: 'Andrés M.', role: 'Paciente — Implante dental' },
  { stars: 5, text: 'El blanqueamiento fue espectacular. En una sola sesión noté una diferencia enorme. Definitivamente el lugar más profesional donde he estado.', name: 'Catalina F.', role: 'Paciente — Blanqueamiento' },
]

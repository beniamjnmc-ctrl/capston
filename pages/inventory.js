import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useApp } from './_app'
import styles from '../styles/Inventory.module.css'

export default function Inventory() {
  const router = useRouter()
  const { user, inventoryData, updateInventory, syncData, syncStatus, resetInventory, logout, loading } = useApp()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [activeBox, setActiveBox] = useState('BOX1')
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (inventoryData) {
      calculateAlerts()
    }
  }, [inventoryData])

  const calculateAlerts = () => {
    const today = new Date()
    const alerts = []
    const boxKeys = ['BOX1', 'BOX2', 'BOX3', 'BOX4', 'BOX5', 'BOX6', 'BOX7']

    inventoryData.products.forEach(p => {
      const d = p.venc ? Math.ceil((new Date(p.venc + 'T12:00:00') - today) / 86400000) : null
      if (d !== null && d <= 30) {
        alerts.push({
          type: 'vencimiento',
          product: p.nombre,
          days: d,
          venc: p.venc,
          severity: d < 0 ? 'critical' : d <= 15 ? 'high' : 'medium'
        })
      }
      boxKeys.forEach(loc => {
        if ((p.mins[loc] ?? 0) > 0 && (p.stocks[loc] ?? 0) < (p.mins[loc] ?? 0)) {
          alerts.push({
            type: 'stock',
            product: p.nombre,
            box: loc,
            current: p.stocks[loc] ?? 0,
            minimum: p.mins[loc] ?? 0,
            severity: (p.stocks[loc] ?? 0) === 0 ? 'critical' : 'high'
          })
        }
      })
    })

    setAlerts(alerts.sort((a, b) => {
      const severityScore = { critical: 3, high: 2, medium: 1 }
      return (severityScore[b.severity] || 0) - (severityScore[a.severity] || 0)
    }))
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className={styles.spinner}></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>DentaStock — Inventario</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.layout}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <Link href="/" className={styles.logo}>
              <span>🦷</span> DentaStock
            </Link>
          </div>

          <nav className={styles.navMain}>
            <div className={styles.navSection}>General</div>
            <button
              className={`${styles.navItem} ${currentPage === 'dashboard' ? styles.active : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              <span>◈</span> Dashboard
              {alerts.length > 0 && <span className={styles.badge}>{alerts.length}</span>}
            </button>
            <button
              className={`${styles.navItem} ${currentPage === 'alertas' ? styles.active : ''}`}
              onClick={() => setCurrentPage('alertas')}
            >
              <span>⚠️</span> Alertas
            </button>

            <div className={styles.navSection}>Inventario</div>
            <button
              className={`${styles.navItem} ${currentPage === 'bodega' ? styles.active : ''}`}
              onClick={() => setCurrentPage('bodega')}
            >
              <span>▣</span> Bodega
            </button>
            <button
              className={`${styles.navItem} ${currentPage === 'boxes' ? styles.active : ''}`}
              onClick={() => setCurrentPage('boxes')}
            >
              <span>▦</span> Boxes
            </button>
            <button
              className={`${styles.navItem} ${currentPage === 'transferir' ? styles.active : ''}`}
              onClick={() => setCurrentPage('transferir')}
            >
              <span>⇄</span> Transferir
            </button>

            <div className={styles.navSection}>Clínica</div>
            <button
              className={`${styles.navItem} ${currentPage === 'procedimientos' ? styles.active : ''}`}
              onClick={() => setCurrentPage('procedimientos')}
            >
              <span>✦</span> Procedimientos
            </button>
            <button
              className={`${styles.navItem} ${currentPage === 'registrar' ? styles.active : ''}`}
              onClick={() => setCurrentPage('registrar')}
            >
              <span>⊕</span> Registrar atención
            </button>
            <button
              className={`${styles.navItem} ${currentPage === 'historial' ? styles.active : ''}`}
              onClick={() => setCurrentPage('historial')}
            >
              <span>≡</span> Historial
            </button>
          </nav>

          <div className={styles.sidebarBottom}>
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>{user.name[0].toUpperCase()}</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
            </div>
            <button className={styles.btnLogout} onClick={handleLogout}>
              ← Cerrar sesión
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.main}>
          {/* HEADER */}
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <h1>
                {currentPage === 'dashboard' && 'Dashboard'}
                {currentPage === 'alertas' && 'Alertas'}
                {currentPage === 'bodega' && 'Bodega General'}
                {currentPage === 'boxes' && 'Boxes'}
                {currentPage === 'transferir' && 'Transferir'}
                {currentPage === 'procedimientos' && 'Procedimientos'}
                {currentPage === 'registrar' && 'Registrar Atención'}
                {currentPage === 'historial' && 'Historial'}
              </h1>
              <p>
                {currentPage === 'dashboard' && 'Resumen del estado de tu inventario'}
                {currentPage === 'alertas' && 'Vencimientos y stock bajo'}
                {currentPage === 'bodega' && 'Stock central de la clínica'}
                {currentPage === 'boxes' && 'Inventario por box'}
                {currentPage === 'transferir' && 'Movimientos desde bodega a boxes'}
                {currentPage === 'procedimientos' && 'Procedimientos y consumos de insumos'}
                {currentPage === 'registrar' && 'Registra atenciones y descuenta automáticamente'}
                {currentPage === 'historial' && 'Registro de todas las operaciones'}
              </p>
            </div>

            <div className={styles.headerActions}>
              <div className={`${styles.syncStatus} ${styles[syncStatus]}`}>
                {syncStatus === 'idle' && '●'}
                {syncStatus === 'syncing' && '◑'}
                {syncStatus === 'synced' && '✓'}
              </div>
              <button className={styles.btnSync} onClick={syncData} disabled={syncStatus === 'syncing'}>
                {syncStatus === 'idle' && '↻ Sincronizar'}
                {syncStatus === 'syncing' && '...'}
                {syncStatus === 'synced' && '✓ Sincronizado'}
              </button>
            </div>
          </header>

          {/* PAGES */}
          <div className={styles.content}>
            {currentPage === 'dashboard' && inventoryData && (
              <Dashboard data={inventoryData} alerts={alerts} />
            )}
            {currentPage === 'alertas' && inventoryData && (
              <AlertasPage data={inventoryData} alerts={alerts} />
            )}
            {currentPage === 'bodega' && inventoryData && (
              <BodegaPage data={inventoryData} updateInventory={updateInventory} />
            )}
            {currentPage === 'boxes' && inventoryData && (
              <BoxesPage data={inventoryData} updateInventory={updateInventory} activeBox={activeBox} setActiveBox={setActiveBox} />
            )}
            {currentPage === 'transferir' && inventoryData && (
              <TransferirPage data={inventoryData} updateInventory={updateInventory} />
            )}
            {currentPage === 'procedimientos' && inventoryData && (
              <ProcedimientosPage data={inventoryData} updateInventory={updateInventory} />
            )}
            {currentPage === 'registrar' && inventoryData && (
              <RegistrarPage data={inventoryData} updateInventory={updateInventory} />
            )}
            {currentPage === 'historial' && inventoryData && (
              <HistorialPage data={inventoryData} />
            )}
          </div>
        </main>
      </div>
    </>
  )
}

// DASHBOARD
function Dashboard({ data, alerts }) {
  const totalBajo = alerts.filter(a => a.type === 'stock').length
  const totalVenc = alerts.filter(a => a.type === 'vencimiento').length

  return (
    <div className="page-content">
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label">Total insumos</div>
          <div className="kpi-val">{data.products.length}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Stock bajo</div>
          <div className="kpi-val danger">{totalBajo}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Vencimientos 30d</div>
          <div className="kpi-val warning">{totalVenc}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Boxes activos</div>
          <div className="kpi-val">7</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Alertas críticas</h3>
          <div className="alerts-list">
            {alerts.slice(0, 5).map((a, i) => (
              <div key={i} className={`alert ${a.severity}`}>
                {a.type === 'vencimiento' && `${a.product} vence en ${a.days}d`}
                {a.type === 'stock' && `${a.product} en ${a.box}: ${a.current}/${a.minimum}`}
              </div>
            ))}
            {alerts.length === 0 && <p className="empty">Sin alertas</p>}
          </div>
        </div>

        <div className="card">
          <h3>Próximas acciones</h3>
          <ul className="actions-list">
            <li>📦 Revisar boxes con stock bajo</li>
            <li>⚠️ Productos próximos a vencer</li>
            <li>⇄ Transferencias pendientes</li>
            <li>📋 Registrar atenciones del día</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ALERTAS
function AlertasPage({ data, alerts }) {
  const vencimientos = alerts.filter(a => a.type === 'vencimiento')
  const stockBajo = alerts.filter(a => a.type === 'stock')

  return (
    <div className="page-content">
      <div className="card">
        <h3>Vencimientos próximos</h3>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Vencimiento</th>
              <th>Días</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {vencimientos.map((a, i) => (
              <tr key={i}>
                <td>{a.product}</td>
                <td>{a.venc}</td>
                <td>{a.days}d</td>
                <td><span className={`badge ${a.severity}`}>{a.severity}</span></td>
              </tr>
            ))}
            {vencimientos.length === 0 && <tr><td colSpan="4" className="empty">Sin alertas de vencimiento</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Stock bajo</h3>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Box</th>
              <th>Stock actual</th>
              <th>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {stockBajo.map((a, i) => (
              <tr key={i}>
                <td>{a.product}</td>
                <td>{a.box.replace('BOX', 'Box ')}</td>
                <td>{a.current}</td>
                <td>{a.minimum}</td>
                <td><span className={`badge ${a.severity}`}>{a.severity}</span></td>
              </tr>
            ))}
            {stockBajo.length === 0 && <tr><td colSpan="5" className="empty">Sin alertas de stock</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// BODEGA
function BodegaPage({ data, updateInventory }) {
  return (
    <div className="page-content">
      <div className="card">
        <h3>Inventario Bodega General</h3>
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Unidad</th>
              <th>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>{p.cat}</td>
                <td>{p.stocks.BODEGA ?? 0}</td>
                <td>{p.unidad}</td>
                <td>{p.venc || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// BOXES
function BoxesPage({ data, updateInventory, activeBox, setActiveBox }) {
  const boxKeys = ['BOX1', 'BOX2', 'BOX3', 'BOX4', 'BOX5', 'BOX6', 'BOX7']

  return (
    <div className="page-content">
      <div className="box-tabs">
        {boxKeys.map(box => (
          <button
            key={box}
            className={`box-tab ${activeBox === box ? 'active' : ''}`}
            onClick={() => setActiveBox(box)}
          >
            {box.replace('BOX', 'Box ')}
          </button>
        ))}
      </div>

      <div className="card">
        <h3>{activeBox.replace('BOX', 'Box ')}</h3>
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>% Nivel</th>
              <th>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {data.products
              .filter(p => (p.mins[activeBox] ?? 0) > 0)
              .map(p => {
                const s = p.stocks[activeBox] ?? 0
                const m = p.mins[activeBox] ?? 0
                const pct = m > 0 ? Math.min(100, Math.round(s / m * 100)) : 100
                return (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{s}</td>
                    <td>{m}</td>
                    <td><div className="bar" style={{ width: pct + '%' }}></div>{pct}%</td>
                    <td>{p.venc || '—'}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// TRANSFERIR
function TransferirPage({ data, updateInventory }) {
  const [selectedBox, setSelectedBox] = useState('BOX1')
  const [selectedProduct, setSelectedProduct] = useState(data.products[0].id)
  const [qty, setQty] = useState(1)

  const handleTransfer = () => {
    const product = data.products.find(p => p.id === parseInt(selectedProduct))
    if (!product) return

    const newData = JSON.parse(JSON.stringify(data))
    const newProduct = newData.products.find(p => p.id === parseInt(selectedProduct))

    if ((newProduct.stocks.BODEGA ?? 0) >= qty) {
      newProduct.stocks.BODEGA = (newProduct.stocks.BODEGA ?? 0) - qty
      newProduct.stocks[selectedBox] = (newProduct.stocks[selectedBox] ?? 0) + qty
      newData.transferHistory.unshift({
        fecha: new Date().toISOString().split('T')[0],
        destino: selectedBox,
        item: newProduct.nombre,
        qty,
        unidad: newProduct.unidad
      })
      updateInventory(newData)
      alert('✓ Transferencia registrada')
      setQty(1)
    } else {
      alert('Stock insuficiente en bodega')
    }
  }

  return (
    <div className="page-content">
      <div className="card">
        <h3>Transferir de Bodega a Box</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Box destino</label>
            <select value={selectedBox} onChange={e => setSelectedBox(e.target.value)}>
              {['BOX1', 'BOX2', 'BOX3', 'BOX4', 'BOX5', 'BOX6', 'BOX7'].map(b => (
                <option key={b} value={b}>{b.replace('BOX', 'Box ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Insumo</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
              {data.products.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (bodega: {p.stocks.BODEGA ?? 0})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Cantidad</label>
            <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} min="1" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleTransfer}>Confirmar transferencia</button>
      </div>

      <div className="card">
        <h3>Historial de transferencias</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Box</th>
              <th>Insumo</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {data.transferHistory.slice(0, 20).map((t, i) => (
              <tr key={i}>
                <td>{t.fecha}</td>
                <td>{t.destino.replace('BOX', 'Box ')}</td>
                <td>{t.item}</td>
                <td>{t.qty} {t.unidad}</td>
              </tr>
            ))}
            {data.transferHistory.length === 0 && <tr><td colSpan="4" className="empty">Sin transferencias</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// PROCEDIMIENTOS
function ProcedimientosPage({ data, updateInventory }) {
  return (
    <div className="page-content">
      <div className="card">
        <h3>Catálogo de procedimientos</h3>
        {data.procedures.map(p => (
          <div key={p.id} className="proc-item">
            <h4>{p.nombre}</h4>
            <p>Insumos: {p.extra.map(e => `${e.pname} ×${e.qty}`).join(', ') || 'Set base'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// REGISTRAR ATENCIÓN
function RegistrarPage({ data, updateInventory }) {
  const [selectedBox, setSelectedBox] = useState('BOX1')
  const [selectedProcs, setSelectedProcs] = useState([])
  const [patient, setPatient] = useState('')

  const handleRegister = () => {
    if (selectedProcs.length === 0) {
      alert('Selecciona al menos un procedimiento')
      return
    }

    const newData = JSON.parse(JSON.stringify(data))
    // Lógica de descuento (simplificada)
    newData.attendHistory.unshift({
      fecha: new Date().toISOString().split('T')[0],
      box: selectedBox.replace('BOX', 'Box '),
      pac: patient || 'Paciente',
      procs: selectedProcs.map(id => newData.procedures.find(p => p.id === id)?.nombre).join(', '),
      ins: 'Ver detalles'
    })

    updateInventory(newData)
    alert('✓ Atención registrada')
    setSelectedProcs([])
    setPatient('')
  }

  return (
    <div className="page-content">
      <div className="card">
        <h3>Nueva atención</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Box</label>
            <select value={selectedBox} onChange={e => setSelectedBox(e.target.value)}>
              {['BOX1', 'BOX2', 'BOX3', 'BOX4', 'BOX5', 'BOX6', 'BOX7'].map(b => (
                <option key={b} value={b}>{b.replace('BOX', 'Box ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Paciente</label>
            <input type="text" value={patient} onChange={e => setPatient(e.target.value)} placeholder="Nombre (opcional)" />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Procedimientos realizados</label>
          <div className="proc-checks">
            {data.procedures.map(p => (
              <label key={p.id} className="check-item">
                <input
                  type="checkbox"
                  checked={selectedProcs.includes(p.id)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedProcs([...selectedProcs, p.id])
                    } else {
                      setSelectedProcs(selectedProcs.filter(id => id !== p.id))
                    }
                  }}
                />
                {p.nombre}
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleRegister}>Registrar atención</button>
      </div>
    </div>
  )
}

// HISTORIAL
function HistorialPage({ data }) {
  return (
    <div className="page-content">
      <div className="card">
        <h3>Historial de atenciones</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Box</th>
              <th>Paciente</th>
              <th>Procedimientos</th>
              <th>Insumos</th>
            </tr>
          </thead>
          <tbody>
            {data.attendHistory.map((a, i) => (
              <tr key={i}>
                <td>{a.fecha}</td>
                <td>{a.box}</td>
                <td>{a.pac}</td>
                <td style={{ fontSize: '12px' }}>{a.procs}</td>
                <td style={{ fontSize: '12px', color: '#666' }}>{a.ins}</td>
              </tr>
            ))}
            {data.attendHistory.length === 0 && <tr><td colSpan="5" className="empty">Sin atenciones registradas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

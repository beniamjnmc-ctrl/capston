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

  // ESTADOS NUEVOS PARA MODALES
  const [showProductModal, setShowProductModal] = useState(false)
  const [showProcModal, setShowProcModal] = useState(false)
  const [isNewProduct, setIsNewProduct] = useState(false)

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
        <title>OdonTool — Panel de Control</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.layout}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop} style={{ padding: '30px 20px' }}>
            <Link href="/" className={styles.logo} style={{ fontSize: '26px', fontWeight: 'bold' }}>
              <span>🦷</span> OdonTool
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
              <span>✦</span> Kits de Procedimiento
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
          <header className={styles.header} style={{ padding: '40px' }}>
            <div className={styles.headerTitle}>
              <h1 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px' }}>
                {currentPage === 'dashboard' && 'Dashboard'}
                {currentPage === 'alertas' && 'Alertas'}
                {currentPage === 'bodega' && 'Bodega General'}
                {currentPage === 'boxes' && 'Boxes'}
                {currentPage === 'transferir' && 'Transferir'}
                {currentPage === 'procedimientos' && 'Kits de Procedimiento'}
                {currentPage === 'registrar' && 'Registrar Atención'}
                {currentPage === 'historial' && 'Historial'}
              </h1>
              <p style={{ fontSize: '16px' }}>
                {currentPage === 'dashboard' && 'Resumen del estado de tu inventario'}
                {currentPage === 'alertas' && 'Vencimientos y stock bajo'}
                {currentPage === 'bodega' && 'Stock central de la clínica'}
                {currentPage === 'boxes' && 'Inventario por box'}
                {currentPage === 'transferir' && 'Movimientos desde bodega a boxes'}
                {currentPage === 'procedimientos' && 'Crea, edita y revisa los Kits de Procedimientos'}
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
              <BodegaPage 
                data={inventoryData} 
                openModal={() => setShowProductModal(true)} 
              />
            )}
            {currentPage === 'boxes' && inventoryData && (
              <BoxesPage data={inventoryData} updateInventory={updateInventory} activeBox={activeBox} setActiveBox={setActiveBox} />
            )}
            {currentPage === 'transferir' && inventoryData && (
              <TransferirPage data={inventoryData} updateInventory={updateInventory} />
            )}
            {currentPage === 'procedimientos' && inventoryData && (
              <ProcedimientosPage 
                data={inventoryData} 
                updateInventory={updateInventory} 
                openModal={() => setShowProcModal(true)} 
              />
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

      {/* MODAL AGREGAR/EDITAR INSUMO */}
      {showProductModal && (
        <ProductModal 
          data={inventoryData} 
          update={updateInventory} 
          onClose={() => setShowProductModal(false)}
          isNew={isNewProduct}
          setIsNew={setIsNewProduct}
        />
      )}

      {/* MODAL CONFIGURAR PROCEDIMIENTO */}
      {showProcModal && (
        <ProcedureModal 
          data={inventoryData} 
          update={updateInventory} 
          onClose={() => setShowProcModal(false)}
        />
      )}
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
function BodegaPage({ data, openModal }) {
  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Inventario Maestro</h3>
        <button className="btn btn-primary" onClick={openModal}>+ Agregar o Reponer Insumo</button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Categoría</th>
              <th>Stock Bodega</th>
              <th>Total en Boxes</th>
              <th>Unidad</th>
              <th>Vencimiento Lote</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p) => {
              const totalBoxes = Object.keys(p.stocks).filter(k => k.startsWith('BOX')).reduce((acc, k) => acc + p.stocks[k], 0)
              return (
                <tr key={p.id}>
                  <td><strong>{p.nombre}</strong></td>
                  <td><span className="badge">{p.cat}</span></td>
                  <td>{p.stocks.BODEGA ?? 0}</td>
                  <td>{totalBoxes}</td>
                  <td>{p.unidad}</td>
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
  const [selectedProduct, setSelectedProduct] = useState(data.products[0]?.id)
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

// PROCEDIMIENTOS (Actualizado con editor)
function ProcedimientosPage({ data, updateInventory, openModal }) {
  const deleteProc = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este kit?')) {
      const newData = { ...data, procedures: data.procedures.filter(p => p.id !== id) }
      updateInventory(newData)
    }
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Catálogo de Procedimientos (Kits)</h3>
        <button className="btn btn-primary" onClick={openModal}>+ Crear Nuevo Kit</button>
      </div>
      <div className="grid-2">
        {data.procedures.map(proc => (
          <div key={proc.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--primary)' }}>{proc.nombre}</h4>
              <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => deleteProc(proc.id)}>Eliminar</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              <strong>Insumos del Kit a descontar:</strong>
            </p>
            <ul style={{ fontSize: '12px', paddingLeft: '20px', color: 'var(--text-primary)' }}>
              {proc.extra && proc.extra.length > 0 ? (
                proc.extra.map((ins, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{ins.pname}: <strong>x{ins.qty}</strong></li>
                ))
              ) : (
                <li>Set base únicamente</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// REGISTRAR ATENCIÓN (CON MOTOR DE DESCUENTO DE STOCK REAL)
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
    let logIns = [] // Para registrar exactamente qué insumos se descontaron

    // --- MOTOR DE DESCUENTO MATEMÁTICO ---
    selectedProcs.forEach(procId => {
      const proc = newData.procedures.find(p => p.id === procId)
      if (proc && proc.extra) {
        proc.extra.forEach(item => {
          const product = newData.products.find(p => p.nombre === item.pname)
          if (product) {
            // Descuenta la cantidad del Box seleccionado y evita que quede en números negativos
            const currentStock = product.stocks[selectedBox] || 0
            product.stocks[selectedBox] = Math.max(0, currentStock - item.qty)
            logIns.push(`${item.pname} (-${item.qty})`)
          }
        })
      }
    })

    // Registra la atención en el historial
    newData.attendHistory.unshift({
      fecha: new Date().toISOString().split('T')[0],
      box: selectedBox.replace('BOX', 'Box '),
      pac: patient || 'Paciente',
      procs: selectedProcs.map(id => newData.procedures.find(p => p.id === id)?.nombre).join(', '),
      ins: logIns.join(', ') || 'Sin insumos deducidos'
    })

    updateInventory(newData)
    alert(`✓ Atención registrada y stock descontado del ${selectedBox.replace('BOX', 'Box ')}`)
    setSelectedProcs([])
    setPatient('')
  }

  return (
    <div className="page-content">
      <div className="card">
        <h3>Nueva atención</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Box de Atención</label>
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
          <label>Seleccionar Kits Consumidos (Esto deducirá el stock del box)</label>
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

        <button className="btn btn-primary" onClick={handleRegister}>Finalizar y Descontar Stock</button>
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
              <th>Insumos Descontados</th>
            </tr>
          </thead>
          <tbody>
            {data.attendHistory.map((a, i) => (
              <tr key={i}>
                <td>{a.fecha}</td>
                <td>{a.box}</td>
                <td>{a.pac}</td>
                <td style={{ fontSize: '12px' }}>{a.procs}</td>
                <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{a.ins}</td>
              </tr>
            ))}
            {data.attendHistory.length === 0 && <tr><td colSpan="5" className="empty">Sin atenciones registradas</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// MODALES

function ProductModal({ data, update, onClose, isNew, setIsNew }) {
  const [form, setForm] = useState({
    idManual: '',
    nombre: '',
    cat: 'Insumos Clínicos',
    unidad: 'unidades',
    ubicacion: 'BODEGA',
    cantidad: 0,
    venc: '',
    existenteId: data.products[0]?.id || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const newData = JSON.parse(JSON.stringify(data))
    
    if (isNew) {
      const newProd = {
        id: form.idManual || Date.now(),
        nombre: form.nombre,
        cat: form.cat,
        unidad: form.unidad,
        venc: form.venc,
        stocks: { BODEGA: 0, BOX1: 0, BOX2: 0, BOX3: 0, BOX4: 0, BOX5: 0, BOX6: 0, BOX7: 0 },
        mins: { BODEGA: 5, BOX1: 2, BOX2: 2, BOX3: 2, BOX4: 2, BOX5: 2, BOX6: 2, BOX7: 2 }
      }
      newProd.stocks[form.ubicacion] = parseInt(form.cantidad)
      newData.products.push(newProd)
    } else {
      const idx = newData.products.findIndex(p => p.id == form.existenteId)
      if (idx !== -1) {
        newData.products[idx].stocks[form.ubicacion] = (newData.products[idx].stocks[form.ubicacion] || 0) + parseInt(form.cantidad)
        newData.products[idx].venc = form.venc 
      }
    }
    
    update(newData)
    alert('✓ Insumo actualizado en ' + form.ubicacion)
    onClose()
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '400px', padding: '30px' }}>
        <h3>Gestionar Insumo</h3>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button type="button" className={`btn ${!isNew ? 'btn-primary' : ''}`} style={{ flex: 1 }} onClick={() => setIsNew(false)}>Existente (Reponer)</button>
          <button type="button" className={`btn ${isNew ? 'btn-primary' : ''}`} style={{ flex: 1 }} onClick={() => setIsNew(true)}>Nuevo Insumo</button>
        </div>

        <form onSubmit={handleSubmit}>
          {isNew ? (
            <>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>ID / Código de Barras (Opcional)</label>
                <input type="text" onChange={e => setForm({...form, idManual: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label>Nombre del Insumo</label>
                <input type="text" required onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Ácido Grabador" />
              </div>
            </>
          ) : (
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label>Seleccionar Insumo a reponer</label>
              <select onChange={e => setForm({...form, existenteId: e.target.value})}>
                {data.products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          )}

          <div className="form-grid" style={{ marginBottom: '10px' }}>
            <div className="form-group">
              <label>Ubicación</label>
              <select onChange={e => setForm({...form, ubicacion: e.target.value})}>
                <option value="BODEGA">Bodega General</option>
                {[1,2,3,4,5,6,7].map(n => <option key={n} value={`BOX${n}`}>Box {n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cantidad a sumar</label>
              <input type="number" required min="1" onChange={e => setForm({...form, cantidad: e.target.value})} />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Fecha de Vencimiento de este lote</label>
            <input type="date" required onChange={e => setForm({...form, venc: e.target.value})} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Guardar Stock</button>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProcedureModal({ data, update, onClose }) {
  const [name, setName] = useState('')
  const [selectedInsumos, setSelectedInsumos] = useState([])

  const addInsumoRow = () => {
    setSelectedInsumos([...selectedInsumos, { pname: data.products[0]?.nombre || '', qty: 1 }])
  }

  const removeInsumoRow = (index) => {
    const newIns = [...selectedInsumos]
    newIns.splice(index, 1)
    setSelectedInsumos(newIns)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newProc = { id: Date.now(), nombre: name, extra: selectedInsumos }
    update({ ...data, procedures: [...data.procedures, newProc] })
    alert('✓ Kit de procedimiento creado')
    onClose()
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3>Crear Kit de Procedimiento</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
          Define los insumos exactos que se descontarán del Box al registrar este procedimiento.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Nombre del Procedimiento</label>
            <input type="text" required onChange={e => setName(e.target.value)} placeholder="Ej: Extracción Simple" />
          </div>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px' }}>Insumos requeridos:</h4>
            
            {selectedInsumos.map((ins, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <select 
                  style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  value={ins.pname}
                  onChange={e => {
                    const newIns = [...selectedInsumos]; 
                    newIns[idx].pname = e.target.value; 
                    setSelectedInsumos(newIns);
                  }}
                >
                  {data.products.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
                
                <input 
                  type="number" 
                  step="0.1"
                  style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                  value={ins.qty}
                  onChange={e => {
                    const newIns = [...selectedInsumos]; 
                    newIns[idx].qty = parseFloat(e.target.value); 
                    setSelectedInsumos(newIns);
                  }} 
                />
                
                <button type="button" className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={() => removeInsumoRow(idx)}>X</button>
              </div>
            ))}
            
            <button type="button" className="btn" onClick={addInsumoRow} style={{ width: '100%', marginTop: '10px', borderStyle: 'dashed' }}>
              + Agregar insumo a la receta
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar Kit</button>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
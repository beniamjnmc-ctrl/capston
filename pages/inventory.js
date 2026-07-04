import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useApp } from './_app'
import { createClient } from '../utils/supabase/client'
import styles from '../styles/Inventory.module.css'
import ThemeToggle from '../components/ThemeToggle'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Inventory() {
  const router = useRouter()
  const { inventoryData, updateInventory, activeClinic, switchClinic, syncData, syncStatus, logout, loading, user } = useApp()
  
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [activeBox, setActiveBox] = useState('BODEGA')
  const [alerts, setAlerts] = useState([])

  const [showProductModal, setShowProductModal] = useState(false)
  const [showProcModal, setShowProcModal] = useState(false)
  const [isNewProduct, setIsNewProduct] = useState(false)

  // Estados para Ã“rdenes de Compra y Perfil
  const [showCreatePOModal, setShowCreatePOModal] = useState(false)
  const [showReceivePOModal, setShowReceivePOModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    if (!user && !loading) router.push('/login');
  }, [user, loading, router])

  useEffect(() => {
    if (inventoryData && inventoryData.boxes) {
      if (activeBox !== 'BODEGA' && !inventoryData.boxes.find(b => b.id === activeBox)) {
        setActiveBox('BODEGA')
      }
    }
  }, [inventoryData, activeClinic, activeBox])

  useEffect(() => {
    if (inventoryData) calculateAlerts()
  }, [inventoryData])

  const calculateAlerts = () => {
    const today = new Date()
    const newAlerts = []
    const boxKeys = ['BODEGA', ...(inventoryData?.boxes?.map(b => b.id) || [])]
    const productos = inventoryData?.products || [];

    productos.forEach(p => {
      const d = p.venc ? Math.ceil((new Date(p.venc + 'T12:00:00') - today) / 86400000) : null
      if (d !== null && d <= 30) {
        newAlerts.push({ type: 'vencimiento', product: p.nombre, days: d, venc: p.venc, severity: d < 0 ? 'critical' : d <= 15 ? 'high' : 'medium' })
      }
      boxKeys.forEach(loc => {
        const min = p.mins?.[loc] ?? 2;
        const stock = p.stocks?.[loc] ?? p[loc] ?? 0;
        if (min > 0 && stock < min) {
          const boxName = loc === 'BODEGA' ? 'Bodega Central' : (inventoryData.boxes.find(b => b.id === loc)?.name || loc);
          newAlerts.push({ type: 'stock', product: p.nombre, box: boxName, current: stock, minimum: min, severity: stock === 0 ? 'critical' : 'high' })
        }
      })
    })
    setAlerts(newAlerts.sort((a, b) => {
      const score = { critical: 3, high: 2, medium: 1 }; return (score[b.severity] || 0) - (score[a.severity] || 0)
    }))
  }

  if (loading || !user || !inventoryData) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Cargando OdonTool...</div>

  const isAdmin = user?.role === 'admin';
  const isClinico = user?.role === 'clinico';
  const isAsistente = user?.role === 'asistente';
  const isPendiente = user?.role === 'pendiente';
  const canViewKits = isAdmin || isClinico || isAsistente;
  const canUseKits = isAdmin || isClinico;
  const canManageKits = isAdmin;

  // Validar que tenemos datos antes de renderizar
  if (!user || !inventoryData) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>Cargando...</div>
  }

  return (
    <>
      <Head><title>OdonTool â€” {inventoryData.clinicName}</title></Head>
      <div className={styles.layout}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop} style={{ padding: '30px 20px' }}>
            <Link href="/" className={styles.logo} style={{ fontSize: '26px', fontWeight: 'bold' }}><span>ðŸ¦·</span> OdonTool</Link>
          </div>
          <nav className={styles.navMain}>
            <div className={styles.navSection}>General</div>
            <button className={`${styles.navItem} ${currentPage === 'dashboard' ? styles.active : ''}`} onClick={() => setCurrentPage('dashboard')}><span>â—ˆ</span> Dashboard {alerts.length > 0 && <span className={styles.badge}>{alerts.length}</span>}</button>
            <button className={`${styles.navItem} ${currentPage === 'alertas' ? styles.active : ''}`} onClick={() => setCurrentPage('alertas')}><span>âš ï¸</span> Alertas</button>
            
            <div className={styles.navSection}>Inventario & LogÃ­stica</div>
            <button className={`${styles.navItem} ${currentPage === 'boxes' ? styles.active : ''}`} onClick={() => setCurrentPage('boxes')}><span>â–¦</span> Bodega y Boxes</button>
            <button className={`${styles.navItem} ${currentPage === 'transferir' ? styles.active : ''}`} onClick={() => setCurrentPage('transferir')}><span>â‡„</span> Transferencias</button>
            {isAdmin && <button className={`${styles.navItem} ${currentPage === 'compras' ? styles.active : ''}`} onClick={() => setCurrentPage('compras')}><span>ðŸ›’</span> Ã“rdenes de Compra</button>}

            <div className={styles.navSection}>ClÃ­nica</div>
            {canViewKits && <button className={`${styles.navItem} ${currentPage === 'procedimientos' ? styles.active : ''}`} onClick={() => setCurrentPage('procedimientos')}><span>âœ¦</span> Kits de Procedimiento</button>}
            <button className={`${styles.navItem} ${currentPage === 'registrar' ? styles.active : ''}`} onClick={() => setCurrentPage('registrar')}><span>âŠ•</span> Registrar atenciÃ³n</button>
            <button className={`${styles.navItem} ${currentPage === 'historial' ? styles.active : ''}`} onClick={() => setCurrentPage('historial')}><span>â‰¡</span> Historial</button>
            {!isPendiente && <button className={`${styles.navItem} ${currentPage === 'historial-inventario' ? styles.active : ''}`} onClick={() => setCurrentPage('historial-inventario')}><span>ðŸ“‹</span> Historial Inventario</button>}

            {isAdmin && (
              <>
                <div className={styles.navSection}>AdministraciÃ³n</div>
                <button className={`${styles.navItem} ${currentPage === 'usuarios' ? styles.active : ''}`} onClick={() => setCurrentPage('usuarios')}><span>ðŸ‘¥</span> Usuarios</button>
              </>
            )}
          </nav>

          <div className={styles.sidebarBottom}>
            <div className={styles.userCard}>
              <div className={styles.userAvatar}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user?.name || 'Usuario'}</div>
                <div className={styles.userEmail}>{isAdmin ? 'Administrador' : 'ClÃ­nico'}</div>
              </div>
            </div>
            
            {/* NUEVOS BOTONES DE PERFIL Y SALIR */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button 
                className={styles.btnLogout} 
                onClick={() => setShowProfileModal(true)} 
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                âš™ï¸ Perfil
              </button>
              <button 
                className={styles.btnLogout} 
                onClick={logout} 
                style={{ flex: 1, padding: '10px', background: 'var(--danger)', color: '#fff' }}
              >
                ðŸšª Salir
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.main}>
          <header className={styles.header} style={{ padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.headerTitle}>
              <h1 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>
                {currentPage === 'dashboard' && 'Business Intelligence'}
                {currentPage === 'alertas' && 'Centro de Alertas'}
                {currentPage === 'boxes' && 'GestiÃ³n de Bodega y Boxes'}
                {currentPage === 'transferir' && 'Transferencias Internas'}
                {currentPage === 'compras' && 'Ã“rdenes de Compra (Inbound)'}
                {currentPage === 'procedimientos' && 'Kits de Procedimiento'}
                {currentPage === 'registrar' && 'Registrar AtenciÃ³n ClÃ­nica'}
                {currentPage === 'historial' && 'Historial de Operaciones'}
                {currentPage === 'historial-inventario' && 'Historial de Inventario'}
                {currentPage === 'usuarios' && 'GestiÃ³n de Usuarios'}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '10px' }}>Sucursal:</span>
                <select value={activeClinic} onChange={e => switchClinic(e.target.value)} style={{ border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '16px', outline: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <option value="loBarnechea">Lo Barnechea</option>
                  <option value="alcantara">AlcÃ¡ntara</option>
                </select>
              </div>
              <ThemeToggle style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }} />
            </div>
          </header>

          <div className={styles.content}>
            {currentPage === 'dashboard' && <Dashboard data={inventoryData} alerts={alerts} />}
            {currentPage === 'alertas' && <AlertasPage alerts={alerts} />}
            {currentPage === 'boxes' && <BoxesPage data={inventoryData} activeBox={activeBox} setActiveBox={setActiveBox} updateInventory={updateInventory} isAdmin={isAdmin} openModal={() => setShowProductModal(true)} isPendiente={isPendiente} activeClinic={activeClinic} />}
            {currentPage === 'transferir' && <TransferirPage data={inventoryData} updateInventory={updateInventory} />}
            {currentPage === 'compras' && isAdmin && <ComprasPage data={inventoryData} updateInventory={updateInventory} openCreate={() => setShowCreatePOModal(true)} openReceive={(po) => { setSelectedPO(po); setShowReceivePOModal(true); }} />}
            {currentPage === 'procedimientos' && canViewKits && <ProcedimientosPage data={inventoryData} updateInventory={updateInventory} openModal={() => setShowProcModal(true)} canManageKits={canManageKits} />}
            {currentPage === 'registrar' && <RegistrarPage data={inventoryData} updateInventory={updateInventory} currentUser={user} canUseKits={canUseKits} />}
            {currentPage === 'historial' && <HistorialPage data={inventoryData} />}
            {currentPage === 'historial-inventario' && !isPendiente && <AuditLogPage activeClinic={activeClinic} />}
            {/* {currentPage === 'usuarios' && isAdmin && <UsuariosPage usersDb={usersDb} registerNewUser={registerNewUser} deleteUser={deleteUser} currentUser={user} />} */}
          </div>
        </main>
      </div>

      {showProductModal && <ProductModal data={inventoryData} update={updateInventory} onClose={() => setShowProductModal(false)} isNew={isNewProduct} setIsNew={setIsNewProduct} activeBox={activeBox} activeClinic={activeClinic} />}
      {showProcModal && <ProcedureModal data={inventoryData} update={updateInventory} onClose={() => setShowProcModal(false)} />}
      {showCreatePOModal && <CreatePOModal data={inventoryData} update={updateInventory} onClose={() => setShowCreatePOModal(false)} currentUser={user} />}
      {showReceivePOModal && <ReceivePOModal data={inventoryData} update={updateInventory} po={selectedPO} onClose={() => { setShowReceivePOModal(false); setSelectedPO(null); }} />}
      {showProfileModal && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} logout={logout} />}
    </>
  )
}

// ============================================================================
// DASHBOARD
// ============================================================================
function Dashboard({ data, alerts = [] }) {
  const [viewMode, setViewMode] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('05');
  const [showDetail, setShowDetail] = useState(false);

  const [chartColors, setChartColors] = useState({ brand: '#0F6E56', blue: '#2B4C7E', red: '#C25953', axis: '#6b7280', grid: '#e5e7eb', tooltipBg: '#ffffff', tooltipText: '#1e293b' })
  useEffect(() => {
    const update = () => {
      const s = getComputedStyle(document.documentElement)
      setChartColors({
        brand:       s.getPropertyValue('--chart-brand').trim()    || '#0F6E56',
        blue:        s.getPropertyValue('--chart-blue').trim()     || '#2B4C7E',
        red:         s.getPropertyValue('--chart-red').trim()      || '#C25953',
        axis:        s.getPropertyValue('--text-secondary').trim() || '#6b7280',
        grid:        s.getPropertyValue('--border').trim()         || '#e5e7eb',
        tooltipBg:   s.getPropertyValue('--card-bg').trim()        || '#ffffff',
        tooltipText: s.getPropertyValue('--text-primary').trim()   || '#1e293b',
      })
    }
    update()
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', update)
    // Escucha el toggle manual de tema (disparado desde useTheme.toggleTheme)
    window.addEventListener('odontool-theme-change', update)
    return () => {
      mql.removeEventListener('change', update)
      window.removeEventListener('odontool-theme-change', update)
    }
  }, [])

  const productionData = data?.productionData || []
  const useProductionData = productionData.length > 0

  const filteredHistory = useMemo(() => {
    const history = data?.attendHistory || [];
    if (viewMode === 'all') return history;
    return history.filter(a => {
      const year = a.fecha.substring(0, 4);
      const month = a.fecha.substring(5, 7);
      if (viewMode === 'annual') return year === selectedYear;
      if (viewMode === 'monthly') return year === selectedYear && month === selectedMonth;
      return true;
    });
  }, [data, viewMode, selectedYear, selectedMonth]);

  const filteredProduction = useMemo(() => {
    if (!useProductionData) return [];
    if (viewMode === 'all') return productionData;
    return productionData.filter(entry => {
      const year = entry.date.substring(0, 4);
      const month = entry.date.substring(5, 7);
      if (viewMode === 'annual') return year === selectedYear;
      if (viewMode === 'monthly') return year === selectedYear && month === selectedMonth;
      return true;
    });
  }, [productionData, useProductionData, viewMode, selectedYear, selectedMonth]);

  const displayedData = useProductionData ? filteredProduction : filteredHistory
  // filteredHistory has new entries that survive reload (saved in Supabase via attendHistory).
  // filteredProduction only has the 1,320 static 2024 records â€” new entries are never saved there.
  // All stats and the chart must combine both sources.
  const detailCount = useProductionData
    ? filteredProduction.reduce((sum, entry) => sum + entry.quantity, 0) + filteredHistory.length
    : filteredHistory.length
  const detailLabel = useProductionData ? 'ProducciÃ³n' : 'Procedimientos'

  const totalBajo = alerts?.filter(a => a.type === 'stock')?.length || 0
  const totalVenc = alerts?.filter(a => a.type === 'vencimiento')?.length || 0
  const totalAtenciones = useProductionData
    ? displayedData.reduce((sum, entry) => sum + entry.quantity, 0) + filteredHistory.length
    : displayedData.length

  const historyData = useMemo(() => {
    const counts = {};
    if (useProductionData) {
      // Static historical records (2024) â€” from productionData import
      filteredProduction.forEach(item => {
        const date = item.date?.substring(0, 10);
        if (!date) return;
        counts[date] = (counts[date] || 0) + item.quantity;
      });
      // New attendance entries (2025/2026+) â€” from attendHistory, persisted in Supabase
      filteredHistory.forEach(item => {
        const date = item.fecha?.substring(0, 10);
        if (!date) return;
        counts[date] = (counts[date] || 0) + 1;
      });
    } else {
      filteredHistory.forEach(item => {
        const date = item.fecha?.substring(0, 10);
        if (!date) return;
        counts[date] = (counts[date] || 0) + 1;
      });
    }
    return Object.keys(counts).sort().map(date => ({ date, atenciones: counts[date] }));
  }, [filteredProduction, filteredHistory, useProductionData]);

  const procsData = useMemo(() => {
    const counts = {};
    if (useProductionData) {
      displayedData.forEach(entry => {
        counts[entry.description] = (counts[entry.description] || 0) + entry.quantity;
      });
      filteredHistory.forEach(a => {
        (a.procs || '').split(' + ').forEach(p => {
          if (p && p !== 'Solo Insumos' && p !== 'Insumos Adicionales') counts[p] = (counts[p] || 0) + 1;
        });
      });
    } else {
      displayedData.forEach(a => {
        const procs = a.procs.split(' + ');
        procs.forEach(p => {
          if (p !== 'Solo Insumos' && p !== 'Insumos Adicionales') counts[p] = (counts[p] || 0) + 1;
        });
      });
    }
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10).map(e => ({ name: e[0], cantidad: e[1] }));
  }, [displayedData, filteredHistory, useProductionData]);

  const filteredAttendHistory = useMemo(() => {
    const history = data?.attendHistory || [];
    if (viewMode === 'all') return history;
    return history.filter(a => {
      const year = a.fecha.substring(0, 4);
      const month = a.fecha.substring(5, 7);
      if (viewMode === 'annual') return year === selectedYear;
      if (viewMode === 'monthly') return year === selectedYear && month === selectedMonth;
      return true;
    });
  }, [data, viewMode, selectedYear, selectedMonth]);

  const allProcsData = useMemo(() => {
    const counts = {};
    if (useProductionData) {
      displayedData.forEach(entry => {
        counts[entry.description] = (counts[entry.description] || 0) + entry.quantity;
      });
      filteredHistory.forEach(a => {
        (a.procs || '').split(' + ').forEach(p => {
          if (p && p !== 'Solo Insumos' && p !== 'Insumos Adicionales') counts[p] = (counts[p] || 0) + 1;
        });
      });
    } else {
      displayedData.forEach(a => {
        const procs = a.procs.split(' + ');
        procs.forEach(p => {
          if (p !== 'Solo Insumos' && p !== 'Insumos Adicionales') counts[p] = (counts[p] || 0) + 1;
        });
      });
    }
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).map(e => ({ name: e[0], cantidad: e[1] }));
  }, [displayedData, filteredHistory, useProductionData]);

  const insumosData = useMemo(() => {
    const counts = {};
    filteredAttendHistory.forEach(a => {
      if (!a.ins) return;
      const items = a.ins.split(', ');
      items.forEach(item => {
        const match = item.match(/(.+?)\s*\(\-(.+?)\)/);
        if (match) {
          const name = match[1].trim();
          const qty = parseFloat(match[2]);
          if (!Number.isNaN(qty)) {
            counts[name] = (counts[name] || 0) + qty;
          }
        }
      });
    });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10).map(e => ({ name: e[0], consumo: e[1] }));
  }, [filteredAttendHistory]);

  return (
    <div className="page-content">
      <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <h3>Filtros:</h3>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-input)' }}>
            <option value="all">Todo el HistÃ³rico</option>
            <option value="annual">Vista Anual</option>
            <option value="monthly">Vista Mensual</option>
          </select>
          {(viewMode === 'annual' || viewMode === 'monthly') && (
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-input)' }}>
              {['2024', '2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {viewMode === 'monthly' && (
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-input)' }}>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="kpis" style={{ marginBottom: '20px' }}>
        <div className="kpi"><div className="kpi-label">Insumos CrÃ­ticos</div><div className="kpi-val danger">{totalBajo}</div></div>
        <div className="kpi"><div className="kpi-label">PrÃ³ximos a Vencer</div><div className="kpi-val warning">{totalVenc}</div></div>
        <div className="kpi"><div className="kpi-label">Atenciones Totales</div><div className="kpi-val">{totalAtenciones || 0}</div></div>
      </div>


      <div className="card" style={{ height: '350px', marginBottom: '20px', cursor: 'pointer' }} onDoubleClick={() => setShowDetail(true)}>
        <h3>Flujo de Atenciones (Doble clic para ver TODOS los procedimientos)</h3>
        {historyData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'monthly' ? (
              <BarChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: chartColors.axis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.grid}`, color: chartColors.tooltipText }} />
                <Bar dataKey="atenciones" fill={chartColors.brand} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={historyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="date" tick={{ fill: chartColors.axis }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: chartColors.axis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.grid}`, color: chartColors.tooltipText }} />
                <Area type="monotone" dataKey="atenciones" stroke={chartColors.brand} strokeWidth={3} fill={chartColors.brand} fillOpacity={0.3} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : <p className="empty">No hay datos en este periodo.</p>}
      </div>

      {showDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--overlay-bg)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '80%', height: '80%', background: 'var(--card-bg)', padding: '20px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Detalle Completo de {detailLabel} ({detailCount} registros)</h3>
              <button className="btn" onClick={() => setShowDetail(false)}>Cerrar</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <table className="table">
                <thead><tr><th>Procedimiento</th><th>Cantidad</th></tr></thead>
                <tbody>{allProcsData.map((p, i) => <tr key={i}><td>{p.name}</td><td>{p.cantidad}</td></tr>)}</tbody>
              </table>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allProcsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: chartColors.axis }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={150} fontSize={10} tick={{ fill: chartColors.axis }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.grid}`, color: chartColors.tooltipText }} />
                    <Bar dataKey="cantidad" fill={chartColors.blue} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ height: '350px' }}>
          <h3>Top 10 Procedimientos</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={procsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
              <XAxis type="number" fontSize={12} allowDecimals={false} tick={{ fill: chartColors.axis }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
              <YAxis dataKey="name" type="category" width={120} fontSize={11} tick={{ fill: chartColors.axis }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.grid}`, color: chartColors.tooltipText }} />
              <Bar dataKey="cantidad" fill={chartColors.blue} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ height: '350px' }}>
          <h3>Top 10 Insumos</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={insumosData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
              <XAxis type="number" fontSize={12} tick={{ fill: chartColors.axis }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
              <YAxis dataKey="name" type="category" width={120} fontSize={11} tick={{ fill: chartColors.axis }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: chartColors.tooltipBg, border: `1px solid ${chartColors.grid}`, color: chartColors.tooltipText }} />
              <Bar dataKey="consumo" fill={chartColors.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function BoxesPage({ data, activeBox, setActiveBox, updateInventory, isAdmin, openModal, isPendiente, activeClinic }) {
  const boxes = data?.boxes || []
  const displayBoxes = [{ id: 'BODEGA', name: 'ðŸ“¦ Bodega Central' }, ...boxes]
  const products = data?.products || []

  const [supabase] = useState(() => createClient())
  const [editPanel, setEditPanel] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [stockAdjust, setStockAdjust] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAddBox = () => {
    const name = prompt("Ingrese el nombre del nuevo box (Ej: Box QuirÃºrgico):")
    if (name) {
      const newId = `BOX_${Date.now()}`
      updateInventory({ ...data, boxes: [...boxes, { id: newId, name }] })
      setActiveBox(newId)
    }
  }

  const handleRenameBox = (id, oldName) => {
    const name = prompt("Editar nombre del box:", oldName)
    if (name) updateInventory({ ...data, boxes: boxes.map(b => b.id === id ? { ...b, name } : b) })
  }

  const handleDeleteBox = (id) => {
    if (confirm("Â¿EstÃ¡s seguro de eliminar este box? Esto no borrarÃ¡ los insumos de bodega, pero el box desaparecerÃ¡.")) {
      updateInventory({ ...data, boxes: boxes.filter(b => b.id !== id) })
      setActiveBox('BODEGA')
    }
  }

  const handleEditSave = async (changes) => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/inventory/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clinicKey: activeClinic, productId: editPanel.id, changes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al editar')
      updateInventory({ ...data, products: data.products.map(p => p.id === editPanel.id ? { ...p, ...changes } : p) })
      setEditPanel(null)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStockAdjust = async (productId, changes) => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/inventory/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clinicKey: activeClinic, productId, changes, action: 'ajuste_stock' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al ajustar')
      updateInventory({
        ...data,
        products: data.products.map(p => p.id !== productId ? p : {
          ...p,
          stocks: { ...p.stocks, ...changes.stocks },
          mins:   { ...p.mins,   ...changes.mins   },
        }),
      })
      setStockAdjust(null)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/inventory/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clinicKey: activeClinic, productId: deleteConfirm.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al eliminar')
      updateInventory({ ...data, products: data.products.filter(p => p.id !== deleteConfirm.id) })
      setDeleteConfirm(null)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      {!isPendiente && (
         <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
           <button className="btn btn-primary" onClick={openModal}>+ Agregar / Ajustar Insumo</button>
         </div>
      )}

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
        {displayBoxes.map(box => (
          <div key={box.id} style={{ display: 'flex', background: activeBox === box.id ? 'var(--primary)' : 'var(--bg-secondary)', color: activeBox === box.id ? '#fff' : 'inherit', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <button style={{ padding: '10px 15px', background: 'transparent', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setActiveBox(box.id)}>
              {box.name}
            </button>
            {activeBox === box.id && box.id !== 'BODEGA' && isAdmin && (
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.1)' }}>
                <button style={{ padding: '0 10px', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => handleRenameBox(box.id, box.name)}>âœï¸</button>
                <button style={{ padding: '0 10px', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={() => handleDeleteBox(box.id)}>ðŸ—‘ï¸</button>
              </div>
            )}
          </div>
        ))}
        {isAdmin && (
          <button onClick={handleAddBox} style={{ padding: '10px 15px', background: 'transparent', border: '1px dashed var(--primary)', color: 'var(--primary)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            + Nuevo Box
          </button>
        )}
      </div>

      <div className="card">
        <h3>Inventario en: {displayBoxes.find(b => b.id === activeBox)?.name || 'Seleccione un box'}</h3>
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              {activeBox === 'BODEGA' && <th>CategorÃ­a</th>}
              <th>Stock</th>
              <th>MÃ­nimo</th>
              <th>% Nivel</th>
              {activeBox === 'BODEGA' && <th>Vencimiento</th>}
              {!isPendiente && <th style={{ width: '120px' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const m = p.mins?.[activeBox] ?? 2
              const s = p.stocks?.[activeBox] ?? p[activeBox] ?? 0
              if (activeBox !== 'BODEGA' && m <= 0 && s <= 0) return null
              const pct = m > 0 ? Math.min(100, Math.round(s / m * 100)) : 100
              return (
                <tr key={p.id}>
                  <td>
                    <strong>{p.nombre}</strong>
                    {p.marca && <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px' }}>{p.marca}</small>}
                  </td>
                  {activeBox === 'BODEGA' && <td><span className="badge">{p.cat || 'General'}</span></td>}
                  <td>{s} {s <= m && s > 0 && <span style={{color: 'var(--warning)', marginLeft: '5px'}}>âš ï¸</span>}{s === 0 && <span style={{color: 'var(--danger)', marginLeft: '5px'}}>âŒ</span>}</td>
                  <td>{m}</td>
                  <td><div className="bar" style={{ width: pct + '%' }}></div>{pct}%</td>
                  {activeBox === 'BODEGA' && <td>{p.venc || 'â€”'}</td>}
                  {!isPendiente && (
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button title="Ajuste rÃ¡pido de stock" style={{ padding: '3px 8px', marginRight: '4px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 'bold' }} onClick={() => setStockAdjust(p)}>Â±</button>
                      <button title="Editar" style={{ padding: '3px 8px', marginRight: '4px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px' }} onClick={() => setEditPanel(p)}>âœï¸</button>
                      <button title="Eliminar" style={{ padding: '3px 8px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--danger)' }} onClick={() => setDeleteConfirm(p)}>ðŸ—‘ï¸</button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {stockAdjust && (
        <StockAdjustModal
          product={stockAdjust}
          boxes={boxes}
          saving={saving}
          onSave={handleStockAdjust}
          onClose={() => setStockAdjust(null)}
        />
      )}
      {editPanel && (
        <EditSlidePanel
          product={editPanel}
          boxes={boxes}
          saving={saving}
          onSave={handleEditSave}
          onClose={() => setEditPanel(null)}
        />
      )}
      {deleteConfirm && (
        <DeleteConfirmModal
          product={deleteConfirm}
          saving={saving}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function ComprasPage({ data, openCreate, openReceive }) {
  const [detailPO, setDetailPO] = useState(null);
  const orders = data?.purchaseOrders || []
  
  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>GestiÃ³n de Ã“rdenes de Compra</h3>
        <button className="btn btn-primary" onClick={openCreate}>+ Emitir Nueva Orden</button>
      </div>
      
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '10px' }}>ID Orden</th>
              <th>Fecha EmisiÃ³n</th>
              <th>Proveedor</th>
              <th>Emitido por</th>
              <th>ArtÃ­culos</th>
              <th>Estado</th>
              <th>AcciÃ³n</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((po) => (
              <tr 
                key={po.id} 
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                onDoubleClick={() => setDetailPO(po)} 
                title="Doble clic para ver el detalle de trazabilidad"
              >
                <td style={{ padding: '10px' }}><strong>#{po.id.toString().slice(-6)}</strong></td>
                <td>{po.date}</td>
                <td>{po.provider}</td>
                <td>{po.issuedBy || 'Sistema'}</td>
                <td>{po.items.length} Ã­tem(s)</td>
                <td><span className={`badge ${po.status === 'Pendiente' ? 'warning' : 'good'}`}>{po.status}</span></td>
                <td>
                  {po.status === 'Pendiente' ? (
                    <>
                      <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }} onClick={(e) => { e.stopPropagation(); openReceive(po); }}>Recibir Insumos</button>
                      <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); window.open('/orden_compra_resina.pdf', '_blank'); }}>Orden</button>
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Completada el {po.receivedAt}</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="7" className="empty">No hay Ã³rdenes de compra registradas.</td></tr>}
          </tbody>
        </table>
        <p style={{fontSize: '12px', color: 'var(--text-muted)', marginTop: '15px'}}>ðŸ’¡ <strong>Tip:</strong> Haz doble clic sobre una orden registrada para ver su detalle (insumos, vencimientos y destino).</p>
      </div>

      {detailPO && <PODetailModal po={detailPO} data={data} onClose={() => setDetailPO(null)} />}
    </div>
  )
}

function CreatePOModal({ data, update, onClose, currentUser }) {
  const [po, setPo] = useState({ proveedor: '', items: [{ pname: data?.products?.[0]?.nombre || '', qty: 1 }] });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.purchaseOrders) newData.purchaseOrders = [];
    
    newData.purchaseOrders.unshift({ 
      id: Date.now(), 
      date: new Date().toISOString().split('T')[0], 
      provider: po.proveedor, 
      status: 'Pendiente', 
      items: po.items,
      issuedBy: currentUser?.name || 'Sistema'
    });
    
    update(newData);
    onClose();
  }

  const modalStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--overlay-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
  const cardStyle = { background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', width: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' };
  const inputStyle = { background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-input)', borderRadius: '4px' };

  return (
    <div style={modalStyle}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Emitir Orden de Compra</h2>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Proveedor</label>
          <input placeholder="Nombre del proveedor" style={{ width: '100%', padding: '12px', marginBottom: '20px', ...inputStyle }} onChange={e => setPo({...po, proveedor: e.target.value})} />

          <table style={{ width: '100%', marginBottom: '20px' }}>
            <thead><tr><th style={{ textAlign: 'left', paddingBottom: '10px' }}>Insumo</th><th style={{ textAlign: 'left', paddingBottom: '10px' }}>Cantidad</th></tr></thead>
            <tbody>
              {po.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ paddingRight: '10px' }}>
                    <select style={{ width: '100%', padding: '10px', ...inputStyle }} value={item.pname} onChange={e => { const n = [...po.items]; n[idx].pname = e.target.value; setPo({...po, items: n}) }}>
                      {data?.products?.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    </select>
                  </td>
                  <td><input type="number" style={{ width: '80px', padding: '10px', ...inputStyle }} value={item.qty} onChange={e => { const n = [...po.items]; n[idx].qty = parseInt(e.target.value); setPo({...po, items: n}) }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => setPo({...po, items: [...po.items, { pname: data?.products?.[0]?.nombre, qty: 1 }]})} style={{ padding: '8px 15px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}>+ Agregar Ãtem</button>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'var(--btn-cancel-bg)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ padding: '10px 20px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Emitir Orden</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReceivePOModal({ data, update, po, onClose }) {
  const [receiveData, setReceiveData] = useState(po?.items.map(() => ({ ubicacion: 'BODEGA', venc: '' })) || [])

  const handleSubmit = (e) => {
    e.preventDefault();
    const newData = JSON.parse(JSON.stringify(data));
    const poIndex = newData.purchaseOrders.findIndex(p => p.id === po.id);
    
    po.items.forEach((item, idx) => {
      const product = newData.products.find(p => p.nombre === item.pname);
      const rData = receiveData[idx];

      newData.purchaseOrders[poIndex].items[idx].venc = rData.venc;
      newData.purchaseOrders[poIndex].items[idx].ubicacion = rData.ubicacion;

      if (product) {
        if (!product.stocks) product.stocks = {};
        product.stocks[rData.ubicacion] = (product.stocks[rData.ubicacion] || 0) + item.qty;
        product.venc = rData.venc;
      }
    });

    newData.purchaseOrders[poIndex].status = 'Completada';
    newData.purchaseOrders[poIndex].receivedAt = new Date().toISOString().split('T')[0];
    update(newData); 
    onClose();
  }

  const modalStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--overlay-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
  const cardStyle = { background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', width: '650px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' };
  const inputStyle = { background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-input)', borderRadius: '4px' };

  return (
    <div style={modalStyle}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Recibir Orden #{po?.id.toString().slice(-6)}</h2>
        <form onSubmit={handleSubmit}>
          {po?.items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{item.pname} (x{item.qty})</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Fecha Vencimiento</label>
                  <input type="date" required style={{ width: '100%', padding: '8px', ...inputStyle }} onChange={e => { const n = [...receiveData]; n[idx].venc = e.target.value; setReceiveData(n); }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>UbicaciÃ³n FÃ­sica</label>
                  <select style={{ width: '100%', padding: '8px', ...inputStyle }} onChange={e => { const n = [...receiveData]; n[idx].ubicacion = e.target.value; setReceiveData(n); }}>
                    <option value="BODEGA">Bodega Central</option>
                    {data?.boxes?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'var(--btn-cancel-bg)', color: '#fff', border: 'none', borderRadius: '6px' }}>Cancelar</button>
            <button type="submit" style={{ padding: '10px 20px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: '6px' }}>Confirmar RecepciÃ³n</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PODetailModal({ po, data, onClose }) {
  const modalStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--overlay-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
  const cardStyle = { background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', width: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={cardStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Detalle de Orden #{po.id.toString().slice(-6)}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>âœ–</button>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
          <div><strong>Proveedor:</strong> {po.provider}</div>
          <div><strong>Fecha EmisiÃ³n:</strong> {po.date}</div>
          <div><strong>Emitido por:</strong> {po.issuedBy || 'Sistema'}</div>
          <div><strong>Estado:</strong> <span className={`badge ${po.status === 'Pendiente' ? 'warning' : 'good'}`}>{po.status}</span></div>
          {po.receivedAt && <div style={{gridColumn: '1 / span 2'}}><strong>Fecha RecepciÃ³n:</strong> {po.receivedAt}</div>}
        </div>

        <h4 style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>Insumos Solicitados</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '8px' }}>Insumo</th>
              <th style={{ padding: '8px' }}>Cant.</th>
              <th style={{ padding: '8px' }}>Destino</th>
              <th style={{ padding: '8px' }}>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px' }}>{item.pname}</td>
                <td style={{ padding: '8px' }}>{item.qty}</td>
                <td style={{ padding: '8px' }}>
                  {item.ubicacion ? (item.ubicacion === 'BODEGA' ? 'Bodega Central' : data?.boxes?.find(b => b.id === item.ubicacion)?.name || item.ubicacion) : <span style={{color: 'var(--text-muted)'}}>Pendiente</span>}
                </td>
                <td style={{ padding: '8px' }}>
                  {item.venc ? item.venc : <span style={{color: 'var(--text-muted)'}}>Pendiente</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--btn-cancel-bg)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cerrar Detalles</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: MI PERFIL
// ============================================================================
function ProfileModal({ user, onClose, logout }) {
  const [msg, setMsg] = useState(null)

  const modalStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--overlay-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }
  const cardStyle = { background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }

  return (
    <div style={modalStyle}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: '5px', color: 'var(--text-primary)' }}>Mi Perfil</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '14px' }}>
          <strong>Nombre:</strong> {user?.name} <br/>
          <strong>Correo:</strong> {user?.email} <br/>
          <strong>Rol:</strong> {user?.role}
        </p>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '20px', paddingTop: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'var(--btn-cancel-bg)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cerrar</button>
          <button onClick={logout} style={{ flex: 1, padding: '12px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cerrar SesiÃ³n</button>
        </div>
      </div>
    </div>
  )
}

/*
// ============================================================================
// USUARIOS PAGE - DEPRECATED
// ============================================================================
// Este componente debe ser reimplementado usando las APIs de Supabase
// Ver: pages/api/users/index.js para la gestiÃ³n de usuarios
// Por ahora estÃ¡ comentado ya que depende de funciones removidas
*/

function AlertasPage({ alerts = [] }) {
  const vencimientos = alerts?.filter(a => a.type === 'vencimiento') || []
  const stockBajo = alerts?.filter(a => a.type === 'stock') || []
  return (
    <div className="page-content">
      <div className="card">
        <h3>Vencimientos prÃ³ximos</h3>
        <table><thead><tr><th>Producto</th><th>Vencimiento</th><th>DÃ­as</th><th>Estado</th></tr></thead><tbody>{vencimientos.map((a, i) => <tr key={i}><td>{a.product}</td><td>{a.venc}</td><td>{a.days}d</td><td><span className={`badge ${a.severity}`}>{a.severity}</span></td></tr>)}{vencimientos.length === 0 && <tr><td colSpan="4" className="empty">Sin alertas</td></tr>}</tbody></table>
      </div>
      <div className="card">
        <h3>Stock bajo en Ubicaciones</h3>
        <table><thead><tr><th>Producto</th><th>UbicaciÃ³n</th><th>Stock actual</th><th>MÃ­nimo</th><th>Estado</th></tr></thead><tbody>{stockBajo.map((a, i) => <tr key={i}><td>{a.product}</td><td>{a.box}</td><td>{a.current}</td><td>{a.minimum}</td><td><span className={`badge ${a.severity}`}>{a.severity}</span></td></tr>)}{stockBajo.length === 0 && <tr><td colSpan="5" className="empty">Sin alertas</td></tr>}</tbody></table>
      </div>
    </div>
  )
}

function TransferirPage({ data, updateInventory }) {
  const products = data?.products || []; const boxes = data?.boxes || []
  const [selectedBox, setSelectedBox] = useState(boxes[0]?.id || ''); const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || ''); const [qty, setQty] = useState(1)
  useEffect(() => { if (boxes.length > 0 && !boxes.find(b => b.id === selectedBox)) setSelectedBox(boxes[0].id) }, [boxes, selectedBox])
  const handleTransfer = () => {
    const newData = JSON.parse(JSON.stringify(data)); const newProduct = newData.products?.find(p => p.id === parseInt(selectedProduct))
    if (!newProduct || !selectedBox) return;
    if (!newProduct.stocks) newProduct.stocks = {}; const currentBodega = newProduct.stocks.BODEGA ?? newProduct.BODEGA ?? 0; const currentBox = newProduct.stocks[selectedBox] ?? newProduct[selectedBox] ?? 0
    if (currentBodega >= qty) {
      newProduct.stocks.BODEGA = currentBodega - qty; newProduct.stocks[selectedBox] = currentBox + qty
      if (!newData.transferHistory) newData.transferHistory = []; newData.transferHistory.unshift({ fecha: new Date().toISOString().split('T')[0], destino: boxes.find(b => b.id === selectedBox)?.name || selectedBox, item: newProduct.nombre, qty })
      updateInventory(newData); alert('âœ“ Transferencia registrada')
    } else alert('Stock insuficiente en bodega')
  }
  return (
    <div className="page-content">
      <div className="card">
        <h3>Transferir de Bodega a Box</h3>
        <div className="form-grid">
          <div className="form-group"><label>Box destino</label><select value={selectedBox} onChange={e => setSelectedBox(e.target.value)}>{boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="form-group"><label>Insumo</label><select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>{products.map(p => <option key={p.id} value={p.id}>{p.nombre} (Bodega: {p.stocks?.BODEGA ?? p.BODEGA ?? 0})</option>)}</select></div>
          <div className="form-group"><label>Cantidad</label><input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} min="1" /></div>
        </div>
        <button className="btn btn-primary" onClick={handleTransfer} disabled={boxes.length === 0}>Confirmar transferencia</button>
      </div>
    </div>
  )
}

function ProcedimientosPage({ data, updateInventory, openModal, canManageKits }) {
  const [searchTerm, setSearchTerm] = useState('')
  const deleteProc = (id) => { if (window.confirm('Â¿Eliminar kit?')) updateInventory({ ...data, procedures: data.procedures.filter(p => p.id !== id) }) }
  const filteredProcedures = (data?.procedures || []).filter(proc => proc.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  return (
    <div className="page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ minWidth: '240px' }}>
          <h3 style={{ margin: 0 }}>CatÃ¡logo de Procedimientos (Kits)</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Buscar kit..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', minWidth: '240px' }} />
          {canManageKits && <button className="btn btn-primary" onClick={openModal}>+ Crear Kit</button>}
        </div>
      </div>
      <div className="grid-2">
        {filteredProcedures.length > 0 ? filteredProcedures.map(proc => (
          <div key={proc.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h4 style={{ margin: 0, color: 'var(--primary)' }}>{proc.nombre}</h4>{canManageKits && <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => deleteProc(proc.id)}>X</button>}</div>
            <ul style={{ fontSize: '12px', paddingLeft: '20px', marginTop: '10px' }}>
              {proc.extra?.map((ins, idx) => <li key={idx}>{ins.pname}: <strong>x{ins.qty}</strong></li>)}
            </ul>
          </div>
        )) : <div style={{ width: '100%', padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron kits con ese nombre.</div>}
      </div>
    </div>
  )
}

function RegistrarPage({ data, updateInventory, currentUser, canUseKits }) {
  const boxes = data?.boxes || []
  const [selectedBox, setSelectedBox] = useState(boxes[0]?.id || '')
  const [selectedProcs, setSelectedProcs] = useState([])
  const [patient, setPatient] = useState('')
  const [extraItems, setExtraItems] = useState([])
  const [procSearch, setProcSearch] = useState('')

  useEffect(() => {
    if (boxes.length > 0 && !boxes.find(b => b.id === selectedBox)) setSelectedBox(boxes[0].id)
  }, [boxes, selectedBox])

  const handleRegister = async () => {
    if (!selectedBox) return alert('No hay boxes creados para registrar la atenciÃ³n')
    if (selectedProcs.length === 0 && extraItems.length === 0) return alert('Selecciona al menos un kit o un insumo adicional')
      
    const newData = JSON.parse(JSON.stringify(data)); let logIns = [] 
    const today = new Date()
    const isoDate = today.toISOString().split('T')[0]
    const year = today.getFullYear()
    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const month = monthNames[today.getMonth()] || 'Enero'
    const csvEntries = []

    selectedProcs.forEach(procId => {
      const proc = newData.procedures?.find(p => p.id === procId)
      proc?.extra?.forEach(item => {
        const product = newData.products?.find(p => p.nombre === item.pname)
        if (product) { if (!product.stocks) product.stocks = {}; product.stocks[selectedBox] = Math.max(0, (product.stocks[selectedBox] ?? 0) - item.qty); logIns.push(`${item.pname} (-${item.qty})`) }
      })
      if (proc) {
        csvEntries.push({
          date: isoDate,
          year,
          month,
          code: proc.code || '9999',
          description: proc.nombre,
          quantity: 1
        })
      }
    })

    extraItems.forEach(item => {
      if (item.pname && item.qty > 0) {
        const product = newData.products?.find(p => p.nombre === item.pname)
        if (product) { if (!product.stocks) product.stocks = {}; product.stocks[selectedBox] = Math.max(0, (product.stocks[selectedBox] ?? 0) - item.qty); logIns.push(`${item.pname} (-${item.qty}) [Extra]`) }
      }
    })

    if (selectedProcs.length === 0 && extraItems.length > 0) {
      const totalExtra = extraItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
      csvEntries.push({ date: isoDate, year, month, code: '9999', description: 'Solo Insumos', quantity: totalExtra || 1 })
    }

    if (!newData.attendHistory) newData.attendHistory = []
    const procNames = selectedProcs.map(id => newData.procedures?.find(p => p.id === id)?.nombre)
    if (extraItems.length > 0) procNames.push('Insumos Adicionales')

    newData.attendHistory.unshift({ fecha: isoDate, box: boxes.find(b => b.id === selectedBox)?.name || selectedBox, pac: patient || 'Paciente', procs: procNames.join(' + ') || 'Solo Insumos', ins: logIns.join(', '), user: currentUser?.name || 'Sistema' })

    if (csvEntries.length > 0) {
      // New entries are captured in attendHistory (persisted to Supabase) and sent to
      // /api/append-production. Do NOT push to productionData â€” that field holds only
      // the 1,320 static records and is never saved to Supabase, so pushing there
      // would create in-session data that disappears on F5.
      try {
        const { data: { session } } = await createClient().auth.getSession()
        await fetch('/api/append-production', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ entries: csvEntries })
        })
      } catch (err) {
        console.warn('No se pudo guardar en el historial de procedimientos:', err)
      }
    }

    await updateInventory(newData)
    alert('âœ“ AtenciÃ³n registrada y stock descontado exitosamente')
    setSelectedProcs([]); setExtraItems([]); setPatient('')
  }

  return (
    <div className="page-content">
      <div className="card">
        <h3>Nueva atenciÃ³n</h3>
        <div className="form-grid"><div className="form-group"><label>Box de AtenciÃ³n</label><select value={selectedBox} onChange={e => setSelectedBox(e.target.value)}>{boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="form-group"><label>Paciente</label><input type="text" value={patient} onChange={e => setPatient(e.target.value)} placeholder="Nombre (opcional)" /></div></div>
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Kits Consumidos</label>
          <input type="text" placeholder="Buscar kit para registrar..." value={procSearch} onChange={e => setProcSearch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px' }} />
          <div className="proc-checks">
            {(data?.procedures || []).filter(p => p.nombre.toLowerCase().includes(procSearch.toLowerCase())).map(p => (
              <label key={p.id} className="check-item"><input type="checkbox" disabled={!canUseKits} checked={selectedProcs.includes(p.id)} onChange={e => setSelectedProcs(e.target.checked ? [...selectedProcs, p.id] : selectedProcs.filter(id => id !== p.id))} /> {p.nombre}</label>
            ))}
            {((data?.procedures || []).filter(p => p.nombre.toLowerCase().includes(procSearch.toLowerCase())).length === 0) && <div style={{ color: 'var(--text-secondary)', padding: '10px 0' }}>No se encontrÃ³ ningÃºn kit.</div>}
          </div>
          {!canUseKits && <div style={{ color: 'var(--text-secondary)', marginTop: '10px', fontSize: '13px' }}><strong>Nota:</strong> Tu rol puede ver los kits, pero no puede seleccionarlos para registrar atenciones.</div>}
        </div>
        <div className="form-group" style={{ marginTop: '20px', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Insumos Adicionales (Opcional)</label>
          {extraItems.map((ins, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}><select style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value={ins.pname} onChange={e => { const n = [...extraItems]; n[idx].pname = e.target.value; setExtraItems(n); }}>{data?.products?.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select><input type="number" step="0.1" min="0.1" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value={ins.qty} onChange={e => { const n = [...extraItems]; n[idx].qty = parseFloat(e.target.value) || 0; setExtraItems(n); }} /><button type="button" className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={() => { const n = [...extraItems]; n.splice(idx, 1); setExtraItems(n); }}>X</button></div>
          ))}
          <button type="button" className="btn" style={{ width: '100%', marginTop: '5px', borderStyle: 'dashed' }} onClick={() => setExtraItems([...extraItems, { pname: data?.products[0]?.nombre || '', qty: 1 }])}>+ Agregar insumo suelto</button>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '20px', width: '100%', padding: '15px' }} onClick={handleRegister} disabled={boxes.length === 0}>Finalizar y Descontar Stock</button>
      </div>
    </div>
  )
}

function HistorialPage({ data }) {
  return (
    <div className="page-content">
      <div className="card"><h3>Historial</h3><table><thead><tr><th>Fecha</th><th>Box</th><th>Paciente</th><th>Kits</th><th>Insumos</th><th>Usuario</th></tr></thead><tbody>{data?.attendHistory?.map((a, i) => (<tr key={i}><td>{a.fecha}</td><td>{a.box}</td><td>{a.pac}</td><td style={{fontSize:'12px'}}>{a.procs}</td><td style={{fontSize:'11px'}}>{a.ins}</td><td><span className="badge">{a.user}</span></td></tr>))}{(!data?.attendHistory || data.attendHistory.length === 0) && <tr><td colSpan="6" className="empty">Sin atenciones registradas</td></tr>}</tbody></table></div>
    </div>
  )
}

function EditSlidePanel({ product, boxes, saving, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    const allBoxes = [{ id: 'BODEGA', name: 'Bodega Central' }, ...(boxes || [])]
    const stocks = {}; const mins = {}
    allBoxes.forEach(b => {
      stocks[b.id] = product.stocks?.[b.id] ?? 0
      mins[b.id]   = product.mins?.[b.id]   ?? 2
    })
    return {
      nombre: product.nombre || '',
      cat:    product.cat    || '',
      unidad: product.unidad || '',
      marca:  product.marca  || '',
      venc:   product.venc   || '',
      stocks,
      mins,
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ nombre: form.nombre, cat: form.cat, unidad: form.unidad,
             marca: form.marca, venc: form.venc, stocks: form.stocks, mins: form.mins })
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', zIndex: 200 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: 0, right: 0, width: '420px', maxWidth: '100vw', height: '100%', background: 'var(--card-bg)', zIndex: 201, boxShadow: '-8px 0 32px rgba(0,0,0,0.18)', overflowY: 'auto', padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Editar Insumo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}>Ã—</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          <div className="form-group">
            <label>Nombre del insumo</label>
            <input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Marca / Fabricante</label>
            <input value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} placeholder="Ej: 3M, Septodont, Ultradent" />
          </div>
          <div className="form-group">
            <label>CategorÃ­a</label>
            <input value={form.cat} onChange={e => setForm({...form, cat: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Unidad</label>
            <input value={form.unidad} onChange={e => setForm({...form, unidad: e.target.value})} placeholder="unid, caja, frascoâ€¦" />
          </div>
          <div className="form-group">
            <label>Vencimiento lote</label>
            <input type="date" value={form.venc} onChange={e => setForm({...form, venc: e.target.value})} />
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock por ubicaciÃ³n</p>
            {[{ id: 'BODEGA', name: 'Bodega Central' }, ...(boxes || [])].map(b => (
              <div key={b.id} style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 500 }}>{b.name}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Stock actual</label>
                    <input type="number" min="0" value={form.stocks[b.id] ?? 0}
                      onChange={e => setForm({...form, stocks: {...form.stocks, [b.id]: parseInt(e.target.value) || 0}})}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-input)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>MÃ­nimo</label>
                    <input type="number" min="0" value={form.mins[b.id] ?? 2}
                      onChange={e => setForm({...form, mins: {...form.mins, [b.id]: parseInt(e.target.value) || 0}})}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-input)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={saving}>{saving ? 'Guardandoâ€¦' : 'Guardar'}</button>
            <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancelar</button>
          </div>
        </form>
      </div>
    </>
  )
}

function DeleteConfirmModal({ product, saving, onConfirm, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div className="card" style={{ width: '380px', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>ðŸ—‘ï¸</div>
        <h3 style={{ margin: '0 0 8px' }}>Â¿Eliminar insumo?</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
          EstÃ¡s a punto de eliminar <strong>{product.nombre}</strong>.<br />Esta acciÃ³n no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm} disabled={saving}>{saving ? 'Eliminandoâ€¦' : 'SÃ­, eliminar'}</button>
          <button className="btn" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function StockAdjustModal({ product, boxes, saving, onSave, onClose }) {
  const displayBoxes = [{ id: 'BODEGA', name: 'Bodega Central' }, ...(boxes || [])]
  const [loc, setLoc] = useState('BODEGA')
  const [cantidad, setCantidad] = useState(product.stocks?.['BODEGA'] ?? 0)
  const [minimo, setMinimo] = useState(product.mins?.['BODEGA'] ?? 2)

  const handleLocChange = (newLoc) => {
    setLoc(newLoc)
    setCantidad(product.stocks?.[newLoc] ?? 0)
    setMinimo(product.mins?.[newLoc] ?? 2)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
      <div className="card" style={{ width: '400px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ margin: 0 }}>Ajuste de Stock</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}>Ã—</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{product.nombre}</strong>
          {product.marca && <span> Â· {product.marca}</span>}
        </p>
        <div className="form-group">
          <label>UbicaciÃ³n</label>
          <select value={loc} onChange={e => handleLocChange(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-input)' }}>
            {displayBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Stock actual en {displayBoxes.find(b => b.id === loc)?.name}</label>
          <input type="number" min="0" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 0)} />
        </div>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label>Stock mÃ­nimo</label>
          <input type="number" min="0" value={minimo} onChange={e => setMinimo(parseInt(e.target.value) || 0)} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-success" style={{ flex: 1 }} disabled={saving}
            onClick={() => onSave(product.id, { stocks: { [loc]: cantidad }, mins: { [loc]: minimo } })}>
            {saving ? 'Guardandoâ€¦' : 'Guardar ajuste'}
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

const ACTION_LABELS = {
  agregar_insumo:  { label: 'Agregar',  cls: 'good'    },
  editar_insumo:   { label: 'Editar',   cls: 'warning' },
  eliminar_insumo: { label: 'Eliminar', cls: 'danger'  },
  ajuste_stock:    { label: 'Ajuste',   cls: 'warning' },
}

function AuditLogPage({ activeClinic }) {
  const [supabase]  = useState(() => createClient())
  const [records,  setRecords]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(1)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(false)
  const [filters,  setFilters]  = useState({ action: '', desde: '', hasta: '' })

  const fetchLogs = async (currentPage = 1, currentFilters = filters) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const params = new URLSearchParams({ clinicKey: activeClinic, page: String(currentPage), limit: '20' })
      if (currentFilters.action) params.set('action', currentFilters.action)
      if (currentFilters.desde)  params.set('desde', currentFilters.desde)
      if (currentFilters.hasta)  params.set('hasta', currentFilters.hasta + 'T23:59:59Z')
      const res = await fetch(`/api/inventory/audit-log?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (res.ok) { setRecords(json.records || []); setTotal(json.total || 0); setPages(json.pages || 1) }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs(page, filters) }, [page, activeClinic])

  const handleFilter = (e) => { e.preventDefault(); setPage(1); fetchLogs(1, filters) }
  const handleClear  = () => {
    const empty = { action: '', desde: '', hasta: '' }
    setFilters(empty); setPage(1); fetchLogs(1, empty)
  }

  const exportCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Accion', 'Insumo', 'Sede']
    const rows = records.map(r => [
      new Date(r.created_at).toLocaleString('es-CL'),
      r.user_name || r.user_id || '',
      ACTION_LABELS[r.action]?.label || r.action,
      r.item_name || '',
      r.clinic_key || '',
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['ï»¿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `historial-inventario-${activeClinic}-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const exportPDF = async () => {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
    const doc  = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)
    let pdfPage = doc.addPage([595, 842])
    let y = pdfPage.getSize().height - 40

    pdfPage.drawText('Historial de Inventario - OdonTool', { x: 40, y, font: bold, size: 13, color: rgb(0.06, 0.43, 0.34) })
    y -= 18
    pdfPage.drawText(`Sucursal: ${activeClinic}   Fecha: ${new Date().toLocaleDateString('es-CL')}`, { x: 40, y, font, size: 9, color: rgb(0.4, 0.4, 0.4) })
    y -= 28

    const cols = [40, 140, 270, 350, 450]
    const hdrs = ['Fecha', 'Usuario', 'Accion', 'Insumo', 'Sede']
    hdrs.forEach((h, i) => pdfPage.drawText(h, { x: cols[i], y, font: bold, size: 9, color: rgb(0, 0, 0) }))
    y -= 14

    for (const r of records) {
      if (y < 60) { pdfPage = doc.addPage([595, 842]); y = pdfPage.getSize().height - 40 }
      const row = [
        new Date(r.created_at).toLocaleDateString('es-CL'),
        (r.user_name || (r.user_id || '').slice(0, 16)),
        (ACTION_LABELS[r.action]?.label || r.action),
        (r.item_name  || '').slice(0, 22),
        (r.clinic_key || ''),
      ]
      row.forEach((v, i) => pdfPage.drawText(String(v), { x: cols[i], y, font, size: 8, color: rgb(0.1, 0.1, 0.1) }))
      y -= 13
    }

    const bytes = await doc.save()
    const blob  = new Blob([bytes], { type: 'application/pdf' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `historial-inventario-${activeClinic}-${new Date().toISOString().slice(0,10)}.pdf`
    a.click()
  }

  const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-input)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }

  return (
    <div className="page-content">
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>AcciÃ³n</label>
          <select value={filters.action} onChange={e => setFilters({...filters, action: e.target.value})} style={inputStyle}>
            <option value="">Todas</option>
            <option value="agregar_insumo">Agregar</option>
            <option value="editar_insumo">Editar</option>
            <option value="eliminar_insumo">Eliminar</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Desde</label>
          <input type="date" value={filters.desde} onChange={e => setFilters({...filters, desde: e.target.value})} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Hasta</label>
          <input type="date" value={filters.hasta} onChange={e => setFilters({...filters, hasta: e.target.value})} style={inputStyle} />
        </div>
        <button type="submit" className="btn btn-primary">Filtrar</button>
        <button type="button" className="btn" onClick={handleClear}>Limpiar</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button type="button" className="btn" onClick={exportCSV} disabled={records.length === 0}>â¬‡ CSV</button>
          <button type="button" className="btn" onClick={exportPDF} disabled={records.length === 0}>â¬‡ PDF</button>
        </div>
      </form>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>Registros ({total})</h3>
        </div>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px 0' }}>Cargandoâ€¦</p>
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>AcciÃ³n</th>
                <th>Insumo</th>
                <th>Sede</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const act = ACTION_LABELS[r.action] || { label: r.action, cls: '' }
                return (
                  <tr key={r.id}>
                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString('es-CL')}</td>
                    <td>{r.user_name || (r.user_id || '').slice(0, 8)}</td>
                    <td><span className={`badge ${act.cls}`}>{act.label}</span></td>
                    <td><strong>{r.item_name || 'â€”'}</strong></td>
                    <td>{r.clinic_key || 'â€”'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.details ? JSON.stringify(r.details).slice(0, 60) + 'â€¦' : 'â€”'}
                    </td>
                  </tr>
                )
              })}
              {records.length === 0 && (
                <tr><td colSpan={6} className="empty">Sin registros para los filtros seleccionados</td></tr>
              )}
            </tbody>
          </table>
        )}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <button className="btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>â† Anterior</button>
            <span style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>PÃ¡g {page} / {pages}</span>
            <button className="btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Siguiente â†’</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductModal({ data, update, onClose, isNew, setIsNew, activeBox, activeClinic }) {
  const products = data?.products || []; const boxes = data?.boxes || []
  const [form, setForm] = useState({ nombre: '', ubicacion: activeBox, cantidad: 0, venc: '', marca: '', cat: '', unidad: '', existenteId: products[0]?.id || '' })
  const [supabase] = useState(() => createClient())
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (isNew) {
        const newProd = { id: Date.now(), nombre: form.nombre, cat: form.cat, unidad: form.unidad, marca: form.marca, venc: form.venc, stocks: { BODEGA: 0 }, mins: { BODEGA: 5 } }
        boxes.forEach(b => { newProd.stocks[b.id] = 0; newProd.mins[b.id] = 2 })
        newProd.stocks[form.ubicacion] = parseInt(form.cantidad)
        const res = await fetch('/api/inventory/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ clinicKey: activeClinic, product: newProd }),
        })
        const json = await res.json()
        if (!res.ok) { alert('Error: ' + (json.error || 'Error al agregar')); return }
        update({ ...data, products: [...(data.products || []), json.product] })
        alert('Insumo agregado exitosamente')
        onClose()
      } else {
        const producto = data.products.find(p => p.id == form.existenteId)
        const changes = {
          stocks: { [form.ubicacion]: (producto?.stocks?.[form.ubicacion] || 0) + parseInt(form.cantidad) },
          venc: form.venc,
        }
        const res = await fetch('/api/inventory/items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ clinicKey: activeClinic, productId: form.existenteId, changes, action: 'ajuste_stock' }),
        })
        const json = await res.json()
        if (!res.ok) { alert('Error: ' + (json.error || 'Error al ajustar')); return }
        update({
          ...data,
          products: data.products.map(p => p.id != form.existenteId ? p : {
            ...p,
            stocks: { ...p.stocks, ...changes.stocks },
            venc: changes.venc,
          }),
        })
        alert('Ajuste guardado exitosamente')
        onClose()
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--overlay-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '400px', padding: '30px' }}>
        <h3>Ajuste Manual de Insumo</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}><button type="button" className={`btn ${!isNew ? 'btn-primary' : ''}`} onClick={() => setIsNew(false)} style={{flex:1}}>Existente</button><button type="button" className={`btn ${isNew ? 'btn-primary' : ''}`} onClick={() => setIsNew(true)} style={{flex:1}}>Nuevo</button></div>
        <form onSubmit={handleSubmit}>
          {isNew ? (
            <>
              <div className="form-group"><label>Nombre del insumo</label><input type="text" required onChange={e => setForm({...form, nombre: e.target.value})} /></div>
              <div className="form-group"><label>Marca / Fabricante</label><input type="text" placeholder="Ej: 3M, Septodont, Ultradent" onChange={e => setForm({...form, marca: e.target.value})} /></div>
              <div className="form-group"><label>CategorÃ­a</label><input type="text" placeholder="Ej: Resina, Anestesia" onChange={e => setForm({...form, cat: e.target.value})} /></div>
              <div className="form-group"><label>Unidad</label><input type="text" placeholder="unid, caja, frascoâ€¦" onChange={e => setForm({...form, unidad: e.target.value})} /></div>
            </>
          ) : (
            <div className="form-group"><label>Insumo</label><select onChange={e => setForm({...form, existenteId: e.target.value})}>{products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
          )}
          <div className="form-group">
            <label>Stock inicial en: <strong>{[{id:'BODEGA',name:'Bodega Central'},...boxes].find(b => b.id === form.ubicacion)?.name || form.ubicacion}</strong></label>
            <select value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})}>
              <option value="BODEGA">Bodega Central</option>
              {boxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Cantidad a sumar</label><input type="number" min="1" required onChange={e => setForm({...form, cantidad: e.target.value})} /></div>
          <div className="form-group" style={{ marginBottom: '20px' }}><label>Vencimiento lote</label><input type="date" required onChange={e => setForm({...form, venc: e.target.value})} /></div>
          <div style={{ display: 'flex', gap: '10px' }}><button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button><button type="button" className="btn" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancelar</button></div>
        </form>
      </div>
    </div>
  )
}

function ProcedureModal({ data, update, onClose }) {
  const [name, setName] = useState(''); const [insumos, setInsumos] = useState([])
  const handleSubmit = (e) => { e.preventDefault(); update({ ...data, procedures: [...(data?.procedures||[]), { id: Date.now(), nombre: name, extra: insumos }] }); alert('âœ“ Kit creado exitosamente'); onClose() }
  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--overlay-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}><div className="card" style={{ width: '400px' }}><h3>Crear Kit</h3><form onSubmit={handleSubmit}><div className="form-group"><label>Nombre del Kit</label><input type="text" required onChange={e => setName(e.target.value)} /></div><div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}><label>Insumos a descontar:</label>{insumos.map((ins, idx) => (<div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px', marginTop: '5px' }}><select style={{ flex: 2, padding: '8px', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-input)' }} value={ins.pname} onChange={e => { const n = [...insumos]; n[idx].pname = e.target.value; setInsumos(n) }}>{data?.products?.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select><input style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-input)' }} type="number" step="0.1" value={ins.qty} onChange={e => { const n = [...insumos]; n[idx].qty = e.target.value; setInsumos(n) }} /><button type="button" className="btn btn-danger" style={{padding: '0 10px'}} onClick={() => { const n = [...insumos]; n.splice(idx, 1); setInsumos(n); }}>X</button></div>))}<button type="button" className="btn" style={{width: '100%', marginTop: '10px', borderStyle: 'dashed'}} onClick={() => setInsumos([...insumos, { pname: data?.products[0]?.nombre, qty: 1 }])}>+ Agregar insumo a la receta</button></div><div style={{ display: 'flex', gap: '10px' }}><button type="submit" className="btn btn-primary" style={{flex: 1}}>Guardar Kit</button> <button type="button" className="btn" style={{flex: 1}} onClick={onClose}>Cancelar</button></div></form></div></div>
  )
}

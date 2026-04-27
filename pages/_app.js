import '../styles/globals.css'
import { createContext, useContext, useEffect, useState } from 'react'

// Contexto de autenticación y datos
const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [inventoryData, setInventoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, synced

  // Cargar datos al inicializar
  useEffect(() => {
    const stored = localStorage.getItem('Odontool-user')
    const storedData = localStorage.getItem('Odontool-inventory')
    
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem('Odontool-user')
      }
    }
    
    if (storedData) {
      try {
        setInventoryData(JSON.parse(storedData))
      } catch (e) {
        localStorage.removeItem('Odontool-inventory')
        setInventoryData(null)
      }
    } else {
      setInventoryData(getDefaultData())
    }
    
    setLoading(false)
  }, [])

  // Guardar datos cuando cambian
  useEffect(() => {
    if (inventoryData && !loading) {
      localStorage.setItem('Odontool-inventory', JSON.stringify(inventoryData))
    }
  }, [inventoryData, loading])

  const login = (email, password) => {
    const newUser = {
      id: Date.now(),
      email,
      name: email.split('@')[0],
      role: 'admin',
      loginAt: new Date().toISOString()
    }
    setUser(newUser)
    localStorage.setItem('Odontool-user', JSON.stringify(newUser))
    return newUser
  }

  const register = (name, email, phone, password) => {
    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      role: 'admin',
      createdAt: new Date().toISOString()
    }
    setUser(newUser)
    localStorage.setItem('Odontool-user', JSON.stringify(newUser))
    return newUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('Odontool-user')
  }

  const updateInventory = (data) => {
    setInventoryData(data)
  }

  const syncData = async () => {
    setSyncStatus('syncing')
    // Simular sincronización con servidor
    await new Promise(r => setTimeout(r, 1000))
    setSyncStatus('synced')
    setTimeout(() => setSyncStatus('idle'), 3000)
  }

  const resetInventory = () => {
    setInventoryData(getDefaultData())
  }

  const value = {
    user,
    login,
    register,
    logout,
    inventoryData,
    updateInventory,
    syncData,
    syncStatus,
    resetInventory,
    loading
  }

  return (
    <AppContext.Provider value={value}>
      <Component {...pageProps} />
    </AppContext.Provider>
  )
}

function getDefaultData() {
  let pid = 1
  const mkp = (nombre, cat, unidad, venc, stocks, mins) => ({
    id: pid++, nombre, cat, unidad, venc,
    stocks: { ...stocks },
    mins: { ...mins }
  })
  const db = (v, extra = {}) => {
    const o = { BODEGA: 0 }
    for (let i = 1; i <= 7; i++) o[`BOX${i}`] = v
    return { ...o, ...extra }
  }
  const dm = (v, bv, extra = {}) => {
    const o = { BODEGA: bv }
    for (let i = 1; i <= 7; i++) o[`BOX${i}`] = v
    return { ...o, ...extra }
  }

  return {
    products: [
      mkp('Anestesia lidocaína 2%', 'Anestesia', 'carpules', '2026-08-01', db(20, { BODEGA: 100 }), dm(20, 50)),
      mkp('Anestesia articaína 3%', 'Anestesia', 'carpules', '2026-06-15', db(20, { BODEGA: 80 }), dm(20, 50)),
      mkp('Guantes látex M', 'Protección', 'cajas', '2027-01-01', db(2, { BODEGA: 15, BOX5: 1 }), dm(2, 10)),
      mkp('Mascarilla triple capa', 'Protección', 'unidades', '2028-01-01', db(30, { BODEGA: 500, BOX5: 20 }), dm(20, 200)),
      mkp('Pechera desechable', 'Protección', 'unidades', '2028-01-01', db(20, { BODEGA: 300, BOX5: 8 }), dm(15, 100)),
      mkp('Boquilla de succión', 'Higiene', 'unidades', '2027-06-01', db(20, { BODEGA: 200 }), dm(15, 80)),
      mkp('Agujas cortas 27G', 'Anestesia', 'unidades', '2027-03-01', db(20, { BODEGA: 300 }), dm(20, 100)),
      mkp('Agujas largas 27G', 'Anestesia', 'unidades', '2027-03-01', db(20, { BODEGA: 300 }), dm(20, 100)),
      mkp('Algodones (tubo/pack)', 'Algodón', 'packs', '2028-01-01', db(2, { BODEGA: 20 }), dm(2, 10)),
      mkp('Pinceles (pack)', 'Instrumental', 'packs', '2027-12-01', db(1, { BODEGA: 10 }), dm(1, 5)),
      mkp('Pick and Stick (pack)', 'Instrumental', 'packs', '2027-12-01', db(1, { BODEGA: 10 }), dm(1, 5)),
      mkp('Resina compuesta', 'Resinas', 'jeringas', '2026-04-30', db(5, { BODEGA: 20 }), dm(5, 10)),
      mkp('Oclufast', 'Instrumental', 'unidades', '2026-09-01', db(2, { BODEGA: 10 }), dm(2, 5)),
      mkp('Silicona pesada/fluida (caja)', 'Silicona', 'cajas', '2026-11-01', db(1, { BODEGA: 8 }), dm(1, 4)),
      mkp('Alcohol etílico (botella)', 'Alcohol/Suero', 'botellas', '2027-01-01', db(1, { BODEGA: 14 }), dm(1, 7)),
      mkp('Suero fisiológico', 'Alcohol/Suero', 'unidades', '2026-12-01', db(2, { BODEGA: 20 }), dm(2, 10)),
      mkp('Set de higiene', 'Higiene', 'sets', '2028-01-01', { BODEGA: 30, BOX1: 3, BOX2: 3, BOX3: 3, BOX4: 0, BOX5: 0, BOX6: 0, BOX7: 0 }, { BODEGA: 10, BOX1: 3, BOX2: 3, BOX3: 3, BOX4: 0, BOX5: 0, BOX6: 0, BOX7: 0 }),
    ],
    procedures: [
      { id: 1, nombre: 'Consulta / revisión', extra: [] },
      { id: 2, nombre: 'Anestesia infiltrativa', extra: [{ pname: 'Anestesia lidocaína 2%', qty: 1 }, { pname: 'Agujas cortas 27G', qty: 1 }] },
      { id: 3, nombre: 'Anestesia troncular', extra: [{ pname: 'Anestesia articaína 3%', qty: 1 }, { pname: 'Agujas largas 27G', qty: 1 }] },
      { id: 4, nombre: 'Obturación con resina', extra: [{ pname: 'Resina compuesta', qty: 1 }, { pname: 'Pinceles (pack)', qty: 0.1 }] },
      { id: 5, nombre: 'Impresión con silicona', extra: [{ pname: 'Silicona pesada/fluida (caja)', qty: 0.2 }, { pname: 'Oclufast', qty: 1 }] },
      { id: 6, nombre: 'Higiene dental', extra: [{ pname: 'Set de higiene', qty: 1 }] },
    ],
    transferHistory: [],
    attendHistory: [],
    nextPid: 18,
    nextProcId: 7
  }
}

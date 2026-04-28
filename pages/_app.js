import '../styles/globals.css'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// Contexto de autenticación y datos
const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [inventoryData, setInventoryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle') // idle, syncing, synced

  // Cargar datos al inicializar
  useEffect(() => {
    const stored = localStorage.getItem('dentastock-user')
    const storedData = localStorage.getItem('dentastock-inventory')
    
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored)
        // REGLA DE SEGURIDAD: Limpia usuarios antiguos que no sean @auil.cl
        if (parsedUser.email && !parsedUser.email.toLowerCase().endsWith('@auil.cl')) {
          localStorage.removeItem('dentastock-user')
          setUser(null)
        } else {
          setUser(parsedUser)
        }
      } catch (e) {
        localStorage.removeItem('dentastock-user')
      }
    }
    
    if (storedData) {
      try {
        setInventoryData(JSON.parse(storedData))
      } catch (e) {
        localStorage.removeItem('dentastock-inventory')
        setInventoryData(null)
      }
    } else {
      setInventoryData(getDefaultData())
    }
    
    setLoading(false)
  }, [])

  // GUARDIA DE RUTAS GLOBAL
  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/', '/login']
      const pathIsPublic = publicPaths.includes(router.pathname)

      if (!pathIsPublic && (!user || !user.email.toLowerCase().endsWith('@auil.cl'))) {
        router.push('/login')
      }
    }
  }, [user, loading, router.pathname])

  // Guardar datos cuando cambian
  useEffect(() => {
    if (inventoryData && !loading) {
      localStorage.setItem('dentastock-inventory', JSON.stringify(inventoryData))
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
    localStorage.setItem('dentastock-user', JSON.stringify(newUser))
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
    localStorage.setItem('dentastock-user', JSON.stringify(newUser))
    return newUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('dentastock-user')
    router.push('/login')
  }

  const updateInventory = (data) => {
    setInventoryData(data)
  }

  const syncData = async () => {
    setSyncStatus('syncing')
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
      mkp('Guantes látex M', 'Protección', 'cajas', '2027-01-01', db(10, { BODEGA: 50, BOX5: 1 }), dm(2, 10)),
      mkp('Mascarilla triple capa', 'Protección', 'unidades', '2028-01-01', db(30, { BODEGA: 500, BOX5: 20 }), dm(20, 200)),
      mkp('Pechera desechable', 'Protección', 'unidades', '2028-01-01', db(20, { BODEGA: 300, BOX5: 8 }), dm(15, 100)),
      mkp('Boquilla de succión', 'Higiene', 'unidades', '2027-06-01', db(20, { BODEGA: 200 }), dm(15, 80)),
      mkp('Agujas cortas 27G', 'Anestesia', 'unidades', '2027-03-01', db(20, { BODEGA: 300 }), dm(20, 100)),
      mkp('Agujas largas 27G', 'Anestesia', 'unidades', '2027-03-01', db(20, { BODEGA: 300 }), dm(20, 100)),
      mkp('Algodones (tubo/pack)', 'Algodón', 'packs', '2028-01-01', db(2, { BODEGA: 20 }), dm(2, 10)),
      mkp('Pinceles (pack)', 'Instrumental', 'packs', '2027-12-01', db(5, { BODEGA: 20 }), dm(1, 5)),
      mkp('Pick and Stick (pack)', 'Instrumental', 'packs', '2027-12-01', db(1, { BODEGA: 10 }), dm(1, 5)),
      mkp('Resina compuesta', 'Resinas', 'jeringas', '2026-04-30', db(5, { BODEGA: 20 }), dm(5, 10)),
      mkp('Oclufast', 'Instrumental', 'unidades', '2026-09-01', db(2, { BODEGA: 10 }), dm(2, 5)),
      mkp('Silicona pesada/fluida (caja)', 'Silicona', 'cajas', '2026-11-01', db(1, { BODEGA: 8 }), dm(1, 4)),
      mkp('Alcohol etílico (botella)', 'Alcohol/Suero', 'botellas', '2027-01-01', db(1, { BODEGA: 14 }), dm(1, 7)),
      mkp('Suero fisiológico', 'Alcohol/Suero', 'unidades', '2026-12-01', db(2, { BODEGA: 20 }), dm(2, 10)),
      mkp('Set de higiene', 'Higiene', 'sets', '2028-01-01', { BODEGA: 30, BOX1: 3, BOX2: 3, BOX3: 3, BOX4: 0, BOX5: 0, BOX6: 0, BOX7: 0 }, { BODEGA: 10, BOX1: 3, BOX2: 3, BOX3: 3, BOX4: 0, BOX5: 0, BOX6: 0, BOX7: 0 }),
      // Insumos específicos para Blanqueamiento:
      mkp('Separador de boca plástico', 'Insumos Clínicos', 'unidades', '2027-05-01', db(5, { BODEGA: 20 }), dm(2, 5)),
      mkp('Pincel dental', 'Insumos Clínicos', 'unidades', '2028-01-01', db(10, { BODEGA: 50 }), dm(2, 10)),
      mkp('Jeringa Blanqueamiento', 'Insumos Clínicos', 'unidades', '2026-12-01', db(5, { BODEGA: 15 }), dm(1, 5)),
      mkp('Protector gingival', 'Insumos Clínicos', 'unidades', '2027-02-01', db(5, { BODEGA: 10 }), dm(1, 3)),
    ],
    procedures: [
      { 
        id: 1, 
        nombre: 'Consulta / revisión', 
        extra: [
          { pname: 'Mascarilla triple capa', qty: 2 },
          { pname: 'Guantes látex M', qty: 2 },
          { pname: 'Pechera desechable', qty: 1 },
          { pname: 'Boquilla de succión', qty: 2 }
        ] 
      },
      { 
        id: 2, 
        nombre: 'Anestesia infiltrativa', 
        extra: [
          { pname: 'Mascarilla triple capa', qty: 2 },
          { pname: 'Guantes látex M', qty: 2 },
          { pname: 'Pechera desechable', qty: 1 },
          { pname: 'Boquilla de succión', qty: 2 },
          { pname: 'Anestesia lidocaína 2%', qty: 1 }, 
          { pname: 'Agujas cortas 27G', qty: 1 }
        ] 
      },
      { 
        id: 3, 
        nombre: 'Anestesia troncular', 
        extra: [
          { pname: 'Mascarilla triple capa', qty: 2 },
          { pname: 'Guantes látex M', qty: 2 },
          { pname: 'Pechera desechable', qty: 1 },
          { pname: 'Boquilla de succión', qty: 2 },
          { pname: 'Anestesia articaína 3%', qty: 1 }, 
          { pname: 'Agujas largas 27G', qty: 1 }
        ] 
      },
      { 
        id: 4, 
        nombre: 'Obturación con resina', 
        extra: [
          { pname: 'Mascarilla triple capa', qty: 2 },
          { pname: 'Guantes látex M', qty: 2 },
          { pname: 'Pechera desechable', qty: 1 },
          { pname: 'Boquilla de succión', qty: 2 },
          { pname: 'Resina compuesta', qty: 1 }, 
          { pname: 'Pinceles (pack)', qty: 1 }
        ] 
      },
      { 
        id: 5, 
        nombre: 'Impresión con silicona', 
        extra: [
          { pname: 'Mascarilla triple capa', qty: 2 },
          { pname: 'Guantes látex M', qty: 2 },
          { pname: 'Pechera desechable', qty: 1 },
          { pname: 'Boquilla de succión', qty: 2 },
          { pname: 'Silicona pesada/fluida (caja)', qty: 1 }, 
          { pname: 'Oclufast', qty: 1 }
        ] 
      },
      { 
        id: 6, 
        nombre: 'Blanqueamiento Dental', 
        extra: [
          // Set Básico
          { pname: 'Mascarilla triple capa', qty: 2 },
          { pname: 'Guantes látex M', qty: 2 },
          { pname: 'Pechera desechable', qty: 1 },
          { pname: 'Boquilla de succión', qty: 2 },
          // Insumos Específicos
          { pname: 'Separador de boca plástico', qty: 1 },
          { pname: 'Pincel dental', qty: 1 },
          { pname: 'Jeringa Blanqueamiento', qty: 1 },
          { pname: 'Protector gingival', qty: 1 }
        ] 
      },
    ],
    transferHistory: [],
    attendHistory: [],
    nextPid: 22,
    nextProcId: 7
  }
}
import '../styles/globals.css'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  
  const [inventories, setInventories] = useState(null)
  const [activeClinic, setActiveClinic] = useState('loBarnechea')
  
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle')

  const [usersDb, setUsersDb] = useState([])

  useEffect(() => {
    const storedUser = localStorage.getItem('dentastock-user')
    const storedInventories = localStorage.getItem('odontool-multiclinic')
    const storedUsers = localStorage.getItem('odontool_users')
    
    if (storedUsers) {
      setUsersDb(JSON.parse(storedUsers))
    } else {
      const defaultUsers = [
        { id: 1, name: 'Administrador Auil', email: 'admin@auil.cl', phone: '+56900000000', password: 'admin', role: 'admin' },
        { id: 2, name: 'Dr. Roberto Auil', email: 'doctor@auil.cl', phone: '+56911111111', password: 'doctor', role: 'clinico' },
        { id: 3, name: 'Asistente Dental', email: 'asistente@auil.cl', phone: '+56922222222', password: 'asistente', role: 'asistente' }
      ]
      localStorage.setItem('odontool_users', JSON.stringify(defaultUsers))
      setUsersDb(defaultUsers)
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
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
    
    if (storedInventories) {
      try {
        setInventories(JSON.parse(storedInventories))
      } catch (e) {
        localStorage.removeItem('odontool-multiclinic')
        initializeDefaultClinics()
      }
    } else {
      initializeDefaultClinics()
    }
    
    setLoading(false)
  }, [])

  const initializeDefaultClinics = () => {
    setInventories({
      loBarnechea: getDefaultData('loBarnechea'),
      alcantara: getDefaultData('alcantara')
    })
  }

  useEffect(() => {
    if (!loading) {
      const publicPaths = ['/', '/login']
      const pathIsPublic = publicPaths.includes(router.pathname)

      if (!pathIsPublic && (!user || !user.email.toLowerCase().endsWith('@auil.cl'))) {
        router.push('/login')
      }
    }
  }, [user, loading, router.pathname])

  useEffect(() => {
    if (inventories && !loading) {
      localStorage.setItem('odontool-multiclinic', JSON.stringify(inventories))
    }
  }, [inventories, loading])

  const registerNewUser = (name, email, role, password) => {
    if (usersDb.find(u => u.email === email)) return { error: 'El correo ya está registrado.' }
    const newUser = { id: Date.now(), name, email, role, password }
    const updated = [...usersDb, newUser]
    setUsersDb(updated)
    localStorage.setItem('odontool_users', JSON.stringify(updated))
    return { success: true }
  }

  const deleteUser = (id) => {
    const updated = usersDb.filter(u => u.id !== id)
    setUsersDb(updated)
    localStorage.setItem('odontool_users', JSON.stringify(updated))
    return { success: true }
  }

  // NUEVA FUNCIÓN: ACTUALIZAR CONTRASEÑA
  const updatePassword = (userEmail, oldPassword, newPassword) => {
    const userIndex = usersDb.findIndex(u => u.email === userEmail);
    if (userIndex === -1) return { error: 'Usuario no encontrado en la base de datos.' };
    
    if (usersDb[userIndex].password !== oldPassword) {
      return { error: 'La contraseña actual es incorrecta.' };
    }

    const updatedUsers = [...usersDb];
    updatedUsers[userIndex].password = newPassword;
    setUsersDb(updatedUsers);
    localStorage.setItem('odontool_users', JSON.stringify(updatedUsers));
    return { success: true };
  }

  const login = (userData) => {
    let newUser;
    if (typeof userData === 'string') {
      newUser = { id: Date.now(), email: userData, name: userData.split('@')[0], role: 'admin', loginAt: new Date().toISOString() }
    } else {
      newUser = { ...userData, id: userData.id || Date.now(), loginAt: new Date().toISOString() }
    }
    setUser(newUser)
    localStorage.setItem('dentastock-user', JSON.stringify(newUser))
    return newUser
  }

  const register = (userDataOrName, email, phone, password) => {
    let newUser;
    if (typeof userDataOrName === 'object' && userDataOrName !== null) {
      newUser = { ...userDataOrName, id: userDataOrName.id || Date.now(), createdAt: new Date().toISOString() }
    } else {
      newUser = { id: Date.now(), name: userDataOrName, email, phone, role: 'clinico', createdAt: new Date().toISOString() }
    }
    setUser(newUser)
    localStorage.setItem('dentastock-user', JSON.stringify(newUser))
    return newUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('dentastock-user')
    localStorage.removeItem('odontool_session')
    router.push('/login')
  }

  const updateInventory = (data) => {
    setInventories(prev => ({ ...prev, [activeClinic]: data }))
  }

  const switchClinic = (clinicKey) => {
    setActiveClinic(clinicKey)
  }

  const syncData = async () => {
    setSyncStatus('syncing')
    await new Promise(r => setTimeout(r, 1000))
    setSyncStatus('synced')
    setTimeout(() => setSyncStatus('idle'), 3000)
  }

  const resetInventory = () => {
    initializeDefaultClinics()
  }

  const inventoryData = inventories ? inventories[activeClinic] : null
  
  const importHistoricalData = (csvText) => {
    const lines = csvText.split('\n');
    const newRecords = [];
    const months = { "Enero": "01", "Febrero": "02", "Marzo": "03", "Abril": "04", "Mayo": "05", "Junio": "06", "Julio": "07", "Agosto": "08", "Septiembre": "09", "Octubre": "10", "Noviembre": "11", "Diciembre": "12" };

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(';');
      if (row.length < 5) continue; 
      const [year, monthName, code, desc, qty] = row;
      const quantity = parseInt(qty) || 0;
      const dateStr = `${year}-${months[monthName] || '01'}-01`;
      for(let j = 0; j < quantity; j++) {
        newRecords.push({ fecha: dateStr, box: 'BODEGA', pac: 'Paciente Histórico', procs: desc ? desc.trim() : "Procedimiento", ins: '', user: 'Histórico 2024-25' });
      }
    }

    setInventories(prev => {
      const updated = { ...prev };
      if (!updated[activeClinic].attendHistory) updated[activeClinic].attendHistory = [];
      updated[activeClinic].attendHistory = [...updated[activeClinic].attendHistory, ...newRecords];
      localStorage.setItem('odontool-multiclinic', JSON.stringify(updated));
      return updated;
    });
    alert(`✓ Importación exitosa: ${newRecords.length} registros añadidos.`);
  };

  const value = {
    user, login, register, logout, inventoryData, updateInventory,
    activeClinic, switchClinic, syncData, syncStatus, resetInventory, loading, importHistoricalData,
    usersDb, registerNewUser, deleteUser, updatePassword // Exportamos la nueva función
  }

  return (
    <AppContext.Provider value={value}>
      <Component {...pageProps} />
    </AppContext.Provider>
  )
}

function getDefaultData(clinicKey) {
  const isLoBarnechea = clinicKey === 'loBarnechea';
  const numBoxes = isLoBarnechea ? 7 : 5;
  const boxes = [];
  
  for (let i = 1; i <= numBoxes; i++) {
    boxes.push({ id: `BOX${i}`, name: `Box ${i}` });
  }

  let pid = 1
  const mkp = (nombre, cat, unidad, venc, stocks, mins) => ({ id: pid++, nombre, cat, unidad, venc, stocks: { ...stocks }, mins: { ...mins } })
  const db = (v, extra = {}) => { const o = { BODEGA: 0 }; boxes.forEach(b => o[b.id] = v); return { ...o, ...extra } }
  const dm = (v, bv, extra = {}) => { const o = { BODEGA: bv }; boxes.forEach(b => o[b.id] = v); return { ...o, ...extra } }

  return {
    clinicName: isLoBarnechea ? 'Clínica Lo Barnechea' : 'Clínica Alcántara',
    boxes: boxes, 
    providers: [{ id: 1, name: 'DentalMed Chile' }, { id: 2, name: '3M Odontología' }, { id: 3, name: 'Insumos Clínicos SpA' }],
    purchaseOrders: [], 
    products: [
      mkp('Anestesia lidocaína 2%', 'Anestesia', 'carpules', '2026-08-01', db(20, { BODEGA: 100 }), dm(20, 50)),
      mkp('Anestesia articaína 3%', 'Anestesia', 'carpules', '2026-06-15', db(20, { BODEGA: 80 }), dm(20, 50)),
      mkp('Guantes látex M', 'Protección', 'cajas', '2027-01-01', db(10, { BODEGA: 50 }), dm(2, 10)),
      mkp('Mascarilla triple capa', 'Protección', 'unidades', '2028-01-01', db(30, { BODEGA: 500 }), dm(20, 200)),
      mkp('Pechera desechable', 'Protección', 'unidades', '2028-01-01', db(20, { BODEGA: 300 }), dm(15, 100)),
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
      mkp('Separador de boca plástico', 'Insumos Clínicos', 'unidades', '2027-05-01', db(5, { BODEGA: 20 }), dm(2, 5)),
      mkp('Pincel dental', 'Insumos Clínicos', 'unidades', '2028-01-01', db(10, { BODEGA: 50 }), dm(2, 10)),
      mkp('Jeringa Blanqueamiento', 'Insumos Clínicos', 'unidades', '2026-12-01', db(5, { BODEGA: 15 }), dm(1, 5)),
      mkp('Protector gingival', 'Insumos Clínicos', 'unidades', '2027-02-01', db(5, { BODEGA: 10 }), dm(1, 3)),
    ],
    procedures: [
      { id: 1, nombre: 'Consulta / revisión', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex M', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }] },
      { id: 2, nombre: 'Anestesia infiltrativa', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex M', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia lidocaína 2%', qty: 1 }, { pname: 'Agujas cortas 27G', qty: 1 }] },
      { id: 3, nombre: 'Anestesia troncular', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex M', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia articaína 3%', qty: 1 }, { pname: 'Agujas largas 27G', qty: 1 }] },
      { id: 4, nombre: 'Obturación con resina', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex M', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Pinceles (pack)', qty: 1 }] },
      { id: 5, nombre: 'Impresión con silicona', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex M', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Silicona pesada/fluida (caja)', qty: 1 }, { pname: 'Oclufast', qty: 1 }] },
      { id: 6, nombre: 'Blanqueamiento Dental', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex M', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Separador de boca plástico', qty: 1 }, { pname: 'Pincel dental', qty: 1 }, { pname: 'Jeringa Blanqueamiento', qty: 1 }, { pname: 'Protector gingival', qty: 1 }] },
    ],
    transferHistory: [], attendHistory: [], nextPid: 22, nextProcId: 7
  }
}
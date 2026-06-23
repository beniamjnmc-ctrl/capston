import '../styles/globals.css'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '../utils/supabase/client'
import { productionData } from '../data/productionData'

const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState(null)
  
  const [inventories, setInventories] = useState(null)
  const [activeClinic, setActiveClinic] = useState('loBarnechea')
  
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState('idle')

  const [usersDb, setUsersDb] = useState([])

  const syncUserFromSession = async (session) => {
    if (!session?.user) {
      setUser(null)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile) {
        setUser({
          id: session.user.id,
          email: profile.email,
          name: profile.name,
          phone: profile.phone,
          role: profile.role || 'clinico'
        })
        return
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
      }

      // Fallback seguro si el perfil no existe o no se puede leer aún.
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || 'Usuario',
        phone: session.user.user_metadata?.phone || '',
        role: session.user.user_metadata?.role || 'clinico'
      })
    } catch (error) {
      console.error('Error syncing user session:', error)
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || 'Usuario',
        phone: session.user.user_metadata?.phone || '',
        role: session.user.user_metadata?.role || 'clinico'
      })
    }
  }

  // Verificar sesión de Supabase al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await syncUserFromSession(session)
      } catch (error) {
        console.error('Error checking session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await syncUserFromSession(session)
      }
    )

    return () => subscription?.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const loadInventoriesFromSupabase = async () => {
      try {
        // Por ahora, usar datos por defecto
        // En el futuro, se pueden sincronizar items específicos desde Supabase
        // Nota: Los datos reales (inventory_items) se cargan a través de los APIs
        initializeDefaultClinics()
      } catch (error) {
        console.error('Error loading inventories from Supabase:', error)
        // Fallback a valores por defecto
        initializeDefaultClinics()
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadInventoriesFromSupabase()
    } else {
      setLoading(false)
    }
  }, [user, supabase])

  const initializeDefaultClinics = () => {
    setInventories({
      loBarnechea: getDefaultData('loBarnechea'),
      alcantara: getDefaultData('alcantara')
    })
  }

  useEffect(() => {
    if (loading) return
    if (router.pathname === '/login' && user) {
      router.replace('/inventory')
      return
    }
    if (router.pathname !== '/' && router.pathname !== '/login') {
      if (!user) {
        router.push('/login')
      }
    }
  }, [user, loading, router.pathname])



  // Funciones de Usuario deprecadas - usar APIs de Supabase directamente
  // const registerNewUser = ...
  // const deleteUser = ...
  // const updatePassword = ...
  // const login = ...
  // const register = ...

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error logging out from Supabase:', error)
    }
    setUser(null)
    setInventories(null)
    router.push('/login')
  }

  const updateInventory = async (data) => {
    // Actualizar estado local
    setInventories(prev => ({ ...prev, [activeClinic]: data }))
    
    // Sincronizar cambios con Supabase (opcional - puede ser asincrónico)
    // Aquí se podrían guardar los cambios a Supabase si es necesario
    // Por ahora, los cambios se persisten via RLS policies
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
    user, logout, inventoryData, updateInventory,
    activeClinic, switchClinic, syncData, syncStatus, resetInventory, loading, importHistoricalData
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
    productionData,
    products: [
      mkp('Anestesia lidocaína 2%', 'Anestesia', 'carpules', '2026-08-01', db(20, { BODEGA: 100 }), dm(20, 50)),
      mkp('Anestesia articaína 3%', 'Anestesia', 'carpules', '2026-06-15', db(20, { BODEGA: 80 }), dm(20, 50)),
      mkp('Anestesia local (carpule)', 'Anestesia', 'carpules', '2027-01-01', db(20, { BODEGA: 50 }), dm(20, 20)),
      mkp('Guantes látex M', 'Protección', 'cajas', '2027-01-01', db(20, { BODEGA: 50 }), dm(20, 20)),
      mkp('Guantes látex', 'Protección', 'cajas', '2027-01-01', db(20, { BODEGA: 50 }), dm(20, 20)),
      mkp('Mascarilla triple capa', 'Protección', 'unidades', '2028-01-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Pechera desechable', 'Protección', 'unidades', '2028-01-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Boquilla de succión', 'Higiene', 'unidades', '2027-06-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Baja lengua', 'Instrumental', 'unidades', '2027-06-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Torulas de algodón', 'Algodón', 'paquetes', '2028-01-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Posicionador de placa RX', 'Radiología', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Placa radiográfica periapical', 'Radiología', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Manga protectora para placa', 'Radiología', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Placa radiográfica bite-wing', 'Radiología', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Babero de plomo (delantal)', 'Protección', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Posicionador de mordida (bite block)', 'Radiología', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cubeta de impresión desechable', 'Impresión', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Alginato de impresión', 'Impresión', 'kg', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Silicona de impresión', 'Impresión', 'sets', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Vaselina', 'Impresión', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Bisturí desechable', 'Cirugía', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Frasco con formol 10%', 'Laboratorio', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Sutura (hilo + aguja)', 'Cirugía', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Gasa estéril', 'Cirugía', 'paquetes', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Pasta profiláctica', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Copa de caucho (profilaxis)', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cepillo de profilaxis', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Babero dental', 'Protección', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Barniz de flúor silano', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Microbrush', 'Instrumental', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cubeta de fluoración', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Revelador de placa', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cepillo dental', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Hilo dental', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Ácido grabador (fosfórico)', 'Adhesión', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Sellante de fosas y fisuras', 'Adhesión', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Rollos de algodón', 'Algodón', 'rollos', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Papel de articular', 'Instrumental', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Lámpara de fotopolimerizar', 'Instrumental', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Jeringa de gel blanqueador', 'Blanqueamiento', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Lentes de protección UV', 'Protección', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Adhesivo/bonding', 'Adhesión', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Matriz transparente', 'Instrumental', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cuña de madera', 'Instrumental', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Matriz metálica (Tofflemire)', 'Instrumental', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Hilo retractor', 'Instrumental', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Corona provisoria acrílica', 'Prostodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cemento temporal', 'Prostodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cemento de adhesión (resina dual)', 'Prostodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cemento de adhesión definitivo', 'Prostodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cemento de adhesión', 'Adhesión', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Discos de pulir', 'Instrumental', 'sets', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Fresa de desobturación', 'Instrumental', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Jeringa Blanqueamiento', 'Blanqueamiento', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Ligaduras elásticas', 'Ortodoncia', 'paquetes', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Oclufast', 'Radiología', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Pincel dental', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Pinceles (pack)', 'Prevención', 'paquetes', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Protector gingival', 'Blanqueamiento', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Resina compuesta', 'Odontología', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Separador de boca plástico', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Separadores orthodónticos', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Sip', 'Prevención', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Suero fisiológico', 'Cirugía', 'ml', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Alicate de amarrar', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Arco de reemplazo', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Arco inicial NiTi', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Bandas molares', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Brackets (set completo)', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Aguja corta 27G', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Aguja larga 27G', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cemento de fosfato/ionómero', 'Prostodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Ácido fluorhídrico', 'Adhesión', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Fresas de pulir', 'Instrumental', 'sets', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Hipoclorito de sodio 2.5%', 'Endodoncia', 'ml', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('EDTA', 'Endodoncia', 'ml', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Jeringa de irrigación', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Conos de papel absorbente', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Conos de gutapercha', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cemento sellador endodóntico', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Dique de goma', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Grapa de dique', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Bastidor de dique', 'Endodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Limas endodónticas', 'Endodoncia', 'sets', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Clorhexidina 0.12%', 'Periodoncia', 'ml', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Sonda periodontal', 'Periodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Periostótomo', 'Periodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Sutura reabsorbible', 'Cirugía', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Sutura no reabsorbible', 'Cirugía', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Tijeras de sutura estériles', 'Cirugía', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Pinzas estériles', 'Cirugía', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Cicatrizal', 'Cirugía', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Alicate de retiro de brackets', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Alicate de ajuste', 'Ortodoncia', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Película radiográfica', 'Radiología', 'unidades', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Silicona de impresión pesada', 'Impresión', 'sets', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
      mkp('Silicona de impresión fluida', 'Impresión', 'sets', '2027-04-01', db(20, { BODEGA: 100 }), dm(20, 20)),
    ],
    procedures: [
      { id: 1, nombre: 'Consulta / revisión', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }] },
      { id: 2, nombre: 'Anestesia infiltrativa', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia lidocaína 2%', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }] },
      { id: 3, nombre: 'Anestesia troncular', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia articaína 3%', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }] },
      { id: 4, nombre: 'Obturación con resina', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Pinceles (pack)', qty: 1 }] },
      { id: 5, nombre: 'Impresión con silicona', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Oclufast', qty: 1 }] },
      { id: 6, nombre: 'Blanqueamiento Dental', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Separador de boca plástico', qty: 1 }, { pname: 'Pincel dental', qty: 1 }, { pname: 'Jeringa Blanqueamiento', qty: 1 }, { pname: 'Protector gingival', qty: 1 }] },
      { id: 7, nombre: 'Examen Clínico Parcial', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Baja lengua', qty: 2 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 8, nombre: 'Examen Clínico Completo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Baja lengua', qty: 2 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 9, nombre: 'Evaluación Periódica', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 10, nombre: 'Examen e Interconsulta', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 11, nombre: 'RX Periapical-1 Película', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Posicionador de placa RX', qty: 1 }, { pname: 'Placa radiográfica periapical', qty: 1 }, { pname: 'Manga protectora para placa', qty: 1 }] },
      { id: 12, nombre: 'RX Periapical Cada Adicional', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Posicionador de placa RX', qty: 1 }, { pname: 'Placa radiográfica periapical', qty: 1 }, { pname: 'Manga protectora para placa', qty: 1 }] },
      { id: 13, nombre: 'Bitewing Unilateral', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Posicionador de placa RX', qty: 1 }, { pname: 'Placa radiográfica bite-wing', qty: 2 }, { pname: 'Manga protectora para placa', qty: 2 }] },
      { id: 14, nombre: 'Bitewings Bilateral', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Posicionador de placa RX', qty: 1 }, { pname: 'Placa radiográfica bite-wing', qty: 4 }, { pname: 'Manga protectora para placa', qty: 2 }] },
      { id: 15, nombre: 'Bitewings Bilateral 4 Placas', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Posicionador de placa RX', qty: 1 }, { pname: 'Placa radiográfica bite-wing', qty: 4 }, { pname: 'Manga protectora para placa', qty: 2 }] },
      { id: 16, nombre: 'Ortopantomografía', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Babero de plomo (delantal)', qty: 1 }, { pname: 'Posicionador de mordida (bite block)', qty: 1 }] },
      { id: 17, nombre: 'Scanner 3D (Cone Beam)', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Babero de plomo (delantal)', qty: 1 }, { pname: 'Posicionador de mordida (bite block)', qty: 1 }] },
      { id: 18, nombre: 'Cephalometric Film Teleradiografía', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Babero de plomo (delantal)', qty: 1 }, { pname: 'Posicionador de mordida (bite block)', qty: 1 }] },
      { id: 19, nombre: 'Impresiones / Modelos Diagnósticos', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Alginato de impresión', qty: 1 }, { pname: 'Vaselina', qty: 1 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 20, nombre: 'Sondaje Computarizado', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Cubeta de impresión desechable', qty: 1 }] },
      { id: 21, nombre: 'Estudio Guided Surgery', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Vaselina', qty: 1 }] },
      { id: 22, nombre: 'Examen Histopatológico', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Frasco con formol 10%', qty: 1 }, { pname: 'Sutura (hilo + aguja)', qty: 1 }, { pname: 'Gasa estéril', qty: 4 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 23, nombre: 'Biopsia de Tejidos Blandos', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Sutura (hilo + aguja)', qty: 1 }, { pname: 'Gasa estéril', qty: 4 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 24, nombre: 'Profilaxis Adulto 3 Grupos', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Pasta profiláctica', qty: 1 }, { pname: 'Copa de caucho (profilaxis)', qty: 1 }, { pname: 'Cepillo de profilaxis', qty: 1 }, { pname: 'Torulas de algodón', qty: 4 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 25, nombre: 'Profilaxis Superficial Total', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Pasta profiláctica', qty: 1 }, { pname: 'Copa de caucho (profilaxis)', qty: 1 }, { pname: 'Cepillo de profilaxis', qty: 1 }, { pname: 'Torulas de algodón', qty: 4 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 26, nombre: 'Profilaxis Niño', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Sip', qty: 0 }] },
      { id: 27, nombre: 'Fluoración Silano Adulto', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Barniz de flúor silano', qty: 1 }, { pname: 'Microbrush', qty: 2 }, { pname: 'Cubeta de fluoración', qty: 2 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 28, nombre: 'Fluoración Silano Niño', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Barniz de flúor silano', qty: 1 }, { pname: 'Microbrush', qty: 2 }, { pname: 'Cubeta de fluoración', qty: 2 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 29, nombre: 'Fluor Gel Niño', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Barniz de flúor silano', qty: 1 }, { pname: 'Microbrush', qty: 2 }, { pname: 'Cubeta de fluoración', qty: 2 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 30, nombre: 'Instrucción de Higiene Oral', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Revelador de placa', qty: 1 }, { pname: 'Cepillo dental', qty: 1 }, { pname: 'Hilo dental', qty: 1 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 31, nombre: 'Sellante', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Sellante de fosas y fisuras', qty: 1 }, { pname: 'Microbrush', qty: 2 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }, { pname: 'Lámpara de fotopolimerizar', qty: 1 }] },
      { id: 32, nombre: 'Sesión de Tratamiento', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Babero dental', qty: 1 }, { pname: 'Torulas de algodón', qty: 4 }] },
      { id: 33, nombre: 'Control Blanqueamiento', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Separador de boca plástico', qty: 1 }, { pname: 'Protector gingival', qty: 1 }, { pname: 'Jeringa de gel blanqueador', qty: 1 }] },
      { id: 34, nombre: 'Resina 1 Superf. Anterior', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Microbrush', qty: 3 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Matriz transparente', qty: 2 }, { pname: 'Cuña de madera', qty: 2 }, { pname: 'Papel de articular', qty: 1 }, { pname: 'Discos de pulir', qty: 3 }] },
      { id: 35, nombre: 'Resina 2 Superf. Anterior', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Microbrush', qty: 3 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Matriz transparente', qty: 2 }, { pname: 'Cuña de madera', qty: 2 }, { pname: 'Papel de articular', qty: 1 }, { pname: 'Discos de pulir', qty: 3 }] },
      { id: 36, nombre: 'Resina 3 Superf. Anterior', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Microbrush', qty: 3 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Matriz transparente', qty: 2 }, { pname: 'Cuña de madera', qty: 2 }, { pname: 'Papel de articular', qty: 1 }, { pname: 'Discos de pulir', qty: 3 }] },
      { id: 37, nombre: 'Resina 1 Superf. Post-Permanente', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Microbrush', qty: 3 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Matriz metálica (Tofflemire)', qty: 1 }, { pname: 'Cuña de madera', qty: 2 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 38, nombre: 'Resina 2 Superf. Post-Permanente', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Microbrush', qty: 3 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Matriz metálica (Tofflemire)', qty: 1 }, { pname: 'Cuña de madera', qty: 2 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 39, nombre: 'Resina 3 Superf. Post-Permanente', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Microbrush', qty: 3 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Matriz metálica (Tofflemire)', qty: 1 }, { pname: 'Cuña de madera', qty: 2 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 40, nombre: 'Resina 1 Superf. Post-Primario', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Microbrush', qty: 3 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Matriz metálica (Tofflemire)', qty: 1 }, { pname: 'Cuña de madera', qty: 2 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 41, nombre: 'Inlay Porcelana 1 Superf.', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Cemento de adhesión (resina dual)', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 42, nombre: 'Inlay Porcelana 2 Superf.', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Cemento de adhesión (resina dual)', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 43, nombre: 'Inlay Porcelana 3+ Superf', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Cemento de adhesión (resina dual)', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 44, nombre: 'Inlay Metálico', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 45, nombre: 'Onlay Metálico/Porcelana', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Cemento de adhesión (resina dual)', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 46, nombre: 'Lab. Inc. Cerec', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }] },
      { id: 47, nombre: 'Corona de Resina Provisoria', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Resina compuesta', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 48, nombre: 'Corona Cerámica', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento de adhesión definitivo', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 49, nombre: 'Corona Metal Cerámica', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento de adhesión definitivo', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 50, nombre: 'Corona Implanto Soportada', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento de adhesión definitivo', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 51, nombre: 'Póntico Metal Porcelana', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Hilo retractor', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento de adhesión definitivo', qty: 1 }, { pname: 'Microbrush', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 52, nombre: 'Remoción de Espiga - Corona', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Fresa de desobturación', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Gasa estéril', qty: 2 }] },
      { id: 53, nombre: 'Recement Crown', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Microbrush', qty: 2 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 54, nombre: 'Corona Provisoria Prefabricada', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 55, nombre: 'Recement Inlay', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 56, nombre: 'Encerado Diagnóstico por Pieza', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 57, nombre: 'Endodoncia Anterior', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Dique de goma', qty: 1 }, { pname: 'Grapa de dique', qty: 1 }, { pname: 'Bastidor de dique', qty: 1 }, { pname: 'Limas endodónticas', qty: 1 }, { pname: 'Hipoclorito de sodio 2.5%', qty: 10 }, { pname: 'EDTA', qty: 5 }, { pname: 'Jeringa de irrigación', qty: 1 }, { pname: 'Conos de papel absorbente', qty: 10 }, { pname: 'Conos de gutapercha', qty: 10 }, { pname: 'Cemento sellador endodóntico', qty: 1 }, { pname: 'Rollos de algodón', qty: 6 }, { pname: 'Cemento temporal', qty: 1 }] },
      { id: 58, nombre: 'Endodoncia Premolar', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Dique de goma', qty: 1 }, { pname: 'Grapa de dique', qty: 1 }, { pname: 'Bastidor de dique', qty: 1 }, { pname: 'Limas endodónticas', qty: 1 }, { pname: 'Hipoclorito de sodio 2.5%', qty: 10 }, { pname: 'EDTA', qty: 5 }, { pname: 'Jeringa de irrigación', qty: 1 }, { pname: 'Conos de papel absorbente', qty: 10 }, { pname: 'Conos de gutapercha', qty: 10 }, { pname: 'Cemento sellador endodóntico', qty: 1 }, { pname: 'Rollos de algodón', qty: 6 }, { pname: 'Cemento temporal', qty: 1 }] },
      { id: 59, nombre: 'Endodoncia Molar', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Dique de goma', qty: 1 }, { pname: 'Grapa de dique', qty: 1 }, { pname: 'Bastidor de dique', qty: 1 }, { pname: 'Limas endodónticas', qty: 1 }, { pname: 'Hipoclorito de sodio 2.5%', qty: 10 }, { pname: 'EDTA', qty: 5 }, { pname: 'Jeringa de irrigación', qty: 1 }, { pname: 'Conos de papel absorbente', qty: 10 }, { pname: 'Conos de gutapercha', qty: 10 }, { pname: 'Cemento sellador endodóntico', qty: 1 }, { pname: 'Rollos de algodón', qty: 6 }, { pname: 'Cemento temporal', qty: 1 }] },
      { id: 60, nombre: 'Endodoncia Ant. Lesión', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Dique de goma', qty: 1 }, { pname: 'Grapa de dique', qty: 1 }, { pname: 'Bastidor de dique', qty: 1 }, { pname: 'Limas endodónticas', qty: 1 }, { pname: 'Hipoclorito de sodio 2.5%', qty: 10 }, { pname: 'EDTA', qty: 5 }, { pname: 'Jeringa de irrigación', qty: 1 }, { pname: 'Conos de papel absorbente', qty: 10 }, { pname: 'Conos de gutapercha', qty: 10 }, { pname: 'Cemento sellador endodóntico', qty: 1 }, { pname: 'Rollos de algodón', qty: 6 }, { pname: 'Cemento temporal', qty: 1 }] },
      { id: 61, nombre: 'Endodoncia PM Con Lesión', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Dique de goma', qty: 1 }, { pname: 'Grapa de dique', qty: 1 }, { pname: 'Bastidor de dique', qty: 1 }, { pname: 'Limas endodónticas', qty: 1 }, { pname: 'Hipoclorito de sodio 2.5%', qty: 10 }, { pname: 'EDTA', qty: 5 }, { pname: 'Jeringa de irrigación', qty: 1 }, { pname: 'Conos de papel absorbente', qty: 10 }, { pname: 'Conos de gutapercha', qty: 10 }, { pname: 'Cemento sellador endodóntico', qty: 1 }, { pname: 'Rollos de algodón', qty: 6 }, { pname: 'Cemento temporal', qty: 1 }] },
      { id: 62, nombre: 'Endodoncia M Con Lesión', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Dique de goma', qty: 1 }, { pname: 'Grapa de dique', qty: 1 }, { pname: 'Bastidor de dique', qty: 1 }, { pname: 'Limas endodónticas', qty: 1 }, { pname: 'Hipoclorito de sodio 2.5%', qty: 10 }, { pname: 'EDTA', qty: 5 }, { pname: 'Jeringa de irrigación', qty: 1 }, { pname: 'Conos de papel absorbente', qty: 10 }, { pname: 'Conos de gutapercha', qty: 10 }, { pname: 'Cemento sellador endodóntico', qty: 1 }, { pname: 'Rollos de algodón', qty: 6 }, { pname: 'Cemento temporal', qty: 1 }] },
      { id: 63, nombre: 'Apicoectomía', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Sutura no reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 4 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 6 }] },
      { id: 64, nombre: 'Sesión de Endodoncia', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Hipoclorito de sodio 2.5%', qty: 5 }, { pname: 'Conos de papel absorbente', qty: 6 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 65, nombre: 'Profilaxis Profunda por Grupo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja larga 27G', qty: 1 }, { pname: 'Gasa estéril', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Clorhexidina 0.12%', qty: 15 }] },
      { id: 66, nombre: 'Reevaluación Periodontal', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Sonda periodontal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 67, nombre: 'Colgajo por Grupo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Tijeras de sutura estériles', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 68, nombre: 'Cir. Ósea por Grupo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Tijeras de sutura estériles', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 69, nombre: 'Cir. Mucogingival', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 70, nombre: 'Cuña Distal-Mesial', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 71, nombre: 'Cir. Ósea C/Alargamiento Coronario', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 72, nombre: 'Injerto por Sitio', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 4 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 2 }, { pname: 'Gasa estéril', qty: 10 }, { pname: 'Suero fisiológico', qty: 30 }, { pname: 'Rollos de algodón', qty: 6 }] },
      { id: 73, nombre: 'Injerto de Tejido Conjuntivo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 4 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 2 }, { pname: 'Gasa estéril', qty: 10 }, { pname: 'Suero fisiológico', qty: 30 }, { pname: 'Rollos de algodón', qty: 6 }] },
      { id: 74, nombre: 'Exodoncia Primario', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Gasa estéril', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 75, nombre: 'Exodoncia a Colgajo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 76, nombre: 'Exodoncia Diente Semi Incluido', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 77, nombre: 'Diente Incluido o Impactado', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 78, nombre: 'Exodoncia Radicular', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 3 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 79, nombre: 'Retiro de Sutura', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Tijeras de sutura estériles', qty: 1 }, { pname: 'Pinzas estériles', qty: 1 }, { pname: 'Gasa estéril', qty: 2 }, { pname: 'Clorhexidina 0.12%', qty: 5 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 80, nombre: 'Control de Cirugía', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Gasa estéril', qty: 2 }, { pname: 'Clorhexidina 0.12%', qty: 5 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 81, nombre: 'Vaciamiento de Absceso Tejido Blando', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 6 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 82, nombre: 'Excéresis de Tumor', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 6 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 83, nombre: 'Sutura de Heridas', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Sutura no reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 6 }, { pname: 'Suero fisiológico', qty: 10 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 84, nombre: 'Cirugía de Implantes C/U', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 4 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura no reabsorbible', qty: 2 }, { pname: 'Gasa estéril', qty: 10 }, { pname: 'Suero fisiológico', qty: 30 }, { pname: 'Rollos de algodón', qty: 6 }] },
      { id: 85, nombre: 'Exposición del Implante', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 86, nombre: 'Pilar Multi Unit', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 87, nombre: 'Pilar Estético Individualizado', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 88, nombre: 'Pilar Gengi-Hue', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 89, nombre: 'Tornillo Protésico-Torque', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 1 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 90, nombre: 'Extracción de Implante', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 4 }, { pname: 'Aguja larga 27G', qty: 2 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura no reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 8 }, { pname: 'Suero fisiológico', qty: 20 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 91, nombre: 'Instalación Aparato Fijo Metálico 1 Año', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Separadores orthodónticos', qty: 8 }, { pname: 'Bandas molares', qty: 2 }, { pname: 'Brackets (set completo)', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Arco inicial NiTi', qty: 1 }, { pname: 'Ligaduras elásticas', qty: 20 }, { pname: 'Rollos de algodón', qty: 6 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 92, nombre: 'Instalación Aparato Fijo Metálico 2 Años', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Separadores orthodónticos', qty: 8 }, { pname: 'Bandas molares', qty: 4 }, { pname: 'Brackets (set completo)', qty: 1 }, { pname: 'Ácido grabador (fosfórico)', qty: 1 }, { pname: 'Adhesivo/bonding', qty: 1 }, { pname: 'Arco inicial NiTi', qty: 1 }, { pname: 'Ligaduras elásticas', qty: 20 }, { pname: 'Rollos de algodón', qty: 6 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 93, nombre: 'Control Ortodoncia', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Ligaduras elásticas', qty: 20 }, { pname: 'Arco de reemplazo', qty: 1 }, { pname: 'Alicate de amarrar', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 94, nombre: 'Control Sin Aparato', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 95, nombre: 'Retiro Aparato Fijo por Maxilar', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Alicate de retiro de brackets', qty: 1 }, { pname: 'Fresas de pulir', qty: 1 }, { pname: 'Discos de pulir', qty: 3 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 96, nombre: 'Invisalign Ortodoncia', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 97, nombre: 'Instalación Aparato Removible', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Alicate de ajuste', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 98, nombre: 'Instalación Ap. Rem. Un Max', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Alicate de ajuste', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 99, nombre: 'Instalación Ap. Fijo Un Max', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Alicate de ajuste', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 100, nombre: 'Fenestración Ortodoncia', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja larga 27G', qty: 3 }, { pname: 'Bisturí desechable', qty: 1 }, { pname: 'Sutura reabsorbible', qty: 1 }, { pname: 'Gasa estéril', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 101, nombre: 'Reparación Base Acrílica', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 102, nombre: 'Reparación Base Metálica', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 103, nombre: 'Agregar Diente a Prótesis Parcial', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 104, nombre: 'Acondicionador de Tejido', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 105, nombre: 'Prótesis Total Inferior', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 106, nombre: 'Prótesis Parcial Metálica', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 107, nombre: 'Reparación Protector Bucal Deportivo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 108, nombre: 'Férula Provisional Extracoronaria', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 109, nombre: 'Plano de Estabilización', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 110, nombre: 'Control de Plano de Estabilización', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Papel de articular', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 111, nombre: 'Desgaste Cosmético', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Papel de articular', qty: 2 }, { pname: 'Fresas de pulir', qty: 1 }, { pname: 'Discos de pulir', qty: 3 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 112, nombre: 'Ajuste Oclusal Selectivo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Papel de articular', qty: 2 }, { pname: 'Fresas de pulir', qty: 1 }, { pname: 'Discos de pulir', qty: 3 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 113, nombre: 'Laboratorio Provisorio', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 114, nombre: 'Laboratorio Espiga Muñón', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento de fosfato/ionómero', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 115, nombre: 'Laboratorio Reparación', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 116, nombre: 'Laboratorio Plano', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 117, nombre: 'Laboratorio Inc. Cerec', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 118, nombre: 'Laboratorio Corona Implantosopo', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Corona provisoria acrílica', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 119, nombre: 'Lab. Corona Porcelana', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento de adhesión definitivo', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 120, nombre: 'Lab. Corona Metal Cerámica', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento de adhesión definitivo', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 121, nombre: 'Lab. Carilla Vestibular', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 122, nombre: 'Laboratorio Cerec Corona', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Silicona de impresión', qty: 1 }, { pname: 'Cubeta de impresión desechable', qty: 1 }, { pname: 'Rollos de algodón', qty: 4 }] },
      { id: 123, nombre: 'Urgencia', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 2 }, { pname: 'Anestesia local (carpule)', qty: 2 }, { pname: 'Aguja corta 27G', qty: 1 }, { pname: 'Cemento temporal', qty: 1 }, { pname: 'Gasa estéril', qty: 4 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Babero dental', qty: 1 }] },
      { id: 124, nombre: 'Programación / Administrativo', extra: [] },
      { id: 125, nombre: 'Control Inespecífico', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 126, nombre: 'Control Intra-oral', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 127, nombre: 'Retenedor Metal-Cerámico', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento de adhesión', qty: 1 }, { pname: 'Microbrush', qty: 2 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 128, nombre: 'Póntico', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento de adhesión', qty: 1 }, { pname: 'Microbrush', qty: 2 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 129, nombre: 'Pilar Protésico (Recepción de Trabajo)', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Cemento de adhesión', qty: 1 }, { pname: 'Microbrush', qty: 2 }, { pname: 'Rollos de algodón', qty: 4 }, { pname: 'Papel de articular', qty: 1 }] },
      { id: 130, nombre: 'Sondaje Computarizado Florida', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
      { id: 131, nombre: 'Examen Inespecífico de Diagnóstico', extra: [{ pname: 'Mascarilla triple capa', qty: 2 }, { pname: 'Guantes látex', qty: 2 }, { pname: 'Pechera desechable', qty: 1 }, { pname: 'Boquilla de succión', qty: 1 }, { pname: 'Rollos de algodón', qty: 2 }] },
    ],
    transferHistory: [], attendHistory: [], nextPid: 22, nextProcId: 132
  }
}
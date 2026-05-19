import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/index'
import toast from 'react-hot-toast'

// ── Tipos ────────────────────────────────────────────────────
interface EjercicioRutina {
  id: string
  ejercicio_id: string
  series: number
  repeticiones: string
  orden: number
  ejercicio: {
    nombre: string
    zona: string
    musculo: string | null
    foto_inicio_url: string | null
    foto_fin_url: string | null
  }
}

interface CatalogoItem {
  id: string
  nombre: string
  zona: string
  musculo: string | null
  foto_inicio_url: string | null
  foto_fin_url: string | null
}

// ── Constantes ───────────────────────────────────────────────
const ZONAS: Record<string, { label: string; musculos: string[] }> = {
  tren_superior:   { label: 'Tren superior',   musculos: ['pecho','espalda','hombros','biceps','triceps'] },
  tren_inferior:   { label: 'Tren inferior',   musculos: ['cuadriceps','isquiotibiales','gluteos','pantorrillas'] },
  core:            { label: 'Core',             musculos: ['abdomen','lumbares'] },
  cuerpo_completo: { label: 'Cuerpo completo',  musculos: [] },
}

const MUSCULO_LABELS: Record<string, string> = {
  pecho:'Pecho', espalda:'Espalda', hombros:'Hombros', biceps:'Bíceps', triceps:'Tríceps',
  cuadriceps:'Cuádriceps', isquiotibiales:'Isquiotibiales', gluteos:'Glúteos',
  pantorrillas:'Pantorrillas', abdomen:'Abdomen', lumbares:'Lumbares',
}

// ── Mini animación ───────────────────────────────────────────
function FotoAnimada({ foto1, foto2, nombre }: { foto1: string | null; foto2: string | null; nombre: string }) {
  const [second, setSecond] = useState(false)
  useEffect(() => {
    if (!foto1 || !foto2) return
    const t = setInterval(() => setSecond(s => !s), 2000)
    return () => clearInterval(t)
  }, [foto1, foto2])
  if (!foto1) return (
    <div className="w-16 h-16 rounded-xl bg-df-purple/10 flex items-center justify-center flex-shrink-0">
      <i className="fa-solid fa-dumbbell text-df-muted"/>
    </div>
  )
  return (
    <div className="w-16 h-16 rounded-xl bg-df-purple/10 overflow-hidden relative flex-shrink-0">
      <img src={foto1} alt={nombre}
        style={{ transition: 'opacity 1.5s ease-in-out' }}
        className={`absolute inset-0 w-full h-full object-contain ${second ? 'opacity-0' : 'opacity-100'}`}/>
      {foto2 && (
        <img src={foto2} alt={nombre}
          style={{ transition: 'opacity 1.5s ease-in-out' }}
          className={`absolute inset-0 w-full h-full object-contain ${second ? 'opacity-100' : 'opacity-0'}`}/>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────
export default function RutinaAlumna({ alumnaId }: { alumnaId: string }) {
  const [rutina, setRutina]           = useState<EjercicioRutina[]>([])
  const [catalogo, setCatalogo]       = useState<CatalogoItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [modalAgregar, setModalAgregar] = useState(false)
  const [busqueda, setBusqueda]       = useState('')
  const [zonaFiltro, setZonaFiltro]   = useState('')
  const [musculoFiltro, setMusculoFiltro] = useState('')
  const [editando, setEditando]       = useState<string | null>(null)
  const [editForm, setEditForm]       = useState({ series: 3, repeticiones: '12' })

  useEffect(() => { cargar() }, [alumnaId])

  async function cargar() {
    setLoading(true)
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase
        .from('rutina_ejercicios')
        .select('*, ejercicio:catalogo_ejercicios(nombre, zona, musculo, foto_inicio_url, foto_fin_url)')
        .eq('alumna_id', alumnaId)
        .order('orden'),
      supabase.from('catalogo_ejercicios').select('*').order('nombre'),
    ])
    setRutina((r as any) ?? [])
    setCatalogo(c ?? [])
    setLoading(false)
  }

  // Agregar ejercicio a la rutina
  async function agregar(ej: CatalogoItem) {
    const yaExiste = rutina.some(r => r.ejercicio_id === ej.id)
    if (yaExiste) { toast.error('Este ejercicio ya está en la rutina'); return }
    setGuardando(true)
    const nuevoOrden = rutina.length > 0 ? Math.max(...rutina.map(r => r.orden)) + 1 : 0
    const { error } = await supabase.from('rutina_ejercicios').insert({
      alumna_id: alumnaId,
      ejercicio_id: ej.id,
      series: 3,
      repeticiones: '12',
      orden: nuevoOrden,
    })
    if (error) { toast.error('Error al agregar'); setGuardando(false); return }
    toast.success(`${ej.nombre} agregado`)
    await cargar()
    setGuardando(false)
  }

  // Guardar edición de series/reps
  async function guardarEdicion(id: string) {
    const { error } = await supabase.from('rutina_ejercicios')
      .update({ series: editForm.series, repeticiones: editForm.repeticiones })
      .eq('id', id)
    if (error) { toast.error('Error al guardar'); return }
    toast.success('Actualizado')
    setEditando(null)
    await cargar()
  }

  // Eliminar ejercicio
  async function eliminar(id: string) {
    if (!confirm('¿Quitar este ejercicio de la rutina?')) return
    const { error } = await supabase.from('rutina_ejercicios').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Ejercicio quitado')
    await cargar()
  }

  // Mover orden
  async function mover(id: string, dir: 'up' | 'down') {
    const idx = rutina.findIndex(r => r.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === rutina.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const a = rutina[idx]
    const b = rutina[swapIdx]
    await Promise.all([
      supabase.from('rutina_ejercicios').update({ orden: b.orden }).eq('id', a.id),
      supabase.from('rutina_ejercicios').update({ orden: a.orden }).eq('id', b.id),
    ])
    await cargar()
  }

  // Filtros del catálogo en el modal
  const musculos = zonaFiltro ? (ZONAS[zonaFiltro]?.musculos ?? []) : []
  const catalogoFiltrado = catalogo.filter(ej => {
    const q = busqueda.toLowerCase()
    return (
      (!busqueda      || ej.nombre.toLowerCase().includes(q)) &&
      (!zonaFiltro    || ej.zona    === zonaFiltro)           &&
      (!musculoFiltro || ej.musculo === musculoFiltro)
    )
  })

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-df-muted">{rutina.length} ejercicio{rutina.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setModalAgregar(true)}
          className="df-btn px-4 py-2 text-sm flex items-center gap-2">
          <i className="fa-solid fa-plus"/> Agregar ejercicio
        </button>
      </div>

      {/* Lista de ejercicios */}
      {rutina.length === 0 ? (
        <div className="text-center py-12">
          <i className="fa-solid fa-dumbbell text-3xl text-df-muted mb-3 block"/>
          <p className="text-df-muted text-sm mb-4">Esta alumna no tiene rutina aún</p>
          <button onClick={() => setModalAgregar(true)} className="df-btn px-5 py-2 text-sm">
            + Agregar primer ejercicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rutina.map((item, idx) => (
            <div key={item.id} className="df-surface rounded-xl p-3 border border-df-border">
              <div className="flex items-center gap-3">
                {/* Foto animada */}
                <FotoAnimada
                  foto1={item.ejercicio.foto_inicio_url}
                  foto2={item.ejercicio.foto_fin_url}
                  nombre={item.ejercicio.nombre}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">{item.ejercicio.nombre}</p>
                  <p className="text-xs text-df-muted mt-0.5">
                    {ZONAS[item.ejercicio.zona]?.label}
                    {item.ejercicio.musculo && ` · ${MUSCULO_LABELS[item.ejercicio.musculo] ?? item.ejercicio.musculo}`}
                  </p>

                  {/* Series/reps — editable o display */}
                  {editando === item.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-df-muted">Series</span>
                        <input type="number" value={editForm.series}
                          onChange={e => setEditForm(f => ({ ...f, series: +e.target.value }))}
                          className="df-input w-12 text-xs py-1 px-2"/>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-df-muted">Reps</span>
                        <input value={editForm.repeticiones}
                          onChange={e => setEditForm(f => ({ ...f, repeticiones: e.target.value }))}
                          className="df-input w-16 text-xs py-1 px-2"/>
                      </div>
                      <button onClick={() => guardarEdicion(item.id)}
                        className="text-xs bg-df-purple text-white px-2 py-1 rounded-lg">
                        ✓
                      </button>
                      <button onClick={() => setEditando(null)}
                        className="text-xs text-df-muted">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs bg-df-card px-2 py-0.5 rounded-full text-df-violet font-semibold">
                        {item.series} series
                      </span>
                      <span className="text-xs bg-df-card px-2 py-0.5 rounded-full text-df-violet font-semibold">
                        {item.repeticiones} reps
                      </span>
                      <button onClick={() => {
                        setEditando(item.id)
                        setEditForm({ series: item.series, repeticiones: item.repeticiones })
                      }} className="text-[10px] text-df-muted hover:text-df-pink transition-colors">
                        <i className="fa-solid fa-pen"/>
                      </button>
                    </div>
                  )}
                </div>

                {/* Controles orden + eliminar */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button onClick={() => mover(item.id, 'up')} disabled={idx === 0}
                    className="w-7 h-7 flex items-center justify-center text-df-muted hover:text-white disabled:opacity-20 transition-colors">
                    <i className="fa-solid fa-chevron-up text-xs"/>
                  </button>
                  <button onClick={() => mover(item.id, 'down')} disabled={idx === rutina.length - 1}
                    className="w-7 h-7 flex items-center justify-center text-df-muted hover:text-white disabled:opacity-20 transition-colors">
                    <i className="fa-solid fa-chevron-down text-xs"/>
                  </button>
                  <button onClick={() => eliminar(item.id)}
                    className="w-7 h-7 flex items-center justify-center text-red-500/50 hover:text-red-400 transition-colors">
                    <i className="fa-solid fa-trash text-xs"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar ejercicio */}
      <Modal open={modalAgregar} onClose={() => { setModalAgregar(false); setBusqueda(''); setZonaFiltro(''); setMusculoFiltro('') }}
        title="Agregar ejercicio">
        <div className="space-y-3">
          {/* Buscador */}
          <div className="df-surface rounded-xl px-3 py-2 flex items-center gap-2 border border-df-border">
            <i className="fa-solid fa-magnifying-glass text-df-muted text-sm"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-df-muted"/>
            {busqueda && <button onClick={() => setBusqueda('')}><i className="fa-solid fa-xmark text-df-muted text-sm"/></button>}
          </div>

          {/* Filtro zona */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => { setZonaFiltro(''); setMusculoFiltro('') }}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-semibold transition-all ${
                !zonaFiltro ? 'bg-df-purple text-white' : 'df-surface text-df-muted'
              }`}>Todos</button>
            {Object.entries(ZONAS).map(([k, z]) => (
              <button key={k} onClick={() => { setZonaFiltro(k); setMusculoFiltro('') }}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-semibold transition-all ${
                  zonaFiltro === k ? 'bg-df-purple text-white' : 'df-surface text-df-muted'
                }`}>{z.label}</button>
            ))}
          </div>

          {/* Sub filtro músculo */}
          {musculos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setMusculoFiltro('')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
                  !musculoFiltro ? 'bg-df-violet/30 text-df-violet border-df-violet/40' : 'border-transparent text-df-muted'
                }`}>Todos</button>
              {musculos.map(m => (
                <button key={m} onClick={() => setMusculoFiltro(m)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
                    musculoFiltro === m ? 'bg-df-violet/30 text-df-violet border-df-violet/40' : 'border-transparent text-df-muted'
                  }`}>{MUSCULO_LABELS[m]}</button>
              ))}
            </div>
          )}

          {/* Lista del catálogo */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {catalogoFiltrado.length === 0 ? (
              <p className="text-df-muted text-sm text-center py-6">Sin resultados</p>
            ) : catalogoFiltrado.map(ej => {
              const enRutina = rutina.some(r => r.ejercicio_id === ej.id)
              return (
                <div key={ej.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    enRutina ? 'border-df-border opacity-40 cursor-not-allowed' : 'border-df-border hover:border-df-violet/50 cursor-pointer'
                  }`}
                  onClick={() => !enRutina && !guardando && agregar(ej)}>
                  {/* Mini foto */}
                  <div className="w-12 h-12 rounded-lg bg-df-purple/10 overflow-hidden flex-shrink-0">
                    {ej.foto_inicio_url
                      ? <img src={ej.foto_inicio_url} className="w-full h-full object-contain"/>
                      : <div className="flex items-center justify-center h-full"><i className="fa-solid fa-dumbbell text-df-muted text-sm"/></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ej.nombre}</p>
                    <p className="text-xs text-df-muted">
                      {ZONAS[ej.zona]?.label}
                      {ej.musculo && ` · ${MUSCULO_LABELS[ej.musculo] ?? ej.musculo}`}
                    </p>
                  </div>
                  {enRutina
                    ? <span className="text-xs text-df-muted flex-shrink-0">Ya agregado</span>
                    : <i className="fa-solid fa-plus text-df-violet flex-shrink-0"/>
                  }
                </div>
              )
            })}
          </div>
        </div>
      </Modal>
    </div>
  )
}
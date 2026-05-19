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
  descanso_seg: number
  dia: string | null
  orden: number
  ejercicio: {
    nombre: string
    zona: string
    musculo: string | null
    foto_inicio_url: string | null
    foto_fin_url: string | null
    duracion_seg: number
  }
}

interface CatalogoItem {
  id: string
  nombre: string
  zona: string
  musculo: string | null
  foto_inicio_url: string | null
  foto_fin_url: string | null
  duracion_seg: number
}

// ── Constantes ───────────────────────────────────────────────
const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const DIAS_LABELS: Record<string, string> = {
  lun: 'Lun', mar: 'Mar', 'mié': 'Mié', jue: 'Jue', vie: 'Vie', 'sáb': 'Sáb', dom: 'Dom',
}
const DIAS_NOMBRES: Record<string, string> = {
  lun: 'Lunes', mar: 'Martes', 'mié': 'Miércoles', jue: 'Jueves',
  vie: 'Viernes', 'sáb': 'Sábado', dom: 'Domingo',
}
// getDay() → 0=dom, 1=lun … 6=sáb
const DIAS_HOY = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

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
function FotoAnimada({
  foto1, foto2, nombre,
}: { foto1: string | null; foto2: string | null; nombre: string }) {
  const [second, setSecond] = useState(false)
  useEffect(() => {
    if (!foto1 || !foto2) return
    const t = setInterval(() => setSecond(s => !s), 2000)
    return () => clearInterval(t)
  }, [foto1, foto2])
  if (!foto1) return (
    <div className="w-16 h-16 rounded-xl bg-df-purple/10 flex items-center justify-center flex-shrink-0">
      <i className="fa-solid fa-dumbbell text-df-muted" />
    </div>
  )
  return (
    <div className="w-16 h-16 rounded-xl bg-df-purple/10 overflow-hidden relative flex-shrink-0">
      <img src={foto1} alt={nombre}
        style={{ transition: 'opacity 1.5s ease-in-out' }}
        className={`absolute inset-0 w-full h-full object-contain ${second ? 'opacity-0' : 'opacity-100'}`} />
      {foto2 && (
        <img src={foto2} alt={nombre}
          style={{ transition: 'opacity 1.5s ease-in-out' }}
          className={`absolute inset-0 w-full h-full object-contain ${second ? 'opacity-100' : 'opacity-0'}`} />
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────
function formatTiempo(seg: number) {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  if (s === 0) return `${m} min`
  return `${m}:${s.toString().padStart(2, '0')} min`
}

// ── Componente principal ─────────────────────────────────────
export default function RutinaAlumna({ alumnaId }: { alumnaId: string }) {
  const hoy = DIAS_HOY[new Date().getDay()]

  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy)
  const [rutina, setRutina]                   = useState<EjercicioRutina[]>([])
  const [catalogo, setCatalogo]               = useState<CatalogoItem[]>([])
  const [loading, setLoading]                 = useState(true)
  const [guardando, setGuardando]             = useState(false)
  const [modalAgregar, setModalAgregar]       = useState(false)
  const [busqueda, setBusqueda]               = useState('')
  const [zonaFiltro, setZonaFiltro]           = useState('')
  const [musculoFiltro, setMusculoFiltro]     = useState('')
  const [editando, setEditando]               = useState<string | null>(null)
  const [editForm, setEditForm]               = useState({
    series: 3, repeticiones: '12', descanso_seg: 60,
  })

  useEffect(() => { cargar() }, [alumnaId])

  async function cargar() {
    setLoading(true)
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase
        .from('rutina_ejercicios')
        .select(`
          *,
          ejercicio:catalogo_ejercicios(
            nombre, zona, musculo, foto_inicio_url, foto_fin_url, duracion_seg
          )
        `)
        .eq('alumna_id', alumnaId)
        .order('orden'),
      supabase.from('catalogo_ejercicios').select('*').order('nombre'),
    ])
    setRutina((r as any) ?? [])
    setCatalogo(c ?? [])
    setLoading(false)
  }

  // Ejercicios del día activo
  const ejerciciosDia = rutina.filter(r => r.dia === diaSeleccionado)

  // Tiempo total estimado del día
  const tiempoTotal = ejerciciosDia.reduce((acc, e) => {
    const durEj     = (e.ejercicio.duracion_seg ?? 45) * e.series
    const durDescanso = (e.descanso_seg ?? 60) * Math.max(e.series - 1, 0)
    return acc + durEj + durDescanso
  }, 0)

  // Zona predominante (para el subtítulo del día)
  function zonaPredominante() {
    if (ejerciciosDia.length === 0) return null
    const conteo: Record<string, number> = {}
    ejerciciosDia.forEach(e => {
      conteo[e.ejercicio.zona] = (conteo[e.ejercicio.zona] ?? 0) + 1
    })
    return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0][0]
  }
  const zonaDia = zonaPredominante()

  // ── CRUD ──────────────────────────────────────────────────
  async function agregar(ej: CatalogoItem) {
    if (ejerciciosDia.some(r => r.ejercicio_id === ej.id)) {
      toast.error('Este ejercicio ya está en el día'); return
    }
    setGuardando(true)
    const nuevoOrden = ejerciciosDia.length > 0
      ? Math.max(...ejerciciosDia.map(r => r.orden)) + 1 : 0
    const { error } = await supabase.from('rutina_ejercicios').insert({
      alumna_id:    alumnaId,
      ejercicio_id: ej.id,
      series:       3,
      repeticiones: '12',
      descanso_seg: 60,
      dia:          diaSeleccionado,
      orden:        nuevoOrden,
    })
    if (error) { toast.error('Error al agregar'); setGuardando(false); return }
    toast.success(`${ej.nombre} agregado`)
    await cargar()
    setGuardando(false)
  }

  async function guardarEdicion(id: string) {
    const { error } = await supabase.from('rutina_ejercicios')
      .update({
        series:       editForm.series,
        repeticiones: editForm.repeticiones,
        descanso_seg: editForm.descanso_seg,
      })
      .eq('id', id)
    if (error) { toast.error('Error al guardar'); return }
    toast.success('Actualizado')
    setEditando(null)
    await cargar()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Quitar este ejercicio de la rutina?')) return
    const { error } = await supabase.from('rutina_ejercicios').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Ejercicio quitado')
    await cargar()
  }

  async function mover(id: string, dir: 'up' | 'down') {
    const lista = ejerciciosDia
    const idx   = lista.findIndex(r => r.id === id)
    if (dir === 'up'   && idx === 0)              return
    if (dir === 'down' && idx === lista.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const a = lista[idx], b = lista[swapIdx]
    await Promise.all([
      supabase.from('rutina_ejercicios').update({ orden: b.orden }).eq('id', a.id),
      supabase.from('rutina_ejercicios').update({ orden: a.orden }).eq('id', b.id),
    ])
    await cargar()
  }

  // ── Filtros modal ─────────────────────────────────────────
  const musculos = zonaFiltro ? (ZONAS[zonaFiltro]?.musculos ?? []) : []
  const catalogoFiltrado = catalogo.filter(ej => {
    const q = busqueda.toLowerCase()
    return (
      (!busqueda      || ej.nombre.toLowerCase().includes(q)) &&
      (!zonaFiltro    || ej.zona    === zonaFiltro)           &&
      (!musculoFiltro || ej.musculo === musculoFiltro)
    )
  })

  // ── Render ────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4">

      {/* ── Tabs de días ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DIAS.map(d => (
          <button
            key={d}
            onClick={() => setDiaSeleccionado(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              diaSeleccionado === d
                ? 'bg-df-purple text-white'
                : d === hoy
                  ? 'df-surface text-df-violet border border-df-violet/40 hover:border-df-violet/70'
                  : 'df-surface text-df-muted border border-df-border hover:border-df-violet/30'
            }`}
          >
            {DIAS_LABELS[d]}
            {d === hoy && diaSeleccionado !== d && (
              <span className="ml-1 w-1 h-1 rounded-full bg-df-violet inline-block align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* ── Header del día ── */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">
            {DIAS_NOMBRES[diaSeleccionado]}
            {zonaDia && (
              <span className="text-df-muted font-normal">
                {' — '}{ZONAS[zonaDia]?.label}
              </span>
            )}
          </h3>
          <p className="text-xs text-df-muted mt-0.5">
            {ejerciciosDia.length} ejercicio{ejerciciosDia.length !== 1 ? 's' : ''}
            {ejerciciosDia.length > 0 && tiempoTotal > 0 && (
              <span className="ml-2 text-df-violet font-semibold">
                · ~{formatTiempo(tiempoTotal)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setModalAgregar(true)}
          className="df-btn px-4 py-2 text-sm flex items-center gap-2 flex-shrink-0"
        >
          <i className="fa-solid fa-plus" /> Agregar
        </button>
      </div>

      {/* ── Lista de ejercicios ── */}
      {ejerciciosDia.length === 0 ? (
        <div className="text-center py-12">
          <i className="fa-solid fa-moon text-3xl text-df-muted mb-3 block" />
          <p className="text-df-muted text-sm mb-4">Sin ejercicios para este día</p>
          <button onClick={() => setModalAgregar(true)} className="df-btn px-5 py-2 text-sm">
            + Agregar ejercicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ejerciciosDia.map((item, idx) => (
            <div key={item.id} className="df-surface rounded-xl p-3 border border-df-border">
              <div className="flex items-center gap-3">

                {/* Foto animada */}
                <FotoAnimada
                  foto1={item.ejercicio.foto_inicio_url}
                  foto2={item.ejercicio.foto_fin_url}
                  nombre={item.ejercicio.nombre}
                />

                {/* Info + edición */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">
                    {item.ejercicio.nombre}
                  </p>
                  <p className="text-xs text-df-muted mt-0.5">
                    {ZONAS[item.ejercicio.zona]?.label}
                    {item.ejercicio.musculo && ` · ${MUSCULO_LABELS[item.ejercicio.musculo] ?? item.ejercicio.musculo}`}
                  </p>

                  {editando === item.id ? (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-df-muted">Series</span>
                        <input
                          type="number"
                          value={editForm.series}
                          onChange={e => setEditForm(f => ({ ...f, series: +e.target.value }))}
                          className="df-input w-12 text-xs py-1 px-2"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-df-muted">Reps</span>
                        <input
                          value={editForm.repeticiones}
                          onChange={e => setEditForm(f => ({ ...f, repeticiones: e.target.value }))}
                          className="df-input w-16 text-xs py-1 px-2"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-df-muted">Descanso (s)</span>
                        <input
                          type="number"
                          value={editForm.descanso_seg}
                          onChange={e => setEditForm(f => ({ ...f, descanso_seg: +e.target.value }))}
                          className="df-input w-16 text-xs py-1 px-2"
                        />
                      </div>
                      <button
                        onClick={() => guardarEdicion(item.id)}
                        className="text-xs bg-df-purple text-white px-2 py-1 rounded-lg"
                      >✓</button>
                      <button onClick={() => setEditando(null)} className="text-xs text-df-muted">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs bg-df-card px-2 py-0.5 rounded-full text-df-violet font-semibold">
                        {item.series} series
                      </span>
                      <span className="text-xs bg-df-card px-2 py-0.5 rounded-full text-df-violet font-semibold">
                        {item.repeticiones} reps
                      </span>
                      <span className="text-xs bg-df-card px-2 py-0.5 rounded-full text-df-muted">
                        <i className="fa-regular fa-clock mr-1" />
                        {item.descanso_seg ?? 60}s
                      </span>
                      <button
                        onClick={() => {
                          setEditando(item.id)
                          setEditForm({
                            series:       item.series,
                            repeticiones: item.repeticiones,
                            descanso_seg: item.descanso_seg ?? 60,
                          })
                        }}
                        className="text-[10px] text-df-muted hover:text-df-pink transition-colors"
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Orden + eliminar */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => mover(item.id, 'up')} disabled={idx === 0}
                    className="w-7 h-7 flex items-center justify-center text-df-muted hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <i className="fa-solid fa-chevron-up text-xs" />
                  </button>
                  <button
                    onClick={() => mover(item.id, 'down')} disabled={idx === ejerciciosDia.length - 1}
                    className="w-7 h-7 flex items-center justify-center text-df-muted hover:text-white disabled:opacity-20 transition-colors"
                  >
                    <i className="fa-solid fa-chevron-down text-xs" />
                  </button>
                  <button
                    onClick={() => eliminar(item.id)}
                    className="w-7 h-7 flex items-center justify-center text-red-500/50 hover:text-red-400 transition-colors"
                  >
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Marcar día de descanso ── */}
      <div className="df-surface rounded-xl px-4 py-3 border border-df-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-df-muted">
          <i className="fa-regular fa-moon text-sm" />
          <span className="text-sm">Marcar como día de descanso</span>
        </div>
        {/* Toggle visual — funcionalidad en siguiente iteración */}
        <div className="w-10 h-6 rounded-full bg-df-card border border-df-border relative">
          <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-df-muted transition-all" />
        </div>
      </div>

      {/* ── Modal agregar ejercicio ── */}
      <Modal
        open={modalAgregar}
        onClose={() => {
          setModalAgregar(false)
          setBusqueda('')
          setZonaFiltro('')
          setMusculoFiltro('')
        }}
        title={`Agregar — ${DIAS_NOMBRES[diaSeleccionado]}`}
      >
        <div className="space-y-3">

          {/* Buscador */}
          <div className="df-surface rounded-xl px-3 py-2 flex items-center gap-2 border border-df-border">
            <i className="fa-solid fa-magnifying-glass text-df-muted text-sm" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-df-muted"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')}>
                <i className="fa-solid fa-xmark text-df-muted text-sm" />
              </button>
            )}
          </div>

          {/* Filtro zona */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => { setZonaFiltro(''); setMusculoFiltro('') }}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-semibold transition-all ${
                !zonaFiltro ? 'bg-df-purple text-white' : 'df-surface text-df-muted'
              }`}
            >Todos</button>
            {Object.entries(ZONAS).map(([k, z]) => (
              <button
                key={k}
                onClick={() => { setZonaFiltro(k); setMusculoFiltro('') }}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap font-semibold transition-all ${
                  zonaFiltro === k ? 'bg-df-purple text-white' : 'df-surface text-df-muted'
                }`}
              >{z.label}</button>
            ))}
          </div>

          {/* Sub filtro músculo */}
          {musculos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setMusculoFiltro('')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
                  !musculoFiltro
                    ? 'bg-df-violet/30 text-df-violet border-df-violet/40'
                    : 'border-transparent text-df-muted'
                }`}
              >Todos</button>
              {musculos.map(m => (
                <button
                  key={m}
                  onClick={() => setMusculoFiltro(m)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
                    musculoFiltro === m
                      ? 'bg-df-violet/30 text-df-violet border-df-violet/40'
                      : 'border-transparent text-df-muted'
                  }`}
                >{MUSCULO_LABELS[m]}</button>
              ))}
            </div>
          )}

          {/* Lista catálogo */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {catalogoFiltrado.length === 0 ? (
              <p className="text-df-muted text-sm text-center py-6">Sin resultados</p>
            ) : catalogoFiltrado.map(ej => {
              const enDia = ejerciciosDia.some(r => r.ejercicio_id === ej.id)
              return (
                <div
                  key={ej.id}
                  onClick={() => !enDia && !guardando && agregar(ej)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    enDia
                      ? 'border-df-border opacity-40 cursor-not-allowed'
                      : 'border-df-border hover:border-df-violet/50 cursor-pointer'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-df-purple/10 overflow-hidden flex-shrink-0">
                    {ej.foto_inicio_url
                      ? <img src={ej.foto_inicio_url} className="w-full h-full object-contain" />
                      : <div className="flex items-center justify-center h-full">
                          <i className="fa-solid fa-dumbbell text-df-muted text-sm" />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ej.nombre}</p>
                    <p className="text-xs text-df-muted">
                      {ZONAS[ej.zona]?.label}
                      {ej.musculo && ` · ${MUSCULO_LABELS[ej.musculo] ?? ej.musculo}`}
                    </p>
                    {ej.duracion_seg > 0 && (
                      <p className="text-xs text-df-violet mt-0.5">
                        <i className="fa-regular fa-clock mr-1" />{ej.duracion_seg}s por serie
                      </p>
                    )}
                  </div>
                  {enDia
                    ? <span className="text-xs text-df-muted flex-shrink-0">Ya agregado</span>
                    : <i className="fa-solid fa-plus text-df-violet flex-shrink-0" />
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
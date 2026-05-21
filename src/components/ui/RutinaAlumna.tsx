import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/index'
import toast from 'react-hot-toast'

// ── Tipos ────────────────────────────────────────────────────
interface EjercicioRutina {
  id: string
  ejercicio_id: string
  dia: string
  series: number
  repeticiones: string
  descanso_seg: number
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
const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
const DIAS_LABEL: Record<string, string> = {
  lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom',
}
const DIAS_FULL: Record<string, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves',
  vie: 'Viernes', sab: 'Sábado', dom: 'Domingo',
}
const DIAS_HOY = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']

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

function diaDeHoy(): string {
  const map = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']
  return map[new Date().getDay()]
}

function fmtTiempo(seg: number): string {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  if (m > 0 && s > 0) return `${m}m ${s}s`
  if (m > 0) return `${m}m`
  return `${s}s`
}

// ── Mini animación ───────────────────────────────────────────
function FotoAnimada({ foto1, foto2, nombre, size = 'md' }: {
  foto1: string | null; foto2: string | null; nombre: string; size?: 'sm' | 'md'
}) {
  const [second, setSecond] = useState(false)
  useEffect(() => {
    if (!foto1 || !foto2) return
    const t = setInterval(() => setSecond(s => !s), 2000)
    return () => clearInterval(t)
  }, [foto1, foto2])
  const cls = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16'
  if (!foto1) return (
    <div className={`${cls} rounded-xl bg-df-purple/10 flex items-center justify-center flex-shrink-0`}>
      <i className="fa-solid fa-dumbbell text-df-muted text-sm"/>
    </div>
  )
  return (
    <div className={`${cls} rounded-xl bg-df-purple/10 overflow-hidden relative flex-shrink-0`}>
      <img src={foto1} alt={nombre} style={{ transition: 'opacity 1.5s ease-in-out' }}
        className={`absolute inset-0 w-full h-full object-contain ${second ? 'opacity-0' : 'opacity-100'}`}/>
      {foto2 && <img src={foto2} alt={nombre} style={{ transition: 'opacity 1.5s ease-in-out' }}
        className={`absolute inset-0 w-full h-full object-contain ${second ? 'opacity-100' : 'opacity-0'}`}/>}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────
export default function RutinaAlumna({ alumnaId }: { alumnaId: string }) {
  const [rutina, setRutina]           = useState<EjercicioRutina[]>([])
  const [catalogo, setCatalogo]       = useState<CatalogoItem[]>([])
  const [descansos, setDescansos]     = useState<string[]>([])
  const [loading, setLoading]         = useState(true)
  const [diaActivo, setDiaActivo]     = useState(diaDeHoy())
  const [modalAgregar, setModalAgregar] = useState(false)
  const [busqueda, setBusqueda]       = useState('')
  const [zonaFiltro, setZonaFiltro]   = useState('')
  const [musculoFiltro, setMusculoFiltro] = useState('')
  const [guardando, setGuardando]     = useState(false)
  const [editando, setEditando]       = useState<string | null>(null)
  const [editForm, setEditForm]       = useState({ series: 3, repeticiones: '12', descanso_seg: 60 })

  useEffect(() => { cargar() }, [alumnaId])

  async function cargar() {
    setLoading(true)
    const [{ data: r }, { data: c }, { data: d }] = await Promise.all([
      supabase.from('rutina_ejercicios')
        .select('*, ejercicio:catalogo_ejercicios(nombre, zona, musculo, foto_inicio_url, foto_fin_url, duracion_seg)')
        .eq('alumna_id', alumnaId).order('orden'),
      supabase.from('catalogo_ejercicios').select('*').order('nombre'),
      supabase.from('rutina_descansos').select('dia').eq('alumna_id', alumnaId),
    ])
    setRutina((r as any) ?? [])
    setCatalogo(c ?? [])
    setDescansos((d ?? []).map((x: any) => x.dia))
    setLoading(false)
  }

  // Toggle día de descanso
  async function toggleDescanso(dia: string) {
    const esDescanso = descansos.includes(dia)
    if (esDescanso) {
      await supabase.from('rutina_descansos').delete().eq('alumna_id', alumnaId).eq('dia', dia)
      setDescansos(d => d.filter(x => x !== dia))
      toast.success('Día de entrenamiento')
    } else {
      await supabase.from('rutina_descansos').insert({ alumna_id: alumnaId, dia })
      setDescansos(d => [...d, dia])
      toast.success('Marcado como descanso')
    }
  }

  // Ejercicios del día activo
  const ejerciciosDia = rutina.filter(r => r.dia === diaActivo)

  // Tiempo total estimado del día
  const tiempoTotal = ejerciciosDia.reduce((acc, item) => {
    return acc + (item.ejercicio.duracion_seg * item.series) + (item.descanso_seg * (item.series - 1))
  }, 0)

  // Agregar ejercicio
  async function agregar(ej: CatalogoItem) {
    const yaExiste = ejerciciosDia.some(r => r.ejercicio_id === ej.id)
    if (yaExiste) { toast.error('Ya está en este día'); return }
    setGuardando(true)
    const nuevoOrden = ejerciciosDia.length > 0 ? Math.max(...ejerciciosDia.map(r => r.orden)) + 1 : 0
    
    // Forzamos un string limpio y extraemos únicamente los 3 caracteres principales
    // Esto destruye cualquier espacio invisible o carácter de codificación oculto
    const diaPuro = String(diaActivo).replace(/[^a-z]/gi, '').toLowerCase().slice(0, 3);

    const { error } = await supabase.from('rutina_ejercicios').insert({
      alumna_id: alumnaId, 
      ejercicio_id: ej.id,
      dia: diaPuro, // 👈 Enviamos el string 100% sanitizado
      series: 3, 
      repeticiones: '12',
      descanso_seg: 60, 
      orden: nuevoOrden,
    })

    if (error) { 
      console.error("Error detallado de Supabase:", error);
      toast.error(`Error: ${error.message}`); // Cambiado para ver el error real en el toast
      setGuardando(false); 
      return 
    }

    toast.success(`${ej.nombre} agregado al ${DIAS_FULL[diaActivo]}`)
    await cargar(); 
    setGuardando(false)
  }

  // Guardar edición
  async function guardarEdicion(id: string) {
    const { error } = await supabase.from('rutina_ejercicios')
      .update({ series: editForm.series, repeticiones: editForm.repeticiones, descanso_seg: editForm.descanso_seg })
      .eq('id', id)
    if (error) { toast.error('Error al guardar'); return }
    toast.success('Actualizado')
    setEditando(null); await cargar()
  }

  // Eliminar
  async function eliminar(id: string) {
    if (!confirm('¿Quitar este ejercicio?')) return
    await supabase.from('rutina_ejercicios').delete().eq('id', id)
    toast.success('Ejercicio quitado'); await cargar()
  }

  // Mover orden
  async function mover(id: string, dir: 'up' | 'down') {
    const lista = ejerciciosDia
    const idx = lista.findIndex(r => r.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === lista.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    await Promise.all([
      supabase.from('rutina_ejercicios').update({ orden: lista[swapIdx].orden }).eq('id', lista[idx].id),
      supabase.from('rutina_ejercicios').update({ orden: lista[idx].orden }).eq('id', lista[swapIdx].id),
    ])
    await cargar()
  }

  // Filtros catálogo
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

  const esDescansoHoy = descansos.includes(diaActivo)

  return (
    <div className="space-y-4">

      {/* Selector de días */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DIAS.map(dia => {
          const esDescanso = descansos.includes(dia)
          const esActivo   = diaActivo === dia
          const count      = rutina.filter(r => r.dia === dia).length
          return (
            <button key={dia} onClick={() => setDiaActivo(dia)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-all ${
                esActivo
                  ? 'bg-df-purple border-df-violet text-white'
                  : esDescanso
                    ? 'bg-df-surface/50 border-df-border/50 text-df-muted/50'
                    : 'bg-df-surface border-df-border text-df-muted hover:text-white'
              }`}>
              <span className="text-xs font-bold">{DIAS_LABEL[dia]}</span>
              {esDescanso
                ? <i className="fa-solid fa-moon text-[10px] mt-0.5 opacity-50"/>
                : <span className={`text-[10px] mt-0.5 ${count > 0 ? 'text-df-violet' : 'opacity-0'}`}>{count}</span>
              }
            </button>
          )
        })}
      </div>

      {/* Header del día */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-bold text-base">{DIAS_FULL[diaActivo]}</h3>
          {esDescansoHoy ? (
            <p className="text-xs text-df-muted mt-0.5">Día de descanso 😴</p>
          ) : (
            <p className="text-xs text-df-muted mt-0.5">
              {ejerciciosDia.length} ejercicio{ejerciciosDia.length !== 1 ? 's' : ''}
              {tiempoTotal > 0 && <span className="ml-2">· <i className="fa-solid fa-clock mr-1 text-df-violet"/>{fmtTiempo(tiempoTotal)} est.</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle descanso */}
          <button onClick={() => toggleDescanso(diaActivo)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
              esDescansoHoy
                ? 'bg-df-violet/20 border-df-violet/40 text-df-violet'
                : 'bg-df-surface border-df-border text-df-muted hover:text-white'
            }`}>
            <i className={`fa-solid ${esDescansoHoy ? 'fa-sun' : 'fa-moon'}`}/>
            {esDescansoHoy ? 'Activar' : 'Descanso'}
          </button>
          {!esDescansoHoy && (
            <button onClick={() => setModalAgregar(true)}
              className="df-btn px-3 py-1.5 text-xs flex items-center gap-1">
              <i className="fa-solid fa-plus"/> Agregar
            </button>
          )}
        </div>
      </div>

      {/* Contenido del día */}
      {esDescansoHoy ? (
        <div className="df-surface rounded-xl p-8 text-center border border-dashed border-df-border/50">
          <div className="text-4xl mb-3">😴</div>
          <p className="text-df-muted text-sm">Este día está marcado como descanso</p>
          <button onClick={() => toggleDescanso(diaActivo)}
            className="mt-3 text-xs text-df-violet hover:text-df-pink transition-colors">
            Cambiar a día de entrenamiento
          </button>
        </div>
      ) : ejerciciosDia.length === 0 ? (
        <div className="text-center py-10">
          <i className="fa-solid fa-dumbbell text-3xl text-df-muted mb-3 block"/>
          <p className="text-df-muted text-sm mb-4">Sin ejercicios para el {DIAS_FULL[diaActivo]}</p>
          <button onClick={() => setModalAgregar(true)} className="df-btn px-5 py-2 text-sm">
            + Agregar ejercicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ejerciciosDia.map((item, idx) => (
            <div key={item.id} className="df-surface rounded-xl p-3 border border-df-border">
              <div className="flex items-center gap-3">
                <FotoAnimada foto1={item.ejercicio.foto_inicio_url} foto2={item.ejercicio.foto_fin_url} nombre={item.ejercicio.nombre}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">{item.ejercicio.nombre}</p>
                  <p className="text-xs text-df-muted mt-0.5">
                    {ZONAS[item.ejercicio.zona]?.label}
                    {item.ejercicio.musculo && ` · ${MUSCULO_LABELS[item.ejercicio.musculo] ?? item.ejercicio.musculo}`}
                  </p>

                  {editando === item.id ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
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
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-df-muted whitespace-nowrap">Descanso (seg)</span>
                        <input type="number" value={editForm.descanso_seg}
                          onChange={e => setEditForm(f => ({ ...f, descanso_seg: +e.target.value }))}
                          className="df-input w-16 text-xs py-1 px-2"/>
                        <button onClick={() => guardarEdicion(item.id)}
                          className="text-xs bg-df-purple text-white px-2 py-1 rounded-lg">✓</button>
                        <button onClick={() => setEditando(null)}
                          className="text-xs text-df-muted">✕</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs bg-df-card px-2 py-0.5 rounded-full text-df-violet font-semibold">{item.series} series</span>
                      <span className="text-xs bg-df-card px-2 py-0.5 rounded-full text-df-violet font-semibold">{item.repeticiones} reps</span>
                      <span className="text-xs bg-df-card px-2 py-0.5 rounded-full text-df-muted">
                        <i className="fa-solid fa-clock mr-1"/>{item.descanso_seg}s descanso
                      </span>
                      <button onClick={() => { setEditando(item.id); setEditForm({ series: item.series, repeticiones: item.repeticiones, descanso_seg: item.descanso_seg }) }}
                        className="text-[10px] text-df-muted hover:text-df-pink transition-colors">
                        <i className="fa-solid fa-pen"/>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button onClick={() => mover(item.id, 'up')} disabled={idx === 0}
                    className="w-7 h-7 flex items-center justify-center text-df-muted hover:text-white disabled:opacity-20">
                    <i className="fa-solid fa-chevron-up text-xs"/>
                  </button>
                  <button onClick={() => mover(item.id, 'down')} disabled={idx === ejerciciosDia.length - 1}
                    className="w-7 h-7 flex items-center justify-center text-df-muted hover:text-white disabled:opacity-20">
                    <i className="fa-solid fa-chevron-down text-xs"/>
                  </button>
                  <button onClick={() => eliminar(item.id)}
                    className="w-7 h-7 flex items-center justify-center text-red-500/50 hover:text-red-400">
                    <i className="fa-solid fa-trash text-xs"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen semanal */}
      <div className="df-surface rounded-xl p-4 border border-df-border">
        <p className="text-[10px] text-df-muted uppercase tracking-widest mb-3">Resumen semanal</p>
        <div className="grid grid-cols-7 gap-1.5">
          {DIAS.map(dia => {
            const esDescanso = descansos.includes(dia)
            const count = rutina.filter(r => r.dia === dia).length
            const esHoy = dia === diaDeHoy()
            return (
              <button key={dia} onClick={() => setDiaActivo(dia)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  diaActivo === dia ? 'bg-df-purple/30 border border-df-violet/40' : 'hover:bg-df-card'
                }`}>
                <span className={`text-[9px] font-bold ${esHoy ? 'text-df-pink' : 'text-df-muted'}`}>{DIAS_LABEL[dia]}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  esDescanso ? 'bg-df-surface/50' : count > 0 ? 'bg-df-purple/40' : 'bg-df-card'
                }`}>
                  {esDescanso
                    ? <i className="fa-solid fa-moon text-[10px] text-df-muted/40"/>
                    : count > 0
                      ? <span className="text-xs font-black text-df-violet">{count}</span>
                      : <i className="fa-solid fa-minus text-[10px] text-df-muted/30"/>
                  }
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal agregar ejercicio */}
      <Modal open={modalAgregar}
        onClose={() => { setModalAgregar(false); setBusqueda(''); setZonaFiltro(''); setMusculoFiltro('') }}
        title={`Agregar a ${DIAS_FULL[diaActivo]}`}>
        <div className="space-y-3">
          <div className="df-surface rounded-xl px-3 py-2 flex items-center gap-2 border border-df-border">
            <i className="fa-solid fa-magnifying-glass text-df-muted text-sm"/>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-df-muted"/>
            {busqueda && <button onClick={() => setBusqueda('')}><i className="fa-solid fa-xmark text-df-muted text-sm"/></button>}
          </div>

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

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {catalogoFiltrado.length === 0 ? (
              <p className="text-df-muted text-sm text-center py-6">Sin resultados</p>
            ) : catalogoFiltrado.map(ej => {
              const enDia = ejerciciosDia.some(r => r.ejercicio_id === ej.id)
              return (
                <div key={ej.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    enDia ? 'border-df-border opacity-40 cursor-not-allowed' : 'border-df-border hover:border-df-violet/50 cursor-pointer'
                  }`}
                  onClick={() => !enDia && !guardando && agregar(ej)}>
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
                    <p className="text-[10px] text-df-muted mt-0.5">
                      <i className="fa-solid fa-clock mr-1 text-df-violet"/>{fmtTiempo(ej.duracion_seg)} por serie
                    </p>
                  </div>
                  {enDia
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
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { EmptyState, Modal } from '@/components/ui/index'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

interface CatalogoEjercicio {
  id: string
  nombre: string
  zona: string
  musculo: string | null
  foto_inicio_url: string | null
  foto_fin_url: string | null
}

const ZONAS: Record<string, { label: string; musculos: string[] }> = {
  tren_superior:  { label: 'Tren superior',  musculos: ['pecho','espalda','hombros','biceps','triceps'] },
  tren_inferior:  { label: 'Tren inferior',  musculos: ['cuadriceps','isquiotibiales','gluteos','pantorrillas'] },
  core:           { label: 'Core',            musculos: ['abdomen','lumbares'] },
  cuerpo_completo:{ label: 'Cuerpo completo', musculos: [] },
}

const MUSCULO_LABELS: Record<string, string> = {
  pecho:'Pecho', espalda:'Espalda', hombros:'Hombros', biceps:'Bíceps', triceps:'Tríceps',
  cuadriceps:'Cuádriceps', isquiotibiales:'Isquiotibiales', gluteos:'Glúteos',
  pantorrillas:'Pantorrillas', abdomen:'Abdomen', lumbares:'Lumbares',
}

// ── Tarjeta con animación crossfade entre las 2 fotos ────────
function EjercicioCard({ ej, onEdit, onDelete }: {
  ej: CatalogoEjercicio
  onEdit: () => void
  onDelete: () => void
}) {
  const [showSecond, setShowSecond] = useState(false)

  useEffect(() => {
    if (!ej.foto_inicio_url || !ej.foto_fin_url) return
    const t = setInterval(() => setShowSecond(s => !s), 1200)
    return () => clearInterval(t)
  }, [ej.foto_inicio_url, ej.foto_fin_url])

  return (
    <div className="df-card p-4 hover:border-df-violet/50 transition-all group">
      {/* Imagen animada */}
      <div className="h-40 rounded-xl bg-df-purple/10 border border-df-border mb-3 overflow-hidden relative">
        {ej.foto_inicio_url ? (
          <>
            <img src={ej.foto_inicio_url} alt={ej.nombre}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${showSecond ? 'opacity-0' : 'opacity-100'}`}
            />
            {ej.foto_fin_url && (
              <img src={ej.foto_fin_url} alt={ej.nombre}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${showSecond ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <i className="fa-solid fa-dumbbell text-3xl text-df-muted"/>
          </div>
        )}
      </div>

      <h3 className="font-black text-white text-sm group-hover:text-df-pink transition-colors mb-2 leading-tight">
        {ej.nombre}
      </h3>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs bg-df-surface px-2 py-0.5 rounded-full text-df-muted">
          {ZONAS[ej.zona]?.label ?? ej.zona}
        </span>
        {ej.musculo && (
          <span className="text-xs bg-df-purple/20 text-df-violet px-2 py-0.5 rounded-full">
            {MUSCULO_LABELS[ej.musculo] ?? ej.musculo}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit}
          className="flex-1 py-1.5 text-xs df-btn-outline border border-df-border rounded-lg hover:border-df-violet/50 transition-colors">
          <i className="fa-solid fa-pen mr-1"/> Editar
        </button>
        <button onClick={onDelete}
          className="py-1.5 px-3 text-xs border border-red-900/40 text-red-400 rounded-lg hover:bg-red-900/20 transition-colors">
          <i className="fa-solid fa-trash"/>
        </button>
      </div>
    </div>
  )
}

// ── Selector de foto ─────────────────────────────────────────
function FotoUpload({ label, preview, inputRef, onChange }: {
  label: string
  preview: string | null
  inputRef: React.RefObject<HTMLInputElement>
  onChange: (f: File) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-df-muted mb-1.5">{label}</label>
      <div onClick={() => inputRef.current?.click()}
        className="h-28 rounded-xl border border-dashed border-df-border bg-df-purple/5 flex items-center justify-center cursor-pointer hover:border-df-violet/50 transition-all overflow-hidden relative">
        {preview ? (
          <img src={preview} className="w-full h-full object-contain"/>
        ) : (
          <div className="text-center">
            <i className="fa-solid fa-camera text-df-muted text-xl mb-1 block"/>
            <span className="text-xs text-df-muted">Subir foto</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && onChange(e.target.files[0])}/>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
const FORM_INIT = { nombre: '', zona: 'tren_superior', musculo: '' }

export default function CatalogoPage() {
  const { user } = useAuth()
  const [ejercicios, setEjercicios] = useState<CatalogoEjercicio[]>([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [editando, setEditando]     = useState<CatalogoEjercicio | null>(null)
  const [guardando, setGuardando]   = useState(false)
  const [busqueda, setBusqueda]     = useState('')
  const [zonaFiltro, setZonaFiltro] = useState('')
  const [musculoFiltro, setMusculoFiltro] = useState('')

  const [form, setForm]             = useState(FORM_INIT)
  const [fotoInicio, setFotoInicio] = useState<File | null>(null)
  const [fotoFin, setFotoFin]       = useState<File | null>(null)
  const [prevInicio, setPrevInicio] = useState<string | null>(null)
  const [prevFin, setPrevFin]       = useState<string | null>(null)

  const refInicio = useRef<HTMLInputElement>(null)
  const refFin    = useRef<HTMLInputElement>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('catalogo_ejercicios').select('*').order('nombre')
    setEjercicios(data ?? [])
    setLoading(false)
  }

  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleFoto(file: File, tipo: 'inicio' | 'fin') {
    const url = URL.createObjectURL(file)
    if (tipo === 'inicio') { setFotoInicio(file); setPrevInicio(url) }
    else                   { setFotoFin(file);    setPrevFin(url)    }
  }

  async function subirFoto(file: File): Promise<string | null> {
    const ext  = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('ejercicios-fotos').upload(path, file)
    if (error) return null
    return supabase.storage.from('ejercicios-fotos').getPublicUrl(path).data.publicUrl
  }

  function abrirModal(ej?: CatalogoEjercicio) {
    if (ej) {
      setEditando(ej)
      setForm({ nombre: ej.nombre, zona: ej.zona, musculo: ej.musculo ?? '' })
      setPrevInicio(ej.foto_inicio_url)
      setPrevFin(ej.foto_fin_url)
    } else {
      setEditando(null)
      setForm(FORM_INIT)
      setPrevInicio(null)
      setPrevFin(null)
      setFotoInicio(null)
      setFotoFin(null)
    }
    setModal(true)
  }

  function cerrarModal() {
    setModal(false)
    setEditando(null)
    setFotoInicio(null); setFotoFin(null)
    setPrevInicio(null); setPrevFin(null)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('Ingresa el nombre'); return }
    setGuardando(true)
    try {
      let foto_inicio_url = editando?.foto_inicio_url ?? null
      let foto_fin_url    = editando?.foto_fin_url    ?? null
      if (fotoInicio) foto_inicio_url = await subirFoto(fotoInicio)
      if (fotoFin)    foto_fin_url    = await subirFoto(fotoFin)

      const payload = {
        nombre: form.nombre.trim(),
        zona:   form.zona,
        musculo: form.musculo || null,
        foto_inicio_url,
        foto_fin_url,
        created_by: user?.id,
      }

      const { error } = editando
        ? await supabase.from('catalogo_ejercicios').update(payload).eq('id', editando.id)
        : await supabase.from('catalogo_ejercicios').insert(payload)

      if (error) throw error
      toast.success(editando ? 'Ejercicio actualizado' : 'Ejercicio agregado al catálogo')
      cerrarModal()
      cargar()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este ejercicio del catálogo?')) return
    const { error } = await supabase.from('catalogo_ejercicios').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Ejercicio eliminado')
    cargar()
  }

  const musculos  = zonaFiltro ? (ZONAS[zonaFiltro]?.musculos ?? []) : []
  const filtrados = ejercicios.filter(ej => {
    const q = busqueda.toLowerCase()
    return (
      (!busqueda      || ej.nombre.toLowerCase().includes(q)) &&
      (!zonaFiltro    || ej.zona    === zonaFiltro)           &&
      (!musculoFiltro || ej.musculo === musculoFiltro)
    )
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Catálogo de ejercicios</h1>
        <button onClick={() => abrirModal()} className="df-btn px-5 py-2.5 text-sm flex items-center gap-2">
          <i className="fa-solid fa-plus"/> Agregar
        </button>
      </div>

      {/* Buscador */}
      <div className="df-surface rounded-xl px-4 py-2.5 flex items-center gap-3 border border-df-border">
        <i className="fa-solid fa-magnifying-glass text-df-muted"/>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-df-muted"/>
        {busqueda && (
          <button onClick={() => setBusqueda('')}>
            <i className="fa-solid fa-xmark text-df-muted"/>
          </button>
        )}
      </div>

      {/* Filtro zona */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[['', 'Todos'], ...Object.entries(ZONAS).map(([k, z]) => [k, z.label])].map(([k, label]) => (
          <button key={k} onClick={() => { setZonaFiltro(k); setMusculoFiltro('') }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              zonaFiltro === k ? 'bg-df-purple text-white' : 'df-surface text-df-muted hover:text-white'
            }`}>{label}</button>
        ))}
      </div>

      {/* Sub-filtro músculo */}
      {musculos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setMusculoFiltro('')}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
              !musculoFiltro ? 'bg-df-violet/30 text-df-violet border-df-violet/40' : 'border-transparent text-df-muted hover:text-white'
            }`}>Todos</button>
          {musculos.map(m => (
            <button key={m} onClick={() => setMusculoFiltro(m)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
                musculoFiltro === m ? 'bg-df-violet/30 text-df-violet border-df-violet/40' : 'border-transparent text-df-muted hover:text-white'
              }`}>{MUSCULO_LABELS[m]}</button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState icon="fa-solid fa-dumbbell"
          title={busqueda ? 'Sin resultados' : 'Catálogo vacío'}
          sub={busqueda ? 'Intenta con otro nombre' : 'Agrega tu primer ejercicio al catálogo'}
          action={!busqueda
            ? <button onClick={() => abrirModal()} className="df-btn px-5 py-2 text-sm">+ Agregar ejercicio</button>
            : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(ej => (
            <EjercicioCard key={ej.id} ej={ej}
              onEdit={() => abrirModal(ej)}
              onDelete={() => eliminar(ej.id)}
            />
          ))}
        </div>
      )}

      {/* Modal crear / editar */}
      <Modal open={modal} onClose={cerrarModal} title={editando ? 'Editar ejercicio' : 'Nuevo ejercicio'}>
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Nombre *</label>
            <input value={form.nombre} onChange={e => setF('nombre', e.target.value)}
              placeholder="Ej: Sentadilla con barra" className="df-input w-full"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Zona</label>
              <select value={form.zona} onChange={e => { setF('zona', e.target.value); setF('musculo', '') }}
                className="df-input w-full">
                {Object.entries(ZONAS).map(([k, z]) => <option key={k} value={k}>{z.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Músculo</label>
              <select value={form.musculo} onChange={e => setF('musculo', e.target.value)}
                className="df-input w-full" disabled={ZONAS[form.zona]?.musculos.length === 0}>
                <option value="">General</option>
                {(ZONAS[form.zona]?.musculos ?? []).map(m => (
                  <option key={m} value={m}>{MUSCULO_LABELS[m]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fotos */}
          <div className="grid grid-cols-2 gap-3">
            <FotoUpload label="Posición inicial" preview={prevInicio}
              inputRef={refInicio} onChange={f => handleFoto(f, 'inicio')}/>
            <FotoUpload label="Posición final" preview={prevFin}
              inputRef={refFin} onChange={f => handleFoto(f, 'fin')}/>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={cerrarModal}
              className="flex-1 py-3 text-sm df-btn-outline border border-df-border rounded-xl">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-3 text-sm df-btn rounded-xl disabled:opacity-60">
              {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
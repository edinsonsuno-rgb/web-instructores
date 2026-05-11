import { useEffect, useState } from 'react'
import { supabase, Rutina } from '@/lib/supabase'
import { NivelBadge, EmptyState, Modal } from '@/components/ui/index'
import toast from 'react-hot-toast'

const CATEGORIAS = ['Fuerza', 'Cardio', 'HIIT', 'Flexibilidad', 'Yoga', 'Full Body', 'Tren superior', 'Tren inferior', 'Core']
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado']
const EMOJIS: Record<string, string> = {
  'Fuerza': '💪', 'Cardio': '🏃‍♀️', 'HIIT': '🔥', 'Flexibilidad': '🧘‍♀️',
  'Yoga': '🌸', 'Full Body': '⚡', 'Tren superior': '💎', 'Tren inferior': '🦵', 'Core': '🎯'
}

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState('')

  const [form, setForm] = useState({
    nombre: '', descripcion: '', nivel: 'Principiante',
    duracion_min: 45, categoria: 'Full Body'
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('rutinas').select('*').order('created_at', { ascending: false })
    setRutinas(data ?? [])
    setLoading(false)
  }

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('Ingresa el nombre'); return }
    setGuardando(true)
    const { error } = await supabase.from('rutinas').insert(form)
    if (error) { toast.error('Error al guardar'); setGuardando(false); return }
    toast.success('¡Rutina creada!')
    setModal(false)
    setForm({ nombre: '', descripcion: '', nivel: 'Principiante', duracion_min: 45, categoria: 'Full Body' })
    cargar()
    setGuardando(false)
  }

  const filtradas = rutinas.filter(r =>
    !filtro || r.nivel === filtro || r.categoria === filtro
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Mis Rutinas</h1>
        <button onClick={() => setModal(true)} className="df-btn px-5 py-2.5 text-sm flex items-center gap-2">
          <i className="fa-solid fa-plus"/> Nueva rutina
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', ...NIVELES].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filtro === f ? 'bg-df-purple text-white' : 'df-surface text-df-muted hover:text-white'
            }`}>
            {f || 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
        </div>
      ) : filtradas.length === 0 ? (
        <EmptyState icon="fa-solid fa-dumbbell" title="Sin rutinas aún"
          sub="Crea tu primera rutina para asignarla a tus alumnas"
          action={<button onClick={() => setModal(true)} className="df-btn px-5 py-2 text-sm">+ Crear rutina</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map(r => (
            <div key={r.id} className="df-card p-4 hover:border-df-violet/50 transition-all group">
              <div className="h-24 rounded-xl bg-df-purple/10 border border-df-border flex items-center justify-center mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-df-purple/20 to-transparent"/>
                <span className="text-4xl relative z-10">{EMOJIS[r.categoria] ?? '💪'}</span>
              </div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-black text-white group-hover:text-df-pink transition-colors leading-tight">{r.nombre}</h3>
                <NivelBadge nivel={r.nivel}/>
              </div>
              {r.descripcion && (
                <p className="text-xs text-df-muted mb-3 line-clamp-2">{r.descripcion}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-df-muted">
                <span><i className="fa-solid fa-clock mr-1"/>{r.duracion_min} min</span>
                <span className="bg-df-surface px-2 py-0.5 rounded-full">{r.categoria}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva rutina">
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required
              placeholder="Ej: Piernas de acero" className="df-input w-full"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              placeholder="Describe el objetivo de esta rutina..." className="df-input w-full resize-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Nivel</label>
              <select value={form.nivel} onChange={e => set('nivel', e.target.value)} className="df-input w-full">
                {NIVELES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Duración (min)</label>
              <input type="number" value={form.duracion_min} onChange={e => set('duracion_min', +e.target.value)}
                className="df-input w-full"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Categoría</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="df-input w-full">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 py-3 text-sm df-btn-outline border border-df-border rounded-xl">Cancelar</button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-3 text-sm df-btn rounded-xl disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Crear rutina'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { supabase, Sesion, Alumna } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { EstadoSesionBadge, EmptyState, Modal } from '@/components/ui/index'
import toast from 'react-hot-toast'

const TIPOS = ['Online', 'Presencial']
const ESTADOS = ['Programada', 'Completada', 'Cancelada']

export default function AgendaPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [alumnas, setAlumnas] = useState<Alumna[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0])

  const [form, setForm] = useState({
    alumna_id: '', titulo: '', fecha: new Date().toISOString().split('T')[0],
    hora_inicio: '09:00', hora_fin: '10:00', tipo: 'Online',
    estado: 'Programada', notas: '', link_videollamada: ''
  })

  useEffect(() => { cargar() }, [filtroFecha])

  async function cargar() {
    setLoading(true)
    const semanaFin = new Date(filtroFecha)
    semanaFin.setDate(semanaFin.getDate() + 7)
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from('sesiones')
        .select('*, alumna:alumnas(nombre, foto_url)')
        .gte('fecha', filtroFecha)
        .lte('fecha', semanaFin.toISOString().split('T')[0])
        .order('fecha').order('hora_inicio'),
      supabase.from('alumnas').select('id, nombre, foto_url').eq('activa', true).order('nombre'),
    ])
    setSesiones((s as any) ?? [])
    setAlumnas((a as any) ?? [])
    setLoading(false)
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.alumna_id) { toast.error('Selecciona una alumna'); return }
    setGuardando(true)
    const { error } = await supabase.from('sesiones').insert(form)
    if (error) { toast.error('Error al guardar'); setGuardando(false); return }
    toast.success('¡Sesión agendada!')
    setModal(false)
    setForm({ alumna_id: '', titulo: '', fecha: new Date().toISOString().split('T')[0], hora_inicio: '09:00', hora_fin: '10:00', tipo: 'Online', estado: 'Programada', notas: '', link_videollamada: '' })
    cargar()
    setGuardando(false)
  }

  async function cambiarEstado(id: string, estado: string) {
    const siguiente = { 'Programada': 'Completada', 'Completada': 'Cancelada', 'Cancelada': 'Programada' }
    await supabase.from('sesiones').update({ estado: (siguiente as any)[estado] }).eq('id', id)
    toast.success('Estado actualizado')
    cargar()
  }

  // Agrupar por fecha
  const porFecha: Record<string, Sesion[]> = {}
  sesiones.forEach(s => {
    if (!porFecha[s.fecha]) porFecha[s.fecha] = []
    porFecha[s.fecha].push(s)
  })

  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Agenda</h1>
        <button onClick={() => setModal(true)} className="df-btn px-5 py-2.5 text-sm flex items-center gap-2">
          <i className="fa-solid fa-plus"/> Nueva sesión
        </button>
      </div>

      {/* Navegación de semana */}
      <div className="df-surface p-4 rounded-2xl flex items-center justify-between gap-4">
        <button onClick={() => {
          const d = new Date(filtroFecha); d.setDate(d.getDate() - 7)
          setFiltroFecha(d.toISOString().split('T')[0])
        }} className="w-9 h-9 df-card rounded-xl flex items-center justify-center text-df-muted hover:text-white transition-colors">
          <i className="fa-solid fa-chevron-left text-sm"/>
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">
            {new Date(filtroFecha).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs text-df-muted">Semana del {new Date(filtroFecha).getDate()}</p>
        </div>
        <button onClick={() => {
          const d = new Date(filtroFecha); d.setDate(d.getDate() + 7)
          setFiltroFecha(d.toISOString().split('T')[0])
        }} className="w-9 h-9 df-card rounded-xl flex items-center justify-center text-df-muted hover:text-white transition-colors">
          <i className="fa-solid fa-chevron-right text-sm"/>
        </button>
      </div>

      {/* Días de la semana (scroll horizontal en móvil) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date(filtroFecha)
          d.setDate(d.getDate() + i)
          const ds = d.toISOString().split('T')[0]
          const tiene = porFecha[ds]?.length > 0
          const esHoy = ds === hoy
          return (
            <button key={ds} onClick={() => {}} className={`flex flex-col items-center px-3 py-2 rounded-xl flex-shrink-0 min-w-12 transition-all ${
              esHoy ? 'bg-df-purple text-white' : tiene ? 'df-card border-df-violet/30 text-white' : 'df-surface text-df-muted'
            }`}>
              <span className="text-[9px] uppercase">{d.toLocaleDateString('es-CO', { weekday: 'short' })}</span>
              <span className="text-lg font-black">{d.getDate()}</span>
              {tiene && <div className="w-1 h-1 rounded-full bg-df-pink mt-1"/>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
        </div>
      ) : Object.keys(porFecha).length === 0 ? (
        <EmptyState icon="fa-solid fa-calendar" title="Sin sesiones esta semana"
          sub="Agenda tu próxima sesión con una alumna"
          action={<button onClick={() => setModal(true)} className="df-btn px-5 py-2 text-sm">+ Agendar sesión</button>}
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(porFecha).map(([fecha, ses]) => (
            <div key={fecha}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${fecha === hoy ? 'bg-df-purple text-white' : 'df-surface text-df-muted'}`}>
                  {fecha === hoy ? 'Hoy' : new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className="flex-1 h-px bg-df-border"/>
              </div>
              <div className="space-y-3">
                {ses.map(s => (
                  <div key={s.id} className="df-card p-4 flex items-center gap-4">
                    {/* Hora */}
                    <div className="text-center flex-shrink-0 w-16">
                      <p className="text-sm font-black text-white">{s.hora_inicio}</p>
                      {s.hora_fin && <p className="text-[10px] text-df-muted">{s.hora_fin}</p>}
                    </div>
                    {/* Separador */}
                    <div className="w-px h-10 bg-df-purple/50 flex-shrink-0"/>
                    {/* Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar nombre={(s.alumna as any)?.nombre ?? '?'} foto_url={(s.alumna as any)?.foto_url} size="sm"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{s.titulo}</p>
                        <p className="text-xs text-df-muted">{(s.alumna as any)?.nombre} · <i className={`fa-solid ${s.tipo === 'Online' ? 'fa-video' : 'fa-location-dot'} mr-1`}/>{s.tipo}</p>
                      </div>
                    </div>
                    {/* Estado + acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <EstadoSesionBadge estado={s.estado}/>
                      <button onClick={() => cambiarEstado(s.id, s.estado)}
                        className="w-8 h-8 df-surface rounded-lg flex items-center justify-center text-df-muted hover:text-df-pink transition-colors">
                        <i className="fa-solid fa-rotate-right text-xs"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva sesión */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva sesión">
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Alumna *</label>
            <select value={form.alumna_id} onChange={e => set('alumna_id', e.target.value)} required className="df-input w-full">
              <option value="">Seleccionar alumna...</option>
              {alumnas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Título / Rutina</label>
            <input value={form.titulo} onChange={e => set('titulo', e.target.value)} required
              placeholder="Ej: Fuerza & Confianza" className="df-input w-full"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className="df-input w-full">
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Hora inicio</label>
              <input type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Hora fin</label>
              <input type="time" value={form.hora_fin} onChange={e => set('hora_fin', e.target.value)} className="df-input w-full"/>
            </div>
          </div>
          {form.tipo === 'Online' && (
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Link videollamada</label>
              <input value={form.link_videollamada} onChange={e => set('link_videollamada', e.target.value)}
                placeholder="https://meet.google.com/..." className="df-input w-full"/>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              placeholder="Indicaciones para la sesión..." className="df-input w-full resize-none"/>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 py-3 text-sm df-btn-outline border border-df-border rounded-xl text-df-muted">Cancelar</button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-3 text-sm df-btn rounded-xl disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Agendar sesión'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
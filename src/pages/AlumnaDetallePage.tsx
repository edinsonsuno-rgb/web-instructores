import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, Alumna, Sesion, Pago, AsignacionRutina } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { NivelBadge, ProgresBar, EstadoSesionBadge, EstadoPagoBadge } from '@/components/ui/index'
import toast from 'react-hot-toast'
import RutinaAlumna from '@/components/ui/RutinaAlumna'

export default function AlumnaDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [alumna, setAlumna] = useState<Alumna | null>(null)
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [asignaciones, setAsignaciones] = useState<AsignacionRutina[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'resumen' | 'sesiones' | 'pagos' | 'rutinas'>('resumen')

  useEffect(() => { if (id) cargar(id) }, [id])

  async function cargar(alumnaId: string) {
    setLoading(true)
    const [{ data: a }, { data: s }, { data: p }, { data: r }] = await Promise.all([
      supabase.from('alumnas').select('*').eq('id', alumnaId).single(),
      supabase.from('sesiones').select('*').eq('alumna_id', alumnaId).order('fecha', { ascending: false }).limit(5),
      supabase.from('pagos').select('*').eq('alumna_id', alumnaId).order('fecha_vencimiento', { ascending: false }).limit(5),
      supabase.from('asignaciones_rutinas').select('*, rutina:rutinas(nombre, categoria, duracion_min, nivel)').eq('alumna_id', alumnaId).eq('activa', true),
    ])
    setAlumna(a)
    setSesiones(s ?? [])
    setPagos((p as any) ?? [])
    setAsignaciones((r as any) ?? [])
    setLoading(false)
  }

  async function toggleActiva() {
    if (!alumna) return
    await supabase.from('alumnas').update({ activa: !alumna.activa }).eq('id', alumna.id)
    toast.success(alumna.activa ? 'Alumna desactivada' : 'Alumna activada')
    if (id) cargar(id)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
    </div>
  )
  if (!alumna) return <div className="text-df-muted text-center py-20">Alumna no encontrada</div>

  const progresoPeso = alumna.peso_inicial && alumna.peso_objetivo && alumna.peso_actual
    ? Math.max(0, Math.min(100, ((alumna.peso_inicial - alumna.peso_actual) / (alumna.peso_inicial - alumna.peso_objetivo)) * 100))
    : 0

  const TABS = [
    { key: 'resumen', label: 'Resumen', icon: 'fa-solid fa-house' },
    { key: 'sesiones', label: 'Sesiones', icon: 'fa-solid fa-calendar' },
    { key: 'pagos', label: 'Pagos', icon: 'fa-solid fa-dollar-sign' },
    { key: 'rutinas', label: 'Rutinas', icon: 'fa-solid fa-dumbbell' },
  ] as const

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/alumnos')} className="flex items-center gap-2 text-df-muted hover:text-df-pink transition-colors text-sm">
        <i className="fa-solid fa-chevron-left text-xs"/> Mis alumnas
      </button>

      {/* Header perfil */}
      <div className="df-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-df-purple/10 to-transparent pointer-events-none"/>
        <div className="flex items-start gap-4">
          <Avatar nombre={alumna.nombre} foto_url={alumna.foto_url} size="xl"/>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-black text-white">{alumna.nombre}</h1>
              <NivelBadge nivel={alumna.nivel}/>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${alumna.activa ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                {alumna.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {alumna.email && <p className="text-sm text-df-muted mb-1"><i className="fa-solid fa-envelope mr-2"/>{alumna.email}</p>}
            {alumna.telefono && (
              <a href={`https://wa.me/${alumna.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                className="text-sm text-green-400 hover:text-green-300 transition-colors">
                <i className="fa-brands fa-whatsapp mr-2"/>{alumna.telefono}
              </a>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to="/mensajes" className="w-9 h-9 df-surface rounded-xl flex items-center justify-center text-df-muted hover:text-df-pink transition-colors">
              <i className="fa-solid fa-message text-sm"/>
            </Link>
            <button onClick={toggleActiva} className="w-9 h-9 df-surface rounded-xl flex items-center justify-center text-df-muted hover:text-white transition-colors">
              <i className={`fa-solid ${alumna.activa ? 'fa-pause' : 'fa-play'} text-sm`}/>
            </button>
          </div>
        </div>

        {alumna.objetivo && (
          <div className="mt-4 p-3 bg-df-purple/10 border border-df-purple/20 rounded-xl">
            <p className="text-xs text-df-muted mb-1">🎯 Objetivo</p>
            <p className="text-sm text-df-text">{alumna.objetivo}</p>
          </div>
        )}

        {/* Progreso peso */}
        {alumna.peso_inicial && alumna.peso_objetivo && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-df-muted mb-2">
              <span>Peso inicial: {alumna.peso_inicial} kg</span>
              <span>Actual: {alumna.peso_actual ?? alumna.peso_inicial} kg</span>
              <span>Meta: {alumna.peso_objetivo} kg</span>
            </div>
            <ProgresBar pct={progresoPeso}/>
            <p className="text-xs text-df-muted mt-1 text-right">{Math.round(progresoPeso)}% hacia su meta</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 df-surface rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              tab === t.key ? 'bg-df-purple text-white' : 'text-df-muted hover:text-white'
            }`}>
            <i className={t.icon}/> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'resumen' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Sesiones totales', value: sesiones.length, icon: 'fa-solid fa-calendar-check', color: 'text-blue-400' },
            { label: 'Sesiones completadas', value: sesiones.filter(s => s.estado === 'Completada').length, icon: 'fa-solid fa-circle-check', color: 'text-green-400' },
            { label: 'Pagos al día', value: pagos.filter(p => p.estado === 'Pagado').length, icon: 'fa-solid fa-dollar-sign', color: 'text-df-pink' },
            { label: 'Rutinas asignadas', value: asignaciones.length, icon: 'fa-solid fa-dumbbell', color: 'text-df-violet' },
          ].map((s, i) => (
            <div key={i} className="df-surface p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-df-card rounded-xl flex items-center justify-center flex-shrink-0">
                <i className={`${s.icon} ${s.color}`}/>
              </div>
              <div>
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-xs text-df-muted">{s.label}</p>
              </div>
            </div>
          ))}
          {alumna.notas && (
            <div className="sm:col-span-2 df-surface p-4 rounded-xl">
              <p className="text-xs text-df-muted mb-2">📝 Notas</p>
              <p className="text-sm text-df-text">{alumna.notas}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'sesiones' && (
        <div className="space-y-3">
          {sesiones.length === 0
            ? <p className="text-df-muted text-sm text-center py-10">Sin sesiones registradas</p>
            : sesiones.map(s => (
              <div key={s.id} className="df-surface p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-df-card rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`fa-solid ${s.tipo === 'Online' ? 'fa-video' : 'fa-location-dot'} text-df-violet text-sm`}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{s.titulo}</p>
                  <p className="text-xs text-df-muted">{s.fecha} · {s.hora_inicio} · {s.tipo}</p>
                </div>
                <EstadoSesionBadge estado={s.estado}/>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'pagos' && (
        <div className="space-y-3">
          {pagos.length === 0
            ? <p className="text-df-muted text-sm text-center py-10">Sin pagos registrados</p>
            : pagos.map(p => (
              <div key={p.id} className="df-surface p-4 rounded-xl flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{p.concepto}</p>
                  <p className="text-xs text-df-muted">Vence: {p.fecha_vencimiento}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-base font-black text-white">${p.monto.toLocaleString('es-CO')}</p>
                  <EstadoPagoBadge estado={p.estado}/>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'rutinas' && (
        <RutinaAlumna alumnaId={alumna.id}/>
      )}
    </div>
  )
}
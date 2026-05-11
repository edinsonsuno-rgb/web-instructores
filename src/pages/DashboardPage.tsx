import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Alumna, Sesion, Pago } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { ProgresBar, EstadoSesionBadge, EstadoPagoBadge } from '@/components/ui/index'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const [alumnas, setAlumnas] = useState<Alumna[]>([])
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [fraseMot, setFraseMot] = useState('"La confianza en ti misma es el secreto de tu éxito."')
  const [editandoFrase, setEditandoFrase] = useState(false)

  const hora = new Date().getHours()
  const { displayName, user } = useAuth()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  const FRASES = [
  '¡Lista para transformar vidas hoy! 💪',
  '¡A darle con todo hoy! 🔥',
  '¡Tu energía inspira a tus alumnas! 💜',
  '¡Hoy es un gran día para entrenar! ⚡',
  '¡Lista para entrenar hoy! 🌸',
  ]
  const frase = FRASES[Math.floor(Math.random() * FRASES.length)]

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const hoy = new Date().toISOString().split('T')[0]
    const [{ data: a }, { data: s }, { data: p }] = await Promise.all([
      supabase.from('alumnas').select('*').eq('activa', true).order('nombre'),
      supabase.from('sesiones').select('*, alumna:alumnas(nombre,foto_url)').gte('fecha', hoy).order('fecha').order('hora_inicio').limit(5),
      supabase.from('pagos').select('*, alumna:alumnas(nombre)').in('estado', ['Pendiente', 'Vencido']).order('fecha_vencimiento').limit(5),
    ])
    setAlumnas(a ?? [])
    setSesiones((s as any) ?? [])
    setPagos((p as any) ?? [])
    const { data: profile } = await supabase.from('profiles').select('motivational_phrase').eq('id', user?.id).single()
    if (profile?.motivational_phrase) setFraseMot(profile.motivational_phrase)
    setLoading(false)
  }

  const totalMes = (() => {
    const mes = new Date().toISOString().slice(0, 7)
    return 0 // Se calculará desde pagos pagados este mes
  })()

  const sesionHoy = sesiones.find(s => s.fecha === new Date().toISOString().split('T')[0] && s.estado === 'Programada')
  const pendientesCobro = pagos.filter(p => p.estado !== 'Pagado').length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-df-muted text-sm">{frase}</p>
          <h1 className="text-xl font-black text-white">{saludo}, <span className="text-df-violet">{displayName ?? 'Instructora'}</span> 👋</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/agenda" className="w-9 h-9 df-surface rounded-xl flex items-center justify-center text-df-muted hover:text-df-pink transition-colors">
            <i className="fa-solid fa-calendar text-sm"/>
          </Link>
          <div className="w-9 h-9 df-surface rounded-xl flex items-center justify-center text-df-muted relative">
            <i className="fa-solid fa-bell text-sm"/>
            {pendientesCobro > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-df-purple rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {pendientesCobro}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Mensaje motivacional */}
          <div className="df-card p-4 border-df-purple/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-df-purple/10 to-transparent pointer-events-none"/>
            <div className="flex items-center justify-between mb-2">
              <img src="/logo.png" alt="Dorita Fit" className="h-10"/>
              <i className="fa-solid fa-pen text-[10px] text-df-muted" title="Click en la frase para editar"/>
            </div>
            {editandoFrase ? (
            <textarea
              value={fraseMot}
              onChange={e => e.target.value.length <= 120 && setFraseMot(e.target.value)}
              onBlur={async () => {
                setEditandoFrase(false)
                await supabase.from('profiles').upsert({ id: user?.id, motivational_phrase: fraseMot })
             }}
             onKeyDown={e => e.key === 'Enter' && (e.target as HTMLTextAreaElement).blur()}
             className="df-input w-full text-sm resize-none"
             rows={3}
             autoFocus
          />
        ) : (
          <p onClick={() => setEditandoFrase(true)}
            className="text-sm text-df-text italic leading-relaxed cursor-pointer hover:text-white transition-colors"
            title="Click para editar">
            {fraseMot}
          </p>
        )}
        <p className="text-[10px] text-df-muted mt-1 text-right">{fraseMot.length}/120</p>
          </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: 'fa-solid fa-fire', label: 'Alumnas activas', value: alumnas.length, color: 'text-orange-400' },
          { icon: 'fa-solid fa-calendar-check', label: 'Sesiones hoy', value: sesiones.filter(s => s.fecha === new Date().toISOString().split('T')[0]).length, color: 'text-blue-400' },
          { icon: 'fa-solid fa-trophy', label: 'Cobros pendientes', value: pendientesCobro, color: 'text-amber-400' },
          { icon: 'fa-solid fa-dollar-sign', label: 'Ingresos del mes', value: `$${totalMes.toLocaleString()}`, color: 'text-df-pink' },
        ].map((s, i) => (
          <div key={i} className="df-surface p-4 rounded-2xl">
            <div className={`text-xl mb-2 ${s.color}`}><i className={s.icon}/></div>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-df-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Próxima sesión */}
        <div className="lg:col-span-2 space-y-5">
          {sesionHoy && (
            <div>
              <h2 className="text-sm font-bold text-white mb-3">Próxima sesión hoy</h2>
              <div className="df-card p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-df-purple/10 to-transparent pointer-events-none"/>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-df-purple/20 flex items-center justify-center flex-shrink-0 border border-df-purple/30">
                    <i className="fa-solid fa-dumbbell text-2xl text-df-violet"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-black text-white truncate">{sesionHoy.titulo}</span>
                      <EstadoSesionBadge estado={sesionHoy.estado}/>
                    </div>
                    <p className="text-df-muted text-xs mb-1">
                      {(sesionHoy.alumna as any)?.nombre} · {sesionHoy.tipo} · {sesionHoy.hora_inicio}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <Link to="/agenda" className="df-btn px-4 py-2 text-xs">
                        Ver detalles →
                      </Link>
                      {sesionHoy.link_videollamada && (
                        <a href={sesionHoy.link_videollamada} target="_blank" rel="noreferrer"
                          className="df-btn-outline border border-df-violet text-df-violet px-4 py-2 text-xs rounded-full hover:bg-df-violet hover:text-white transition-all">
                          <i className="fa-solid fa-video mr-1"/> Unirse
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alumnas recientes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Mis alumnas</h2>
              <Link to="/alumnos" className="text-xs text-df-violet hover:text-df-pink transition-colors">Ver todas →</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {alumnas.slice(0, 4).map(a => (
                <Link key={a.id} to={`/alumnos/${a.id}`}
                  className="df-surface p-4 rounded-2xl flex items-center gap-3 hover:border-df-violet/40 transition-all">
                  <Avatar nombre={a.nombre} foto_url={a.foto_url} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{a.nombre}</p>
                    <p className="text-xs text-df-muted">{a.nivel}</p>
                    <ProgresBar pct={65} className="mt-2"/>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Próximas sesiones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Próximas sesiones</h2>
              <Link to="/agenda" className="text-xs text-df-violet hover:text-df-pink transition-colors">Ver agenda →</Link>
            </div>
            <div className="space-y-2">
              {sesiones.slice(0, 4).map(s => (
                <div key={s.id} className="df-surface p-3 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-df-purple/20 flex items-center justify-center flex-shrink-0">
                    <i className={`fa-solid ${s.tipo === 'Online' ? 'fa-video' : 'fa-location-dot'} text-df-violet text-sm`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.titulo}</p>
                    <p className="text-xs text-df-muted">{(s.alumna as any)?.nombre} · {s.fecha} {s.hora_inicio}</p>
                  </div>
                  <EstadoSesionBadge estado={s.estado}/>
                </div>
              ))}
              {sesiones.length === 0 && (
                <div className="df-surface p-6 rounded-xl text-center text-df-muted text-sm">
                  No hay sesiones programadas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-5">
          {/* Cobros pendientes */}
          <div className="df-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Cobros pendientes</h3>
              <Link to="/cobros" className="text-xs text-df-violet hover:text-df-pink">Ver todos →</Link>
            </div>
            <div className="space-y-2">
              {pagos.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{(p.alumna as any)?.nombre}</p>
                    <p className="text-[10px] text-df-muted">{p.concepto}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-white">${p.monto.toLocaleString()}</span>
                    <EstadoPagoBadge estado={p.estado}/>
                  </div>
                </div>
              ))}
              {pagos.length === 0 && <p className="text-xs text-df-muted text-center py-4">Sin cobros pendientes 🎉</p>}
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="df-card p-4">
            <h3 className="text-sm font-bold text-white mb-3">Accesos rápidos</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/alumnos/nueva', icon: 'fa-solid fa-user-plus', label: 'Nueva alumna', color: 'text-df-violet' },
                { to: '/rutinas/nueva', icon: 'fa-solid fa-plus-circle', label: 'Nueva rutina', color: 'text-df-pink' },
                { to: '/agenda/nueva', icon: 'fa-solid fa-calendar-plus', label: 'Nueva sesión', color: 'text-blue-400' },
                { to: '/cobros/nuevo', icon: 'fa-solid fa-file-invoice-dollar', label: 'Nuevo cobro', color: 'text-amber-400' },
              ].map(q => (
                <Link key={q.to} to={q.to}
                  className="df-surface p-3 rounded-xl flex flex-col items-center gap-2 hover:border-df-violet/40 transition-all text-center">
                  <i className={`${q.icon} text-lg ${q.color}`}/>
                  <span className="text-[10px] text-df-muted leading-tight">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

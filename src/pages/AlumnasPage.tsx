import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { supabase, Alumna } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'
import { NivelBadge, ProgresBar, EmptyState, Modal } from '@/components/ui/index'
import toast from 'react-hot-toast'

// Cliente sin sesión persistente — para crear cuentas sin afectar la sesión activa
const supabaseAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado']

export default function AlumnasPage() {
  const { user } = useAuth()
  const [alumnas, setAlumnas]     = useState<Alumna[]>([])
  const [loading, setLoading]     = useState(true)
  const [busqueda, setBusqueda]   = useState('')
  const [modal, setModal]         = useState(false)
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', objetivo: '',
    nivel: 'Principiante', peso_inicial: '', peso_objetivo: '',
    fecha_inicio: new Date().toISOString().split('T')[0], notas: '', activa: true,
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('alumnas').select('*').order('nombre')
    setAlumnas(data ?? [])
    setLoading(false)
  }

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('Ingresa el nombre'); return }
    setGuardando(true)

    // 1. Insertar alumna en la base de datos
    const { data, error } = await supabase.from('alumnas').insert({
      ...form,
      instructor_id: user?.id ?? null,
      peso_inicial:  form.peso_inicial  ? +form.peso_inicial  : null,
      peso_objetivo: form.peso_objetivo ? +form.peso_objetivo : null,
      peso_actual:   form.peso_inicial  ? +form.peso_inicial  : null,
    }).select().single()

    if (error) { toast.error('Error al guardar'); setGuardando(false); return }

    // 2. Si tiene email, crear cuenta Auth y enviar invitación
    if (form.email.trim()) {
      // Crear usuario sin afectar la sesión activa
      await supabaseAuth.auth.signUp({
        email:    form.email.trim(),
        password: crypto.randomUUID(), // contraseña aleatoria, la cambiará con el link
        options: {
          data: { nombre: form.nombre, role: 'alumna' },
        },
      })

      // Enviar email para que establezca su propia contraseña
      await supabase.auth.resetPasswordForEmail(form.email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      toast.success(`¡Alumna registrada! Se envió invitación a ${form.email}`)
    } else {
      toast.success('¡Alumna registrada!')
    }

    setModal(false)
    setForm({
      nombre: '', email: '', telefono: '', objetivo: '', nivel: 'Principiante',
      peso_inicial: '', peso_objetivo: '',
      fecha_inicio: new Date().toISOString().split('T')[0], notas: '', activa: true,
    })
    cargar()
    setGuardando(false)
    if (data) navigate(`/alumnos/${data.id}`)
  }

  const filtradas = alumnas.filter(a =>
    !busqueda ||
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Mis Alumnas</h1>
        <button onClick={() => setModal(true)}
          className="df-btn px-5 py-2.5 text-sm flex items-center gap-2">
          <i className="fa-solid fa-plus"/> Nueva alumna
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-df-muted text-sm"/>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar alumna..."
          className="df-input w-full pl-10"/>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',     value: alumnas.length,                              color: 'text-df-pink' },
          { label: 'Activas',   value: alumnas.filter(a => a.activa).length,        color: 'text-green-400' },
          { label: 'Avanzadas', value: alumnas.filter(a => a.nivel === 'Avanzado').length, color: 'text-df-violet' },
        ].map((s, i) => (
          <div key={i} className="df-surface p-3 rounded-xl text-center">
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-df-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
        </div>
      ) : filtradas.length === 0 ? (
        <EmptyState icon="fa-solid fa-users" title="Sin alumnas aún"
          sub="Agrega tu primera alumna para empezar"
          action={<button onClick={() => setModal(true)} className="df-btn px-5 py-2 text-sm">+ Nueva alumna</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map(a => (
            <Link key={a.id} to={`/alumnos/${a.id}`}
              className="df-card p-4 hover:border-df-violet/50 transition-all hover:glow-purple group">
              <div className="flex items-start gap-3 mb-3">
                <Avatar nombre={a.nombre} foto_url={a.foto_url} size="md"/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate group-hover:text-df-pink transition-colors">{a.nombre}</p>
                  <p className="text-xs text-df-muted truncate">{a.email}</p>
                  <div className="mt-1"><NivelBadge nivel={a.nivel}/></div>
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${a.activa ? 'bg-green-400' : 'bg-df-muted'}`}/>
              </div>
              {a.objetivo && (
                <p className="text-xs text-df-muted mb-3 line-clamp-2">🎯 {a.objetivo}</p>
              )}
              {a.peso_inicial && a.peso_objetivo && (
                <div>
                  <div className="flex justify-between text-[10px] text-df-muted mb-1">
                    <span>{a.peso_actual ?? a.peso_inicial} kg actual</span>
                    <span>{a.peso_objetivo} kg meta</span>
                  </div>
                  <ProgresBar pct={a.peso_objetivo && a.peso_inicial
                    ? Math.max(0, ((a.peso_inicial - (a.peso_actual ?? a.peso_inicial)) / (a.peso_inicial - a.peso_objetivo)) * 100)
                    : 0
                  }/>
                </div>
              )}
              <p className="text-[10px] text-df-muted mt-3">
                Desde {a.fecha_inicio
                  ? new Date(a.fecha_inicio).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Modal nueva alumna */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva alumna">
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Nombre completo *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required
                placeholder="Nombre de la alumna" className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="email@ejemplo.com" className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                placeholder="+57 300..." className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Nivel</label>
              <select value={form.nivel} onChange={e => set('nivel', e.target.value)} className="df-input w-full">
                {NIVELES.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Fecha inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Peso inicial (kg)</label>
              <input type="number" value={form.peso_inicial} onChange={e => set('peso_inicial', e.target.value)}
                placeholder="65" className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Peso objetivo (kg)</label>
              <input type="number" value={form.peso_objetivo} onChange={e => set('peso_objetivo', e.target.value)}
                placeholder="58" className="df-input w-full"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Objetivo</label>
              <input value={form.objetivo} onChange={e => set('objetivo', e.target.value)}
                placeholder="Ej: Bajar de peso, ganar músculo..." className="df-input w-full"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Notas</label>
              <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
                placeholder="Observaciones, lesiones, restricciones..." className="df-input w-full resize-none"/>
            </div>
          </div>

          {/* Aviso invitación */}
          {form.email && (
            <div className="flex items-start gap-2 bg-df-violet/10 border border-df-violet/20 rounded-xl px-3 py-2.5">
              <i className="fa-solid fa-envelope text-df-violet text-xs mt-0.5"/>
              <p className="text-xs text-df-muted">
                Se enviará un correo a <span className="text-df-violet font-semibold">{form.email}</span> para que configure su contraseña.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 py-3 text-sm df-btn-outline border border-df-border rounded-xl text-df-muted">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-3 text-sm df-btn rounded-xl disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Registrar alumna'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
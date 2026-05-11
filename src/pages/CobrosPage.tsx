import { useEffect, useState } from 'react'
import { supabase, Pago, Alumna } from '@/lib/supabase'
import { EstadoPagoBadge, EmptyState, Modal } from '@/components/ui/index'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

const METODOS = ['Transferencia', 'Efectivo', 'Nequi', 'Daviplata', 'PayPal', 'Otro']

export default function CobrosPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [alumnas, setAlumnas] = useState<Alumna[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState('')

  const [form, setForm] = useState({
    alumna_id: '', concepto: 'Plan mensual', monto: '',
    moneda: 'COP', estado: 'Pendiente',
    fecha_vencimiento: new Date().toISOString().split('T')[0],
    metodo_pago: '', notas: ''
  })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('pagos').select('*, alumna:alumnas(nombre, foto_url)').order('fecha_vencimiento'),
      supabase.from('alumnas').select('id, nombre, foto_url').eq('activa', true).order('nombre'),
    ])
    setPagos((p as any) ?? [])
    setAlumnas((a as any) ?? [])
    setLoading(false)
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.alumna_id || !form.monto) { toast.error('Completa los campos requeridos'); return }
    setGuardando(true)
    const { error } = await supabase.from('pagos').insert({ ...form, monto: +form.monto })
    if (error) { toast.error('Error al guardar'); setGuardando(false); return }
    toast.success('¡Cobro registrado!')
    setModal(false)
    setForm({ alumna_id: '', concepto: 'Plan mensual', monto: '', moneda: 'COP', estado: 'Pendiente', fecha_vencimiento: new Date().toISOString().split('T')[0], metodo_pago: '', notas: '' })
    cargar()
    setGuardando(false)
  }

  async function marcarPagado(id: string) {
    await supabase.from('pagos').update({ estado: 'Pagado', fecha_pago: new Date().toISOString().split('T')[0] }).eq('id', id)
    toast.success('¡Pago confirmado! 💜')
    cargar()
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este cobro?')) return
    await supabase.from('pagos').delete().eq('id', id)
    toast.success('Cobro eliminado')
    cargar()
  }

  const filtrados = filtro ? pagos.filter(p => p.estado === filtro) : pagos

  // Totales
  const totalPagado = pagos.filter(p => p.estado === 'Pagado').reduce((a, p) => a + p.monto, 0)
  const totalPendiente = pagos.filter(p => p.estado === 'Pendiente').reduce((a, p) => a + p.monto, 0)
  const totalVencido = pagos.filter(p => p.estado === 'Vencido').reduce((a, p) => a + p.monto, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Cobros</h1>
        <button onClick={() => setModal(true)} className="df-btn px-5 py-2.5 text-sm flex items-center gap-2">
          <i className="fa-solid fa-plus"/> Nuevo cobro
        </button>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-3 gap-3">
        <div className="df-card p-4 text-center border-green-900/30">
          <p className="text-xs text-df-muted mb-1">Cobrado</p>
          <p className="text-lg font-black text-green-400">${totalPagado.toLocaleString('es-CO')}</p>
        </div>
        <div className="df-card p-4 text-center border-amber-900/30">
          <p className="text-xs text-df-muted mb-1">Pendiente</p>
          <p className="text-lg font-black text-amber-400">${totalPendiente.toLocaleString('es-CO')}</p>
        </div>
        <div className="df-card p-4 text-center border-red-900/30">
          <p className="text-xs text-df-muted mb-1">Vencido</p>
          <p className="text-lg font-black text-red-400">${totalVencido.toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'Pendiente', 'Pagado', 'Vencido'].map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filtro === f ? 'bg-df-purple text-white' : 'df-surface text-df-muted hover:text-white'
            }`}>
            {f || 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState icon="fa-solid fa-dollar-sign" title="Sin cobros aún"
          sub="Registra el primer cobro de tus alumnas"
          action={<button onClick={() => setModal(true)} className="df-btn px-5 py-2 text-sm">+ Nuevo cobro</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtrados.map(p => (
            <div key={p.id} className="df-card p-4 flex items-center gap-4">
              <Avatar nombre={(p.alumna as any)?.nombre ?? '?'} foto_url={(p.alumna as any)?.foto_url} size="sm"/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-bold text-white truncate">{(p.alumna as any)?.nombre}</p>
                  <EstadoPagoBadge estado={p.estado}/>
                </div>
                <p className="text-xs text-df-muted">{p.concepto}</p>
                <p className="text-[10px] text-df-muted">
                  Vence: {new Date(p.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {p.metodo_pago && ` · ${p.metodo_pago}`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-base font-black text-white">${p.monto.toLocaleString('es-CO')}</p>
                  <p className="text-[10px] text-df-muted">{p.moneda}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {p.estado !== 'Pagado' && (
                    <button onClick={() => marcarPagado(p.id)}
                      className="w-8 h-8 bg-green-900/30 hover:bg-green-700 rounded-lg flex items-center justify-center text-green-400 hover:text-white transition-all">
                      <i className="fa-solid fa-check text-xs"/>
                    </button>
                  )}
                  <button onClick={() => eliminar(p.id)}
                    className="w-8 h-8 bg-red-900/20 hover:bg-red-900/50 rounded-lg flex items-center justify-center text-red-400 transition-all">
                    <i className="fa-solid fa-trash text-xs"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo cobro">
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Alumna *</label>
            <select value={form.alumna_id} onChange={e => set('alumna_id', e.target.value)} required className="df-input w-full">
              <option value="">Seleccionar alumna...</option>
              {alumnas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Concepto</label>
            <input value={form.concepto} onChange={e => set('concepto', e.target.value)} required
              placeholder="Ej: Plan mensual, sesión individual..." className="df-input w-full"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Monto *</label>
              <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)} required
                placeholder="150000" className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Moneda</label>
              <select value={form.moneda} onChange={e => set('moneda', e.target.value)} className="df-input w-full">
                <option>COP</option><option>USD</option><option>EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} className="df-input w-full"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Estado</label>
              <select value={form.estado} onChange={e => set('estado', e.target.value)} className="df-input w-full">
                <option>Pendiente</option><option>Pagado</option><option>Vencido</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-df-muted mb-1.5">Método de pago</label>
              <select value={form.metodo_pago} onChange={e => set('metodo_pago', e.target.value)} className="df-input w-full">
                <option value="">Sin especificar</option>
                {METODOS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-df-muted mb-1.5">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              placeholder="Observaciones..." className="df-input w-full resize-none"/>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="flex-1 py-3 text-sm df-btn-outline border border-df-border rounded-xl text-df-muted">Cancelar</button>
            <button type="submit" disabled={guardando}
              className="flex-1 py-3 text-sm df-btn rounded-xl disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Registrar cobro'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
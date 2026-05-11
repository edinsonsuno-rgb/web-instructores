import { useEffect, useState, useRef } from 'react'
import { supabase, Mensaje, Alumna } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function MensajesPage() {
  const [alumnas, setAlumnas] = useState<Alumna[]>([])
  const [seleccionada, setSeleccionada] = useState<Alumna | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [noLeidos, setNoLeidos] = useState<Record<string, number>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { cargarAlumnas() }, [])
  useEffect(() => { if (seleccionada) cargarMensajes(seleccionada.id) }, [seleccionada])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  async function cargarAlumnas() {
    setLoading(true)
    const { data } = await supabase.from('alumnas').select('*').eq('activa', true).order('nombre')
    setAlumnas(data ?? [])

    // Contar no leídos por alumna
    const { data: nl } = await supabase.from('mensajes')
      .select('alumna_id').eq('leido', false).eq('de_instructora', false)
    const counts: Record<string, number> = {}
    nl?.forEach(m => { counts[m.alumna_id] = (counts[m.alumna_id] ?? 0) + 1 })
    setNoLeidos(counts)
    setLoading(false)
  }

  async function cargarMensajes(alumnaId: string) {
    const { data } = await supabase.from('mensajes')
      .select('*').eq('alumna_id', alumnaId).order('created_at')
    setMensajes(data ?? [])
    // Marcar como leídos
    await supabase.from('mensajes').update({ leido: true })
      .eq('alumna_id', alumnaId).eq('de_instructora', false)
    setNoLeidos(prev => ({ ...prev, [alumnaId]: 0 }))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || !seleccionada) return
    setEnviando(true)
    const { error } = await supabase.from('mensajes').insert({
      alumna_id: seleccionada.id,
      contenido: texto.trim(),
      de_instructora: true,
      leido: false,
    })
    if (error) { toast.error('Error al enviar'); setEnviando(false); return }
    setTexto('')
    cargarMensajes(seleccionada.id)
    setEnviando(false)
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] flex gap-4 overflow-hidden">
      {/* Lista alumnas */}
      <div className={`${seleccionada ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 df-surface rounded-2xl overflow-hidden flex-shrink-0`}>
        <div className="p-4 border-b border-df-border">
          <h2 className="text-base font-black text-white">Mensajes</h2>
          <p className="text-xs text-df-muted">Chatea con tus alumnas</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-df-border border-t-df-violet rounded-full animate-spin"/>
            </div>
          ) : alumnas.length === 0 ? (
            <p className="text-df-muted text-sm text-center py-10">Sin alumnas aún</p>
          ) : (
            alumnas.map(a => (
              <button key={a.id} onClick={() => setSeleccionada(a)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-df-card transition-colors border-b border-df-border/50 ${
                  seleccionada?.id === a.id ? 'bg-df-card border-l-2 border-l-df-violet' : ''
                }`}>
                <Avatar nombre={a.nombre} foto_url={a.foto_url} size="sm"/>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">{a.nombre}</p>
                  <p className="text-xs text-df-muted truncate">{a.nivel}</p>
                </div>
                {(noLeidos[a.id] ?? 0) > 0 && (
                  <span className="w-5 h-5 bg-df-violet rounded-full text-[10px] text-white flex items-center justify-center font-bold flex-shrink-0">
                    {noLeidos[a.id]}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      {!seleccionada ? (
        <div className="hidden lg:flex flex-1 df-surface rounded-2xl items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-df-card rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-message text-2xl text-df-muted"/>
            </div>
            <p className="text-white font-semibold">Selecciona una alumna</p>
            <p className="text-df-muted text-sm mt-1">para ver sus mensajes</p>
          </div>
        </div>
      ) : (
        <div className={`${seleccionada ? 'flex' : 'hidden lg:flex'} flex-col flex-1 df-surface rounded-2xl overflow-hidden`}>
          {/* Chat header */}
          <div className="p-4 border-b border-df-border flex items-center gap-3">
            <button onClick={() => setSeleccionada(null)} className="lg:hidden text-df-muted hover:text-white mr-1">
              <i className="fa-solid fa-chevron-left"/>
            </button>
            <Avatar nombre={seleccionada.nombre} foto_url={seleccionada.foto_url} size="sm"/>
            <div>
              <p className="text-sm font-bold text-white">{seleccionada.nombre}</p>
              <p className="text-xs text-df-muted">{seleccionada.nivel}</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensajes.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-df-muted text-sm">Inicia la conversación con {seleccionada.nombre} 💜</p>
              </div>
            )}
            {mensajes.map(m => (
              <div key={m.id} className={`flex ${m.de_instructora ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                  m.de_instructora
                    ? 'bg-df-purple text-white rounded-br-sm'
                    : 'bg-df-card text-df-text rounded-bl-sm border border-df-border'
                }`}>
                  <p className="leading-relaxed">{m.contenido}</p>
                  <p className={`text-[9px] mt-1 ${m.de_instructora ? 'text-white/60 text-right' : 'text-df-muted'}`}>
                    {new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <form onSubmit={enviar} className="p-4 border-t border-df-border flex gap-3 items-end">
            <input
              value={texto} onChange={e => setTexto(e.target.value)}
              placeholder={`Mensaje para ${seleccionada.nombre}...`}
              className="df-input flex-1 resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(e) } }}
            />
            <button type="submit" disabled={enviando || !texto.trim()}
              className="df-btn w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40">
              <i className="fa-solid fa-paper-plane text-sm"/>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
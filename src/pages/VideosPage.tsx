import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface Video {
  id: string
  titulo: string
  descripcion?: string
  url_youtube: string
  categoria: string
  created_at: string
}

const CATEGORIAS = ['Todas', 'Pierna', 'Brazo', 'Pecho', 'Espalda', 'Abdomen', 'Glúteo', 'Cardio']

function getVideoId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function getEmbedUrl(url: string) {
  const id = getVideoId(url)
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0&showinfo=0` : url
}

function getThumbnail(url: string) {
  const id = getVideoId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ''
}

export default function VideosPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin' || role === 'owner'

  const [videos, setVideos] = useState<Video[]>([])
  const [categoria, setCategoria] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [videoActivo, setVideoActivo] = useState<Video | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Video | null>(null)
  const [form, setForm] = useState({ titulo: '', descripcion: '', url_youtube: '', categoria: 'Pierna' })

  useEffect(() => { fetchVideos() }, [])

  async function fetchVideos() {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false })
    setVideos(data ?? [])
    setLoading(false)
  }

  async function handleGuardar() {
    if (!form.titulo || !form.url_youtube) return toast.error('Título y URL son requeridos')
    if (editando) {
      const { error } = await supabase.from('videos').update(form).eq('id', editando.id)
      if (error) return toast.error('Error al actualizar')
      toast.success('Video actualizado')
    } else {
      const { error } = await supabase.from('videos').insert(form)
      if (error) return toast.error('Error al guardar')
      toast.success('Video agregado')
    }
    setShowForm(false)
    setEditando(null)
    setForm({ titulo: '', descripcion: '', url_youtube: '', categoria: 'Pierna' })
    fetchVideos()
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar este video?')) return
    await supabase.from('videos').delete().eq('id', id)
    toast.success('Video eliminado')
    fetchVideos()
  }

  function handleEditar(v: Video) {
    setEditando(v)
    setForm({ titulo: v.titulo, descripcion: v.descripcion ?? '', url_youtube: v.url_youtube, categoria: v.categoria })
    setShowForm(true)
  }

  const filtrados = categoria === 'Todas' ? videos : videos.filter(v => v.categoria === categoria)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-white uppercase">Videos</h1>
        {isAdmin && (
          <button onClick={() => { setEditando(null); setForm({ titulo: '', descripcion: '', url_youtube: '', categoria: 'Pierna' }); setShowForm(true) }}
            className="df-btn px-4 py-2 text-sm font-black uppercase tracking-widest glow-purple">
            + Agregar
          </button>
        )}
      </div>

      {/* Filtros scrolleables */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIAS.map(c => (
          <button key={c} onClick={() => setCategoria(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              categoria === c ? 'bg-df-purple text-white' : 'border border-df-border text-df-muted hover:text-white'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Lista estilo Spotify */}
      {loading ? (
        <p className="text-df-muted text-center py-10">Cargando...</p>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-df-muted">
          <i className="fa-solid fa-video text-4xl mb-3 block opacity-30"/>
          <p>No hay videos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(v => (
            <div key={v.id}
              className="df-card flex overflow-hidden cursor-pointer hover:border-df-purple/50 transition-all"
              onClick={() => setVideoActivo(v)}
            >
              {/* Thumbnail grande */}
              <div className="relative flex-shrink-0 w-32 h-32">
                <img src={getThumbnail(v.url_youtube)} alt={v.titulo} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <i className="fa-solid fa-play text-white text-sm ml-0.5"/>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-df-violet uppercase tracking-widest">{v.categoria}</span>
                  <h3 className="text-white font-black text-base leading-tight mt-0.5">{v.titulo}</h3>
                  {v.descripcion && <p className="text-df-muted text-xs mt-1 line-clamp-2">{v.descripcion}</p>}
                </div>
              </div>

              {/* Acciones admin */}
              {isAdmin && (
               <div className="flex flex-col gap-3 p-3 justify-center flex-shrink-0" onClick={e => e.stopPropagation()}>
                 <button onClick={() => handleEditar(v)} className="text-df-muted hover:text-df-violet transition-colors">
                    <i className="fa-solid fa-pen text-xs"/>
                 </button>
                 <button onClick={() => handleEliminar(v.id)} className="text-df-muted hover:text-red-400 transition-colors">
                    <i className="fa-solid fa-trash text-xs"/>
                 </button>
               </div>
            )}
          </div>
        ))}
          
        </div>
      )}

      {/* Modal reproductor */}
      {videoActivo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 flex-shrink-0">
            <button onClick={() => setVideoActivo(null)} className="text-white">
              <i className="fa-solid fa-chevron-down text-xl"/>
            </button>
            <span className="text-xs font-semibold text-df-violet uppercase tracking-widest">{videoActivo.categoria}</span>
            <div className="w-6"/>
          </div>

          {/* Video */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={getEmbedUrl(videoActivo.url_youtube)}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>

          {/* Info */}
          <div className="p-4 flex-1">
            <h2 className="text-white text-xl font-black">{videoActivo.titulo}</h2>
            {videoActivo.descripcion && <p className="text-df-muted text-sm mt-2">{videoActivo.descripcion}</p>}
          </div>
        </div>
      )}

      {/* Modal agregar/editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-4">
          <div className="df-card p-6 w-full max-w-md">
            <h2 className="text-white font-black uppercase mb-6">{editando ? 'Editar video' : 'Agregar video'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-df-muted mb-2">Título</label>
                <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Sentadillas con barra" className="df-input w-full"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-df-muted mb-2">URL de YouTube</label>
                <input value={form.url_youtube} onChange={e => setForm({ ...form, url_youtube: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..." className="df-input w-full"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-df-muted mb-2">Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="df-input w-full">
                  {CATEGORIAS.filter(c => c !== 'Todas').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-df-muted mb-2">Descripción (opcional)</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción del ejercicio..." rows={3} className="df-input w-full resize-none"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditando(null) }}
                className="df-btn-outline flex-1 py-2.5 text-sm font-bold uppercase">Cancelar</button>
              <button onClick={handleGuardar}
                className="df-btn flex-1 py-2.5 text-sm font-black uppercase">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function SetupName() {
  const { updateDisplayName } = useAuth()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await updateDisplayName(name.trim())
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-df-bg flex items-center justify-center p-4">
      <div className="df-card p-8 w-full max-w-sm text-center">
        <img src="/logo.png" alt="Dorita Fit" className="h-10 mx-auto mb-6"/>
        <h2 className="text-xl font-black text-white mb-2">¡Bienvenida! 🎉</h2>
        <p className="text-df-muted text-sm mb-6">¿Cómo quieres que te llamemos?</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Dorita, María, Coach..."
            className="df-input w-full text-center"
            autoFocus
          />
          <button type="submit" disabled={loading || !name.trim()}
            className="df-btn w-full py-3 text-sm font-black disabled:opacity-60">
            {loading ? 'Guardando...' : '¡Listo!'}
          </button>
        </form>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [pass, setPass]         = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    // Verificar si ya hay sesión activa (hash procesado antes del listener)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    // También escuchar cambios de estado por si el hash se procesa después
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (pass.length < 6)  { toast.error('Mínimo 6 caracteres'); return }
    if (pass !== confirm) { toast.error('Las contraseñas no coinciden'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pass })
    setLoading(false)
    if (error) {
      toast.error('Link expirado. Solicita uno nuevo.')
    } else {
      toast.success('¡Contraseña creada! 💜')
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-dvh bg-df-bg circuit-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-df-purple/10 blur-3xl pointer-events-none"/>

      <div className="w-full max-w-sm relative z-10">
        <div className="df-card p-8">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Dorita Fit" className="h-10 mx-auto mb-4"/>
            <div className="w-14 h-14 rounded-2xl bg-df-purple/20 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-key text-df-violet text-xl"/>
            </div>
            <h2 className="text-white font-bold text-lg">Crea tu contraseña</h2>
            <p className="text-df-muted text-sm mt-1">Elige una contraseña para acceder a tu rutina</p>
          </div>

          {!ready ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-8 h-8 border-4 border-df-border border-t-df-violet rounded-full animate-spin mx-auto"/>
              <p className="text-df-muted text-sm">Verificando link...</p>
              <button
                onClick={() => setReady(true)}
                className="text-xs text-df-violet underline"
              >
                ¿Ya verificado? Continuar
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-df-muted mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass} onChange={e => setPass(e.target.value)} required
                    placeholder="Mínimo 6 caracteres"
                    className="df-input w-full pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-df-muted hover:text-df-violet transition-colors">
                    <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}/>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-df-muted mb-2">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Repite la contraseña"
                  className="df-input w-full"
                />
              </div>

              {pass.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(n => (
                      <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                        pass.length >= n * 3
                          ? n <= 2 ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-df-border'
                      }`}/>
                    ))}
                  </div>
                  <p className="text-[10px] text-df-muted">
                    {pass.length < 6 ? 'Muy corta' : pass.length < 10 ? 'Aceptable' : 'Fuerte 💪'}
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="df-btn w-full py-3.5 text-sm font-black uppercase tracking-widest disabled:opacity-60">
                {loading ? 'Guardando...' : 'Crear contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
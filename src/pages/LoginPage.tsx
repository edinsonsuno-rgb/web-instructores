import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, pass)
      navigate('/dashboard')
    } catch {
      toast.error('Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-df-bg circuit-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-df-purple/10 blur-3xl pointer-events-none"/>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-df-violet/8 blur-3xl pointer-events-none"/>

      <div className="w-full max-w-sm relative z-10">
        {!showLogin ? (
          /* ── SPLASH ── */
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-12">
              <img src="/logo.png" alt="Dorita Fit" className="h-23"/>
              <p className="text-df-muted text-xs tracking-widest uppercase mt-2" style={{letterSpacing:'.25em'}}>
                Train your best
              </p>
            </div>

            {/* Hero */}
            <div className="mb-10">
              <h1 className="text-2xl font-black text-white uppercase leading-tight mb-3">
                Tu mejor versión<br/>
                <span className="text-df-violet">Empieza hoy</span>
              </h1>
              <p className="text-df-muted text-sm leading-relaxed max-w-xs">
                Tu plataforma de entrenamiento personalizado.
              </p>
            </div>

            {/* Dots */}
            <div className="flex gap-2 mb-10">
              <div className="w-6 h-1.5 rounded-full bg-df-violet"/>
              <div className="w-1.5 h-1.5 rounded-full bg-df-border"/>
              <div className="w-1.5 h-1.5 rounded-full bg-df-border"/>
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowLogin(true)}
              className="df-btn w-3/4 mx-auto block py-3 text-sm font-black uppercase tracking-widest mb-4 glow-purple"
            >
              Comenzar
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="text-df-muted text-sm hover:text-df-pink transition-colors"
            >
              ¿Ya tienes cuenta? <span className="text-df-violet font-semibold">Inicia sesión</span>
            </button>
          </div>
        ) : (
          /* ── LOGIN FORM ── */
          <div className="df-card p-8">
            <button onClick={() => setShowLogin(false)} className="text-df-muted hover:text-df-pink transition-colors mb-6 flex items-center gap-2 text-sm">
              <i className="fa-solid fa-chevron-left text-xs"/> Volver
            </button>

            <div className="text-center mb-8">
              <img src="/logo.png" alt="Dorita Fit" className="h-10 mx-auto"/>
              <p className="text-df-muted text-sm">Bienvenida de vuelta 💜</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-df-muted mb-2">Correo electrónico</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com"
                  className="df-input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-df-muted mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass} onChange={e => setPass(e.target.value)} required
                    placeholder="••••••••"
                    className="df-input w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-df-muted hover:text-df-violet transition-colors"
                >
                    <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`}/>
                </button>
              </div>
            </div>
              <button type="submit" disabled={loading}
                className="df-btn w-full py-3.5 text-sm font-black uppercase tracking-widest mt-2 disabled:opacity-60">
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
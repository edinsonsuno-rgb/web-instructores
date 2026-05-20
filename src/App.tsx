import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import AlumnasPage from '@/pages/AlumnasPage'
import AlumnaDetallePage from '@/pages/AlumnaDetallePage'
import RutinasPage from '@/pages/RutinasPage'
import AgendaPage from '@/pages/AgendaPage'
import CobrosPage from '@/pages/CobrosPage'
import MensajesPage from '@/pages/MensajesPage'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import SetupName from '@/components/ui/SetupName'
import VideosPage from '@/pages/VideosPage'
import CatalogoPage from '@/pages/CatalogoPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading, displayName } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-df-bg flex items-center justify-center">
      <div className="text-center">
        <img src="/logo.png" alt="Dorita Fit" className="h-15 mx-auto mb-4"/>
        <div className="w-8 h-8 border-4 border-violet-900 border-t-violet-400 rounded-full animate-spin mx-auto"/>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace/>
  if (!displayName) return <SetupName/>
  return <>{children}</>
}

function InactivityGuard() {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    const TIMEOUT = 10 * 60 * 1000
    const reset = () => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => supabase.auth.signOut(), TIMEOUT)
    }
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, reset))
    reset()
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      clearTimeout(timer.current)
    }
  }, [])
  return null
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/reset-password" element={<ResetPasswordPage/>}/>
      <Route path="/" element={<Guard><AppLayout/></Guard>}>
        <Route index element={<Navigate to="/dashboard" replace/>}/>
        <Route path="dashboard" element={<DashboardPage/>}/>
        <Route path="alumnos" element={<AlumnasPage/>}/>
        <Route path="alumnos/:id" element={<AlumnaDetallePage/>}/>
        <Route path="rutinas" element={<RutinasPage/>}/>
        <Route path="catalogo" element={<CatalogoPage/>}/>
        <Route path="videos" element={<VideosPage/>}/>
        <Route path="agenda" element={<AgendaPage/>}/>
        <Route path="cobros" element={<CobrosPage/>}/>
        <Route path="mensajes" element={<MensajesPage/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InactivityGuard/>
        <AppRoutes/>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1030', color: '#e2d9f3', border: '1px solid #2d1f50', fontSize: '13px', borderRadius: '12px' },
          success: { iconTheme: { primary: '#a855f7', secondary: '#1a1030' } }
        }}/>
      </AuthProvider>
    </BrowserRouter>
  )
}
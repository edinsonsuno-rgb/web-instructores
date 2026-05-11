import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Logo from '@/components/ui/Logo'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard', icon: 'fa-solid fa-house', label: 'Inicio' },
  { to: '/alumnos',   icon: 'fa-solid fa-users', label: 'Alumnos' },
  { to: '/rutinas',   icon: 'fa-solid fa-dumbbell', label: 'Rutinas' },
  { to: '/videos',    icon: 'fa-solid fa-play', label: 'Videos' },
  { to: '/agenda',    icon: 'fa-solid fa-calendar', label: 'Agenda' },
  { to: '/cobros',    icon: 'fa-solid fa-dollar-sign', label: 'Cobros' },
  { to: '/mensajes',  icon: 'fa-solid fa-message', label: 'Mensajes' },
]

export default function AppLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
    toast.success('Sesión cerrada')
  }

  return (
    <div className="flex min-h-screen bg-df-bg">
      {/* ── SIDEBAR DESKTOP ── */}
      {/* ── DRAWER MOBILE ── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-df-surface border-r border-df-border z-50 flex flex-col transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-df-border flex items-center justify-between">
          <Logo size="md"/>
          <button onClick={() => setDrawerOpen(false)} className="text-df-muted hover:text-df-pink transition-colors">
            <i className="fa-solid fa-xmark text-lg"/>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive ? 'bg-df-purple/20 text-df-pink border border-df-purple/30' : 'text-df-muted hover:text-df-text hover:bg-df-card'
                }`
            }
          >
            <i className={`${item.icon} text-base w-4 text-center`}/>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-df-border">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-df-muted hover:text-red-400 hover:bg-red-900/20 transition-all w-full"
        >
          <i className="fa-solid fa-right-from-bracket text-base w-4 text-center"/>
          Cerrar sesión
        </button>
      </div>
    </aside>

      <aside className={`hidden lg:flex flex-col bg-df-surface border-r border-df-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} fixed top-0 left-0 bottom-0 z-30`}>
        {/* Logo */}
        <div className={`p-4 border-b border-df-border flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <Logo size="sm" showTagline />}
          <button onClick={() => setCollapsed(!collapsed)} className="text-df-muted hover:text-df-pink transition-colors">
            <i className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`}/>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-df-purple/20 text-df-pink border border-df-purple/30'
                    : 'text-df-muted hover:text-df-text hover:bg-df-card'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <i className={`${item.icon} text-base w-4 text-center`}/>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t border-df-border ${collapsed ? 'flex justify-center' : ''}`}>
          <button onClick={handleSignOut}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-df-muted hover:text-red-400 hover:bg-red-900/20 transition-all w-full ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <i className="fa-solid fa-right-from-bracket text-base w-4 text-center"/>
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        {/* Topbar mobile */}
        <header className="lg:hidden bg-df-surface border-b border-df-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setDrawerOpen(true)} className="text-df-muted hover:text-df-pink transition-colors">
            <i className="fa-solid fa-bars text-lg"/>
          </button>
          <Logo size="md"/>
          <div className="flex items-center gap-3">
            <NavLink to="/mensajes" className="text-df-muted hover:text-df-pink transition-colors">
              <i className="fa-solid fa-message"/>
            </NavLink>
            <button onClick={handleSignOut} className="text-df-muted hover:text-red-400 transition-colors">
              <i className="fa-solid fa-right-from-bracket"/>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto overflow-x-hidden">
          <Outlet/>
        </div>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-df-surface border-t border-df-border z-20 grid grid-cols-7">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 gap-1 text-[9px] font-semibold transition-colors ${
                  isActive ? 'text-df-pink' : 'text-df-muted'
                }`
              }
            >
              <i className={`${item.icon} text-lg`}/>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  )
}
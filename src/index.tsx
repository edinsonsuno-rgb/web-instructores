export function NivelBadge({ nivel }: { nivel: string }) {
  const cls: Record<string, string> = {
    'Principiante': 'df-badge-beg',
    'Intermedio': 'df-badge-int',
    'Avanzado': 'df-badge-adv',
  }
  return <span className={cls[nivel] ?? 'df-badge-beg'}>{nivel}</span>
}

export function EstadoPagoBadge({ estado }: { estado: string }) {
  const cls: Record<string, string> = {
    'Pagado': 'df-badge-paid',
    'Pendiente': 'df-badge-pending',
    'Vencido': 'df-badge-overdue',
  }
  return <span className={cls[estado] ?? 'df-badge-pending'}>{estado}</span>
}

export function EstadoSesionBadge({ estado }: { estado: string }) {
  const cls: Record<string, string> = {
    'Programada': 'bg-violet-900/50 text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full',
    'Completada': 'df-badge-paid',
    'Cancelada': 'df-badge-overdue',
  }
  return <span className={cls[estado] ?? ''}>{estado}</span>
}

export function StatCard({ icon, label, value, sub, color = 'text-df-pink' }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="df-surface p-4 flex flex-col gap-1">
      <div className={`text-2xl ${color}`}><i className={icon}/></div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-df-muted">{label}</div>
      {sub && <div className="text-xs text-df-muted">{sub}</div>}
    </div>
  )
}

export function ProgresBar({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <div className={`h-1.5 bg-df-border rounded-full overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-df-purple to-df-pink transition-all duration-500"
        style={{ width: `${Math.min(100, pct)}%` }}/>
    </div>
  )
}

export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="df-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-df-border">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-df-muted hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-lg"/>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, sub, action }: {
  icon: string; title: string; sub?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-df-surface flex items-center justify-center mb-4">
        <i className={`${icon} text-2xl text-df-muted`}/>
      </div>
      <p className="text-white font-semibold mb-1">{title}</p>
      {sub && <p className="text-df-muted text-sm mb-4">{sub}</p>}
      {action}
    </div>
  )
}
interface EmptyStateProps {
  icon: string
  title: string
  sub: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, sub, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <i className={`${icon} text-4xl text-df-muted/40`}/>
      <p className="text-white font-bold text-lg">{title}</p>
      <p className="text-df-muted text-sm max-w-xs">{sub}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

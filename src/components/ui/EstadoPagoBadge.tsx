const COLORES: Record<string, string> = {
  'Pagado':    'bg-green-500/20 text-green-400 border-green-500/30',
  'Pendiente': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Vencido':   'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function EstadoPagoBadge({ estado }: { estado: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${COLORES[estado] ?? 'bg-df-surface text-df-muted border-df-border'}`}>
      {estado}
    </span>
  )
}
const COLORES: Record<string, string> = {
  'Programada': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Completada': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Cancelada':  'bg-red-500/20 text-red-400 border-red-500/30',
  'Reagendada': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

export default function EstadoSesionBadge({ estado }: { estado: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${COLORES[estado] ?? 'bg-df-surface text-df-muted border-df-border'}`}>
      {estado}
    </span>
  )
}

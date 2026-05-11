const COLORS = [
  'from-purple-600 to-violet-400',
  'from-pink-600 to-rose-400',
  'from-blue-600 to-cyan-400',
  'from-emerald-600 to-teal-400',
  'from-amber-600 to-orange-400',
]

interface AvatarProps {
  nombre: string
  foto_url?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export default function Avatar({ nombre, foto_url, size = 'md' }: AvatarProps) {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-11 h-11 text-base', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' }
  const idx = nombre.charCodeAt(0) % COLORS.length
  const initials = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  if (foto_url) return (
    <img src={foto_url} alt={nombre} className={`${sizes[size]} rounded-full object-cover border-2 border-df-border flex-shrink-0`}/>
  )
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${COLORS[idx]} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  )
}
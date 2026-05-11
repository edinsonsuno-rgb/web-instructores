import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export interface Alumna {
  id: string
  nombre: string
  email: string
  telefono?: string
  foto_url?: string
  objetivo?: string
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado'
  peso_inicial?: number
  peso_actual?: number
  peso_objetivo?: number
  fecha_inicio?: string
  activa: boolean
  notas?: string
  created_at: string
}

export interface Rutina {
  id: string
  nombre: string
  descripcion?: string
  nivel: 'Principiante' | 'Intermedio' | 'Avanzado'
  duracion_min: number
  categoria: string
  foto_url?: string
  ejercicios?: Ejercicio[]
  created_at: string
}

export interface Ejercicio {
  id: string
  rutina_id: string
  nombre: string
  series: number
  repeticiones: string
  descanso_seg: number
  instrucciones?: string
  video_url?: string
  orden: number
}

export interface AsignacionRutina {
  id: string
  alumna_id: string
  rutina_id: string
  alumna?: Alumna
  rutina?: Rutina
  fecha_inicio: string
  fecha_fin?: string
  progreso: number
  activa: boolean
  created_at: string
}

export interface Sesion {
  id: string
  alumna_id: string
  alumna?: Alumna
  titulo: string
  fecha: string
  hora_inicio: string
  hora_fin?: string
  tipo: 'Online' | 'Presencial'
  estado: 'Programada' | 'Completada' | 'Cancelada'
  notas?: string
  link_videollamada?: string
  created_at: string
}

export interface Pago {
  id: string
  alumna_id: string
  alumna?: Alumna
  concepto: string
  monto: number
  moneda: string
  estado: 'Pendiente' | 'Pagado' | 'Vencido'
  fecha_vencimiento: string
  fecha_pago?: string
  metodo_pago?: string
  notas?: string
  created_at: string
}

export interface Mensaje {
  id: string
  alumna_id: string
  alumna?: Alumna
  contenido: string
  de_instructora: boolean
  leido: boolean
  created_at: string
}

export interface ProgresoPeso {
  id: string
  alumna_id: string
  peso: number
  fecha: string
  notas?: string
}
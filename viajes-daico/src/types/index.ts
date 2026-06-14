export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      viajes: {
        Row: Viaje
        Insert: Omit<Viaje, 'id' | 'created_at'>
        Update: Partial<Omit<Viaje, 'id' | 'created_at'>>
      }
      dias: {
        Row: Dia
        Insert: Omit<Dia, 'id' | 'created_at'>
        Update: Partial<Omit<Dia, 'id' | 'created_at'>>
      }
      actividades: {
        Row: Actividad
        Insert: Omit<Actividad, 'id' | 'created_at'>
        Update: Partial<Omit<Actividad, 'id' | 'created_at'>>
      }
      reservas: {
        Row: Reserva
        Insert: Omit<Reserva, 'id' | 'created_at'>
        Update: Partial<Omit<Reserva, 'id' | 'created_at'>>
      }
      gastos: {
        Row: Gasto
        Insert: Omit<Gasto, 'id' | 'created_at'>
        Update: Partial<Omit<Gasto, 'id' | 'created_at'>>
      }
      checklist_items: {
        Row: ChecklistItem
        Insert: Omit<ChecklistItem, 'id' | 'created_at'>
        Update: Partial<Omit<ChecklistItem, 'id' | 'created_at'>>
      }
      entradas_diario: {
        Row: EntradaDiario
        Insert: Omit<EntradaDiario, 'id' | 'created_at'>
        Update: Partial<Omit<EntradaDiario, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Profile {
  id: string
  email: string
  nombre: string | null
  avatar_url: string | null
  pais: string | null
  moneda: string
  created_at: string
}

export interface Viaje {
  id: string
  user_id: string
  nombre: string
  descripcion: string | null
  imagen_portada: string | null
  fecha_inicio: string
  fecha_fin: string
  presupuesto: number | null
  moneda: string
  estado: 'planificando' | 'en_curso' | 'completado'
  created_at: string
}

export interface Dia {
  id: string
  viaje_id: string
  fecha: string
  titulo: string | null
  orden: number
  created_at: string
}

export interface Actividad {
  id: string
  dia_id: string
  viaje_id: string
  nombre: string
  descripcion: string | null
  hora: string | null
  ubicacion: string | null
  categoria: 'transporte' | 'alojamiento' | 'comida' | 'atraccion' | 'compras' | 'otro'
  notas: string | null
  orden: number
  created_at: string
}

export interface Reserva {
  id: string
  viaje_id: string
  tipo: 'vuelo' | 'hotel' | 'tren' | 'ferry' | 'auto' | 'entrada' | 'otro'
  nombre: string
  descripcion: string | null
  fecha_desde: string | null
  fecha_hasta: string | null
  confirmacion: string | null
  precio: number | null
  moneda: string
  archivo_url: string | null
  notas: string | null
  created_at: string
}

export interface Gasto {
  id: string
  viaje_id: string
  categoria: 'vuelos' | 'hoteles' | 'comida' | 'transporte' | 'entradas' | 'compras' | 'otro'
  descripcion: string
  monto: number
  moneda: string
  fecha: string
  created_at: string
}

export interface ChecklistItem {
  id: string
  viaje_id: string
  categoria: string
  texto: string
  completado: boolean
  orden: number
  created_at: string
}

export interface EntradaDiario {
  id: string
  viaje_id: string
  fecha: string
  titulo: string | null
  contenido: string
  ubicacion: string | null
  created_at: string
}

export type ViajeConDias = Viaje & { dias: (Dia & { actividades: Actividad[] })[] }
export type EstadoViaje = Viaje['estado']
export type CategoriaGasto = Gasto['categoria']
export type TipoReserva = Reserva['tipo']

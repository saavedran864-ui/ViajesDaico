import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFecha(fecha: string, fmt = 'd MMM yyyy') {
  return format(parseISO(fecha), fmt, { locale: es })
}

export function diasRestantes(fecha: string) {
  return differenceInDays(parseISO(fecha), new Date())
}

export function duracionViaje(inicio: string, fin: string) {
  return differenceInDays(parseISO(fin), parseISO(inicio)) + 1
}

export function formatMonto(monto: number, moneda = 'USD') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(monto)
}

export function estadoViaje(inicio: string, fin: string): 'planificando' | 'en_curso' | 'completado' {
  const hoy = new Date()
  const start = parseISO(inicio)
  const end = parseISO(fin)
  if (hoy < start) return 'planificando'
  if (hoy > end) return 'completado'
  return 'en_curso'
}

export const CATEGORIAS_GASTO = [
  { value: 'vuelos',     label: 'Vuelos',      color: '#B8956A' },
  { value: 'hoteles',    label: 'Hoteles',     color: '#9C8E82' },
  { value: 'comida',     label: 'Comida',      color: '#C9BFB0' },
  { value: 'transporte', label: 'Transporte',  color: '#6B5F54' },
  { value: 'entradas',   label: 'Entradas',    color: '#D6CFC4' },
  { value: 'compras',    label: 'Compras',     color: '#EDE8E0' },
  { value: 'otro',       label: 'Otro',        color: '#3D3028' },
] as const

export const TIPOS_RESERVA = [
  { value: 'vuelo',   label: 'Vuelo',           icon: 'plane' },
  { value: 'hotel',   label: 'Hotel',            icon: 'building' },
  { value: 'tren',    label: 'Tren',             icon: 'train' },
  { value: 'ferry',   label: 'Ferry',            icon: 'ship' },
  { value: 'auto',    label: 'Alquiler de auto', icon: 'car' },
  { value: 'entrada', label: 'Entrada',          icon: 'ticket' },
  { value: 'otro',    label: 'Otro',             icon: 'file' },
] as const

export const CATEGORIAS_ACTIVIDAD = [
  { value: 'transporte',  label: 'Transporte' },
  { value: 'alojamiento', label: 'Alojamiento' },
  { value: 'comida',      label: 'Comida' },
  { value: 'atraccion',   label: 'Atracción' },
  { value: 'compras',     label: 'Compras' },
  { value: 'otro',        label: 'Otro' },
] as const

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, CalendarDays, Ticket, Coins, CheckSquare, BookOpen, Route, LayoutDashboard } from 'lucide-react'
import { formatFecha, duracionViaje } from '@/lib/utils'

const TABS = [
  { key: 'resumen',    label: 'Resumen',    href: '' },
  { key: 'itinerario', label: 'Itinerario', href: '/itinerario' },
  { key: 'road-trip',  label: 'Road trip',  href: '/road-trip' },
  { key: 'reservas',   label: 'Reservas',   href: '/reservas' },
  { key: 'gastos',     label: 'Gastos',     href: '/gastos' },
  { key: 'checklist',  label: 'Checklist',  href: '/checklist' },
  { key: 'diario',     label: 'Diario',     href: '/diario' },
]

export default async function ViajeLayout({
  children, params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viaje } = await supabase
    .from('viajes').select('*').eq('id', id).eq('user_id', user.id).single()

  if (!viaje) notFound()

  return (
    <div className="min-h-full">
      <div className="bg-nude-50 border-b border-nude-300 px-8 pt-6 pb-0">
        <Link href="/viajes" className="inline-flex items-center gap-1.5 text-xs text-nude-500 hover:text-nude-800 mb-4 transition-colors">
          <ArrowLeft size={13} /> Mis viajes
        </Link>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-serif font-normal text-nude-900">{viaje.nombre}</h1>
            <p className="text-nude-500 text-sm mt-1">
              {formatFecha(viaje.fecha_inicio)} — {formatFecha(viaje.fecha_fin)} · {duracionViaje(viaje.fecha_inicio, viaje.fecha_fin)} días
            </p>
          </div>
          <span className={`badge mt-1 ${
            viaje.estado === 'completado' ? 'bg-nude-200 text-nude-600' :
            viaje.estado === 'en_curso'   ? 'bg-green-100 text-green-700' :
            'bg-accent/15 text-accent'
          }`}>
            {viaje.estado === 'planificando' ? 'Planificando' :
             viaje.estado === 'en_curso'     ? 'En curso' : 'Completado'}
          </span>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const href = `/viajes/${id}${tab.href}`
            return (
              <Link key={tab.key} href={href}
                className="tab flex items-center gap-1.5 text-sm whitespace-nowrap">
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
      <div className="p-8">{children}</div>
    </div>
  )
}


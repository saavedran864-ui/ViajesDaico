import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
      <div className="bg-white border-b border-[#E8E9EC] px-4 md:px-8 pt-4 pb-0">
        <Link href="/viajes" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1A1D23] mb-3 transition-colors">
          <ArrowLeft size={13} /> Mis viajes
        </Link>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-3">
            <h1 className="text-xl md:text-2xl font-semibold text-[#1A1D23] leading-tight">{viaje.nombre}</h1>
            <p className="text-[#6B7280] text-xs mt-1">
              {formatFecha(viaje.fecha_inicio)} — {formatFecha(viaje.fecha_fin)} · {duracionViaje(viaje.fecha_inicio, viaje.fecha_fin)} días
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 mt-0.5 ${
            viaje.estado === 'completado' ? 'bg-[#F4F5F7] text-[#6B7280]' :
            viaje.estado === 'en_curso'   ? 'bg-green-100 text-green-700' :
            'bg-[#EDE9FE] text-[#7C3AED]'
          }`}>
            {viaje.estado === 'planificando' ? 'Planificando' :
             viaje.estado === 'en_curso'     ? 'En curso' : 'Completado'}
          </span>
        </div>
        <div className="flex gap-0 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map(tab => (
            <Link key={tab.key} href={`/viajes/${id}${tab.href}`}
              className="text-xs px-3 py-2.5 border-b-2 border-transparent text-[#6B7280] hover:text-[#1A1D23] transition-all whitespace-nowrap font-medium">
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  )
}

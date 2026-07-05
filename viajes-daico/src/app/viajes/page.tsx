import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatFecha, duracionViaje } from '@/lib/utils'

const ESTADO_LABELS = {
  planificando: { label: 'Planificando', class: 'bg-[#EDE9FE] text-[#7C3AED]' },
  en_curso:     { label: 'En curso',     class: 'bg-green-100 text-green-700' },
  completado:   { label: 'Completado',   class: 'bg-[#F4F5F7] text-[#6B7280]' },
}

export default async function ViajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase
    .from('viajes').select('*').eq('user_id', user.id).order('fecha_inicio', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1D23]">Mis viajes</h1>
          <p className="text-[#6B7280] text-xs mt-0.5">{viajes?.length ?? 0} viajes en total</p>
        </div>
        <Link href="/viajes/new" className="btn-primary text-xs px-3 py-2">
          <Plus size={14} /> Nuevo viaje
        </Link>
      </div>

      {!viajes?.length ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">✈️</p>
          <p className="text-[#1A1D23] font-medium mb-1">Todavia no creaste ningun viaje</p>
          <p className="text-[#6B7280] text-sm mb-4">Empieza planificando tu proxima aventura</p>
          <Link href="/viajes/new" className="btn-primary inline-flex text-xs">
            <Plus size={14} /> Crear primer viaje
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {viajes.map(viaje => {
            const estado = ESTADO_LABELS[viaje.estado as keyof typeof ESTADO_LABELS]
            return (
              <Link key={viaje.id} href={`/viajes/${viaje.id}`}
                className="card p-3 hover:shadow-md transition-all group block">
                <div className="h-28 bg-[#F4F5F7] rounded-xl mb-3 overflow-hidden flex items-center justify-center text-4xl">
                  {viaje.imagen_portada
                    ? <img src={viaje.imagen_portada} alt={viaje.nombre} className="w-full h-full object-cover" />
                    : '🗺️'}
                </div>
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <h3 className="text-sm font-medium text-[#1A1D23] group-hover:text-[#7C3AED] transition-colors leading-tight line-clamp-2">
                    {viaje.nombre}
                  </h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${estado?.class}`}>
                    {estado?.label}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7280]">
                  {formatFecha(viaje.fecha_inicio)} — {formatFecha(viaje.fecha_fin)}
                </p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                  {duracionViaje(viaje.fecha_inicio, viaje.fecha_fin)} dias
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

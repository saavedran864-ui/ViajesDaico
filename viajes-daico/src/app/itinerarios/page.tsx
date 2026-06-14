import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatFecha } from '@/lib/utils'

export default async function ItinerariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase
    .from('viajes').select('id,nombre,fecha_inicio,fecha_fin').eq('user_id', user.id).order('fecha_inicio', { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-[#1A1D23] mb-2">Itinerarios</h1>
      <p className="text-[#6B7280] text-sm mb-8">Selecciona un viaje para ver o editar su itinerario.</p>
      <div className="grid grid-cols-2 gap-4">
        {viajes?.map(v => (
          <Link key={v.id} href={`/viajes/${v.id}/itinerario`}
            className="card hover:shadow-md transition-all group">
            <p className="font-medium text-[#1A1D23] group-hover:text-[#7C3AED] transition-colors">{v.nombre}</p>
            <p className="text-xs text-[#6B7280] mt-1">{formatFecha(v.fecha_inicio)} — {formatFecha(v.fecha_fin)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatFecha, duracionViaje } from '@/lib/utils'

const ESTADO_LABELS = {
  planificando: { label: 'Planificando', class: 'bg-accent/15 text-accent' },
  en_curso:     { label: 'En curso',     class: 'bg-green-100 text-green-700' },
  completado:   { label: 'Completado',   class: 'bg-nude-200 text-nude-600' },
}

export default async function ViajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase
    .from('viajes')
    .select('*')
    .eq('user_id', user.id)
    .order('fecha_inicio', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-serif font-normal text-nude-900">Mis viajes</h1>
          <p className="text-nude-500 text-sm mt-1">{viajes?.length ?? 0} viajes en total</p>
        </div>
        <Link href="/viajes/new" className="btn-primary">
          <Plus size={16} /> Nuevo viaje
        </Link>
      </div>

      {!viajes?.length ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">✈️</p>
          <p className="text-nude-700 font-medium mb-1">Todavía no creaste ningún viaje</p>
          <p className="text-nude-500 text-sm mb-5">Empezá planificando tu próxima aventura</p>
          <Link href="/viajes/new" className="btn-primary inline-flex">
            <Plus size={16} /> Crear primer viaje
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {viajes.map(viaje => {
            const estado = ESTADO_LABELS[viaje.estado as keyof typeof ESTADO_LABELS]
            return (
              <Link key={viaje.id} href={`/viajes/${viaje.id}`}
                className="card hover:border-nude-400 transition-all group block">
                <div className="h-36 bg-nude-200 rounded-lg mb-4 overflow-hidden flex items-center justify-center text-5xl">
                  {viaje.imagen_portada
                    ? <img src={viaje.imagen_portada} alt={viaje.nombre} className="w-full h-full object-cover" />
                    : '🗺️'}
                </div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-serif text-nude-900 font-normal group-hover:text-accent transition-colors">
                    {viaje.nombre}
                  </h3>
                  <span className={`badge shrink-0 ${estado?.class}`}>{estado?.label}</span>
                </div>
                <p className="text-xs text-nude-500">
                  {formatFecha(viaje.fecha_inicio)} — {formatFecha(viaje.fecha_fin)}
                </p>
                <p className="text-xs text-nude-400 mt-0.5">
                  {duracionViaje(viaje.fecha_inicio, viaje.fecha_fin)} días
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

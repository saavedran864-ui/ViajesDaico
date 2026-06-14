import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Globe, Map, Coins, Briefcase, ChevronRight } from 'lucide-react'
import { formatFecha, diasRestantes, duracionViaje, formatMonto, estadoViaje } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase
    .from('viajes')
    .select('*')
    .eq('user_id', user.id)
    .order('fecha_inicio', { ascending: true })

  const hoy = new Date()
  const proximoViaje = viajes?.find(v => new Date(v.fecha_inicio) > hoy)
  const viajesRecientes = viajes?.filter(v => new Date(v.fecha_fin) < hoy).slice(-3).reverse() ?? []
  const totalViajes = viajes?.length ?? 0

  const { data: gastosTotales } = await supabase
    .from('gastos')
    .select('monto')
    .in('viaje_id', viajes?.map(v => v.id) ?? [])
  const totalGastado = gastosTotales?.reduce((a, g) => a + g.monto, 0) ?? 0

  const dias = proximoViaje ? diasRestantes(proximoViaje.fecha_inicio) : null

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-serif font-normal text-nude-900">Bienvenido de vuelta ✦</h1>
          <p className="text-nude-500 text-sm mt-1">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/viajes/new" className="btn-primary">
          <Plus size={16} /> Nuevo viaje
        </Link>
      </div>

      {proximoViaje ? (
        <div className="bg-nude-900 rounded-xl p-7 mb-6 grid grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <p className="text-[10px] tracking-[2.5px] text-accent uppercase mb-2">Próximo viaje</p>
            <h2 className="text-2xl font-serif font-normal text-nude-50 mb-1">{proximoViaje.nombre}</h2>
            <p className="text-nude-500 text-xs mb-5">
              {formatFecha(proximoViaje.fecha_inicio)} — {formatFecha(proximoViaje.fecha_fin)} · {duracionViaje(proximoViaje.fecha_inicio, proximoViaje.fecha_fin)} días
            </p>
            <div className="flex gap-6">
              {proximoViaje.presupuesto && (
                <div>
                  <p className="text-lg font-medium text-nude-50">{formatMonto(proximoViaje.presupuesto, proximoViaje.moneda)}</p>
                  <p className="text-[10px] text-nude-600">Presupuesto</p>
                </div>
              )}
              <div>
                <Link href={`/viajes/${proximoViaje.id}`} className="text-sm text-accent hover:underline flex items-center gap-1">
                  Ver viaje <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
          {dias !== null && (
            <div className="text-center">
              <p className="text-5xl font-serif font-normal text-nude-50 leading-none">{dias}</p>
              <p className="text-[10px] tracking-[2px] text-nude-600 uppercase mt-2">días restantes</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-nude-200 border border-nude-300 rounded-xl p-8 mb-6 text-center">
          <p className="text-nude-600 mb-3">No tenés viajes planificados</p>
          <Link href="/viajes/new" className="btn-primary inline-flex">
            <Plus size={16} /> Planificar un viaje
          </Link>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Viajes realizados', value: totalViajes, icon: Briefcase },
          { label: 'Países visitados',  value: '—',         icon: Globe },
          { label: 'km recorridos',     value: '—',         icon: Map },
          { label: 'Total gastado',     value: formatMonto(totalGastado), icon: Coins },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
              <Icon size={14} className="text-accent" />
            </div>
            <p className="text-xl font-medium text-nude-900">{value}</p>
            <p className="text-xs text-nude-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {viajesRecientes.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-nude-900">Viajes recientes</h3>
            <Link href="/viajes" className="text-xs text-accent hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {viajesRecientes.map(viaje => (
              <Link key={viaje.id} href={`/viajes/${viaje.id}`}
                className="card hover:border-nude-400 transition-colors group">
                <div className="h-28 bg-nude-200 rounded-lg mb-3 flex items-center justify-center text-4xl overflow-hidden">
                  {viaje.imagen_portada
                    ? <img src={viaje.imagen_portada} alt={viaje.nombre} className="w-full h-full object-cover" />
                    : '✈️'}
                </div>
                <p className="font-serif text-nude-900 font-normal group-hover:text-accent transition-colors">{viaje.nombre}</p>
                <p className="text-xs text-nude-500 mt-1">
                  {formatFecha(viaje.fecha_inicio, 'MMM yyyy')} · {duracionViaje(viaje.fecha_inicio, viaje.fecha_fin)} días
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

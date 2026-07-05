import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Globe, Map, Coins, Briefcase, ChevronRight } from 'lucide-react'
import { formatFecha, diasRestantes, duracionViaje, formatMonto } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase
    .from('viajes').select('*').eq('user_id', user.id).order('fecha_inicio', { ascending: true })

  const hoy = new Date()
  const proximoViaje = viajes?.find(v => new Date(v.fecha_inicio) > hoy)
  const viajesRecientes = viajes?.filter(v => new Date(v.fecha_fin) < hoy).slice(-3).reverse() ?? []
  const totalViajes = viajes?.length ?? 0

  const { data: gastosTotales } = await supabase
    .from('gastos').select('monto').in('viaje_id', viajes?.map(v => v.id) ?? [])
  const totalGastado = gastosTotales?.reduce((a, g) => a + g.monto, 0) ?? 0

  const dias = proximoViaje ? diasRestantes(proximoViaje.fecha_inicio) : null

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-[#1A1D23]">Bienvenido ✦</h1>
          <p className="text-[#6B7280] text-xs mt-1">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/viajes/new" className="btn-primary text-xs px-3 py-2">
          <Plus size={14} /> Nuevo viaje
        </Link>
      </div>

      {proximoViaje ? (
        <div className="bg-[#1A1D23] rounded-2xl p-5 mb-5">
          <p className="text-[10px] tracking-[2px] text-[#7C3AED] uppercase mb-2">Proximo viaje</p>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white mb-1 truncate">{proximoViaje.nombre}</h2>
              <p className="text-[#6B7280] text-xs mb-4">
                {formatFecha(proximoViaje.fecha_inicio)} — {formatFecha(proximoViaje.fecha_fin)} · {duracionViaje(proximoViaje.fecha_inicio, proximoViaje.fecha_fin)} dias
              </p>
              <div className="flex items-center gap-4">
                {proximoViaje.presupuesto && (
                  <div>
                    <p className="text-base font-semibold text-white">{formatMonto(proximoViaje.presupuesto, proximoViaje.moneda)}</p>
                    <p className="text-[10px] text-[#6B7280]">Presupuesto</p>
                  </div>
                )}
                <Link href={`/viajes/${proximoViaje.id}`} className="text-xs text-[#7C3AED] hover:underline flex items-center gap-1">
                  Ver viaje <ChevronRight size={12} />
                </Link>
              </div>
            </div>
            {dias !== null && (
              <div className="text-center shrink-0">
                <p className="text-4xl font-bold text-white leading-none">{dias}</p>
                <p className="text-[9px] tracking-[1.5px] text-[#6B7280] uppercase mt-1">dias</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#F4F5F7] rounded-2xl p-6 mb-5 text-center">
          <p className="text-[#6B7280] text-sm mb-3">No tenes viajes planificados</p>
          <Link href="/viajes/new" className="btn-primary inline-flex text-xs">
            <Plus size={14} /> Planificar un viaje
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Viajes realizados', value: totalViajes, icon: Briefcase },
          { label: 'Paises visitados',  value: '—', icon: Globe },
          { label: 'km recorridos',     value: '—', icon: Map },
          { label: 'Total gastado',     value: formatMonto(totalGastado), icon: Coins },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card">
            <div className="w-7 h-7 rounded-lg bg-[#EDE9FE] flex items-center justify-center mb-2">
              <Icon size={13} className="text-[#7C3AED]" />
            </div>
            <p className="text-lg font-semibold text-[#1A1D23]">{value}</p>
            <p className="text-xs text-[#6B7280] mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {viajesRecientes.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#1A1D23]">Viajes recientes</h3>
            <Link href="/viajes" className="text-xs text-[#7C3AED] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {viajesRecientes.map(viaje => (
              <Link key={viaje.id} href={`/viajes/${viaje.id}`}
                className="card hover:shadow-md transition-all group">
                <div className="h-24 bg-[#F4F5F7] rounded-xl mb-3 flex items-center justify-center text-3xl overflow-hidden">
                  {viaje.imagen_portada
                    ? <img src={viaje.imagen_portada} alt={viaje.nombre} className="w-full h-full object-cover" />
                    : '✈️'}
                </div>
                <p className="text-sm font-medium text-[#1A1D23] group-hover:text-[#7C3AED] transition-colors truncate">{viaje.nombre}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {formatFecha(viaje.fecha_inicio, 'MMM yyyy')} · {duracionViaje(viaje.fecha_inicio, viaje.fecha_fin)} dias
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

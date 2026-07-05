import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatMonto } from '@/lib/utils'

export default async function ViajeResumenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: viaje } = await supabase.from('viajes').select('*').eq('id', id).single()
  if (!viaje) notFound()

  const { data: gastos } = await supabase.from('gastos').select('monto').eq('viaje_id', id)
  const { data: reservas } = await supabase.from('reservas').select('id').eq('viaje_id', id)
  const { data: checklist } = await supabase.from('checklist_items').select('completado').eq('viaje_id', id)
  const { data: dias } = await supabase.from('dias').select('id').eq('viaje_id', id)

  const totalGastado = gastos?.reduce((a, g) => a + g.monto, 0) ?? 0
  const totalPresupuesto = viaje.presupuesto ?? 0
  const checkCompletados = checklist?.filter(c => c.completado).length ?? 0
  const checkTotal = checklist?.length ?? 0

  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs text-[#6B7280] mb-1">Presupuesto</p>
          <p className="text-lg font-semibold text-[#1A1D23]">
            {totalPresupuesto ? formatMonto(totalPresupuesto, viaje.moneda) : '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-[#6B7280] mb-1">Gastado</p>
          <p className="text-lg font-semibold text-[#1A1D23]">{formatMonto(totalGastado, viaje.moneda)}</p>
          {totalPresupuesto > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-[#E8E9EC] rounded-full">
                <div className="h-1.5 bg-[#7C3AED] rounded-full transition-all"
                  style={{ width: `${Math.min((totalGastado / totalPresupuesto) * 100, 100)}%` }} />
              </div>
              <p className="text-[10px] text-[#6B7280] mt-1">
                {Math.round((totalGastado / totalPresupuesto) * 100)}% del presupuesto
              </p>
            </div>
          )}
        </div>
        <div className="card">
          <p className="text-xs text-[#6B7280] mb-1">Disponible</p>
          <p className={`text-lg font-semibold ${totalPresupuesto - totalGastado < 0 ? 'text-red-600' : 'text-[#1A1D23]'}`}>
            {totalPresupuesto ? formatMonto(totalPresupuesto - totalGastado, viaje.moneda) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Dias planificados', value: dias?.length ?? 0, href: `/viajes/${id}/itinerario` },
          { label: 'Reservas', value: reservas?.length ?? 0, href: `/viajes/${id}/reservas` },
          { label: 'Checklist', value: `${checkCompletados}/${checkTotal}`, href: `/viajes/${id}/checklist` },
        ].map(({ label, value, href }) => (
          <Link key={label} href={href} className="card hover:shadow-md transition-all text-center">
            <p className="text-2xl font-semibold text-[#1A1D23] mb-0.5">{value}</p>
            <p className="text-xs text-[#6B7280] leading-tight">{label}</p>
          </Link>
        ))}
      </div>

      {viaje.descripcion && (
        <div className="card">
          <h3 className="text-sm font-medium text-[#1A1D23] mb-2">Descripcion</h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">{viaje.descripcion}</p>
        </div>
      )}
    </div>
  )
}

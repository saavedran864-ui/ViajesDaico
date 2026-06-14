import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatFecha } from '@/lib/utils'

export default async function DiarioGlobalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viajes } = await supabase
    .from('viajes').select('id,nombre,fecha_inicio,fecha_fin').eq('user_id', user.id).order('fecha_inicio', { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-normal text-nude-900 mb-2">Diario de viaje</h1>
      <p className="text-nude-500 text-sm mb-8">Seleccioná un viaje para escribir en tu diario.</p>
      <div className="grid grid-cols-2 gap-4">
        {viajes?.map(v => (
          <Link key={v.id} href={`/viajes/${v.id}/diario`}
            className="card hover:border-nude-400 transition-colors group">
            <p className="font-serif text-nude-900 group-hover:text-accent transition-colors">{v.nombre}</p>
            <p className="text-xs text-nude-500 mt-1">{formatFecha(v.fecha_inicio)} — {formatFecha(v.fecha_fin)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

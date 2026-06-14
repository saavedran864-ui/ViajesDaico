'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoViajePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '',
    presupuesto: '', moneda: 'USD',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase.from('viajes').insert({
      user_id: user.id,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      presupuesto: form.presupuesto ? parseFloat(form.presupuesto) : null,
      moneda: form.moneda,
      estado: 'planificando',
    }).select().single()

    if (error) { setError(error.message); setLoading(false) }
    else router.push(`/viajes/${data.id}`)
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Link href="/viajes" className="btn-ghost mb-6 inline-flex">
        <ArrowLeft size={15} /> Volver
      </Link>
      <h1 className="text-2xl font-serif font-normal text-nude-900 mb-6">Nuevo viaje</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre del viaje *</label>
            <input className="input" placeholder="Ej: Italia 2027"
              value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="textarea" rows={3} placeholder="Notas o descripción del viaje..."
              value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha de inicio *</label>
              <input className="input" type="date"
                value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} required />
            </div>
            <div>
              <label className="label">Fecha de fin *</label>
              <input className="input" type="date"
                value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Presupuesto total</label>
              <input className="input" type="number" placeholder="0.00"
                value={form.presupuesto} onChange={e => set('presupuesto', e.target.value)} />
            </div>
            <div>
              <label className="label">Moneda</label>
              <select className="select" value={form.moneda} onChange={e => set('moneda', e.target.value)}>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="ARS">ARS — Peso arg.</option>
                <option value="GBP">GBP — Libra</option>
                <option value="BRL">BRL — Real</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-2.5">
              {loading ? 'Creando...' : 'Crear viaje'}
            </button>
            <Link href="/viajes" className="btn-secondary justify-center px-5">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, Plane, Building2, Train, Ship, Car, Ticket, File, X, Check } from 'lucide-react'
import type { Reserva } from '@/types'
import { TIPOS_RESERVA, formatFecha, formatMonto } from '@/lib/utils'

const ICONS: Record<string, React.ElementType> = {
  vuelo: Plane, hotel: Building2, tren: Train, ferry: Ship,
  auto: Car, entrada: Ticket, otro: File,
}

const emptyForm = { tipo: 'vuelo', nombre: '', descripcion: '', fecha_desde: '', fecha_hasta: '', confirmacion: '', precio: '', notas: '' }

export default function ReservasPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [viajeId, setViajeId] = useState('')
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [moneda, setMoneda] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    params.then(p => { setViajeId(p.id); load(p.id) })
  }, [])

  async function load(id: string) {
    const [{ data: r }, { data: v }] = await Promise.all([
      supabase.from('reservas').select('*').eq('viaje_id', id).order('fecha_desde'),
      supabase.from('viajes').select('moneda').eq('id', id).single(),
    ])
    setReservas(r ?? [])
    if (v) setMoneda(v.moneda)
    setLoading(false)
  }

  function startEdit(r: Reserva) {
    setEditingId(r.id)
    setForm({
      tipo: r.tipo, nombre: r.nombre,
      descripcion: r.descripcion ?? '', fecha_desde: r.fecha_desde ?? '',
      fecha_hasta: r.fecha_hasta ?? '', confirmacion: r.confirmacion ?? '',
      precio: r.precio?.toString() ?? '', notas: r.notas ?? '',
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function saveReserva(e: React.FormEvent) {
    e.preventDefault()
    if (!viajeId) return
    const payload = {
      tipo: form.tipo as Reserva['tipo'],
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      fecha_desde: form.fecha_desde || null,
      fecha_hasta: form.fecha_hasta || null,
      confirmacion: form.confirmacion || null,
      precio: form.precio ? parseFloat(form.precio) : null,
      moneda,
      notas: form.notas || null,
    }

    if (editingId) {
      const { data } = await supabase.from('reservas').update(payload).eq('id', editingId).select().single()
      if (data) setReservas(r => r.map(x => x.id === editingId ? data : x))
    } else {
      const { data } = await supabase.from('reservas').insert({ viaje_id: viajeId, ...payload }).select().single()
      if (data) setReservas(r => [...r, data].sort((a, b) => (a.fecha_desde ?? '').localeCompare(b.fecha_desde ?? '')))
    }
    cancelForm()
  }

  async function deleteReserva(id: string) {
    await supabase.from('reservas').delete().eq('id', id)
    setReservas(r => r.filter(x => x.id !== id))
  }

  if (loading) return <div className="text-nude-500 text-sm">Cargando...</div>

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex justify-end">
        <button onClick={() => { cancelForm(); setShowForm(true) }} className="btn-primary">
          <Plus size={15} /> Agregar reserva
        </button>
      </div>

      {showForm && (
        <div className="card border-accent/30">
          <h3 className="text-sm font-medium text-nude-900 mb-4">{editingId ? 'Editar reserva' : 'Nueva reserva'}</h3>
          <form onSubmit={saveReserva} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo *</label>
              <select className="select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                {TIPOS_RESERVA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input className="input" placeholder="Ej: Vuelo BA2341"
                value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
            </div>
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <input className="input" placeholder="Aerolínea, número de vuelo, etc."
                value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fecha desde</label>
              <input className="input" type="date" value={form.fecha_desde} onChange={e => setForm(f => ({ ...f, fecha_desde: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fecha hasta</label>
              <input className="input" type="date" value={form.fecha_hasta} onChange={e => setForm(f => ({ ...f, fecha_hasta: e.target.value }))} />
            </div>
            <div>
              <label className="label">Nro. de confirmación</label>
              <input className="input" placeholder="ABC123"
                value={form.confirmacion} onChange={e => setForm(f => ({ ...f, confirmacion: e.target.value }))} />
            </div>
            <div>
              <label className="label">Precio</label>
              <input className="input" type="number" placeholder="0.00"
                value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea className="textarea" rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex-1 justify-center">
                <Check size={15} /> {editingId ? 'Guardar cambios' : 'Guardar reserva'}
              </button>
              <button type="button" onClick={cancelForm} className="btn-secondary px-5">
                <X size={15} /> Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {reservas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-nude-500 text-sm">No hay reservas cargadas aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map(r => {
            const Icon = ICONS[r.tipo] ?? File
            return (
              <div key={r.id} className="card flex gap-4 items-start group">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-nude-900 text-sm">{r.nombre}</p>
                      {r.descripcion && <p className="text-xs text-nude-500 mt-0.5">{r.descripcion}</p>}
                    </div>
                    {r.precio && <p className="text-sm font-medium text-nude-900 shrink-0">{formatMonto(r.precio, r.moneda)}</p>}
                  </div>
                  <div className="flex gap-4 mt-2 flex-wrap">
                    {r.fecha_desde && <p className="text-[11px] text-nude-500">{formatFecha(r.fecha_desde)}{r.fecha_hasta ? ` → ${formatFecha(r.fecha_hasta)}` : ''}</p>}
                    {r.confirmacion && <p className="text-[11px] text-nude-400 font-mono">#{r.confirmacion}</p>}
                  </div>
                  {r.notas && <p className="text-xs text-nude-400 mt-1 italic">{r.notas}</p>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button onClick={() => startEdit(r)} className="text-nude-400 hover:text-accent transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteReserva(r.id)} className="text-nude-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

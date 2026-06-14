'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'
import type { EntradaDiario } from '@/types'
import { formatFecha } from '@/lib/utils'

export default function DiarioPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [viajeId, setViajeId] = useState('')
  const [entradas, setEntradas] = useState<EntradaDiario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', contenido: '', fecha: new Date().toISOString().split('T')[0], ubicacion: '' })

  useEffect(() => {
    params.then(p => { setViajeId(p.id); load(p.id) })
  }, [])

  async function load(id: string) {
    const { data } = await supabase.from('entradas_diario').select('*').eq('viaje_id', id).order('fecha', { ascending: false })
    setEntradas(data ?? [])
    setLoading(false)
  }

  async function addEntrada(e: React.FormEvent) {
    e.preventDefault()
    if (!viajeId || !form.contenido.trim()) return
    const { data } = await supabase.from('entradas_diario').insert({
      viaje_id: viajeId,
      titulo: form.titulo || null,
      contenido: form.contenido,
      fecha: form.fecha,
      ubicacion: form.ubicacion || null,
    }).select().single()
    if (data) {
      setEntradas(e => [data, ...e])
      setShowForm(false)
      setForm({ titulo: '', contenido: '', fecha: new Date().toISOString().split('T')[0], ubicacion: '' })
    }
  }

  async function deleteEntrada(id: string) {
    await supabase.from('entradas_diario').delete().eq('id', id)
    setEntradas(e => e.filter(x => x.id !== id))
  }

  if (loading) return <div className="text-nude-500 text-sm">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <Plus size={15} /> Nueva entrada
        </button>
      </div>

      {showForm && (
        <div className="card border-accent/30">
          <h3 className="text-sm font-medium text-nude-900 mb-4">Nueva entrada de diario</h3>
          <form onSubmit={addEntrada} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Título</label>
                <input className="input" placeholder="Título de la entrada"
                  value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div>
                <label className="label">Fecha</label>
                <input className="input" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Ubicación</label>
              <input className="input" placeholder="¿Dónde estás?"
                value={form.ubicacion} onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))} />
            </div>
            <div>
              <label className="label">Contenido *</label>
              <textarea className="textarea" rows={5} placeholder="¿Qué viviste hoy?"
                value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))} required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1 justify-center">Guardar entrada</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-5">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {entradas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">📓</p>
          <p className="text-nude-500 text-sm">Tu diario de viaje está vacío</p>
          <p className="text-nude-400 text-xs mt-1">Empezá a escribir tus memorias</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entradas.map(entrada => (
            <div key={entrada.id} className="card group">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  {entrada.titulo && <h3 className="font-serif font-normal text-nude-900">{entrada.titulo}</h3>}
                  <div className="flex gap-3 mt-0.5">
                    <p className="text-xs text-nude-400">{formatFecha(entrada.fecha)}</p>
                    {entrada.ubicacion && <p className="text-xs text-accent">📍 {entrada.ubicacion}</p>}
                  </div>
                </div>
                <button onClick={() => deleteEntrada(entrada.id)}
                  className="opacity-0 group-hover:opacity-100 text-nude-400 hover:text-red-500 transition-all shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm text-nude-700 leading-relaxed whitespace-pre-wrap">{entrada.contenido}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

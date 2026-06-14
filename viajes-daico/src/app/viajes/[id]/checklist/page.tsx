'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Check } from 'lucide-react'
import type { ChecklistItem } from '@/types'

const CATEGORIAS_DEFAULT = ['Documentación', 'Equipaje', 'Ropa', 'Electrónica', 'Salud', 'Otro']

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [viajeId, setViajeId] = useState('')
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newTexto, setNewTexto] = useState('')
  const [newCat, setNewCat] = useState('Equipaje')

  useEffect(() => {
    params.then(p => { setViajeId(p.id); load(p.id) })
  }, [])

  async function load(id: string) {
    const { data } = await supabase.from('checklist_items').select('*').eq('viaje_id', id).order('categoria').order('orden')
    setItems(data ?? [])
    setLoading(false)
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newTexto.trim() || !viajeId) return
    const { data } = await supabase.from('checklist_items').insert({
      viaje_id: viajeId, texto: newTexto, categoria: newCat,
      completado: false, orden: items.length,
    }).select().single()
    if (data) { setItems(i => [...i, data]); setNewTexto('') }
  }

  async function toggleItem(item: ChecklistItem) {
    await supabase.from('checklist_items').update({ completado: !item.completado }).eq('id', item.id)
    setItems(is => is.map(i => i.id === item.id ? { ...i, completado: !i.completado } : i))
  }

  async function deleteItem(id: string) {
    await supabase.from('checklist_items').delete().eq('id', id)
    setItems(is => is.filter(i => i.id !== id))
  }

  const categorias = [...new Set(items.map(i => i.categoria))]
  const completados = items.filter(i => i.completado).length

  if (loading) return <div className="text-nude-500 text-sm">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-nude-500">{completados} de {items.length} completados</p>
        <div className="w-32 h-1.5 bg-nude-200 rounded-full">
          <div className="h-1.5 bg-accent rounded-full transition-all"
            style={{ width: items.length ? `${(completados / items.length) * 100}%` : '0%' }} />
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-nude-900 mb-3">Agregar ítem</h3>
        <form onSubmit={addItem} className="flex gap-3">
          <select className="select w-36 shrink-0" value={newCat} onChange={e => setNewCat(e.target.value)}>
            {CATEGORIAS_DEFAULT.map(c => <option key={c}>{c}</option>)}
          </select>
          <input className="input flex-1" placeholder="Nuevo ítem..."
            value={newTexto} onChange={e => setNewTexto(e.target.value)} />
          <button type="submit" className="btn-primary px-4">
            <Plus size={15} />
          </button>
        </form>
      </div>

      {categorias.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-nude-500 text-sm">Todavía no agregaste ítems al checklist</p>
        </div>
      )}

      {categorias.map(cat => (
        <div key={cat} className="card">
          <h3 className="text-xs font-medium text-nude-600 uppercase tracking-wider mb-3">{cat}</h3>
          <div className="space-y-1">
            {items.filter(i => i.categoria === cat).map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-nude-100 last:border-0 group">
                <button onClick={() => toggleItem(item)}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                    item.completado ? 'bg-accent border-accent' : 'border-nude-400 hover:border-accent'
                  }`}>
                  {item.completado && <Check size={11} className="text-white" />}
                </button>
                <span className={`flex-1 text-sm transition-all ${item.completado ? 'line-through text-nude-400' : 'text-nude-800'}`}>
                  {item.texto}
                </span>
                <button onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-nude-400 hover:text-red-500 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

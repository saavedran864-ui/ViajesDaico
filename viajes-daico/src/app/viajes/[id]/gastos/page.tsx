'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { formatMonto, CATEGORIAS_GASTO, formatFecha } from '@/lib/utils'
import type { Gasto } from '@/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

type GastoConTipo = Gasto & { tipo: 'estimado' | 'real' }

export default function GastosPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [viajeId, setViajeId] = useState('')
  const [gastos, setGastos] = useState<GastoConTipo[]>([])
  const [viaje, setViaje] = useState<{ presupuesto: number | null; moneda: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'todos' | 'estimado' | 'real'>('todos')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ descripcion: '', monto: '', categoria: 'comida', fecha: '', tipo: 'real' })
  const [form, setForm] = useState({ descripcion: '', monto: '', categoria: 'comida', fecha: new Date().toISOString().split('T')[0], tipo: 'real' })

  useEffect(() => {
    params.then(p => { setViajeId(p.id); load(p.id) })
  }, [])

  async function load(id: string) {
    setLoading(true)
    const [{ data: g }, { data: v }] = await Promise.all([
      supabase.from('gastos').select('*').eq('viaje_id', id).order('fecha', { ascending: false }),
      supabase.from('viajes').select('presupuesto,moneda').eq('id', id).single(),
    ])
    setGastos((g ?? []) as GastoConTipo[])
    setViaje(v)
    setLoading(false)
  }

  async function addGasto(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !viajeId) return
    const { data } = await supabase.from('gastos').insert({
      viaje_id: viajeId,
      descripcion: form.descripcion,
      monto: parseFloat(form.monto),
      categoria: form.categoria as Gasto['categoria'],
      fecha: form.fecha,
      moneda: viaje?.moneda ?? 'USD',
      tipo: form.tipo,
    } as any).select().single()
    if (data) {
      setGastos(g => [data as GastoConTipo, ...g])
      setShowForm(false)
      setForm({ descripcion: '', monto: '', categoria: 'comida', fecha: new Date().toISOString().split('T')[0], tipo: 'real' })
    }
  }

  function startEdit(gasto: GastoConTipo) {
    setEditingId(gasto.id)
    setEditForm({
      descripcion: gasto.descripcion,
      monto: gasto.monto.toString(),
      categoria: gasto.categoria,
      fecha: gasto.fecha,
      tipo: (gasto as any).tipo ?? 'real',
    })
  }

  async function saveEdit(id: string) {
    const { data } = await supabase.from('gastos').update({
      descripcion: editForm.descripcion,
      monto: parseFloat(editForm.monto),
      categoria: editForm.categoria as Gasto['categoria'],
      fecha: editForm.fecha,
      tipo: editForm.tipo,
    } as any).eq('id', id).select().single()
    if (data) {
      setGastos(g => g.map(x => x.id === id ? data as GastoConTipo : x))
      setEditingId(null)
    }
  }

  async function deleteGasto(id: string) {
    await supabase.from('gastos').delete().eq('id', id)
    setGastos(g => g.filter(x => x.id !== id))
  }

  const gastosFiltrados = tab === 'todos' ? gastos : gastos.filter(g => (g as any).tipo === tab)
  const totalEstimado = gastos.filter(g => (g as any).tipo === 'estimado').reduce((a, g) => a + g.monto, 0)
  const totalReal = gastos.filter(g => (g as any).tipo === 'real').reduce((a, g) => a + g.monto, 0)
  const presupuesto = viaje?.presupuesto ?? 0
  const moneda = viaje?.moneda ?? 'USD'

  const pieData = CATEGORIAS_GASTO.map(cat => ({
    name: cat.label,
    value: gastosFiltrados.filter(g => g.categoria === cat.value).reduce((a, g) => a + g.monto, 0),
    color: cat.color,
  })).filter(d => d.value > 0)

  if (loading) return <div className="text-[#6B7280] text-sm">Cargando...</div>

  return (
    <div className="max-w-4xl space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-[#6B7280] mb-0.5">Presupuesto</p>
          <p className="text-xl font-medium text-[#1A1D23]">{presupuesto ? formatMonto(presupuesto, moneda) : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[#6B7280] mb-0.5">Estimado</p>
          <p className="text-xl font-medium text-[#1A1D23]">{formatMonto(totalEstimado, moneda)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[#6B7280] mb-0.5">Gastado real</p>
          <p className="text-xl font-medium text-[#1A1D23]">{formatMonto(totalReal, moneda)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[#6B7280] mb-0.5">Diferencia</p>
          <p className={`text-xl font-medium ${totalEstimado - totalReal < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {formatMonto(totalEstimado - totalReal, moneda)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 border border-[#E8E9EC] rounded-lg p-1">
          {(['todos', 'estimado', 'real'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${tab === t ? 'bg-[#7C3AED] text-white' : 'text-[#6B7280] hover:bg-[#F4F5F7]'}`}>
              {t === 'todos' ? 'Todos' : t === 'estimado' ? '📋 Estimados' : '✅ Reales'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <Plus size={15} /> Agregar gasto
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-sm font-medium text-[#1A1D23] mb-4">Nuevo gasto</h3>
          <form onSubmit={addGasto} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Descripcion *</label>
              <input className="input" placeholder="Ej: Hotel en Roma"
                value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Monto *</label>
              <input className="input" type="number" step="0.01" placeholder="0.00"
                value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="estimado">📋 Estimado</option>
                <option value="real">✅ Real</option>
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="select" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS_GASTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha</label>
              <input className="input" type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex-1 justify-center">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {pieData.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-medium text-[#1A1D23] mb-3">Por categoria</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatMonto(v, moneda)} />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <h3 className="text-sm font-medium text-[#1A1D23] mb-3">
            {tab === 'todos' ? 'Todos los gastos' : tab === 'estimado' ? 'Gastos estimados' : 'Gastos reales'}
          </h3>
          <div className="space-y-1">
            {gastosFiltrados.length === 0 && <p className="text-[#6B7280] text-sm">Sin gastos en esta categoria</p>}
            {gastosFiltrados.map(gasto => {
              const cat = CATEGORIAS_GASTO.find(c => c.value === gasto.categoria)
              const tipo = (gasto as any).tipo
              return (
                <div key={gasto.id}>
                  {editingId === gasto.id ? (
                    <div className="py-2 border-b border-[#E8E9EC] space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <input className="input text-xs py-1" value={editForm.descripcion}
                            onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
                        </div>
                        <input className="input text-xs py-1" type="number" step="0.01" value={editForm.monto}
                          onChange={e => setEditForm(f => ({ ...f, monto: e.target.value }))} />
                        <select className="select text-xs py-1" value={editForm.tipo}
                          onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value }))}>
                          <option value="estimado">📋 Estimado</option>
                          <option value="real">✅ Real</option>
                        </select>
                        <select className="select text-xs py-1" value={editForm.categoria}
                          onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}>
                          {CATEGORIAS_GASTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <input className="input text-xs py-1" type="date" value={editForm.fecha}
                          onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(gasto.id)} className="btn-primary text-xs px-3 py-1"><Check size={11} /> Guardar</button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary text-xs px-3 py-1"><X size={11} /> Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-2 border-b border-[#E8E9EC] last:border-0 group">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat?.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-[#1A1D23] truncate">{gasto.descripcion}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tipo === 'estimado' ? 'bg-[#F4F5F7] text-[#6B7280]' : 'bg-green-100 text-green-700'}`}>
                            {tipo === 'estimado' ? 'Est.' : 'Real'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#9CA3AF]">{formatFecha(gasto.fecha)} · {cat?.label}</p>
                      </div>
                      <p className="text-xs font-medium text-[#1A1D23]">{formatMonto(gasto.monto, moneda)}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => startEdit(gasto)} className="text-[#9CA3AF] hover:text-[#7C3AED]"><Pencil size={12} /></button>
                        <button onClick={() => deleteGasto(gasto.id)} className="text-[#9CA3AF] hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

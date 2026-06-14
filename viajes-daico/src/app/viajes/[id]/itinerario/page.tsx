'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ChevronDown, ChevronRight, MapPin, Utensils } from 'lucide-react'
import type { Dia, Actividad } from '@/types'
import { formatFecha, CATEGORIAS_ACTIVIDAD } from '@/lib/utils'

interface Recomendacion {
  id: string
  dia_id: string
  nombre: string
  tipo: string
  ubicacion: string | null
  notas: string | null
}

export default function ItinerarioPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [viajeId, setViajeId] = useState('')
  const [dias, setDias] = useState<(Dia & { actividades: Actividad[]; recomendaciones: Recomendacion[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showRecoTab, setShowRecoTab] = useState<Record<string, 'actividades' | 'recomendaciones'>>({})
  const [showActForm, setShowActForm] = useState<string | null>(null)
  const [showRecoForm, setShowRecoForm] = useState<string | null>(null)
  const [actForm, setActForm] = useState({ nombre: '', hora: '', ubicacion: '', categoria: 'atraccion', notas: '' })
  const [recoForm, setRecoForm] = useState({ nombre: '', tipo: 'restaurante', ubicacion: '', notas: '' })
  const [newDiaFecha, setNewDiaFecha] = useState('')
  const [showDiaForm, setShowDiaForm] = useState(false)

  useEffect(() => {
    params.then(p => { setViajeId(p.id); load(p.id) })
  }, [])

  async function load(id: string) {
    const { data: diasData } = await supabase.from('dias').select('*').eq('viaje_id', id).order('fecha')
    const { data: acts } = await supabase.from('actividades').select('*').eq('viaje_id', id).order('orden')
    const { data: recos } = await supabase.from('recomendaciones').select('*').in('dia_id', (diasData ?? []).map(d => d.id))
    
    const diasConTodo = (diasData ?? []).map(d => ({
      ...d,
      actividades: (acts ?? []).filter(a => a.dia_id === d.id),
      recomendaciones: (recos ?? []).filter((r: Recomendacion) => r.dia_id === d.id),
    }))
    setDias(diasConTodo)
    const exp: Record<string, boolean> = {}
    const tabs: Record<string, 'actividades' | 'recomendaciones'> = {}
    diasConTodo.forEach(d => { exp[d.id] = true; tabs[d.id] = 'actividades' })
    setExpanded(exp)
    setShowRecoTab(tabs)
    setLoading(false)
  }

  async function addDia(e: React.FormEvent) {
    e.preventDefault()
    if (!viajeId || !newDiaFecha) return
    const { data } = await supabase.from('dias').insert({ viaje_id: viajeId, fecha: newDiaFecha, orden: dias.length }).select().single()
    if (data) {
      setDias(d => [...d, { ...data, actividades: [], recomendaciones: [] }].sort((a, b) => a.fecha.localeCompare(b.fecha)))
      setExpanded(e => ({ ...e, [data.id]: true }))
      setShowRecoTab(t => ({ ...t, [data.id]: 'actividades' }))
      setShowDiaForm(false)
      setNewDiaFecha('')
    }
  }

  async function deleteDia(id: string) {
    await supabase.from('dias').delete().eq('id', id)
    setDias(d => d.filter(x => x.id !== id))
  }

  async function addActividad(e: React.FormEvent, diaId: string) {
    e.preventDefault()
    if (!viajeId || !actForm.nombre.trim()) return
    const dia = dias.find(d => d.id === diaId)
    const { data } = await supabase.from('actividades').insert({
      dia_id: diaId, viaje_id: viajeId,
      nombre: actForm.nombre, hora: actForm.hora || null,
      ubicacion: actForm.ubicacion || null,
      categoria: actForm.categoria as Actividad['categoria'],
      notas: actForm.notas || null, orden: dia?.actividades.length ?? 0,
    }).select().single()
    if (data) {
      setDias(ds => ds.map(d => d.id === diaId ? { ...d, actividades: [...d.actividades, data] } : d))
      setShowActForm(null)
      setActForm({ nombre: '', hora: '', ubicacion: '', categoria: 'atraccion', notas: '' })
    }
  }

  async function deleteActividad(diaId: string, actId: string) {
    await supabase.from('actividades').delete().eq('id', actId)
    setDias(ds => ds.map(d => d.id === diaId ? { ...d, actividades: d.actividades.filter(a => a.id !== actId) } : d))
  }

  async function addRecomendacion(e: React.FormEvent, diaId: string) {
    e.preventDefault()
    if (!recoForm.nombre.trim()) return
    const { data } = await supabase.from('recomendaciones').insert({
      dia_id: diaId, nombre: recoForm.nombre,
      tipo: recoForm.tipo, ubicacion: recoForm.ubicacion || null,
      notas: recoForm.notas || null,
    }).select().single()
    if (data) {
      setDias(ds => ds.map(d => d.id === diaId ? { ...d, recomendaciones: [...d.recomendaciones, data] } : d))
      setShowRecoForm(null)
      setRecoForm({ nombre: '', tipo: 'restaurante', ubicacion: '', notas: '' })
    }
  }

  async function deleteRecomendacion(diaId: string, recoId: string) {
    await supabase.from('recomendaciones').delete().eq('id', recoId)
    setDias(ds => ds.map(d => d.id === diaId ? { ...d, recomendaciones: d.recomendaciones.filter(r => r.id !== recoId) } : d))
  }

  const TIPOS_RECO = [
    { value: 'restaurante', label: '🍽️ Restaurante' },
    { value: 'cafe', label: '☕ Café' },
    { value: 'bar', label: '🍷 Bar' },
    { value: 'heladeria', label: '🍦 Heladería' },
    { value: 'mercado', label: '🛒 Mercado' },
    { value: 'otro', label: '📍 Otro lugar' },
  ]

  if (loading) return <div className="text-nude-500 text-sm">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowDiaForm(s => !s)} className="btn-primary">
          <Plus size={15} /> Agregar día
        </button>
      </div>

      {showDiaForm && (
        <div className="card border-accent/30">
          <form onSubmit={addDia} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Fecha del día</label>
              <input className="input" type="date" value={newDiaFecha} onChange={e => setNewDiaFecha(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary">Agregar</button>
            <button type="button" onClick={() => setShowDiaForm(false)} className="btn-secondary">Cancelar</button>
          </form>
        </div>
      )}

      {dias.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-nude-500 text-sm">Todavía no hay días en el itinerario</p>
        </div>
      ) : dias.map((dia, idx) => (
        <div key={dia.id} className="card">
          <div className="flex items-center gap-3 cursor-pointer"
            onClick={() => setExpanded(e => ({ ...e, [dia.id]: !e[dia.id] }))}>
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-accent">D{idx + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-nude-900">{formatFecha(dia.fecha, "EEEE d 'de' MMMM")}</p>
              <p className="text-xs text-nude-400">{dia.actividades.length} actividades · {dia.recomendaciones.length} recomendaciones</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteDia(dia.id) }}
                className="text-nude-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                <Trash2 size={13} />
              </button>
              {expanded[dia.id] ? <ChevronDown size={15} className="text-nude-400" /> : <ChevronRight size={15} className="text-nude-400" />}
            </div>
          </div>

          {expanded[dia.id] && (
            <div className="mt-4 pl-11">
              {/* Tabs actividades / recomendaciones */}
              <div className="flex gap-1 mb-3 border-b border-nude-200">
                <button onClick={() => setShowRecoTab(t => ({ ...t, [dia.id]: 'actividades' }))}
                  className={`text-xs px-3 py-1.5 border-b-2 transition-all font-medium ${showRecoTab[dia.id] === 'actividades' ? 'border-accent text-nude-900' : 'border-transparent text-nude-400 hover:text-nude-700'}`}>
                  📅 Actividades
                </button>
                <button onClick={() => setShowRecoTab(t => ({ ...t, [dia.id]: 'recomendaciones' }))}
                  className={`text-xs px-3 py-1.5 border-b-2 transition-all font-medium flex items-center gap-1 ${showRecoTab[dia.id] === 'recomendaciones' ? 'border-accent text-nude-900' : 'border-transparent text-nude-400 hover:text-nude-700'}`}>
                  <Utensils size={11} /> Dónde comer
                  {dia.recomendaciones.length > 0 && (
                    <span className="bg-accent/20 text-accent text-[9px] px-1.5 py-0.5 rounded-full">{dia.recomendaciones.length}</span>
                  )}
                </button>
              </div>

              {showRecoTab[dia.id] === 'actividades' ? (
                <div className="space-y-2">
                  {dia.actividades.map(act => (
                    <div key={act.id} className="flex items-start gap-3 p-3 bg-nude-100 rounded-lg group">
                      {act.hora && <span className="text-[11px] text-nude-400 font-mono mt-0.5 w-10 shrink-0">{act.hora}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-nude-900">{act.nombre}</p>
                        {act.ubicacion && <p className="text-xs text-nude-400 mt-0.5">📍 {act.ubicacion}</p>}
                        {act.notas && <p className="text-xs text-nude-400 mt-0.5 italic">{act.notas}</p>}
                      </div>
                      <span className="badge bg-nude-200 text-nude-600 text-[10px] shrink-0">
                        {CATEGORIAS_ACTIVIDAD.find(c => c.value === act.categoria)?.label}
                      </span>
                      <button onClick={() => deleteActividad(dia.id, act.id)}
                        className="opacity-0 group-hover:opacity-100 text-nude-400 hover:text-red-500 transition-all shrink-0 mt-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {showActForm === dia.id ? (
                    <form onSubmit={e => addActividad(e, dia.id)} className="p-3 bg-nude-100 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="label">Actividad *</label>
                          <input className="input" placeholder="Ej: Visita al Coliseo"
                            value={actForm.nombre} onChange={e => setActForm(f => ({ ...f, nombre: e.target.value }))} required />
                        </div>
                        <div>
                          <label className="label">Hora</label>
                          <input className="input" type="time" value={actForm.hora} onChange={e => setActForm(f => ({ ...f, hora: e.target.value }))} />
                        </div>
                        <div>
                          <label className="label">Categoría</label>
                          <select className="select" value={actForm.categoria} onChange={e => setActForm(f => ({ ...f, categoria: e.target.value }))}>
                            {CATEGORIAS_ACTIVIDAD.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="label">Ubicación</label>
                          <input className="input" placeholder="Dirección o lugar"
                            value={actForm.ubicacion} onChange={e => setActForm(f => ({ ...f, ubicacion: e.target.value }))} />
                        </div>
                        <div className="col-span-2">
                          <label className="label">Notas</label>
                          <input className="input" placeholder="Notas opcionales"
                            value={actForm.notas} onChange={e => setActForm(f => ({ ...f, notas: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary text-xs px-3 py-1.5">Guardar</button>
                        <button type="button" onClick={() => setShowActForm(null)} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setShowActForm(dia.id)}
                      className="flex items-center gap-2 text-xs text-nude-400 hover:text-accent transition-colors py-1">
                      <Plus size={13} /> Agregar actividad
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {dia.recomendaciones.length === 0 && (
                    <p className="text-xs text-nude-400 italic py-2">No hay recomendaciones para este día todavía.</p>
                  )}
                  {dia.recomendaciones.map(reco => (
                    <div key={reco.id} className="flex items-start gap-3 p-3 bg-nude-100 rounded-lg group">
                      <Utensils size={14} className="text-accent mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-nude-900">{reco.nombre}</p>
                        <p className="text-[10px] text-nude-400 mt-0.5">{TIPOS_RECO.find(t => t.value === reco.tipo)?.label}</p>
                        {reco.ubicacion && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reco.ubicacion)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {reco.ubicacion}
                          </a>
                        )}
                        {reco.notas && <p className="text-xs text-nude-400 mt-1 italic">{reco.notas}</p>}
                      </div>
                      <button onClick={() => deleteRecomendacion(dia.id, reco.id)}
                        className="opacity-0 group-hover:opacity-100 text-nude-400 hover:text-red-500 transition-all shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {showRecoForm === dia.id ? (
                    <form onSubmit={e => addRecomendacion(e, dia.id)} className="p-3 bg-nude-100 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="label">Nombre del lugar *</label>
                          <input className="input" placeholder="Ej: Trattoria da Mario"
                            value={recoForm.nombre} onChange={e => setRecoForm(f => ({ ...f, nombre: e.target.value }))} required />
                        </div>
                        <div>
                          <label className="label">Tipo</label>
                          <select className="select" value={recoForm.tipo} onChange={e => setRecoForm(f => ({ ...f, tipo: e.target.value }))}>
                            {TIPOS_RECO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Ubicación / Dirección</label>
                          <input className="input" placeholder="Via Roma 123, Roma"
                            value={recoForm.ubicacion} onChange={e => setRecoForm(f => ({ ...f, ubicacion: e.target.value }))} />
                        </div>
                        <div className="col-span-2">
                          <label className="label">Notas</label>
                          <input className="input" placeholder="Ej: Reservar con anticipación, muy buena pasta"
                            value={recoForm.notas} onChange={e => setRecoForm(f => ({ ...f, notas: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary text-xs px-3 py-1.5">Guardar</button>
                        <button type="button" onClick={() => setShowRecoForm(null)} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setShowRecoForm(dia.id)}
                      className="flex items-center gap-2 text-xs text-nude-400 hover:text-accent transition-colors py-1">
                      <Plus size={13} /> Agregar recomendación
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

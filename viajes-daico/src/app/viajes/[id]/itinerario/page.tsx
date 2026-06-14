'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ChevronDown, ChevronRight, MapPin, Utensils, Map } from 'lucide-react'
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

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function ItinerarioPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [viajeId, setViajeId] = useState('')
  const [dias, setDias] = useState<(Dia & { actividades: Actividad[]; recomendaciones: Recomendacion[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<Record<string, 'actividades' | 'recomendaciones'>>({})
  const [showActForm, setShowActForm] = useState<string | null>(null)
  const [showRecoForm, setShowRecoForm] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [actForm, setActForm] = useState({ nombre: '', hora: '', ubicacion: '', categoria: 'atraccion', notas: '' })
  const [recoForm, setRecoForm] = useState({ nombre: '', tipo: 'restaurante', ubicacion: '', notas: '' })
  const [newDiaFecha, setNewDiaFecha] = useState('')
  const [showDiaForm, setShowDiaForm] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    params.then(p => { setViajeId(p.id); load(p.id) })
  }, [])

  useEffect(() => {
    if (showMap) initGoogleMap()
  }, [showMap, dias])

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
    setActiveTab(tabs)
    setLoading(false)
  }

  function initGoogleMap() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey || !mapRef.current) return

    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`
      script.async = true
      window.initMap = () => renderMap()
      document.head.appendChild(script)
    } else {
      renderMap()
    }
  }

  function renderMap() {
    if (!mapRef.current) return
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 5,
      center: { lat: 41.9, lng: 12.5 },
      mapTypeControl: false,
      streetViewControl: false,
    })
    mapInstance.current = map

    const geocoder = new window.google.maps.Geocoder()
    const bounds = new window.google.maps.LatLngBounds()
    let hasPoints = false

    dias.forEach((dia, dIdx) => {
      dia.actividades.forEach(act => {
        if (!act.ubicacion) return
        geocoder.geocode({ address: act.ubicacion }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const pos = results[0].geometry.location
            new window.google.maps.Marker({
              position: pos,
              map,
              title: act.nombre,
              label: { text: `D${dIdx + 1}`, color: 'white', fontSize: '11px', fontWeight: 'bold' },
            })
            bounds.extend(pos)
            hasPoints = true
            map.fitBounds(bounds)
          }
        })
      })
      dia.recomendaciones.forEach(reco => {
        if (!reco.ubicacion) return
        geocoder.geocode({ address: reco.ubicacion }, (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const pos = results[0].geometry.location
            new window.google.maps.Marker({
              position: pos,
              map,
              title: reco.nombre,
              icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            })
            bounds.extend(pos)
            map.fitBounds(bounds)
          }
        })
      })
    })
  }

  async function addDia(e: React.FormEvent) {
    e.preventDefault()
    if (!viajeId || !newDiaFecha) return
    const { data } = await supabase.from('dias').insert({ viaje_id: viajeId, fecha: newDiaFecha, orden: dias.length }).select().single()
    if (data) {
      setDias(d => [...d, { ...data, actividades: [], recomendaciones: [] }].sort((a, b) => a.fecha.localeCompare(b.fecha)))
      setExpanded(e => ({ ...e, [data.id]: true }))
      setActiveTab(t => ({ ...t, [data.id]: 'actividades' }))
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
    { value: 'restaurante', label: 'Restaurante' },
    { value: 'cafe',        label: 'Cafe' },
    { value: 'bar',         label: 'Bar' },
    { value: 'heladeria',   label: 'Heladeria' },
    { value: 'mercado',     label: 'Mercado' },
    { value: 'otro',        label: 'Otro lugar' },
  ]

  if (loading) return <div className="text-[#6B7280] text-sm">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button onClick={() => setShowDiaForm(s => !s)} className="btn-primary">
            <Plus size={15} /> Agregar dia
          </button>
          <button onClick={() => setShowMap(s => !s)}
            className={`btn-secondary flex items-center gap-2 ${showMap ? 'bg-[#EDE9FE] text-[#7C3AED]' : ''}`}>
            <Map size={15} /> {showMap ? 'Ocultar mapa' : 'Ver mapa'}
          </button>
        </div>
      </div>

      {showMap && (
        <div className="card p-0 overflow-hidden">
          <div ref={mapRef} className="w-full h-72" />
        </div>
      )}

      {showDiaForm && (
        <div className="card border-[#7C3AED]/20">
          <form onSubmit={addDia} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Fecha del dia</label>
              <input className="input" type="date" value={newDiaFecha} onChange={e => setNewDiaFecha(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary">Agregar</button>
            <button type="button" onClick={() => setShowDiaForm(false)} className="btn-secondary">Cancelar</button>
          </form>
        </div>
      )}

      {dias.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[#6B7280] text-sm">Todavia no hay dias en el itinerario</p>
        </div>
      ) : dias.map((dia, idx) => (
        <div key={dia.id} className="card">
          <div className="flex items-center gap-3 cursor-pointer"
            onClick={() => setExpanded(e => ({ ...e, [dia.id]: !e[dia.id] }))}>
            <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-[#7C3AED]">D{idx + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1A1D23]">{formatFecha(dia.fecha, "EEEE d 'de' MMMM")}</p>
              <p className="text-xs text-[#6B7280]">{dia.actividades.length} actividades · {dia.recomendaciones.length} recomendaciones</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={e => { e.stopPropagation(); deleteDia(dia.id) }}
                className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1">
                <Trash2 size={13} />
              </button>
              {expanded[dia.id] ? <ChevronDown size={15} className="text-[#9CA3AF]" /> : <ChevronRight size={15} className="text-[#9CA3AF]" />}
            </div>
          </div>

          {expanded[dia.id] && (
            <div className="mt-4 pl-11">
              <div className="flex gap-1 mb-3 border-b border-[#E8E9EC]">
                <button onClick={() => setActiveTab(t => ({ ...t, [dia.id]: 'actividades' }))}
                  className={`text-xs px-3 py-1.5 border-b-2 transition-all font-medium ${activeTab[dia.id] === 'actividades' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-[#9CA3AF] hover:text-[#1A1D23]'}`}>
                  Actividades
                </button>
                <button onClick={() => setActiveTab(t => ({ ...t, [dia.id]: 'recomendaciones' }))}
                  className={`text-xs px-3 py-1.5 border-b-2 transition-all font-medium flex items-center gap-1 ${activeTab[dia.id] === 'recomendaciones' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-[#9CA3AF] hover:text-[#1A1D23]'}`}>
                  <Utensils size={11} /> Donde comer
                  {dia.recomendaciones.length > 0 && (
                    <span className="bg-[#EDE9FE] text-[#7C3AED] text-[9px] px-1.5 py-0.5 rounded-full">{dia.recomendaciones.length}</span>
                  )}
                </button>
              </div>

              {activeTab[dia.id] === 'actividades' ? (
                <div className="space-y-2">
                  {dia.actividades.map(act => (
                    <div key={act.id} className="flex items-start gap-3 p-3 bg-[#F4F5F7] rounded-xl group">
                      {act.hora && <span className="text-[11px] text-[#9CA3AF] font-mono mt-0.5 w-10 shrink-0">{act.hora}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1D23]">{act.nombre}</p>
                        {act.ubicacion && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.ubicacion)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#7C3AED] hover:underline flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {act.ubicacion}
                          </a>
                        )}
                        {act.notas && <p className="text-xs text-[#9CA3AF] mt-0.5 italic">{act.notas}</p>}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#6B7280] border border-[#E8E9EC] shrink-0">
                        {CATEGORIAS_ACTIVIDAD.find(c => c.value === act.categoria)?.label}
                      </span>
                      <button onClick={() => deleteActividad(dia.id, act.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-red-500 transition-all shrink-0 mt-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {showActForm === dia.id ? (
                    <form onSubmit={e => addActividad(e, dia.id)} className="p-3 bg-[#F4F5F7] rounded-xl space-y-3">
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
                          <label className="label">Categoria</label>
                          <select className="select" value={actForm.categoria} onChange={e => setActForm(f => ({ ...f, categoria: e.target.value }))}>
                            {CATEGORIAS_ACTIVIDAD.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="label">Ubicacion</label>
                          <input className="input" placeholder="Ej: Coliseo, Roma"
                            value={actForm.ubicacion} onChange={e => setActForm(f => ({ ...f, ubicacion: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="btn-primary text-xs px-3 py-1.5">Guardar</button>
                        <button type="button" onClick={() => setShowActForm(null)} className="btn-secondary text-xs px-3 py-1.5">Cancelar</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setShowActForm(dia.id)}
                      className="flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-[#7C3AED] transition-colors py-1">
                      <Plus size={13} /> Agregar actividad
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {dia.recomendaciones.length === 0 && (
                    <p className="text-xs text-[#9CA3AF] italic py-2">Sin recomendaciones para este dia.</p>
                  )}
                  {dia.recomendaciones.map(reco => (
                    <div key={reco.id} className="flex items-start gap-3 p-3 bg-[#F4F5F7] rounded-xl group">
                      <Utensils size={14} className="text-[#7C3AED] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1D23]">{reco.nombre}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{TIPOS_RECO.find(t => t.value === reco.tipo)?.label}</p>
                        {reco.ubicacion && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reco.ubicacion)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#7C3AED] hover:underline flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {reco.ubicacion}
                          </a>
                        )}
                        {reco.notas && <p className="text-xs text-[#9CA3AF] mt-1 italic">{reco.notas}</p>}
                      </div>
                      <button onClick={() => deleteRecomendacion(dia.id, reco.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-red-500 transition-all shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {showRecoForm === dia.id ? (
                    <form onSubmit={e => addRecomendacion(e, dia.id)} className="p-3 bg-[#F4F5F7] rounded-xl space-y-3">
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
                          <label className="label">Ubicacion</label>
                          <input className="input" placeholder="Via Roma 123, Roma"
                            value={recoForm.ubicacion} onChange={e => setRecoForm(f => ({ ...f, ubicacion: e.target.value }))} />
                        </div>
                        <div className="col-span-2">
                          <label className="label">Notas</label>
                          <input className="input" placeholder="Ej: Reservar con anticipacion"
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
                      className="flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-[#7C3AED] transition-colors py-1">
                      <Plus size={13} /> Agregar recomendacion
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

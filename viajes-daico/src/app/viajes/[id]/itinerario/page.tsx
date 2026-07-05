'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ChevronDown, ChevronRight, MapPin, Utensils, Map, Pencil, Check, X, Plane, Car, Train, PersonStanding, Bike, Ship, GripVertical } from 'lucide-react'
import type { Dia, Actividad } from '@/types'
import { formatFecha, CATEGORIAS_ACTIVIDAD } from '@/lib/utils'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Recomendacion {
  id: string; dia_id: string; nombre: string; tipo: string; ubicacion: string | null; notas: string | null
}

interface DiaExtendido extends Dia {
  titulo: string | null
  ciudad: string | null
  distancia_desde_anterior: number | null
  tiempo_desde_anterior: number | null
  modo_transporte: string | null
  actividades: Actividad[]
  recomendaciones: Recomendacion[]
}

declare global { interface Window { google: any; initMap: () => void } }

const TIPOS_RECO = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bar', label: 'Bar' },
  { value: 'heladeria', label: 'Heladeria' },
  { value: 'mercado', label: 'Mercado' },
  { value: 'otro', label: 'Otro lugar' },
]

const MODOS_TRANSPORTE = [
  { value: 'auto', label: 'Auto', icon: Car },
  { value: 'avion', label: 'Avion', icon: Plane },
  { value: 'tren', label: 'Tren', icon: Train },
  { value: 'caminando', label: 'Caminando', icon: PersonStanding },
  { value: 'bici', label: 'Bici', icon: Bike },
  { value: 'barco', label: 'Barco', icon: Ship },
]

function safeFecha(fecha: string | null | undefined, formato: string) {
  if (!fecha) return '—'
  try { return formatFecha(fecha, formato) } catch { return '—' }
}

function UbicacionInput({ value, onChange, placeholder = 'Ej: Coliseo, Roma' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  useEffect(() => {
    if (!inputRef.current || !window.google || autocompleteRef.current) return
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, { types: ['geocode', 'establishment'] })
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (place?.formatted_address) onChange(place.formatted_address)
      else if (place?.name) onChange(place.name)
    })
  }, [])
  return <input ref={inputRef} className="input" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
}

function SortableActividad({ act, diaId, editingAct, editActForm, setEditActForm, startEditAct, saveEditAct, deleteActividad, mapsLoaded, setEditingAct }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: act.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style}>
      {editingAct === act.id ? (
        <form onSubmit={e => saveEditAct(e, diaId, act.id)} className="p-3 bg-[#F4F5F7] rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Actividad *</label>
              <input className="input" value={editActForm.nombre} onChange={e => setEditActForm((f: any) => ({ ...f, nombre: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Hora</label>
              <input className="input" type="time" value={editActForm.hora} onChange={e => setEditActForm((f: any) => ({ ...f, hora: e.target.value }))} />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="select" value={editActForm.categoria} onChange={e => setEditActForm((f: any) => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS_ACTIVIDAD.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Ubicacion</label>
              {mapsLoaded
                ? <UbicacionInput value={editActForm.ubicacion} onChange={(v: string) => setEditActForm((f: any) => ({ ...f, ubicacion: v }))} />
                : <input className="input" value={editActForm.ubicacion} onChange={e => setEditActForm((f: any) => ({ ...f, ubicacion: e.target.value }))} />
              }
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <input className="input" value={editActForm.notas} onChange={e => setEditActForm((f: any) => ({ ...f, notas: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-xs px-3 py-1.5"><Check size={12} /> Guardar</button>
            <button type="button" onClick={() => setEditingAct(null)} className="btn-secondary text-xs px-3 py-1.5"><X size={12} /> Cancelar</button>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-2 p-3 bg-[#F4F5F7] rounded-xl group">
          <button {...attributes} {...listeners} className="text-[#D1D5DB] hover:text-[#9CA3AF] cursor-grab active:cursor-grabbing mt-0.5 shrink-0">
            <GripVertical size={14} />
          </button>
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
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
            <button onClick={() => startEditAct(act)} className="text-[#9CA3AF] hover:text-[#7C3AED]"><Pencil size={12} /></button>
            <button onClick={() => deleteActividad(diaId, act.id)} className="text-[#9CA3AF] hover:text-red-500"><Trash2 size={12} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ItinerarioPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [viajeId, setViajeId] = useState('')
  const [dias, setDias] = useState<DiaExtendido[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<Record<string, 'actividades' | 'recomendaciones'>>({})
  const [showActForm, setShowActForm] = useState<string | null>(null)
  const [showRecoForm, setShowRecoForm] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [editingAct, setEditingAct] = useState<string | null>(null)
  const [editingDia, setEditingDia] = useState<string | null>(null)
  const [editDia, setEditDia] = useState({ fecha: '', titulo: '', ciudad: '', distancia: '', tiempo: '', modo: 'auto' })
  const [actForm, setActForm] = useState({ nombre: '', hora: '', ubicacion: '', categoria: 'atraccion', notas: '' })
  const [editActForm, setEditActForm] = useState({ nombre: '', hora: '', ubicacion: '', categoria: 'atraccion', notas: '' })
  const [recoForm, setRecoForm] = useState({ nombre: '', tipo: 'restaurante', ubicacion: '', notas: '' })
  const [newDiaFecha, setNewDiaFecha] = useState('')
  const [showDiaForm, setShowDiaForm] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<any[]>([])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { params.then(p => { setViajeId(p.id); load(p.id) }) }, [])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey) return
    if (window.google) { setMapsLoaded(true); return }
    window.initMap = () => setMapsLoaded(true)
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (!existing) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
      script.async = true
      document.head.appendChild(script)
    } else if (window.google) { setMapsLoaded(true) }
  }, [])

  useEffect(() => { if (showMap && mapsLoaded) renderMap() }, [showMap, dias, mapsLoaded])

  async function load(id: string) {
    const { data: diasData } = await supabase.from('dias').select('*').eq('viaje_id', id).order('fecha')
    const { data: acts } = await supabase.from('actividades').select('*').eq('viaje_id', id).order('orden')
    const { data: recos } = await supabase.from('recomendaciones').select('*').in('dia_id', (diasData ?? []).map(d => d.id))
    const diasConTodo = (diasData ?? []).map(d => ({
      ...d,
      titulo: d.titulo ?? null,
      ciudad: d.ciudad ?? null,
      distancia_desde_anterior: d.distancia_desde_anterior ?? null,
      tiempo_desde_anterior: d.tiempo_desde_anterior ?? null,
      modo_transporte: d.modo_transporte ?? 'auto',
      actividades: (acts ?? []).filter(a => a.dia_id === d.id),
      recomendaciones: (recos ?? []).filter((r: Recomendacion) => r.dia_id === d.id),
    }))
    setDias(diasConTodo)
    const exp: Record<string, boolean> = {}
    const tabs: Record<string, 'actividades' | 'recomendaciones'> = {}
    diasConTodo.forEach(d => { exp[d.id] = true; tabs[d.id] = 'actividades' })
    setExpanded(exp); setActiveTab(tabs); setLoading(false)
  }

  function renderMap() {
    if (!mapRef.current || !window.google) return
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 5, center: { lat: 41.9, lng: 12.5 }, mapTypeControl: false, streetViewControl: false,
    })
    const geocoder = new window.google.maps.Geocoder()
    const bounds = new window.google.maps.LatLngBounds()
    dias.forEach((dia, dIdx) => {
      dia.actividades.forEach(act => {
        if (!act.ubicacion) return
        geocoder.geocode({ address: act.ubicacion }, async (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const pos = results[0].geometry.location
            const marker = new window.google.maps.Marker({
              position: pos, map, title: act.nombre, draggable: true,
              label: { text: `D${dIdx + 1}`, color: 'white', fontSize: '11px', fontWeight: 'bold' },
            })
            marker.addListener('dragend', async (e: any) => {
              const lat = e.latLng.lat(); const lng = e.latLng.lng()
              const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`)
              const data = await res.json()
              if (data.results[0]) {
                const newAddr = data.results[0].formatted_address
                await supabase.from('actividades').update({ ubicacion: newAddr }).eq('id', act.id)
                setDias(ds => ds.map(d => d.id === dia.id ? { ...d, actividades: d.actividades.map(a => a.id === act.id ? { ...a, ubicacion: newAddr } : a) } : d))
              }
            })
            markersRef.current.push(marker)
            bounds.extend(pos); map.fitBounds(bounds)
          }
        })
      })
    })
  }

  async function handleDragEnd(event: any, diaId: string) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const dia = dias.find(d => d.id === diaId)
    if (!dia) return
    const oldIndex = dia.actividades.findIndex(a => a.id === active.id)
    const newIndex = dia.actividades.findIndex(a => a.id === over.id)
    const newActividades = arrayMove(dia.actividades, oldIndex, newIndex)
    setDias(ds => ds.map(d => d.id === diaId ? { ...d, actividades: newActividades } : d))
    await Promise.all(newActividades.map((act, idx) =>
      supabase.from('actividades').update({ orden: idx }).eq('id', act.id)
    ))
  }

  async function addDia(e: React.FormEvent) {
    e.preventDefault()
    if (!viajeId || !newDiaFecha) return
    const { data } = await supabase.from('dias').insert({ viaje_id: viajeId, fecha: newDiaFecha, orden: dias.length }).select().single()
    if (data) {
      setDias(d => [...d, { ...data, titulo: null, ciudad: null, distancia_desde_anterior: null, tiempo_desde_anterior: null, modo_transporte: 'auto', actividades: [], recomendaciones: [] }].sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? '')))
      setExpanded(e => ({ ...e, [data.id]: true }))
      setActiveTab(t => ({ ...t, [data.id]: 'actividades' }))
      setShowDiaForm(false); setNewDiaFecha('')
    }
  }

  function startEditDia(dia: DiaExtendido) {
    setEditingDia(dia.id)
    setEditDia({
      fecha: dia.fecha ?? '', titulo: dia.titulo ?? '', ciudad: dia.ciudad ?? '',
      distancia: dia.distancia_desde_anterior?.toString() ?? '',
      tiempo: dia.tiempo_desde_anterior?.toString() ?? '',
      modo: dia.modo_transporte ?? 'auto',
    })
  }

  async function saveDia(diaId: string) {
    await supabase.from('dias').update({
      fecha: editDia.fecha || null, titulo: editDia.titulo || null, ciudad: editDia.ciudad || null,
      distancia_desde_anterior: editDia.distancia ? parseFloat(editDia.distancia) : null,
      tiempo_desde_anterior: editDia.tiempo ? parseInt(editDia.tiempo) : null,
      modo_transporte: editDia.modo,
    }).eq('id', diaId)
    setDias(ds => ds.map(d => d.id === diaId ? {
      ...d, fecha: editDia.fecha || d.fecha, titulo: editDia.titulo || null, ciudad: editDia.ciudad || null,
      distancia_desde_anterior: editDia.distancia ? parseFloat(editDia.distancia) : null,
      tiempo_desde_anterior: editDia.tiempo ? parseInt(editDia.tiempo) : null,
      modo_transporte: editDia.modo,
    } : d).sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? '')))
    setEditingDia(null)
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
      dia_id: diaId, viaje_id: viajeId, nombre: actForm.nombre, hora: actForm.hora || null,
      ubicacion: actForm.ubicacion || null, categoria: actForm.categoria as Actividad['categoria'],
      notas: actForm.notas || null, orden: dia?.actividades.length ?? 0,
    }).select().single()
    if (data) {
      setDias(ds => ds.map(d => d.id === diaId ? { ...d, actividades: [...d.actividades, data] } : d))
      setShowActForm(null); setActForm({ nombre: '', hora: '', ubicacion: '', categoria: 'atraccion', notas: '' })
    }
  }

  function startEditAct(act: Actividad) {
    setEditingAct(act.id)
    setEditActForm({ nombre: act.nombre, hora: act.hora ?? '', ubicacion: act.ubicacion ?? '', categoria: act.categoria, notas: act.notas ?? '' })
  }

  async function saveEditAct(e: React.FormEvent, diaId: string, actId: string) {
    e.preventDefault()
    const { data } = await supabase.from('actividades').update({
      nombre: editActForm.nombre, hora: editActForm.hora || null,
      ubicacion: editActForm.ubicacion || null, categoria: editActForm.categoria as Actividad['categoria'],
      notas: editActForm.notas || null,
    }).eq('id', actId).select().single()
    if (data) {
      setDias(ds => ds.map(d => d.id === diaId ? { ...d, actividades: d.actividades.map(a => a.id === actId ? data : a) } : d))
      setEditingAct(null)
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
      dia_id: diaId, nombre: recoForm.nombre, tipo: recoForm.tipo,
      ubicacion: recoForm.ubicacion || null, notas: recoForm.notas || null,
    }).select().single()
    if (data) {
      setDias(ds => ds.map(d => d.id === diaId ? { ...d, recomendaciones: [...d.recomendaciones, data] } : d))
      setShowRecoForm(null); setRecoForm({ nombre: '', tipo: 'restaurante', ubicacion: '', notas: '' })
    }
  }

  async function deleteRecomendacion(diaId: string, recoId: string) {
    await supabase.from('recomendaciones').delete().eq('id', recoId)
    setDias(ds => ds.map(d => d.id === diaId ? { ...d, recomendaciones: d.recomendaciones.filter(r => r.id !== recoId) } : d))
  }

  if (loading) return <div className="text-[#6B7280] text-sm">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setShowDiaForm(s => !s)} className="btn-primary"><Plus size={15} /> Agregar dia</button>
        <button onClick={() => setShowMap(s => !s)} className={`btn-secondary ${showMap ? 'bg-[#EDE9FE] text-[#7C3AED]' : ''}`}>
          <Map size={15} /> {showMap ? 'Ocultar mapa' : 'Ver mapa'}
        </button>
      </div>

      {showMap && (
        <div className="card p-0 overflow-hidden">
          <p className="text-xs text-[#6B7280] px-4 py-2 border-b border-[#E8E9EC]">Podas arrastrar los marcadores para ajustar la ubicacion</p>
          <div ref={mapRef} className="w-full h-72" />
        </div>
      )}

      {showDiaForm && (
        <div className="card">
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
        <div className="card text-center py-12"><p className="text-[#6B7280] text-sm">Sin dias en el itinerario</p></div>
      ) : dias.map((dia, idx) => (
        <div key={dia.id}>
          {idx > 0 && (dia.distancia_desde_anterior || dia.modo_transporte) && (
            <div className="flex items-center gap-2 px-4 py-1.5 mx-4">
              <div className="flex-1 h-px bg-[#E8E9EC]" />
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F4F5F7] rounded-full px-3 py-1">
                {(() => {
                  const modo = MODOS_TRANSPORTE.find(m => m.value === dia.modo_transporte)
                  const Icon = modo?.icon ?? Car
                  return <Icon size={11} className="text-[#7C3AED]" />
                })()}
                {dia.modo_transporte && <span className="capitalize">{dia.modo_transporte}</span>}
                {dia.distancia_desde_anterior && <span>· {dia.distancia_desde_anterior} km</span>}
                {dia.tiempo_desde_anterior && <span>· {Math.floor(dia.tiempo_desde_anterior / 60)}h {dia.tiempo_desde_anterior % 60}m</span>}
              </div>
              <div className="flex-1 h-px bg-[#E8E9EC]" />
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-[#7C3AED]">D{idx + 1}</span>
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => !editingDia && setExpanded(e => ({ ...e, [dia.id]: !e[dia.id] }))}>
                {editingDia === dia.id ? (
                  <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Fecha</label>
                        <input className="input py-1 text-xs" type="date" value={editDia.fecha} onChange={e => setEditDia(f => ({ ...f, fecha: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Ciudad</label>
                        <input className="input py-1 text-xs" placeholder="Ej: Roma" value={editDia.ciudad} onChange={e => setEditDia(f => ({ ...f, ciudad: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Nombre del dia</label>
                      <input className="input py-1 text-xs" placeholder="Ej: Barcelona a Roma" value={editDia.titulo} onChange={e => setEditDia(f => ({ ...f, titulo: e.target.value }))} />
                    </div>
                    {idx > 0 && (
                      <div>
                        <label className="label">Desde ciudad anterior</label>
                        <div className="grid grid-cols-3 gap-2">
                          <select className="select text-xs py-1" value={editDia.modo} onChange={e => setEditDia(f => ({ ...f, modo: e.target.value }))}>
                            {MODOS_TRANSPORTE.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                          <input className="input py-1 text-xs" type="number" placeholder="km" value={editDia.distancia} onChange={e => setEditDia(f => ({ ...f, distancia: e.target.value }))} />
                          <input className="input py-1 text-xs" type="number" placeholder="min" value={editDia.tiempo} onChange={e => setEditDia(f => ({ ...f, tiempo: e.target.value }))} />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => saveDia(dia.id)} className="btn-primary text-xs px-3 py-1"><Check size={12} /> Guardar</button>
                      <button onClick={() => setEditingDia(null)} className="btn-secondary text-xs px-3 py-1"><X size={12} /> Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1A1D23]">{dia.titulo || safeFecha(dia.fecha, "EEEE d 'de' MMMM")}</p>
                      {dia.ciudad && <span className="text-xs px-2 py-0.5 bg-[#EDE9FE] text-[#7C3AED] rounded-full">{dia.ciudad}</span>}
                    </div>
                    <p className="text-xs text-[#6B7280]">{dia.titulo && dia.fecha ? safeFecha(dia.fecha, "d 'de' MMMM") + ' · ' : ''}{dia.actividades.length} actividades · {dia.recomendaciones.length} recomendaciones</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEditDia(dia)} className="text-[#9CA3AF] hover:text-[#7C3AED] p-1"><Pencil size={12} /></button>
                <button onClick={() => deleteDia(dia.id)} className="text-[#9CA3AF] hover:text-red-500 p-1"><Trash2 size={13} /></button>
                {expanded[dia.id] ? <ChevronDown size={15} className="text-[#9CA3AF]" /> : <ChevronRight size={15} className="text-[#9CA3AF]" />}
              </div>
            </div>

            {expanded[dia.id] && (
              <div className="mt-4 pl-11">
                <div className="flex gap-1 mb-3 border-b border-[#E8E9EC]">
                  <button onClick={() => setActiveTab(t => ({ ...t, [dia.id]: 'actividades' }))}
                    className={`text-xs px-3 py-1.5 border-b-2 transition-all font-medium ${activeTab[dia.id] === 'actividades' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-[#9CA3AF]'}`}>
                    Actividades
                  </button>
                  <button onClick={() => setActiveTab(t => ({ ...t, [dia.id]: 'recomendaciones' }))}
                    className={`text-xs px-3 py-1.5 border-b-2 transition-all font-medium flex items-center gap-1 ${activeTab[dia.id] === 'recomendaciones' ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-[#9CA3AF]'}`}>
                    <Utensils size={11} /> Donde comer
                    {dia.recomendaciones.length > 0 && <span className="bg-[#EDE9FE] text-[#7C3AED] text-[9px] px-1.5 py-0.5 rounded-full">{dia.recomendaciones.length}</span>}
                  </button>
                </div>

                {activeTab[dia.id] === 'actividades' ? (
                  <div className="space-y-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, dia.id)}>
                      <SortableContext items={dia.actividades.map(a => a.id)} strategy={verticalListSortingStrategy}>
                        {dia.actividades.map(act => (
                          <SortableActividad
                            key={act.id}
                            act={act}
                            diaId={dia.id}
                            editingAct={editingAct}
                            editActForm={editActForm}
                            setEditActForm={setEditActForm}
                            startEditAct={startEditAct}
                            saveEditAct={saveEditAct}
                            deleteActividad={deleteActividad}
                            mapsLoaded={mapsLoaded}
                            setEditingAct={setEditingAct}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
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
                            {mapsLoaded
                              ? <UbicacionInput value={actForm.ubicacion} onChange={v => setActForm(f => ({ ...f, ubicacion: v }))} />
                              : <input className="input" placeholder="Ej: Coliseo, Roma" value={actForm.ubicacion} onChange={e => setActForm(f => ({ ...f, ubicacion: e.target.value }))} />
                            }
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
                    {dia.recomendaciones.length === 0 && <p className="text-xs text-[#9CA3AF] italic py-2">Sin recomendaciones.</p>}
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
                            {mapsLoaded
                              ? <UbicacionInput value={recoForm.ubicacion} onChange={v => setRecoForm(f => ({ ...f, ubicacion: v }))} placeholder="Via Roma 123, Roma" />
                              : <input className="input" placeholder="Via Roma 123, Roma" value={recoForm.ubicacion} onChange={e => setRecoForm(f => ({ ...f, ubicacion: e.target.value }))} />
                            }
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
        </div>
      ))}
    </div>
  )
}

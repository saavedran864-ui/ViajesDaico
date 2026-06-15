'use client'
import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, MapPin, Clock, Navigation, Plane, Car, Train, PersonStanding, Bike, Ship, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

declare global { interface Window { google: any; initRoadMap: () => void } }

interface Tramo {
  id: string
  origen: string
  destino: string
  modo: string
  distancia_km: number | null
  tiempo_min: number | null
  dia_id: string | null
  orden: number
}

interface Dia {
  id: string
  fecha: string
  titulo: string | null
  ciudad: string | null
}

const MODOS = [
  { value: 'auto',      label: 'Auto',      icon: Car },
  { value: 'avion',     label: 'Avion',     icon: Plane },
  { value: 'tren',      label: 'Tren',      icon: Train },
  { value: 'caminando', label: 'Caminando', icon: PersonStanding },
  { value: 'bici',      label: 'Bici',      icon: Bike },
  { value: 'barco',     label: 'Barco',     icon: Ship },
]

function LugarInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autoRef = useRef<any>(null)

  useEffect(() => {
    if (!inputRef.current || autoRef.current) return
    const tryInit = () => {
      if (!window.google) return false
      autoRef.current = new window.google.maps.places.Autocomplete(inputRef.current!, { types: ['geocode', 'establishment'] })
      autoRef.current.addListener('place_changed', () => {
        const place = autoRef.current.getPlace()
        onChange(place?.formatted_address || place?.name || '')
      })
      return true
    }
    if (!tryInit()) {
      const interval = setInterval(() => { if (tryInit()) clearInterval(interval) }, 500)
      return () => clearInterval(interval)
    }
  }, [])

  return <input ref={inputRef} className="input" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
}

export default function RoadTripPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [viajeId, setViajeId] = useState('')
  const [tramos, setTramos] = useState<Tramo[]>([])
  const [dias, setDias] = useState<Dia[]>([])
  const [calculando, setCalculando] = useState(false)
  const [consumo, setConsumo] = useState('8')
  const [precio, setPrecio] = useState('1.5')
  const mapRef = useRef<HTMLDivElement>(null)
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => { setViajeId(p.id); loadData(p.id) })
  }, [])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey || window.google) return
    window.initRoadMap = () => {}
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (!existing) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initRoadMap`
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  async function loadData(id: string) {
    const [{ data: tramosData }, { data: diasData }] = await Promise.all([
      supabase.from('road_trip_tramos').select('*').eq('viaje_id', id).order('orden'),
      supabase.from('dias').select('id,fecha,titulo,ciudad').eq('viaje_id', id).order('fecha'),
    ])
    setTramos(tramosData ?? [])
    setDias(diasData ?? [])
    setLoading(false)
  }

  async function addTramo() {
    const ultimo = tramos[tramos.length - 1]
    const { data } = await supabase.from('road_trip_tramos').insert({
      viaje_id: viajeId,
      origen: ultimo?.destino ?? '',
      destino: '',
      modo: 'auto',
      distancia_km: null,
      tiempo_min: null,
      dia_id: null,
      orden: tramos.length,
    }).select().single()
    if (data) setTramos(t => [...t, data])
  }

  async function removeTramo(id: string) {
    await supabase.from('road_trip_tramos').delete().eq('id', id)
    setTramos(t => t.filter(x => x.id !== id))
  }

  async function updateTramo(id: string, changes: Partial<Tramo>) {
    setTramos(t => t.map(x => x.id === id ? { ...x, ...changes } : x))
    await supabase.from('road_trip_tramos').update(changes).eq('id', id)
  }

  async function calcularTramo(tramo: Tramo) {
    if (!tramo.origen || !tramo.destino || !window.google) return
    if (tramo.modo !== 'auto' && tramo.modo !== 'tren') {
      const geocoder = new window.google.maps.Geocoder()
      const [r1, r2] = await Promise.all([
        new Promise<any>(res => geocoder.geocode({ address: tramo.origen }, (r: any) => res(r?.[0]))),
        new Promise<any>(res => geocoder.geocode({ address: tramo.destino }, (r: any) => res(r?.[0]))),
      ])
      if (r1 && r2) {
        const lat1 = r1.geometry.location.lat(); const lng1 = r1.geometry.location.lng()
        const lat2 = r2.geometry.location.lat(); const lng2 = r2.geometry.location.lng()
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2
        const km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
        const velocidades: Record<string, number> = { avion: 800, barco: 30, bici: 20, caminando: 5 }
        const vel = velocidades[tramo.modo] ?? 50
        const min = Math.round((km / vel) * 60)
        await updateTramo(tramo.id, { distancia_km: km, tiempo_min: min })
      }
      return
    }
    const service = new window.google.maps.DirectionsService()
    service.route({
      origin: tramo.origen,
      destination: tramo.destino,
      travelMode: tramo.modo === 'tren' ? window.google.maps.TravelMode.TRANSIT : window.google.maps.TravelMode.DRIVING,
    }, async (result: any, status: any) => {
      if (status === 'OK') {
        const leg = result.routes[0].legs[0]
        await updateTramo(tramo.id, {
          distancia_km: Math.round(leg.distance.value / 1000),
          tiempo_min: Math.round(leg.duration.value / 60),
        })
      }
    })
  }

  async function calcularTodos() {
    setCalculando(true)
    for (const tramo of tramos) {
      await calcularTramo(tramo)
      await new Promise(r => setTimeout(r, 300))
    }
    setCalculando(false)
    if (showMap) renderMapa()
  }

  async function sincronizarConItinerario() {
    for (const tramo of tramos) {
      if (!tramo.dia_id || !tramo.distancia_km) continue
      await supabase.from('dias').update({
        ciudad: tramo.destino,
        distancia_desde_anterior: tramo.distancia_km,
        tiempo_desde_anterior: tramo.tiempo_min,
        modo_transporte: tramo.modo,
      }).eq('id', tramo.dia_id)
    }
    alert('Sincronizado con el itinerario!')
  }

  function renderMapa() {
    if (!mapRef.current || !window.google) return
    const map = new window.google.maps.Map(mapRef.current, { zoom: 5, center: { lat: 41.9, lng: 12.5 }, mapTypeControl: false })
    const tramosAuto = tramos.filter(t => t.modo === 'auto' && t.origen && t.destino)
    if (tramosAuto.length > 0) {
      const service = new window.google.maps.DirectionsService()
      const waypoints = tramosAuto.slice(1, -1).map(t => ({ location: t.origen, stopover: true }))
      service.route({
        origin: tramosAuto[0].origen,
        destination: tramosAuto[tramosAuto.length - 1].destino,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result: any, status: any) => {
        if (status === 'OK') new window.google.maps.DirectionsRenderer({ map }).setDirections(result)
      })
    }
  }

  function abrirEnMaps() {
    const lugares = [...new Set(tramos.flatMap(t => [t.origen, t.destino]).filter(Boolean))]
    if (lugares.length < 2) return
    window.open(`https://www.google.com/maps/dir/${lugares.map(encodeURIComponent).join('/')}`, '_blank')
  }

  const totalKm = tramos.reduce((a, t) => a + (t.distancia_km ?? 0), 0)
  const totalMin = tramos.reduce((a, t) => a + (t.tiempo_min ?? 0), 0)
  const kmAuto = tramos.filter(t => t.modo === 'auto').reduce((a, t) => a + (t.distancia_km ?? 0), 0)
  const litros = (kmAuto * parseFloat(consumo || '0')) / 100
  const costoCombustible = litros * parseFloat(precio || '0')
  const horas = Math.floor(totalMin / 60)
  const minutos = totalMin % 60

  if (loading) return <div className="text-[#6B7280] text-sm">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1D23]">Road Trip Planner</h2>
          <p className="text-[#6B7280] text-sm mt-1">Planifica cada tramo con su modo de transporte</p>
        </div>
        <div className="flex gap-2">
          <button onClick={abrirEnMaps} className="btn-secondary"><Navigation size={14} /> Maps</button>
          <button onClick={() => { setShowMap(s => !s); if (!showMap) setTimeout(renderMapa, 200) }} className="btn-secondary">
            <MapPin size={14} /> {showMap ? 'Ocultar mapa' : 'Ver mapa'}
          </button>
        </div>
      </div>

      {showMap && (
        <div className="card p-0 overflow-hidden">
          <div ref={mapRef} className="w-full h-64" />
        </div>
      )}

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#1A1D23]">Tramos del recorrido</h3>
          <button onClick={addTramo} className="flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#6D28D9] font-medium">
            <Plus size={13} /> Agregar tramo
          </button>
        </div>

        {tramos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#9CA3AF] text-sm mb-3">No hay tramos todavia</p>
            <button onClick={addTramo} className="btn-primary"><Plus size={14} /> Agregar primer tramo</button>
          </div>
        )}

        {tramos.map((tramo, idx) => {
          const ModoIcon = MODOS.find(m => m.value === tramo.modo)?.icon ?? Car
          return (
            <div key={tramo.id} className="border border-[#E8E9EC] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#7C3AED] bg-[#EDE9FE] px-2 py-0.5 rounded-full">Tramo {idx + 1}</span>
                  <ModoIcon size={14} className="text-[#6B7280]" />
                </div>
                <button onClick={() => removeTramo(tramo.id)} className="text-[#9CA3AF] hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Origen</label>
                  <LugarInput value={tramo.origen} onChange={v => updateTramo(tramo.id, { origen: v })} placeholder="Ciudad de origen" />
                </div>
                <div>
                  <label className="label">Destino</label>
                  <LugarInput value={tramo.destino} onChange={v => updateTramo(tramo.id, { destino: v })} placeholder="Ciudad de destino" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Modo de transporte</label>
                  <select className="select" value={tramo.modo} onChange={e => updateTramo(tramo.id, { modo: e.target.value })}>
                    {MODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Dia del itinerario (destino)</label>
                  <select className="select" value={tramo.dia_id ?? ''} onChange={e => updateTramo(tramo.id, { dia_id: e.target.value || null })}>
                    <option value="">Sin asociar</option>
                    {dias.map(d => (
                      <option key={d.id} value={d.id}>{d.ciudad || d.titulo || d.fecha}</option>
                    ))}
                  </select>
                </div>
              </div>

              {tramo.distancia_km !== null && (
                <div className="flex gap-3 pt-1">
                  <span className="flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F4F5F7] rounded-lg px-3 py-1.5">
                    <MapPin size={11} className="text-[#7C3AED]" /> {tramo.distancia_km} km
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F4F5F7] rounded-lg px-3 py-1.5">
                    <Clock size={11} className="text-[#7C3AED]" /> {Math.floor((tramo.tiempo_min ?? 0) / 60)}h {(tramo.tiempo_min ?? 0) % 60}m
                  </span>
                </div>
              )}
            </div>
          )
        })}

        {tramos.length > 0 && (
          <div className="flex gap-3 pt-2">
            <button onClick={calcularTodos} disabled={calculando} className="btn-primary flex-1 justify-center">
              {calculando ? 'Calculando...' : 'Calcular todos los tramos'}
            </button>
            <button onClick={sincronizarConItinerario} className="btn-secondary px-4">
              Sincronizar con itinerario
            </button>
          </div>
        )}
      </div>

      {totalKm > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-[#1A1D23] mb-4">Resumen del viaje</h3>
          <div className="space-y-2 mb-4">
            {tramos.map((tramo, idx) => {
              const ModoIcon = MODOS.find(m => m.value === tramo.modo)?.icon ?? Car
              return (
                <div key={tramo.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-[#7C3AED]'}`} />
                    {idx < tramos.length - 1 && <div className="w-px h-5 bg-[#E8E9EC]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-[#1A1D23]">{tramo.origen}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                    <ModoIcon size={12} className="text-[#7C3AED]" />
                    <span>{tramo.distancia_km ? `${tramo.distancia_km} km` : '—'}</span>
                    <ChevronRight size={11} />
                    <span>{tramo.destino}</span>
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <p className="text-xs font-medium text-[#1A1D23]">{tramos[tramos.length - 1]?.destino}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-[#E8E9EC] pt-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-[#1A1D23]">{totalKm} km</p>
              <p className="text-xs text-[#6B7280]">Distancia total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#1A1D23]">{horas}h {minutos}m</p>
              <p className="text-xs text-[#6B7280]">Tiempo total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#1A1D23]">{litros.toFixed(1)}L</p>
              <p className="text-xs text-[#6B7280]">Combustible auto</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="label">Consumo auto (L/100km)</label>
              <input className="input" type="number" step="0.1" value={consumo} onChange={e => setConsumo(e.target.value)} />
            </div>
            <div>
              <label className="label">Precio combustible</label>
              <input className="input" type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} />
            </div>
          </div>
          {costoCombustible > 0 && (
            <p className="text-sm text-center text-[#6B7280] mt-3">
              Costo estimado combustible: <span className="font-semibold text-[#1A1D23]">${costoCombustible.toFixed(2)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

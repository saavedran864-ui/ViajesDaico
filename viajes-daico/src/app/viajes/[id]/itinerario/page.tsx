'use client'
import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, MapPin, Clock, Fuel, Navigation } from 'lucide-react'

declare global { interface Window { google: any; initRoadMap: () => void } }

interface Parada {
  id: string
  nombre: string
  distancia_km: number | null
  tiempo_min: number | null
}

function LugarInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autoRef = useRef<any>(null)

  useEffect(() => {
    if (!inputRef.current || !window.google || autoRef.current) return
    autoRef.current = new window.google.maps.places.Autocomplete(inputRef.current, { types: ['geocode', 'establishment'] })
    autoRef.current.addListener('place_changed', () => {
      const place = autoRef.current.getPlace()
      if (place?.formatted_address) onChange(place.formatted_address)
      else if (place?.name) onChange(place.name)
    })
  }, [window.google])

  return (
    <input ref={inputRef} className="input" placeholder={placeholder}
      value={value} onChange={e => onChange(e.target.value)} />
  )
}

export default function RoadTripPage() {
  const [paradas, setParadas] = useState<Parada[]>([
    { id: '1', nombre: '', distancia_km: null, tiempo_min: null },
    { id: '2', nombre: '', distancia_km: null, tiempo_min: null },
  ])
  const [consumo, setConsumo] = useState('8')
  const [precioCombustible, setPrecioCombustible] = useState('1.5')
  const [calculando, setCalculando] = useState(false)
  const [calculado, setCalculado] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
    if (!apiKey) return
    if (window.google) { setMapsLoaded(true); return }
    window.initRoadMap = () => setMapsLoaded(true)
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initRoadMap`
    script.async = true
    document.head.appendChild(script)
  }, [])

  function addParada() {
    const nueva = { id: Date.now().toString(), nombre: '', distancia_km: null, tiempo_min: null }
    setParadas(p => {
      const arr = [...p]
      arr.splice(arr.length - 1, 0, nueva)
      return arr
    })
  }

  function removeParada(id: string) {
    if (paradas.length <= 2) return
    setParadas(p => p.filter(x => x.id !== id))
  }

  function updateNombre(id: string, nombre: string) {
    setParadas(p => p.map(x => x.id === id ? { ...x, nombre } : x))
    setCalculado(false)
  }

  async function calcular() {
    const lugares = paradas.map(p => p.nombre).filter(Boolean)
    if (lugares.length < 2) return
    if (!window.google) return
    setCalculando(true)

    const service = new window.google.maps.DirectionsService()
    const waypoints = lugares.slice(1, -1).map((loc: string) => ({ location: loc, stopover: true }))

    service.route({
      origin: lugares[0],
      destination: lugares[lugares.length - 1],
      waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result: any, status: any) => {
      if (status === 'OK') {
        const legs = result.routes[0].legs
        const nuevasParadas = [...paradas]
        legs.forEach((leg: any, idx: number) => {
          nuevasParadas[idx + 1] = {
            ...nuevasParadas[idx + 1],
            distancia_km: Math.round(leg.distance.value / 1000),
            tiempo_min: Math.round(leg.duration.value / 60),
          }
        })
        setParadas(nuevasParadas)
        setCalculado(true)

        if (mapRef.current) {
          const map = new window.google.maps.Map(mapRef.current, { mapTypeControl: false, streetViewControl: false })
          const renderer = new window.google.maps.DirectionsRenderer()
          renderer.setMap(map)
          renderer.setDirections(result)
        }
      }
      setCalculando(false)
    })
  }

  function abrirEnMaps() {
    const lugares = paradas.map(p => p.nombre).filter(Boolean)
    if (lugares.length < 2) return
    const origin = encodeURIComponent(lugares[0])
    const destination = encodeURIComponent(lugares[lugares.length - 1])
    const waypoints = lugares.slice(1, -1).map(encodeURIComponent).join('|')
    const url = waypoints
      ? `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}`
      : `https://www.google.com/maps/dir/${origin}/${destination}`
    window.open(url, '_blank')
  }

  const totalKm = paradas.slice(1).reduce((a, p) => a + (p.distancia_km ?? 0), 0)
  const totalMin = paradas.slice(1).reduce((a, p) => a + (p.tiempo_min ?? 0), 0)
  const litros = (totalKm * parseFloat(consumo || '0')) / 100
  const costoCombustible = litros * parseFloat(precioCombustible || '0')
  const horas = Math.floor(totalMin / 60)
  const minutos = totalMin % 60

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1D23]">Road Trip Planner</h2>
          <p className="text-[#6B7280] text-sm mt-1">Ingresa las paradas y calculamos distancias automaticamente</p>
        </div>
        <button onClick={abrirEnMaps} className="btn-secondary">
          <Navigation size={14} /> Abrir en Maps
        </button>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-medium text-[#1A1D23] mb-2">Paradas del recorrido</h3>
        {paradas.map((parada, idx) => (
          <div key={parada.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-0.5 shrink-0 w-6">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                idx === 0 ? 'bg-green-100 text-green-700' :
                idx === paradas.length - 1 ? 'bg-red-100 text-red-700' :
                'bg-[#EDE9FE] text-[#7C3AED]'
              }`}>
                {idx === 0 ? 'A' : idx === paradas.length - 1 ? 'B' : idx}
              </div>
              {idx < paradas.length - 1 && <div className="w-px h-4 bg-[#E8E9EC]" />}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="col-span-3">
                {mapsLoaded
                  ? <LugarInput value={parada.nombre} onChange={v => updateNombre(parada.id, v)}
                      placeholder={idx === 0 ? 'Ciudad de origen' : idx === paradas.length - 1 ? 'Ciudad de destino' : `Parada ${idx}`} />
                  : <input className="input" placeholder={idx === 0 ? 'Ciudad de origen' : idx === paradas.length - 1 ? 'Ciudad de destino' : `Parada ${idx}`}
                      value={parada.nombre} onChange={e => updateNombre(parada.id, e.target.value)} />
                }
              </div>
              {idx > 0 && parada.distancia_km !== null && (
                <div className="col-span-3 flex gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F4F5F7] rounded-lg px-3 py-1.5">
                    <MapPin size={11} className="text-[#7C3AED]" /> {parada.distancia_km} km
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F4F5F7] rounded-lg px-3 py-1.5">
                    <Clock size={11} className="text-[#7C3AED]" /> {Math.floor((parada.tiempo_min ?? 0) / 60)}h {(parada.tiempo_min ?? 0) % 60}m
                  </div>
                </div>
              )}
            </div>
            {paradas.length > 2 && idx > 0 && idx < paradas.length - 1 && (
              <button onClick={() => removeParada(parada.id)} className="text-[#9CA3AF] hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        <button onClick={addParada} className="flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-[#7C3AED] transition-colors mt-1">
          <Plus size={13} /> Agregar parada intermedia
        </button>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-[#1A1D23] mb-3">Datos del vehiculo</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Consumo (litros/100km)</label>
            <input className="input" type="number" step="0.1" value={consumo} onChange={e => setConsumo(e.target.value)} />
          </div>
          <div>
            <label className="label">Precio combustible (por litro)</label>
            <input className="input" type="number" step="0.01" value={precioCombustible} onChange={e => setPrecioCombustible(e.target.value)} />
          </div>
        </div>
        <button onClick={calcular} disabled={calculando} className="btn-primary">
          {calculando ? 'Calculando...' : 'Calcular ruta'}
        </button>
      </div>

      {calculado && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <MapPin size={18} className="text-[#7C3AED] mx-auto mb-2" />
              <p className="text-xl font-semibold text-[#1A1D23]">{totalKm} km</p>
              <p className="text-xs text-[#6B7280] mt-1">Distancia total</p>
            </div>
            <div className="card text-center">
              <Clock size={18} className="text-[#7C3AED] mx-auto mb-2" />
              <p className="text-xl font-semibold text-[#1A1D23]">{horas}h {minutos}m</p>
              <p className="text-xs text-[#6B7280] mt-1">Tiempo estimado</p>
            </div>
            <div className="card text-center">
              <Fuel size={18} className="text-[#7C3AED] mx-auto mb-2" />
              <p className="text-xl font-semibold text-[#1A1D23]">${costoCombustible.toFixed(2)}</p>
              <p className="text-xs text-[#6B7280] mt-1">{litros.toFixed(1)}L combustible</p>
            </div>
          </div>
          <div className="card p-0 overflow-hidden">
            <div ref={mapRef} className="w-full h-64" />
          </div>
        </>
      )}
    </div>
  )
}

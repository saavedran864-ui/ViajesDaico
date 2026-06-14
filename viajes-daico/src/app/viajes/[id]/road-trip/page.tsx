'use client'
import { useState } from 'react'
import { Plus, Trash2, MapPin, Clock, Fuel, Navigation } from 'lucide-react'

interface Parada {
  id: string
  nombre: string
  distancia_km: number | null
  tiempo_min: number | null
}

export default function RoadTripPage({ params }: { params: Promise<{ id: string }> }) {
  const [paradas, setParadas] = useState<Parada[]>([
    { id: '1', nombre: '', distancia_km: null, tiempo_min: null },
    { id: '2', nombre: '', distancia_km: null, tiempo_min: null },
  ])
  const [consumo, setConsumo] = useState('8')
  const [precioCombustible, setPrecioCombustible] = useState('1.5')
  const [calculado, setCalculado] = useState(false)

  function addParada() {
    setParadas(p => [...p, { id: Date.now().toString(), nombre: '', distancia_km: null, tiempo_min: null }])
  }

  function removeParada(id: string) {
    if (paradas.length <= 2) return
    setParadas(p => p.filter(x => x.id !== id))
  }

  function updateNombre(id: string, nombre: string) {
    setParadas(p => p.map(x => x.id === id ? { ...x, nombre } : x))
    setCalculado(false)
  }

  function updateDistancia(id: string, val: string) {
    setParadas(p => p.map(x => x.id === id ? { ...x, distancia_km: val ? parseFloat(val) : null } : x))
  }

  function updateTiempo(id: string, val: string) {
    setParadas(p => p.map(x => x.id === id ? { ...x, tiempo_min: val ? parseInt(val) : null } : x))
  }

  function calcular() {
    setCalculado(true)
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
          <h2 className="text-xl font-serif font-normal text-nude-900">Road Trip Planner</h2>
          <p className="text-nude-500 text-sm mt-1">Ingresá las paradas y calculá distancias y costos</p>
        </div>
        <button onClick={abrirEnMaps} className="btn-secondary flex items-center gap-2">
          <Navigation size={14} /> Abrir en Maps
        </button>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-medium text-nude-900 mb-1">Paradas del recorrido</h3>
        {paradas.map((parada, idx) => (
          <div key={parada.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                idx === 0 ? 'bg-green-100 text-green-700' :
                idx === paradas.length - 1 ? 'bg-red-100 text-red-700' :
                'bg-nude-200 text-nude-600'
              }`}>
                {idx === 0 ? '●' : idx === paradas.length - 1 ? '■' : idx}
              </div>
              {idx < paradas.length - 1 && <div className="w-0.5 h-3 bg-nude-300" />}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2">
              <input className="input col-span-1" placeholder={idx === 0 ? 'Origen' : idx === paradas.length - 1 ? 'Destino' : `Parada ${idx}`}
                value={parada.nombre} onChange={e => updateNombre(parada.id, e.target.value)} />
              {idx > 0 && (
                <>
                  <input className="input" type="number" placeholder="km"
                    value={parada.distancia_km ?? ''} onChange={e => updateDistancia(parada.id, e.target.value)} />
                  <input className="input" type="number" placeholder="min"
                    value={parada.tiempo_min ?? ''} onChange={e => updateTiempo(parada.id, e.target.value)} />
                </>
              )}
              {idx === 0 && <div className="col-span-2 flex items-center text-xs text-nude-400 pl-2">distancia (km) · tiempo (min)</div>}
            </div>
            {paradas.length > 2 && idx > 0 && idx < paradas.length - 1 && (
              <button onClick={() => removeParada(parada.id)} className="text-nude-400 hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        <button onClick={addParada} className="flex items-center gap-2 text-xs text-nude-400 hover:text-accent transition-colors">
          <Plus size={13} /> Agregar parada intermedia
        </button>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-nude-900 mb-3">Datos del vehículo</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Consumo (litros/100km)</label>
            <input className="input" type="number" step="0.1" value={consumo} onChange={e => setConsumo(e.target.value)} />
          </div>
          <div>
            <label className="label">Precio combustible (por litro)</label>
            <input className="input" type="number" step="0.01" value={precioCombustible} onChange={e => setPrecioCombustible(e.target.value)} />
          </div>
        </div>
        <button onClick={calcular} className="btn-primary mt-4">Calcular</button>
      </div>

      {calculado && totalKm > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <MapPin size={18} className="text-accent mx-auto mb-2" />
            <p className="text-xl font-medium text-nude-900">{totalKm.toFixed(0)} km</p>
            <p className="text-xs text-nude-500 mt-1">Distancia total</p>
          </div>
          <div className="card text-center">
            <Clock size={18} className="text-accent mx-auto mb-2" />
            <p className="text-xl font-medium text-nude-900">{horas}h {minutos}m</p>
            <p className="text-xs text-nude-500 mt-1">Tiempo estimado</p>
          </div>
          <div className="card text-center">
            <Fuel size={18} className="text-accent mx-auto mb-2" />
            <p className="text-xl font-medium text-nude-900">${costoCombustible.toFixed(2)}</p>
            <p className="text-xs text-nude-500 mt-1">{litros.toFixed(1)}L combustible</p>
          </div>
        </div>
      )}
    </div>
  )
}

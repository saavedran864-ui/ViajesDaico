'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User } from 'lucide-react'

interface Mensaje {
  rol: 'user' | 'assistant'
  contenido: string
}

const SUGERENCIAS = [
  '¿Qué debo llevar en mi maleta para un viaje a Europa?',
  'Creame un itinerario de 7 días por Italia',
  '¿Cuáles son los mejores consejos para viajar con poco presupuesto?',
  '¿Qué documentos necesito para viajar a Europa desde Argentina?',
]

export default function IAPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar(texto?: string) {
    const msg = texto ?? input.trim()
    if (!msg || loading) return
    setInput('')
    const nuevosMensajes: Mensaje[] = [...mensajes, { rol: 'user', contenido: msg }]
    setMensajes(nuevosMensajes)
    setLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: 'Sos un asistente experto en viajes y planificacion de viajes. Ayudas a los usuarios a planificar itinerarios, dar consejos de viaje, informacion sobre destinos, presupuestos y todo lo relacionado con viajes. Respondé siempre en español de Argentina, de forma amigable y concisa.',
          messages: nuevosMensajes.map(m => ({ role: m.rol, content: m.contenido })),
        }),
      })
      const data = await response.json()
      const respuesta = data.content?.[0]?.text ?? 'No pude generar una respuesta.'
      setMensajes(m => [...m, { rol: 'assistant', contenido: respuesta }])
    } catch {
      setMensajes(m => [...m, { rol: 'assistant', contenido: 'Hubo un error al conectar con la IA. Intentá de nuevo.' }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-180px)]">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-[#1A1D23]">Asistente IA</h1>
        <p className="text-[#6B7280] text-xs mt-0.5">Preguntame sobre destinos, itinerarios, consejos de viaje y mas.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {mensajes.length === 0 && (
          <div className="space-y-3">
            <div className="card text-center py-8">
              <Sparkles size={32} className="text-[#7C3AED] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1A1D23]">Asistente de viajes con IA</p>
              <p className="text-xs text-[#6B7280] mt-1">Haceme cualquier pregunta sobre tu viaje</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SUGERENCIAS.map((s, i) => (
                <button key={i} onClick={() => enviar(s)}
                  className="card p-3 text-left hover:shadow-md transition-all text-xs text-[#1A1D23] hover:text-[#7C3AED]">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.rol === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#EDE9FE] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={13} className="text-[#7C3AED]" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.rol === 'user'
                ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                : 'bg-white border border-[#E8E9EC] text-[#1A1D23] rounded-tl-sm shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap text-xs">{msg.contenido}</p>
            </div>
            {msg.rol === 'user' && (
              <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-[#EDE9FE] flex items-center justify-center shrink-0">
              <Sparkles size={13} className="text-[#7C3AED]" />
            </div>
            <div className="bg-white border border-[#E8E9EC] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-[#E8E9EC]">
        <input
          className="input flex-1 text-sm"
          placeholder="Preguntame sobre tu viaje..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
          disabled={loading}
        />
        <button onClick={() => enviar()} disabled={loading || !input.trim()}
          className="btn-primary px-3 py-2 disabled:opacity-50">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

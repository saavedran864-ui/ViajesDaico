import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const lastMessage = messages[messages.length - 1].content
  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: 'Sos un asistente experto en viajes y planificacion de viajes. Ayudas a los usuarios a planificar itinerarios, dar consejos de viaje, informacion sobre destinos, presupuestos y todo lo relacionado con viajes. Respondé siempre en español de Argentina, de forma amigable y concisa.' }]
          },
          contents: [
            ...history,
            { role: 'user', parts: [{ text: lastMessage }] }
          ],
          generationConfig: { maxOutputTokens: 1000 },
        }),
      }
    )

    const data = await response.json()
    console.log('Gemini response:', JSON.stringify(data))
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? data?.error?.message
      ?? 'No pude generar una respuesta.'

    return NextResponse.json({ content: [{ text }] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ content: [{ text: 'Error al conectar con la IA.' }] })
  }
}

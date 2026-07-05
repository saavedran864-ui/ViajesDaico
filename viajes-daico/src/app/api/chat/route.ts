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
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...history,
            { role: 'user', parts: [{ text: 'Sos un asistente experto en viajes. Respondé en español de Argentina. ' + lastMessage }] }
          ],
          generationConfig: { maxOutputTokens: 1000 },
        }),
      }
    )

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? data?.error?.message
      ?? 'No pude generar una respuesta.'

    return NextResponse.json({ content: [{ text }] })
  } catch (error) {
    return NextResponse.json({ content: [{ text: 'Error al conectar con la IA.' }] })
  }
}

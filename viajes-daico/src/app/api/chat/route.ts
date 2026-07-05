import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
  )
  const data = await response.json()
  return NextResponse.json(data)
}

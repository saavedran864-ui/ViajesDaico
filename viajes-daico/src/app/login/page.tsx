'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEntrar() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-[#1A1D23]">
            Viajes <span className="text-[#7C3AED]">DaiCo</span>
          </h1>
          <p className="text-[#6B7280] text-sm mt-2">Tu segundo cerebro para viajeros</p>
        </div>

        <div className="card">
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            onClick={handleEntrar}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#7C3AED] text-white text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

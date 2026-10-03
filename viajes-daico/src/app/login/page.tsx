'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
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
          <h2 className="text-lg font-medium text-[#1A1D23] mb-5">Iniciar sesión</h2>

          {sent ? (
            <div className="text-sm text-[#1A1D23]">
              <p className="font-medium mb-1">Revisa tu correo ✉️</p>
              <p className="text-[#6B7280]">
                Te enviamos un enlace a <b>{email}</b>. Haz clic en él para entrar.
                Si no lo ves, mira en spam.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-[#7C3AED] mt-4"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email" required placeholder="Tu correo electrónico"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-[#7C3AED] text-white text-sm font-medium disabled:opacity-60"
              >
                {loading ? 'Enviando…' : 'Enviarme un enlace de acceso'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

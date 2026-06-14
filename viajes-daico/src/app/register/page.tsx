'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-nude-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-normal text-nude-900">Viajes <span className="text-accent">DaiCo</span></h1>
          <p className="text-nude-600 text-sm mt-2">Creá tu cuenta gratis</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-medium text-nude-900 mb-5">Registrarse</h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="label">Nombre</label>
              <input className="input" type="text" placeholder="Tu nombre"
                value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="tu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input className="input" type="password" placeholder="Mínimo 8 caracteres"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
          <p className="text-center text-xs text-nude-600 mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-accent hover:underline">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

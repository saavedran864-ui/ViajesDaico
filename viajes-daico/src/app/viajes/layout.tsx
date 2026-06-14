import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function ViajesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let userName = user.email?.split('@')[0] ?? 'Usuario'

  const { data } = await supabase
    .from('profiles')
    .select('nombre')
    .eq('id', user.id)
    .maybeSingle()

  const profile = data as { nombre: string | null } | null
  if (profile?.nombre) userName = profile.nombre

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={userName} />
      <main className="flex-1 overflow-y-auto bg-nude-100">{children}</main>
    </div>
  )
}

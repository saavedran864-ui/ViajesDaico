'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Briefcase, Bookmark, Sparkles, LogOut, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/viajes',     label: 'Mis viajes',  icon: Briefcase },
  { href: '/biblioteca', label: 'Biblioteca',  icon: Bookmark },
  { href: '/ia',         label: 'Asistente IA',icon: Sparkles },
]

interface SidebarProps { userName?: string }

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (collapsed) {
    return (
      <aside className="w-16 bg-white border-r border-[#E8E9EC] flex flex-col items-center py-4 gap-2 h-screen sticky top-0 shrink-0">
        <button onClick={() => setCollapsed(false)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#9CA3AF] hover:bg-[#F4F5F7] transition-colors mb-2">
          <ChevronRight size={16} />
        </button>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <div key={href} className="relative"
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}>
                <Link href={href}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl transition-all',
                    active
                      ? 'bg-[#7C3AED] text-white shadow-lg'
                      : 'text-[#6B7280] hover:bg-[#F4F5F7] hover:text-[#1A1D23]'
                  )}>
                  <Icon size={18} />
                </Link>
                {hovered === href && (
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#1A1D23] text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 pointer-events-none">
                    {label}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="relative"
          onMouseEnter={() => setHovered('user')}
          onMouseLeave={() => setHovered(null)}>
          <button onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center text-xs font-semibold text-white">
            {userName?.[0]?.toUpperCase() ?? 'U'}
          </button>
          {hovered === 'user' && (
            <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-[#1A1D23] text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 flex items-center gap-1.5">
              <LogOut size={11} /> Cerrar sesion
            </div>
          )}
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-52 bg-white border-r border-[#E8E9EC] flex flex-col h-screen sticky top-0 shrink-0">
      <div className="px-4 py-5 border-b border-[#E8E9EC] flex items-center justify-between">
        <div>
          <p className="text-[9px] tracking-[2px] text-[#9CA3AF] uppercase mb-0.5">tu segundo cerebro</p>
          <h1 className="text-base font-semibold text-[#1A1D23]">
            Viajes <span className="text-[#7C3AED]">DaiCo</span>
          </h1>
        </div>
        <button onClick={() => setCollapsed(true)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F4F5F7] transition-colors">
          <ChevronLeft size={14} />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all',
                active
                  ? 'bg-[#EDE9FE] text-[#7C3AED] font-medium'
                  : 'text-[#6B7280] hover:bg-[#F4F5F7] hover:text-[#1A1D23]'
              )}>
              <Icon size={16} className={active ? 'text-[#7C3AED]' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-[#E8E9EC]">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {userName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#1A1D23] truncate">{userName ?? 'Usuario'}</p>
          </div>
          <button onClick={handleLogout} className="text-[#9CA3AF] hover:text-[#1A1D23] transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

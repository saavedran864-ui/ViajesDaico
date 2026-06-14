'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Briefcase, Bookmark, Sparkles, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/viajes',     label: 'Mis viajes',   icon: Briefcase },
  { href: '/biblioteca', label: 'Biblioteca',   icon: Bookmark },
  { href: '/ia',         label: 'Asistente IA', icon: Sparkles },
]

interface SidebarProps { userName?: string }

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link href={href}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all border-2',
          collapsed ? 'justify-center px-2' : '',
          active
            ? 'bg-coral text-white border-white/20'
            : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'
        )}
        title={collapsed ? label : undefined}>
        <Icon size={16} />
        {!collapsed && label}
      </Link>
    )
  }

  return (
    <aside className={cn(
      'bg-navy-600 flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-200 border-r-2 border-navy-900',
      collapsed ? 'w-14' : 'w-56'
    )}>
      <div className={cn('px-4 py-5 border-b-2 border-white/10 flex items-center justify-between', collapsed && 'px-2 justify-center')}>
        {!collapsed && (
          <div>
            <p className="text-[9px] tracking-[3px] text-white/30 uppercase mb-1">tu segundo cerebro</p>
            <h1 className="text-xl font-display text-white uppercase tracking-wider">
              VIAJES <span className="text-coral">DAICO</span>
            </h1>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)}
          className="text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 shrink-0">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      <div className="p-2 border-t-2 border-white/10">
        <div className={cn('flex items-center gap-2.5 px-2 py-2 rounded-lg', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-coral border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {userName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white/75 truncate uppercase">{userName ?? 'Usuario'}</p>
              </div>
              <button onClick={handleLogout} className="text-white/30 hover:text-white transition-colors">
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

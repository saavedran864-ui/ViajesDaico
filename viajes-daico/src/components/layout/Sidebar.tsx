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
        className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
          collapsed ? 'justify-center px-2' : '',
          active ? 'bg-accent/20 text-nude-50' : 'text-nude-50/50 hover:text-nude-50/80 hover:bg-white/5'
        )}
        title={collapsed ? label : undefined}>
        <Icon size={15} className={active ? 'text-accent' : ''} />
        {!collapsed && label}
      </Link>
    )
  }

  return (
    <aside className={cn('bg-nude-900 flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-200',
      collapsed ? 'w-14' : 'w-52'
    )}>
      <div className={cn('px-5 py-6 border-b border-white/8 flex items-center justify-between', collapsed && 'px-2 justify-center')}>
        {!collapsed && (
          <div>
            <p className="text-[9px] tracking-[3px] text-white/25 uppercase mb-1">tu segundo cerebro</p>
            <h1 className="text-[17px] font-serif font-normal text-nude-50">Viajes <span className="text-accent">DaiCo</span></h1>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)}
          className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/5 shrink-0">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.href} {...item} />)}
      </nav>
      <div className="p-2 border-t border-white/8">
        <div className={cn('flex items-center gap-2.5 px-2 py-2 rounded-lg', collapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-nude-50 shrink-0">
            {userName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/75 truncate">{userName ?? 'Usuario'}</p>
              </div>
              <button onClick={handleLogout} className="text-white/30 hover:text-white/70 transition-colors">
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

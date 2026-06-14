'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Briefcase, Bookmark, CalendarDays,
  Ticket, Coins, CheckSquare, BookOpen, Route, Sparkles, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/viajes',      label: 'Mis viajes',   icon: Briefcase },
  { href: '/biblioteca',  label: 'Biblioteca',   icon: Bookmark },
]
const planItems = [
  { href: '/itinerarios', label: 'Itinerarios',  icon: CalendarDays },
  { href: '/reservas',    label: 'Reservas',     icon: Ticket },
  { href: '/gastos',      label: 'Gastos',       icon: Coins },
  { href: '/checklist',   label: 'Checklists',   icon: CheckSquare },
  { href: '/diario',      label: 'Diario',       icon: BookOpen },
]
const exploreItems = [
  { href: '/road-trip',   label: 'Road trips',   icon: Route },
  { href: '/ia',          label: 'Asistente IA', icon: Sparkles },
]

interface SidebarProps { userName?: string }

export default function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link href={href}
        className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
          active
            ? 'bg-accent/20 text-nude-50'
            : 'text-nude-50/50 hover:text-nude-50/80 hover:bg-white/5'
        )}>
        <Icon size={15} className={active ? 'text-accent' : ''} />
        {label}
      </Link>
    )
  }

  return (
    <aside className="w-52 bg-nude-900 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-white/8">
        <p className="text-[9px] tracking-[3px] text-white/25 uppercase mb-1">tu segundo cerebro</p>
        <h1 className="text-[17px] font-serif font-normal text-nude-50">
          Viajes <span className="text-accent">DaiCo</span>
        </h1>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.href} {...item} />)}
        <p className="text-[9px] tracking-[2.5px] text-white/20 uppercase px-3 pt-4 pb-1.5">Planificación</p>
        {planItems.map(item => <NavItem key={item.href} {...item} />)}
        <p className="text-[9px] tracking-[2.5px] text-white/20 uppercase px-3 pt-4 pb-1.5">Explorar</p>
        {exploreItems.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      <div className="p-3 border-t border-white/8">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-nude-50">
            {userName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/75 truncate">{userName ?? 'Usuario'}</p>
          </div>
          <button onClick={handleLogout} className="text-white/30 hover:text-white/70 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

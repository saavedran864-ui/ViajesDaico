'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Briefcase, Bookmark, Sparkles, LogOut, ChevronRight, ChevronLeft } from 'lucide-react'
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
  const [collapsed, setCollapsed] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = pathname === href || pathname.startsWith(href + '/')
    return (
      <div className="relative" onMouseEnter={() => setHovered(href)} onMouseLeave={() => setHovered(null)}>
        <Link href={href}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl transition-all',
            active
              ? 'bg-[#7C3AED] text-white shadow-[0_2px_8px_rgba(124,58,237,0.35)]'
              : 'text-[#6B7280] hover:bg-[#F4F5F7] hover:text-[#1A1D23]'
          )}>
          <Icon size={18} />
        </Link>
        {collapsed && hovered === href && (
          <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#1A1D23] text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 pointer-events-none">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1A1D23]" />
          </div>
        )}
      </div>
    )
  }

  if (collapsed) {
    return (
      <aside className="w-16 bg-white border-r border-[#E8E9EC] flex flex-col items-center py-4 gap-2 h-screen sticky top-0 shrink-0">
        <button onClick={() => setCollapsed(false)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#6B7280] hover:bg-[#F4F5F7] transition-colors mb-2">
          <ChevronRight size={16} />
        </button>
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => <NavItem key={item.href} {...item} />)}
        </nav>
        <div className="relative" onMouseEnter={() => setHovered('user')} onMouseLeave={() => setHovered(null)}>
          <button onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center text-xs font-semibold text-white">
            {userName?.[0]?.toUpperCase() ?? 'U'}
          </button>
          {hovered === 'user' && (
            <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#1A1D23]

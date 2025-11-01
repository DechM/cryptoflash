'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, AlertCircle, Crown, Trophy } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Zap },
    { href: '/alerts', label: 'Alerts', icon: AlertCircle },
    { href: '/bg-leaderboard', label: 'BG Leaderboard', icon: Trophy },
    { href: '/premium', label: 'Premium', icon: Crown },
  ]

  return (
    <nav className="glass sticky top-0 z-50 w-full border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-[#00ff88]" />
            <span className="text-xl font-bold gradient-text">PumpKing Sniper</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#00ff88]/20 text-[#00ff88] glow-green'
                      : 'text-[#b8c5d6] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-[#b8c5d6]">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}


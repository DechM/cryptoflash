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
    <nav className="glass sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-xl bg-[#0a0e27]/80">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Zap className="h-6 w-6 text-[#00ff88]" />
            <span className="text-xl font-bold gradient-text">CryptoFlash</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-5 py-2.5 rounded-lg transition-all font-medium min-w-[120px] text-center ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00ff88]/20 to-[#00d9ff]/20 text-[#00ff88] border border-[#00ff88]/30 shadow-lg shadow-[#00ff88]/20'
                      : 'text-[#b8c5d6] hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-[#b8c5d6] hover:text-white transition-colors p-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}


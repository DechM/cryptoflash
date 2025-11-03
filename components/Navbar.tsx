'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Zap, AlertCircle, Crown, Trophy, LogOut, User } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, loading: sessionLoading } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

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

            {/* Auth UI */}
            <div className="ml-4 relative">
              {sessionLoading ? (
                <div className="px-4 py-2 text-[#6b7280]">Loading...</div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <User className="h-4 w-4 text-[#00ff88]" />
                    <span className="text-sm text-white font-medium max-w-[150px] truncate">
                      {user.email}
                    </span>
                    <svg
                      className={`h-4 w-4 text-[#6b7280] transition-transform ${
                        showUserMenu ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 glass rounded-lg border border-white/10 overflow-hidden z-50">
                      <button
                        onClick={async () => {
                          await signOut()
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-left text-[#b8c5d6] hover:bg-white/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(pathname || '/dashboard')}`}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-semibold hover:opacity-90 transition-opacity"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu - Auth UI */}
          <div className="md:hidden flex items-center space-x-2">
            {!sessionLoading && !user && (
              <Link
                href={`/login?next=${encodeURIComponent(pathname || '/dashboard')}`}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black text-sm font-semibold"
              >
                Login
              </Link>
            )}
            {user && (
              <button
                onClick={async () => await signOut()}
                className="text-[#b8c5d6] hover:text-white transition-colors p-2"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
            <button className="text-[#b8c5d6] hover:text-white transition-colors p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}


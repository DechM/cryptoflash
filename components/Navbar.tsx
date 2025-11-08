'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Zap, AlertCircle, Crown, Trophy, Waves, ShieldCheck, LogOut, User, LogIn, Gauge } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { useState } from 'react'
import { isAdminEmail } from '@/lib/admin'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, loading: sessionLoading } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Zap },
    { href: '/alerts', label: 'Alerts', icon: AlertCircle },
    { href: '/alerts/whales', label: 'Whale Add-on', icon: ShieldCheck },
    { href: '/whale-alerts', label: 'Whales', icon: Waves },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/premium', label: 'Premium', icon: Crown },
  ]

  return (
    <nav className="glass sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-xl bg-[#0B1020]/80">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Zap className="h-6 w-6 text-[#00FFA3]" />
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
                  className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl transition-all duration-200 font-medium min-w-[100px] md:min-w-[120px] text-center text-sm md:text-base ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00FFA3]/20 to-[#00D1FF]/20 text-[#00FFA3] border border-[#00FFA3]/30 shadow-lg shadow-[#00FFA3]/20 hover:scale-105'
                      : 'text-[#b8c5d6] hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10 hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1.5 md:space-x-2">
                    <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}

            {isAdminEmail(user?.email) && (
              <Link
                href="/monitoring"
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl transition-all duration-200 font-medium min-w-[100px] md:min-w-[120px] text-center text-sm md:text-base ${
                  pathname === '/monitoring'
                    ? 'bg-gradient-to-r from-[#00FFA3]/20 to-[#00D1FF]/20 text-[#00FFA3] border border-[#00FFA3]/30 shadow-lg shadow-[#00FFA3]/20 hover:scale-105'
                    : 'text-[#b8c5d6] hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10 hover:scale-105'
                }`}
              >
                <div className="flex items-center justify-center space-x-1.5 md:space-x-2">
                  <Gauge className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span>Monitoring</span>
                </div>
              </Link>
            )}

            {/* Auth UI - integrated with nav items */}
            {sessionLoading ? (
              <div className="px-4 py-2 text-[#6b7280]">Loading...</div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl transition-all duration-200 font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-sm md:text-base"
                >
                  <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#00FFA3]" />
                  <span className="text-white font-medium max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <svg
                    className={`h-3.5 w-3.5 md:h-4 md:w-4 text-[#6b7280] transition-transform ${
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
                className="btn-cta-login px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base min-h-[44px]"
              >
                <LogIn className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center space-x-2">
            {!sessionLoading && !user && (
              <Link
                href={`/login?next=${encodeURIComponent(pathname || '/dashboard')}`}
                className="btn-cta-login"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Login</span>
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
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-[#b8c5d6] hover:text-white transition-colors p-2"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-white/10 bg-[#0B1020]/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
            {isAdminEmail(user?.email) && (
              <Link
                href="/monitoring"
                onClick={() => setShowMobileMenu(false)}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                  pathname === '/monitoring'
                    ? 'bg-gradient-to-r from-[#00FFA3]/20 to-[#00D1FF]/20 text-[#00FFA3] border border-[#00FFA3]/30'
                    : 'text-[#b8c5d6] hover:bg-white/10 hover:text-white'
                )}
              >
                <Gauge className="h-5 w-5" />
                <span className="font-medium">Monitoring</span>
              </Link>
            )}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#00FFA3]/20 to-[#00D1FF]/20 text-[#00FFA3] border border-[#00FFA3]/30'
                        : 'text-[#b8c5d6] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}


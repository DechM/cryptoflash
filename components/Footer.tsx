'use client'

import Link from 'next/link'
import { Zap, Twitter } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'CryptoFlash'

  return (
    <footer className="border-t border-white/10 bg-[#0B1020]/50 backdrop-blur-xl mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-6 w-6 text-[#00FFA3]" />
                <span className="text-xl font-bold gradient-text">{siteName}</span>
              </div>
              <p className="text-sm text-[#94A3B8] mb-4 max-w-md">
                The FIRST automated real-time KOTH tracker for Pump.fun. 
                Get early alerts at 69%+ progress and snipe winners before they moon.
              </p>
              {/* Social Links */}
              <div className="flex items-center space-x-4">
                <a
                  href="https://x.com/CryptoFlashGuru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#94A3B8] hover:text-[#00FFA3] transition-colors"
                  aria-label="Twitter/X"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/alerts" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Alerts
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/premium" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Premium
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC] mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Disclaimer
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-[#94A3B8] hover:text-[#00FFA3] transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-xs text-[#6b7280]">
                © {currentYear} {siteName}. All rights reserved.
              </p>
              <p className="text-xs text-[#6b7280]">
                Not financial advice. DYOR. Trade at your own risk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


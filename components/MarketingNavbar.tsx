import Link from "next/link"

const navLinks = [
  { href: "/koth-tracker", label: "KOTH Tracker" },
  { href: "/whale-alerts", label: "Whale Alerts" },
  { href: "/premium", label: "Premium" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
]

export function MarketingNavbar() {
  return (
    <nav className="glass sticky top-0 z-40 w-screen border-b border-white/10 backdrop-blur-xl bg-[#0B1020]/80">
      <div className="w-full px-4 md:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            prefetch={false}
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-bold gradient-text">CryptoFlash</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(item => (
              <Link
                key={item.href}
                prefetch={false}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#b8c5d6] hover:text-white hover:bg-white/10 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              prefetch={false}
              href="/login"
              className="text-sm font-medium text-[#b8c5d6] hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link prefetch={false} href="/premium" className="btn-cta-login px-4 py-2 rounded-xl text-sm">
              Get Started
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Link prefetch={false} href="/premium" className="btn-cta-login px-4 py-2 rounded-xl text-sm">
              Get Started
            </Link>
          </div>
        </div>

        <div className="md:hidden mt-2 flex overflow-x-auto gap-2 pb-1 px-2 no-scrollbar">
          {navLinks.map(item => (
            <Link
              key={item.href}
              prefetch={false}
              href={item.href}
              className="shrink-0 flex h-9 items-center justify-center rounded-full border border-white/18 bg-white/[0.08] px-4 text-xs font-medium tracking-wide text-white/90 whitespace-nowrap hover:bg-white/15 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}


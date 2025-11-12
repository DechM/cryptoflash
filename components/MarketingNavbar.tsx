import Link from "next/link";

const navLinks = [
  { href: "/koth-tracker", label: "KOTH Tracker" },
  { href: "/whale-alerts", label: "Whale Alerts" },
  { href: "/premium", label: "Premium" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function MarketingNavbar() {
  return (
    <nav className="glass sticky top-0 z-40 w-full border-b border-white/10 backdrop-blur-xl bg-[#0B1020]/80">
      <div className="w-full py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            prefetch={false}
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-bold gradient-text">CryptoFlash</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((item) => (
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
            <Link
              prefetch={false}
              href="/premium"
              className="btn-cta-login px-4 py-2 rounded-xl text-sm"
            >
              Get Started
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <Link
              prefetch={false}
              href="/premium"
              className="btn-cta-login px-4 py-2 rounded-xl text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="md:hidden mt-3 flex overflow-x-auto gap-2 pb-1">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              prefetch={false}
              href={item.href}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-[#b8c5d6] border border-white/10 whitespace-nowrap hover:text-white hover:border-white/30 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}


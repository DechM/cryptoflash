"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from "@/components/brand/Logo";
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/signals', label: 'Market Signals' },
  { href: '/predictions', label: 'Prediction Signals' },
  { href: '/news', label: 'AI Crypto Briefs' },
  { href: '/subscribe', label: 'Subscribe' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-3 sm:px-4">
        <Logo className="hidden md:flex" withText imgSize={30} />
        <Logo className="md:hidden" withText={false} imgSize={26} />

        <nav className="ml-auto flex items-center gap-3 sm:gap-5" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-1",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}


"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary" />
          <span className="text-sm font-semibold tracking-wide">CryptoFlash</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn('text-sm text-muted-foreground transition-colors hover:text-foreground')}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <a href="https://x.com" target="_blank" rel="noreferrer">Follow on X</a>
          </Button>
        </div>
      </div>
    </header>
  );
}


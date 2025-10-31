"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
  <div className="mx-auto flex h-14 max-w-7xl items-center px-3 sm:px-4">
    {/* Лого вляво */}
    <Logo className="hidden md:flex" withText imgSize={30} />
    <Logo className="md:hidden" withText={false} imgSize={26} />

    {/* Навигация вдясно */}
    <nav className="ml-auto flex items-center gap-3 sm:gap-5">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
      <Link href="/signals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Market Signals</Link>
      <Link href="/predictions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Prediction Signals</Link>
      <Link href="/briefs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Crypto Briefs</Link>
      <Link href="/subscribe" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Subscribe</Link>
      <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
    </nav>
  </div>
</header>
  );
}


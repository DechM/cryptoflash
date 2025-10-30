import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'CryptoFlash',
  description: 'AI-powered crypto insights, signals, and research.',
  metadataBase: new URL('https://cryptoflash.example'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Header />
          <main className="container mx-auto px-4 py-6 sm:py-8 md:py-10">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}


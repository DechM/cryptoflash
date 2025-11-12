import Script from 'next/script'
import Link from 'next/link'

import { MarketingNavbar } from '@/components/MarketingNavbar'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app').replace(/\/$/, '')

export const metadata = {
  title: 'CryptoFlash FAQ | Alerts, Discord, Billing',
  description: 'Answers to the most common CryptoFlash questions: KOTH alerts, Discord linking, Whale Alerts, billing and roadmap.',
  alternates: {
    canonical: `${siteUrl}/faq`,
  },
}

const faqs = [
  {
    question: 'What are KOTH alerts?',
    answer:
      'King of the Hill (KOTH) alerts trigger when a Pump.fun token crosses a configured AI Snipe Score threshold. Free fires at 95%, Pro at 85%, and Ultimate at 80%.',
  },
  {
    question: 'Do I need Discord to receive alerts?',
    answer: (
      <>
        Yes. Discord linking is required to receive CryptoFlash notifications. Go to{' '}
        <Link prefetch={false} href="/alerts" className="text-[#00FFA3] hover:underline">
          Alerts &gt; Manage
        </Link>{' '}
        and click “Link Discord” to authorise the CryptoFlash bot.
      </>
    ),
  },
  {
    question: 'How do Whale Alerts work?',
    answer:
      'Whale Alerts are bundled with the Ultimate plan. Once your subscription is active, the private Discord channel posts every $20K+ transfer together with curated X/Twitter updates.',
  },
  {
    question: 'How are payments handled?',
    answer: (
      <>
        Billing is processed through Solana Pay. On the{' '}
        <Link prefetch={false} href="/premium" className="text-[#00FFA3] hover:underline">
          Pricing
        </Link>{' '}
        page select a plan and follow the QR/Phantom flow. After confirmation you will land on the “Payment Successful” page.
      </>
    ),
  },
  {
    question: 'Can I export my data?',
    answer:
      'Both Pro and Ultimate support CSV export for dashboard data and alert history. Use the “Export” button in the KOTH dashboard section.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(item => ({
    '@type': 'Question',
    name: typeof item.question === 'string' ? item.question : '',
    acceptedAnswer: {
      '@type': 'Answer',
      text:
        typeof item.answer === 'string'
          ? item.answer
          : 'Link-rich answers are rendered on page; see CryptoFlash FAQ for full details.',
    },
  })),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
    { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${siteUrl}/faq` },
  ],
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <MarketingNavbar />

      <Script
        id="faq-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([faqSchema, breadcrumbSchema]) }}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <section className="space-y-4 text-center">
            <h1 className="text-3xl md:text-4xl font-heading text-white">CryptoFlash FAQ</h1>
            <p className="text-base md:text-lg text-[#b8c5d6]">
              Answers to the most common questions about KOTH alerts, Discord linking, Whale Alerts and billing.
              Need more help? Reach out via the{' '}
              <Link prefetch={false} href="/contact" className="text-[#00FFA3] hover:underline">
                contact form
              </Link>.
            </p>
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
            {faqs.map(item => (
              <div key={typeof item.question === 'string' ? item.question : ''} className="space-y-2">
                <h2 className="text-lg md:text-xl font-heading text-white">{item.question}</h2>
                <p className="text-sm md:text-base text-[#b8c5d6]">{item.answer}</p>
              </div>
            ))}
          </section>

          <section className="glass-card rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-lg md:text-xl font-heading text-white">Additional resources</h2>
            <ul className="list-disc list-inside text-sm md:text-base text-[#b8c5d6] space-y-2">
              <li>
                <Link prefetch={false} href="/whale-alerts" className="text-[#00FFA3] hover:underline">
                  Whale Alerts Dashboard
                </Link>{' '}
                – see what is included with the Ultimate plan.
              </li>
              <li>
                <Link prefetch={false} href="/blog/cryptoflash-sniper-workflow" className="text-[#00FFA3] hover:underline">
                  CryptoFlash Sniper Workflow
                </Link>{' '}
                – a step-by-step operating system for KOTH sniping.
              </li>
              <li>
                <Link prefetch={false} href="/leaderboard" className="text-[#00FFA3] hover:underline">
                  Pump.fun Leaderboard
                </Link>{' '}
                – track top-performing wallets and their results.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}



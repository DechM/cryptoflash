import Script from 'next/script'
import Link from 'next/link'

import { Navbar } from '@/components/Navbar'

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
    question: 'Какво представляват KOTH alert-ите?',
    answer:
      'KOTH (King of the Hill) alert-ите се задействат, когато Pump.fun токен премине определен AI Snipe Score. Стандартният праг е 95% за Free, 85% за Pro и 80% за Ultimate план.',
  },
  {
    question: 'Имам ли нужда от Discord, за да получавам аларми?',
    answer: (
      <>
        Да. Свързването на Discord е задължително. Отиди в{' '}
        <Link href="/alerts" className="text-[#00FFA3] hover:underline">
          Alerts &gt; Manage
        </Link>{' '}
        и натисни “Link Discord”, за да дадеш достъп на CryptoFlash бота.
      </>
    ),
  },
  {
    question: 'Как работят Whale Alerts?',
    answer:
      'Whale Alerts са включени в Ultimate плана. След като активираш абонамента, автоматично получаваш достъп до Discord канала с всички $20K+ трансфери и curated постове в X/Twitter.',
  },
  {
    question: 'Как се извършват плащанията?',
    answer: (
      <>
        Плащанията стават чрез Solana Pay. На страницата{' '}
        <Link href="/premium" className="text-[#00FFA3] hover:underline">
          Pricing
        </Link>{' '}
        избери план и следвай стъпките за QR/Phantom плащане. При успех ще видиш страница “Payment Successful”.
      </>
    ),
  },
  {
    question: 'Мога ли да експортирам данните си?',
    answer:
      'Pro и Ultimate плановете позволяват експортиране на dashboard данни и alert history. Използвай бутона “Export” в KOTH dashboard секцията.',
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

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />

      <Script
        id="faq-structured-data"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <section className="space-y-4 text-center">
            <h1 className="text-3xl md:text-4xl font-heading text-white">CryptoFlash FAQ</h1>
            <p className="text-base md:text-lg text-[#b8c5d6]">
              Събрахме най-често задаваните въпроси за KOTH alert-ите, Discord интеграцията, Whale Alerts и плащанията.
              Ако не откриеш нужния отговор, свържи се с нас през{' '}
              <Link href="/contact" className="text-[#00FFA3] hover:underline">
                контактната форма
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
            <h2 className="text-lg md:text-xl font-heading text-white">Допълнителни ресурси</h2>
            <ul className="list-disc list-inside text-sm md:text-base text-[#b8c5d6] space-y-2">
              <li>
                <Link href="/whale-alerts" className="text-[#00FFA3] hover:underline">
                  Whale Alerts Dashboard
                </Link>{' '}
                – виж какво получаваш с Ultimate плана
              </li>
              <li>
                <Link href="/blog/cryptoflash-sniper-workflow" className="text-[#00FFA3] hover:underline">
                  CryptoFlash Sniper Workflow
                </Link>{' '}
                – стъпка по стъпка за KOTH операционна система
              </li>
              <li>
                <Link href="/leaderboard" className="text-[#00FFA3] hover:underline">
                  Pump.fun Leaderboard
                </Link>{' '}
                – следи топ портфейлите и техните резултати
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}



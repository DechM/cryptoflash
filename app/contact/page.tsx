import { Metadata } from 'next'
import Link from 'next/link'
import { MarketingNavbar } from '@/components/MarketingNavbar'
import { Twitter } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | CryptoFlash',
  description: 'Get in touch with CryptoFlash - Support, questions, and feedback',
  robots: {
    index: true,
    follow: true,
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full flex flex-col">
      <MarketingNavbar />
      
      <main className="w-screen flex-grow">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <h1 className="text-4xl font-bold gradient-text mb-6">Contact Us</h1>
          <p className="text-lg text-[#b8c5d6] mb-6">
            Have questions, feedback, or need support? We're here to help! Check the{' '}
            <Link prefetch={false} href="/faq" className="text-[#00FFA3] hover:underline">
              FAQ page
            </Link>{' '}
            or reach out directly below.
          </p>
          <div className="mb-6">
            <Link prefetch={false}
              href="/whale-alerts"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#00FFA3]/20 border border-[#00FFA3]/40 text-[#00FFA3] hover:bg-[#00FFA3]/30 transition-colors text-sm font-semibold"
            >
              View Whale Alerts
            </Link>
          </div>

          <div className="space-y-8">
            {/* Social Media */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#F8FAFC] mb-4">Follow Us</h2>
              <div className="space-y-4">
                <a
                  href="https://x.com/CryptoFlashGuru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-[#b8c5d6] hover:text-[#00FFA3] transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  <span>@CryptoFlashGuru</span>
                </a>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#F8FAFC] mb-4">Highlights</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">How do I set up alerts?</h3>
                  <p className="text-[#b8c5d6]">
                    Go to the{' '}
                    <Link prefetch={false} href="/alerts" className="text-[#00FFA3] hover:underline">
                      Alerts page
                    </Link>
                    , link your Discord account, and create the token rules you want to monitor.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">How does the AI Snipe Score work?</h3>
                  <p className="text-[#b8c5d6]">
                    The AI Snipe Score (0-100) is calculated based on bonding curve progress, whale activity, 
                    volume trends, and rug risk assessment. Higher scores indicate better potential, but always DYOR.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Can I cancel my subscription?</h3>
                  <p className="text-[#b8c5d6]">
                    Yes, you can cancel your subscription at any time. 
                    Cancellation takes effect at the end of the current billing period.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Need faster signals?</h3>
                  <p className="text-[#b8c5d6]">
                    Upgrade to{' '}
                    <Link prefetch={false} href="/premium" className="text-[#00FFA3] underline">
                      Pro
                    </Link>{' '}
                    or{' '}
                    <Link prefetch={false} href="/premium" className="text-[#00FFA3] underline">
                      Ultimate
                    </Link>{' '}
                    for earlier alerts, more tracked tokens, and Whale Alerts.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">Is this financial advice?</h3>
                  <p className="text-[#b8c5d6]">
                    No. CryptoFlash is an informational tool only. 
                    We do not provide financial advice. Always do your own research (DYOR) before investing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


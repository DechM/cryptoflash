import { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | CryptoFlash',
  description: 'Terms of Service for CryptoFlash - Real-time KOTH tracker for Pump.fun',
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full flex flex-col">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-12 max-w-4xl mx-auto flex-grow">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <h1 className="text-4xl font-bold gradient-text mb-6">Terms of Service</h1>
          <p className="text-sm text-[#94A3B8] mb-8">Last updated: November 6, 2024</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                By accessing and using CryptoFlash ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">2. Description of Service</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                CryptoFlash provides real-time tracking and alerts for Pump.fun tokens in bonding curve phase (KOTH tracking). 
                The Service includes:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4">
                <li>Real-time KOTH token tracking</li>
                <li>AI Snipe Score calculations</li>
                <li>Automated alerts via Discord and Twitter/X</li>
                <li>Dashboard with live data</li>
                <li>Leaderboard and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">3. User Responsibilities</h2>
              <p className="text-[#b8c5d6] leading-relaxed mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring compliance with all applicable laws and regulations</li>
                <li>Using the Service only for lawful purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">4. Financial Disclaimer</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                <strong className="text-[#FF6B35]">IMPORTANT:</strong> CryptoFlash is an informational tool only. 
                The Service does not provide financial advice, investment recommendations, or trading signals. 
                All information provided is for educational and informational purposes only.
              </p>
              <p className="text-[#b8c5d6] leading-relaxed mt-4">
                Cryptocurrency trading involves substantial risk of loss. You should never invest more than you can afford to lose. 
                Past performance does not guarantee future results. Always conduct your own research (DYOR) before making any investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">5. Subscription and Payments</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                CryptoFlash offers subscription plans (Pro and Ultimate) paid in USDC via Solana Pay. 
                Subscriptions are billed monthly and automatically renew unless cancelled.
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>All payments are final and non-refundable</li>
                <li>You may cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">6. Data and Privacy</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                Your use of the Service is also governed by our Privacy Policy. 
                Please review our <Link prefetch={false} href="/privacy" className="text-[#00FFA3] hover:underline">Privacy Policy</Link> to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">7. Limitation of Liability</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                CryptoFlash shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, 
                or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">8. Service Availability</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to the Service. 
                The Service may be temporarily unavailable due to maintenance, updates, or unforeseen circumstances.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">9. Changes to Terms</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                We reserve the right to modify these Terms at any time. 
                We will notify users of significant changes via email or through the Service. 
                Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">10. Contact Information</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-[#b8c5d6] leading-relaxed mt-2">
                Email: <a href="mailto:support@cryptoflash.app" className="text-[#00FFA3] hover:underline">support@cryptoflash.app</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}


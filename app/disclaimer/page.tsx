import { Metadata } from 'next'
import { MarketingNavbar } from '@/components/MarketingNavbar'

export const metadata: Metadata = {
  title: 'Disclaimer | CryptoFlash',
  description: 'Financial disclaimer for CryptoFlash - Not financial advice',
  robots: {
    index: true,
    follow: true,
  },
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full flex flex-col">
      <MarketingNavbar />
      
      <main className="w-screen flex-grow">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <h1 className="text-4xl font-bold gradient-text mb-6">Disclaimer</h1>
          <p className="text-sm text-[#94A3B8] mb-8">Last updated: November 6, 2024</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <section className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-[#FF6B35] mb-4">⚠️ NOT FINANCIAL ADVICE</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                CryptoFlash is an <strong>informational tool only</strong>. 
                We do not provide financial advice, investment recommendations, or trading signals. 
                All information provided is for educational and informational purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">1. No Investment Advice</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                The Service provides data, analytics, and alerts about Pump.fun tokens. 
                This information is NOT investment advice. We do not:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>Recommend specific tokens to buy or sell</li>
                <li>Guarantee profits or returns</li>
                <li>Provide financial planning or investment strategies</li>
                <li>Act as a financial advisor or broker</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">2. High Risk Warning</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                Cryptocurrency trading, especially memecoins, involves <strong className="text-[#FF6B35]">substantial risk of loss</strong>. 
                You should be aware that:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>You may lose all or more than your initial investment</li>
                <li>Memecoins are highly volatile and speculative</li>
                <li>Prices can drop to zero very quickly</li>
                <li>There is no guarantee of liquidity</li>
                <li>Rug pulls and scams are common</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">3. Do Your Own Research (DYOR)</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                Always conduct your own research before making any investment decisions. 
                You should:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>Research the token, team, and project thoroughly</li>
                <li>Understand the risks involved</li>
                <li>Consult with a qualified financial advisor</li>
                <li>Never invest more than you can afford to lose</li>
                <li>Be aware of potential scams and rug pulls</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">4. No Guarantees</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                We make no guarantees about:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>The accuracy or completeness of data</li>
                <li>The performance of any tokens</li>
                <li>Profitability of trades based on our alerts</li>
                <li>Service availability or uptime</li>
                <li>Future results based on past performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">5. AI Snipe Score Disclaimer</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                Our AI Snipe Score (0-100) is a calculated metric based on various factors including:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>Bonding curve progress</li>
                <li>Whale activity</li>
                <li>Volume trends</li>
                <li>Rug risk assessment</li>
              </ul>
              <p className="text-[#b8c5d6] leading-relaxed mt-4">
                This score is <strong>NOT</strong> a guarantee of token performance. 
                It is a tool to help you make informed decisions, but you should always do your own research.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">6. Past Performance</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                Past performance does not guarantee future results. 
                Just because a token reached KOTH in the past does not mean similar tokens will perform the same way.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">7. Regulatory Compliance</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                Cryptocurrency regulations vary by jurisdiction. 
                You are responsible for ensuring compliance with all applicable laws and regulations in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">8. Limitation of Liability</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                By using CryptoFlash, you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>You are solely responsible for your investment decisions</li>
                <li>We are not liable for any losses you may incur</li>
                <li>You use the Service at your own risk</li>
                <li>You will not hold CryptoFlash responsible for any financial losses</li>
              </ul>
            </section>

            <section className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-bold text-[#FF6B35] mb-4">Final Warning</h2>
              <p className="text-[#b8c5d6] leading-relaxed text-lg">
                <strong>Only invest what you can afford to lose.</strong> 
                Cryptocurrency trading is highly risky and speculative. 
                Never invest money you need for essential expenses.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}


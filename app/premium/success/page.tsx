'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { CheckCircle, Crown, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PremiumSuccessPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait a moment for webhook to process
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }, [])

  return (
    <div className="min-h-screen bg-[#0B1020]">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center">
          <div className="mb-6">
            <CheckCircle className="h-24 w-24 mx-auto text-[#00FFA3]" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            Welcome to CryptoFlash Pro!
          </h1>

          <p className="text-xl text-[#b8c5d6] mb-8">
            Your subscription is active. Start sniping early!
          </p>

          {loading ? (
            <div className="glass rounded-xl p-8">
              <div className="animate-spin h-8 w-8 border-4 border-[#00FFA3] border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-[#b8c5d6]">Activating your Pro account...</p>
            </div>
          ) : (
            <div className="glass rounded-xl p-8 space-y-6">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <Crown className="h-8 w-8 text-[#ffd700]" />
                <span className="text-2xl font-bold text-white">Pro Features Unlocked</span>
              </div>

              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#00FFA3] mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Early Alerts Enabled</div>
                    <div className="text-sm text-[#6b7280]">Get notified at 85% score (vs 95% for free)</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#00FFA3] mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Unlimited Tracking</div>
                    <div className="text-sm text-[#6b7280]">Track as many tokens as you want</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#00FFA3] mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Custom Thresholds</div>
                    <div className="text-sm text-[#6b7280]">Set alerts at any level (80-100%)</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-[#00FFA3] mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Faster Updates</div>
                    <div className="text-sm text-[#6b7280]">15-second refresh rate (vs 60s for free)</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black font-semibold hover:opacity-90 transition-opacity glow-mint"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


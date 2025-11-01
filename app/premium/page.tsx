'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Crown, Check, Zap, AlertCircle, TrendingUp, BarChart3, History } from 'lucide-react'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PremiumPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
      fetch(`/api/user/tier?userId=${storedUserId}`)
        .then(res => res.json())
        .then(data => setUserTier(data.tier || 'free'))
    }
  }, [])

  const handleSubscribe = async () => {
    if (!userId) {
      alert('Please set up your account first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/premium/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: 'user@example.com' // In production, get from auth
        })
      })

      const { sessionId, url } = await response.json()

      if (url) {
        window.location.href = url
      } else if (sessionId) {
        // If no URL returned, try redirecting manually
        alert('Redirecting to checkout...')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Zap, title: 'Early Alerts', desc: 'Get alerts at 85% score (vs 95% for free)', pro: true },
    { icon: AlertCircle, title: 'Unlimited Alerts', desc: 'Track unlimited tokens simultaneously', pro: true },
    { icon: TrendingUp, title: 'Custom Thresholds', desc: 'Set your own alert levels (80-100%)', pro: true },
    { icon: History, title: 'Alert History', desc: 'View all past alerts (last 30 days)', pro: true },
    { icon: BarChart3, title: 'Advanced Analytics', desc: 'Detailed metrics and insights', pro: true },
    { icon: Crown, title: 'Priority Support', desc: 'Get help faster', pro: true },
  ]

  const freeFeatures = [
    { icon: AlertCircle, title: 'Basic Alerts', desc: '1 token, alerts at 95%+ score' },
    { icon: Zap, title: '10 Alerts/Day', desc: 'Limited daily notifications' },
    { icon: TrendingUp, title: 'Standard Dashboard', desc: 'Access to KOTH tracker' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Crown className="h-16 w-16 mx-auto mb-4 text-[#ffd700]" />
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            PumpKing Pro
          </h1>
          <p className="text-xl text-[#b8c5d6]">
            Unlock early signals and unlimited tracking
          </p>
        </motion.div>

        {userTier === 'pro' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 glass rounded-xl p-6 border border-[#00ff88]/30 text-center"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Check className="h-6 w-6 text-[#00ff88]" />
              <span className="text-xl font-bold text-[#00ff88]">You're a Pro member!</span>
            </div>
            <p className="text-[#b8c5d6]">Enjoy all premium features</p>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-8 border border-white/10"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Free</h2>
            <div className="text-4xl font-bold text-[#b8c5d6] mb-6">$0<span className="text-lg">/mo</span></div>
            
            <ul className="space-y-4 mb-6">
              {freeFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <li key={index} className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 text-[#6b7280] mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">{feature.title}</div>
                      <div className="text-sm text-[#6b7280]">{feature.desc}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-8 border-2 border-[#00ff88] relative overflow-hidden glow-green"
          >
            <div className="absolute top-0 right-0 px-4 py-1 bg-[#00ff88] text-black text-sm font-bold">
              POPULAR
            </div>
            
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-6 w-6 text-[#ffd700]" />
                <h2 className="text-2xl font-bold text-white">Pro</h2>
              </div>
              <div className="text-4xl font-bold gradient-text mb-6">
                $4.99<span className="text-lg">/mo</span>
              </div>
              
              <ul className="space-y-4 mb-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-[#00ff88] mt-0.5" />
                      <div>
                        <div className="font-semibold text-white">{feature.title}</div>
                        <div className="text-sm text-[#6b7280]">{feature.desc}</div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {userTier === 'pro' ? (
                <button
                  disabled
                  className="w-full px-6 py-3 rounded-lg bg-[#00ff88] text-black font-semibold opacity-50 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={loading || !userId}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-green"
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-[#b8c5d6]">Yes, cancel anytime from your account settings.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-[#b8c5d6]">We accept all major credit cards via Stripe.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Do Pro alerts really come 10-15 min earlier?</h3>
              <p className="text-[#b8c5d6]">Yes! Pro users get alerts at 85% score vs 95% for free users, giving you valuable time to act.</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}


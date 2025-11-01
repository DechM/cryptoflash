'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Crown, Check, Zap, AlertCircle, TrendingUp, BarChart3, History, Sparkles, Rocket, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { SubscriptionTier } from '@/lib/types'

export default function PremiumPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('free')
  const [loading, setLoading] = useState<string | null>(null) // Track which plan is loading

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
      fetch(`/api/user/tier?userId=${storedUserId}`)
        .then(res => res.json())
        .then(data => setUserTier(data.tier || 'free'))
    }
  }, [])

  const handleSubscribe = async (tier: 'pro' | 'ultimate') => {
    if (!userId) {
      alert('Please set up your account first (enter Telegram username on Alerts page)')
      return
    }

    setLoading(tier)
    try {
      const response = await fetch('/api/premium/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: null,
          tier: tier // Pass tier to determine price
        })
      })

      const { sessionId, url } = await response.json()

      if (url) {
        window.location.href = url
      } else if (sessionId) {
        alert('Redirecting to checkout...')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Failed to start checkout')
    } finally {
      setLoading(null)
    }
  }

  // Feature lists for each plan
  const freeFeatures = [
    { icon: AlertCircle, title: 'Basic Alerts', desc: '1 token, alerts at 95%+ score' },
    { icon: Zap, title: '10 Alerts/Day', desc: 'Limited daily notifications' },
    { icon: TrendingUp, title: 'Standard Dashboard', desc: 'Access to KOTH tracker' },
    { icon: BarChart3, title: 'Basic Stats', desc: 'View token data' },
  ]

  const proFeatures = [
    { icon: Zap, title: 'Early Alerts', desc: 'Get alerts at 85% score (vs 95% for free)' },
    { icon: AlertCircle, title: '10 Token Tracking', desc: 'Track up to 10 tokens simultaneously' },
    { icon: TrendingUp, title: 'Custom Thresholds', desc: 'Set your own alert levels (80-100%)' },
    { icon: History, title: 'Alert History', desc: 'View all past alerts (last 30 days)' },
    { icon: BarChart3, title: 'Advanced Filters', desc: 'Filter by score, volume, whales' },
    { icon: Zap, title: '100 Alerts/Day', desc: 'Increased daily limit' },
    { icon: TrendingUp, title: 'Faster Updates', desc: '15-second refresh rate' },
  ]

  const ultimateFeatures = [
    { icon: Rocket, title: 'Earliest Alerts', desc: 'Get alerts at 80% score - first to know!' },
    { icon: AlertCircle, title: 'Unlimited Tracking', desc: 'Track unlimited tokens' },
    { icon: TrendingUp, title: 'Ultra Custom Thresholds', desc: 'Set alerts at any level (70-100%)' },
    { icon: History, title: 'Extended History', desc: 'View all past alerts (unlimited)' },
    { icon: BarChart3, title: 'Premium Analytics', desc: 'Advanced metrics & insights' },
    { icon: Zap, title: 'Unlimited Alerts', desc: 'No daily limits' },
    { icon: TrendingUp, title: 'Real-time Updates', desc: '10-second refresh rate' },
    { icon: Shield, title: 'Priority Support', desc: '24/7 dedicated support' },
    { icon: Sparkles, title: 'API Access', desc: 'Direct API access (1000 req/day)' },
    { icon: Crown, title: 'Exclusive Features', desc: 'Early access to new features' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header - Centered */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Crown className="h-16 w-16 mx-auto mb-4 text-[#ffd700]" />
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-[#b8c5d6] max-w-2xl mx-auto">
            Unlock powerful features to maximize your KOTH sniping potential
          </p>
        </motion.div>

        {/* Current Plan Badge */}
        {(userTier === 'pro' || userTier === 'ultimate') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 glass rounded-xl p-6 border border-[#00ff88]/30 text-center max-w-md mx-auto"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Check className="h-6 w-6 text-[#00ff88]" />
              <span className="text-xl font-bold text-[#00ff88]">
                You're on {userTier === 'ultimate' ? 'Ultimate' : 'Pro'}!
              </span>
            </div>
            <p className="text-[#b8c5d6]">Enjoy all {userTier === 'ultimate' ? 'ultimate' : 'premium'} features</p>
          </motion.div>
        )}

        {/* Pricing Cards - Centered Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 border border-white/10 flex flex-col"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Free</h2>
              <div className="text-4xl font-bold text-[#b8c5d6] mb-2">
                $0<span className="text-lg">/mo</span>
              </div>
              <p className="text-sm text-[#6b7280]">Perfect for beginners</p>
            </div>
            
            <ul className="space-y-3 mb-6 flex-grow">
              {freeFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <li key={index} className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 text-[#6b7280] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white text-sm">{feature.title}</div>
                      <div className="text-xs text-[#6b7280]">{feature.desc}</div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <button
              disabled
              className="w-full px-6 py-3 rounded-lg bg-[#6b7280]/20 text-[#b8c5d6] font-semibold cursor-not-allowed border border-[#6b7280]/30"
            >
              Current Plan
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 border-2 border-[#00ff88] relative overflow-hidden glow-green flex flex-col"
          >
            <div className="absolute top-0 right-0 px-4 py-1 bg-[#00ff88] text-black text-xs font-bold rounded-bl-lg">
              POPULAR
            </div>
            
            <div className="text-center mb-6 mt-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Crown className="h-5 w-5 text-[#ffd700]" />
                <h2 className="text-2xl font-bold text-white">Pro</h2>
              </div>
              <div className="text-4xl font-bold gradient-text mb-2">
                $4.99<span className="text-lg">/mo</span>
              </div>
              <p className="text-sm text-[#6b7280]">For serious traders</p>
            </div>
            
            <ul className="space-y-3 mb-6 flex-grow">
              {proFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white text-sm">{feature.title}</div>
                      <div className="text-xs text-[#6b7280]">{feature.desc}</div>
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
                onClick={() => handleSubscribe('pro')}
                disabled={loading !== null || !userId}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-green"
              >
                {loading === 'pro' ? 'Processing...' : 'Subscribe Now'}
              </button>
            )}
          </motion.div>

          {/* Ultimate Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6 border-2 border-[#ff006e] relative overflow-hidden glow-pink flex flex-col"
          >
            <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-[#ff006e] to-[#ff6b35] text-white text-xs font-bold rounded-bl-lg">
              ULTIMATE
            </div>
            
            <div className="text-center mb-6 mt-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Sparkles className="h-5 w-5 text-[#ff006e]" />
                <h2 className="text-2xl font-bold text-white">Ultimate</h2>
              </div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff006e] to-[#ff6b35] mb-2">
                $19.99<span className="text-lg">/mo</span>
              </div>
              <p className="text-sm text-[#6b7280]">Maximum power</p>
            </div>
            
            <ul className="space-y-3 mb-6 flex-grow">
              {ultimateFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-[#ff006e] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-white text-sm">{feature.title}</div>
                      <div className="text-xs text-[#6b7280]">{feature.desc}</div>
                    </div>
                  </li>
                )
              })}
            </ul>

            {userTier === 'ultimate' ? (
              <button
                disabled
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff006e] to-[#ff6b35] text-white font-semibold opacity-50 cursor-not-allowed"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe('ultimate')}
                disabled={loading !== null || !userId}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff006e] to-[#ff6b35] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-pink"
              >
                {loading === 'ultimate' ? 'Processing...' : 'Subscribe Now'}
              </button>
            )}
          </motion.div>
        </div>

        {/* FAQ Section - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-8 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-[#b8c5d6] text-sm">Yes, cancel anytime from your account settings. No hidden fees.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-[#b8c5d6] text-sm">We accept all major credit cards via Stripe secure payments.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">What's the difference between plans?</h3>
              <p className="text-[#b8c5d6] text-sm">
                Free: Basic alerts at 95%. Pro: Early alerts at 85%, 10 tokens, advanced features. 
                Ultimate: Earliest alerts at 80%, unlimited everything, API access.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Do alerts really come earlier?</h3>
              <p className="text-[#b8c5d6] text-sm">
                Yes! Pro users get alerts at 85% vs 95% for free (10-15 min earlier). 
                Ultimate users get alerts at 80% (up to 20-25 min earlier).
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

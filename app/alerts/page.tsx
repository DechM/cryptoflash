'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { AlertCircle, Check, Zap, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFeature } from '@/hooks/useFeature'
import Link from 'next/link'

export default function AlertsPage() {
  const [telegramUsername, setTelegramUsername] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const { plan, limit, isEnabled } = useFeature()
  const minThreshold = limit('alerts.threshold_min') as number
  const maxTokens = limit('alerts.max_tokens') as number
  const maxPerDay = limit('alerts.max_per_day') as number
  
  const [threshold, setThreshold] = useState(minThreshold)

  // Get user ID on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
    }
  }, [])

  // Update threshold when plan changes
  useEffect(() => {
    setThreshold(minThreshold)
  }, [minThreshold])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess(false)

    try {
      let currentUserId = userId || localStorage.getItem('userId')

      // Create user if doesn't exist
      if (!currentUserId && telegramUsername) {
        const userResponse = await fetch('/api/user/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramUsername: telegramUsername.replace('@', ''),
            email: null
          })
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          currentUserId = userData.userId
          if (currentUserId) {
            localStorage.setItem('userId', currentUserId)
            setUserId(currentUserId)
          } else {
            throw new Error('Failed to get user ID')
          }
        } else {
          throw new Error('Failed to create user account')
        }
      }

      if (!currentUserId) {
        alert('Please enter your Telegram username first')
        setSubmitting(false)
        return
      }

      // Check if user is trying to add more tokens than allowed
      if (tokenAddress && maxTokens === 1) {
        // Free plan - can only track 1 token or all tokens
        // This is handled by backend, but we can warn here
      }

      const response = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          tokenAddress: tokenAddress || null,
          alertType: 'score',
          thresholdValue: threshold
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'MAX_ALERTS_REACHED') {
          alert(`You've reached your limit. ${plan === 'free' ? 'Upgrade to Pro for 10 tokens or Ultimate for unlimited!' : 'Upgrade to Ultimate for unlimited!'}`)
        } else {
          alert(data.error || 'Failed to create alert')
        }
        return
      }

      setSuccess(true)
      setTelegramUsername('')
      setTokenAddress('')
      setThreshold(minThreshold)
    } catch (error) {
      console.error('Error creating alert:', error)
      alert('Failed to create alert')
    } finally {
      setSubmitting(false)
    }
  }

  const maxThreshold = plan === 'ultimate' ? 100 : plan === 'pro' ? 100 : 95
  const canUseCustomThreshold = plan !== 'free'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] w-full">
      <Navbar />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            Set Up Alerts
          </h1>
          <p className="text-[#b8c5d6]">
            Get notified when KOTH tokens reach your threshold
          </p>
          <div className="mt-2 px-3 py-1 inline-block rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-[#b8c5d6]">Current Plan: <span className="font-semibold text-white">{plan.toUpperCase()}</span></span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 md:p-8"
        >
          {plan === 'free' && (
            <div className="mb-6 p-4 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/30">
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-[#ffd700] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#ffd700] mb-1">Free Plan</p>
                  <p className="text-sm text-[#b8c5d6]">
                    You can track {maxTokens} token{maxTokens > 1 ? 's' : ''} with alerts at {minThreshold}%+ score. 
                    Upgrade to Pro ($4.99) for early alerts (85%+) or Ultimate ($19.99) for earliest alerts (80%)!
                  </p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-lg bg-[#00ff88]/20 border border-[#00ff88]/30"
            >
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-[#00ff88]" />
                <span className="text-[#00ff88] font-semibold">Alert created successfully!</span>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="telegramUsername" className="block text-sm font-semibold text-[#b8c5d6] mb-2">
                Telegram Username
              </label>
              <input
                type="text"
                id="telegramUsername"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="@your_username"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#00ff88] focus:outline-none text-white placeholder-[#6b7280]"
                required
              />
              <p className="mt-2 text-xs text-[#6b7280]">
                Send /start to @PumpKingBot to enable alerts
              </p>
            </div>

            <div>
              <label htmlFor="tokenAddress" className="block text-sm font-semibold text-[#b8c5d6] mb-2">
                Token Address {plan === 'free' && '(Optional - leave empty for all tokens)'}
              </label>
              <input
                type="text"
                id="tokenAddress"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="Leave empty for all tokens"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#00ff88] focus:outline-none text-white placeholder-[#6b7280] font-mono text-sm"
              />
              <p className="mt-2 text-xs text-[#6b7280]">
                {plan === 'free' 
                  ? `Free users can track ${maxTokens} specific token or all tokens`
                  : plan === 'pro'
                  ? `Pro users can track up to ${maxTokens} tokens`
                  : 'Ultimate users can track unlimited tokens'}
              </p>
            </div>

            <div>
              <label htmlFor="threshold" className="block text-sm font-semibold text-[#b8c5d6] mb-2">
                Alert Threshold (Score) {canUseCustomThreshold ? '(Custom)' : '(Fixed)'}
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  id="threshold"
                  min={minThreshold}
                  max={maxThreshold}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  disabled={!canUseCustomThreshold}
                  className={`flex-1 ${!canUseCustomThreshold ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <div className="text-2xl font-bold text-white min-w-[60px] text-right">
                  {threshold}%
                </div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-[#6b7280]">
                <span>{minThreshold}%</span>
                <span>{maxThreshold}%</span>
              </div>
              <p className="mt-2 text-xs text-[#6b7280]">
                {plan === 'ultimate' 
                  ? 'Ultimate users: 80-100%' 
                  : plan === 'pro'
                  ? 'Pro users: 85-100%'
                  : 'Free users: Fixed at 95%'}
              </p>
              {!canUseCustomThreshold && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-[#ffd700]">
                  <Lock className="h-3 w-3" />
                  <span>Custom thresholds available in Pro/Ultimate</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !telegramUsername}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <AlertCircle className="h-5 w-5 animate-spin" />
                  <span>Creating Alert...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Create Alert</span>
                </>
              )}
            </button>
          </form>

          {plan === 'free' && (
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-[#ff006e]/10 to-[#ff6b35]/10 border border-[#ff006e]/30 text-center">
              <p className="text-sm text-[#b8c5d6] mb-3">
                <strong className="text-white">Upgrade for more power:</strong>
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="text-left">
                  <p className="font-semibold text-white mb-2">Pro - $4.99/mo</p>
                  <ul className="space-y-1 text-xs text-[#b8c5d6]">
                    <li className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-[#00ff88]" />
                      <span>10 token tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-[#00ff88]" />
                      <span>Early alerts at 85%</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-[#00ff88]" />
                      <span>Custom thresholds (80-100%)</span>
                    </li>
                  </ul>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white mb-2">Ultimate - $19.99/mo</p>
                  <ul className="space-y-1 text-xs text-[#b8c5d6]">
                    <li className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-[#ff006e]" />
                      <span>Unlimited tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-[#ff006e]" />
                      <span>Earliest alerts at 80%</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="h-3 w-3 text-[#ff006e]" />
                      <span>API access + priority</span>
                    </li>
                  </ul>
                </div>
              </div>
              <Link
                href="/premium"
                className="inline-block px-6 py-2 rounded-lg bg-gradient-to-r from-[#ff006e] to-[#ff6b35] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                View Plans →
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

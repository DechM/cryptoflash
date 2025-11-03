'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { AlertCircle, Check, Zap, Lock, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFeature } from '@/hooks/useFeature'
import { useSession } from '@/hooks/useSession'
import Link from 'next/link'

export default function AlertsPageContent() {
  const { user } = useSession()
  const [telegramUsername, setTelegramUsername] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null) // null = checking, true/false = status
  const [linkingTelegram, setLinkingTelegram] = useState(false)

  const { plan, limit, isEnabled } = useFeature()
  const minThreshold = limit('alerts.threshold_min') as number
  const maxTokens = limit('alerts.max_tokens') as number
  const maxPerDay = limit('alerts.max_per_day') as number
  
  const [threshold, setThreshold] = useState(minThreshold)

  // Check Telegram link status on mount and poll for updates
  useEffect(() => {
    if (!user) {
      setTelegramLinked(false)
      return
    }
    
    let shouldPoll = true // Flag to stop polling on auth errors
    
    const checkTelegramLink = async () => {
      try {
        const response = await fetch('/api/me/link-telegram')
        if (response.ok) {
          const data = await response.json()
          const isLinked = data.linked || false
          setTelegramLinked(isLinked)
          
          if (data.telegram_username) {
            setTelegramUsername(data.telegram_username)
          }
          
          // Stop polling if linked
          if (isLinked) {
            shouldPoll = false
            return // Exit early if linked
          }
          
          // Continue polling if not linked
          shouldPoll = true
        } else if (response.status === 401) {
          // Stop polling if we get 401 (unauthorized)
          console.warn('Unauthorized - stopping Telegram link polling')
          setTelegramLinked(false)
          shouldPoll = false
        } else {
          setTelegramLinked(false)
          shouldPoll = true // Continue polling on other errors
        }
      } catch (error) {
        console.error('Error checking Telegram link:', error)
        setTelegramLinked(false)
        shouldPoll = false // Stop on network errors
      }
    }
    
    checkTelegramLink()
    
    // Poll every 5 seconds ONLY if shouldPoll is true and not linked
    const interval = setInterval(() => {
      if (shouldPoll && (telegramLinked === false || telegramLinked === null)) {
        checkTelegramLink()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [user]) // Remove telegramLinked from dependencies to avoid infinite loop

  // Update threshold when plan changes
  useEffect(() => {
    setThreshold(minThreshold)
  }, [minThreshold])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess(false)

    if (!user) {
      alert('You must be logged in to create alerts')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress: tokenAddress || null,
          alertType: 'score',
          thresholdValue: threshold
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - redirect to login
          alert(data.message || 'Please log in to create alerts')
          window.location.href = `/login?next=${encodeURIComponent('/alerts')}`
          return
        }
        
        if (data.error === 'MAX_ALERTS_REACHED') {
          alert(`You've reached your limit. ${plan === 'free' ? 'Upgrade to Pro for 10 tokens or Ultimate for unlimited!' : 'Upgrade to Ultimate for unlimited!'}`)
        } else {
          alert(data.message || data.error || 'Failed to create alert')
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
                    Upgrade to Pro (19.99 USDC/mo) for early alerts (85%+) or Ultimate (39.99 USDC/mo) for earliest alerts (80%)!
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

          {/* Telegram Link Status */}
          {telegramLinked === null && (
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-400 animate-spin" />
                <span className="text-sm text-blue-400">Checking Telegram link status...</span>
              </div>
            </div>
          )}

          {telegramLinked === false && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-400 mb-1">Telegram Not Linked</p>
                    <p className="text-sm text-[#b8c5d6] mb-3">
                      Link your Telegram account to receive alerts when tokens match your criteria.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'CryptoFlashBot'}?start=email:${encodeURIComponent(user?.email || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0088cc] hover:bg-[#0077b3] text-white font-semibold transition-colors text-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open Telegram Bot</span>
                      </a>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/me/link-telegram')
                            if (response.ok) {
                              const data = await response.json()
                              setTelegramLinked(data.linked || false)
                              if (data.telegram_username) {
                                setTelegramUsername(data.telegram_username)
                              }
                              if (data.linked) {
                                alert('✅ Telegram account is now linked!')
                              } else {
                                alert('⚠️ Not linked yet. Make sure you clicked "Start" in Telegram after opening the bot.')
                              }
                            }
                          } catch (error) {
                            console.error('Error refreshing link status:', error)
                          }
                        }}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors text-sm"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span>Check Status</span>
                      </button>
                      <button
                        onClick={async () => {
                          setLinkingTelegram(true)
                          try {
                            const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'CryptoFlashBot'
                            const userEmail = user?.email || 'your-email'
                            alert(`📱 Link Telegram Account:

1. Click "Open Telegram Bot" button above (opens automatically)
2. Click "Start" button in Telegram
3. Your account will be automatically linked!

OR manually:
- Open: https://t.me/${botUsername}
- Send: /start email:${userEmail}

💡 We'll automatically detect your email and link your account.`)
                          } catch (error) {
                            console.error('Error:', error)
                          } finally {
                            setLinkingTelegram(false)
                          }
                        }}
                        disabled={linkingTelegram}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors text-sm disabled:opacity-50"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span>{linkingTelegram ? 'Opening...' : 'How to Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {telegramLinked === true && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-lg bg-[#00ff88]/20 border border-[#00ff88]/30"
            >
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-[#00ff88]" />
                <span className="text-sm text-[#00ff88] font-semibold">
                  ✅ Telegram linked! You'll receive alerts when tokens match your criteria.
                </span>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={submitting || (telegramLinked === false && plan !== 'free')}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              title={telegramLinked === false && plan !== 'free' ? 'Please link your Telegram account first' : undefined}
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
            
            {telegramLinked === false && plan !== 'free' && (
              <p className="text-xs text-yellow-400 text-center">
                ⚠️ Link your Telegram account above to enable alerts
              </p>
            )}
          </form>

          {plan === 'free' && (
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-[#ff006e]/10 to-[#ff6b35]/10 border border-[#ff006e]/30 text-center">
              <p className="text-sm text-[#b8c5d6] mb-3">
                <strong className="text-white">Upgrade for more power:</strong>
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="text-left">
                  <p className="font-semibold text-white mb-2">Pro - 19.99 USDC/mo</p>
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
                      <span>Custom thresholds (85-100%)</span>
                    </li>
                  </ul>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white mb-2">Ultimate - 39.99 USDC/mo</p>
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
                      <span>Whale alerts + API access</span>
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


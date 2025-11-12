'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AlertCircle, Check, Zap, Lock, ExternalLink } from 'lucide-react'

import { Navbar } from '@/components/Navbar'
import { useFeature } from '@/hooks/useFeature'
import { useSession } from '@/hooks/useSession'

export default function AlertsPageContent() {
  const { user } = useSession()
  const { plan, limit } = useFeature()

  const [tokenAddress, setTokenAddress] = useState('')
  const [threshold, setThreshold] = useState(limit('alerts.threshold_min') as number)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [discordStatus, setDiscordStatus] = useState<{ linked: boolean; username: string | null } | null>(null)
  const [checkingDiscord, setCheckingDiscord] = useState(false)
  const [linkingDiscord, setLinkingDiscord] = useState(false)
  const [discordError, setDiscordError] = useState<string | null>(null)
  const [testSending, setTestSending] = useState(false)

  const minThreshold = limit('alerts.threshold_min') as number
  const maxTokens = limit('alerts.max_tokens') as number
  const maxPerDay = limit('alerts.max_per_day') as number

  const refreshDiscordStatus = useCallback(async () => {
    if (!user) {
      setDiscordStatus({ linked: false, username: null })
      return
    }

    setCheckingDiscord(true)
    try {
      const response = await fetch('/api/me/link-discord', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setDiscordStatus({
          linked: Boolean(data.linked),
          username: data.discord_username
        })
      } else if (response.status === 401) {
        setDiscordStatus({ linked: false, username: null })
      } else {
        setDiscordStatus({ linked: false, username: null })
      }
    } catch (error) {
      console.error('Error checking Discord link:', error)
      setDiscordStatus({ linked: false, username: null })
    } finally {
      setCheckingDiscord(false)
    }
  }, [user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('linked')) {
      setSuccess(true)
      params.delete('linked')
      const url = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', url)
    }
  }, [])

  useEffect(() => {
    if (user) {
      refreshDiscordStatus()
    } else {
      setDiscordStatus({ linked: false, username: null })
    }
  }, [user, refreshDiscordStatus])

  useEffect(() => {
    setThreshold(minThreshold)
  }, [minThreshold])

  const handleLinkDiscord = async () => {
    setDiscordError(null)
    setLinkingDiscord(true)
    try {
      const response = await fetch('/api/alerts/discord/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()

      if (!response.ok || !data.authorizeUrl) {
        throw new Error(data.error || 'Failed to start Discord linking')
      }

      window.location.href = data.authorizeUrl
    } catch (error: any) {
      console.error('Error linking Discord:', error)
      setDiscordError(error.message || 'Failed to link Discord account. Please try again.')
    } finally {
      setLinkingDiscord(false)
    }
  }

  const handleUnlinkDiscord = async () => {
    setDiscordError(null)
    try {
      const response = await fetch('/api/alerts/discord/link', {
        method: 'DELETE'
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to unlink Discord account')
      }
      await refreshDiscordStatus()
    } catch (error: any) {
      console.error('Error unlinking Discord:', error)
      setDiscordError(error.message || 'Failed to unlink Discord account. Please try again.')
    }
  }

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
          alert(data.message || 'Please log in to create alerts')
          window.location.href = `/login?next=${encodeURIComponent('/alerts')}`
          return
        }

        if (data.error === 'DISCORD_NOT_LINKED') {
          alert('⚠️ Please link your Discord account first! Click "Link Discord" above.')
          await refreshDiscordStatus()
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
      setTokenAddress('')
      setThreshold(minThreshold)
    } catch (error) {
      console.error('Error creating alert:', error)
      alert('Failed to create alert')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendTestAlert = async () => {
    setDiscordError(null)
    setTestSending(true)
    try {
      const response = await fetch('/api/alerts/test-send', {
        method: 'POST'
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send test alert')
      }

      alert('✅ Test alert sent! Check the Discord KOTH channel.')
    } catch (error: any) {
      console.error('Error sending test alert:', error)
      setDiscordError(error.message || 'Failed to send test alert. Please try again.')
    } finally {
      setTestSending(false)
    }
  }

  const maxThreshold = plan === 'ultimate' ? 100 : plan === 'pro' ? 100 : 95
  const canUseCustomThreshold = plan !== 'free'

  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            Set Up Alerts
          </h1>
          <p className="text-[#b8c5d6]">
            Get notified in Discord when KOTH tokens reach your threshold
          </p>
          <div className="mt-2 px-3 py-1 inline-block rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-[#b8c5d6]">
              Current Plan:{' '}
              <span className="font-semibold text-white">{plan.toUpperCase()}</span>
            </span>
          </div>
        </div>

        <div className="glass rounded-xl p-4 md:p-6 lg:p-8">
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
            <div className="mb-6 p-4 rounded-lg bg-[#00FFA3]/20 border border-[#00FFA3]/30 bounce-in">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-[#00FFA3]" />
                <span className="text-[#00FFA3] font-semibold">Alert created successfully!</span>
              </div>
            </div>
          )}

          {checkingDiscord && (
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-400 animate-spin" />
                <span className="text-sm text-blue-400">Checking Discord link status...</span>
              </div>
            </div>
          )}

          {discordError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-semibold">Discord Error</p>
                  <p className="text-sm text-red-300">{discordError}</p>
                </div>
              </div>
            </div>
          )}

          {discordStatus?.linked === false && !checkingDiscord && (
            <div className="mb-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-semibold text-purple-300 mb-1">Discord Not Linked</p>
                    <p className="text-sm text-[#b8c5d6]">
                      Connect your Discord account to receive KOTH alerts directly inside the CryptoFlash server.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleLinkDiscord}
                      disabled={linkingDiscord}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-colors text-sm disabled:opacity-60"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>{linkingDiscord ? 'Opening Discord...' : 'Link Discord'}</span>
                    </button>
                    <button
                      onClick={refreshDiscordStatus}
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Refresh Status</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    You’ll be redirected to Discord to authorize the CryptoFlash bot.
                  </p>
                </div>
              </div>
            </div>
          )}

          {discordStatus?.linked && !checkingDiscord && (
            <div className="mb-6 p-4 rounded-lg bg-[#00FFA3]/20 border border-[#00FFA3]/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-[#00FFA3]" />
                  <span className="text-sm text-[#00FFA3] font-semibold">
                    ✅ Discord linked! {discordStatus.username ? `(${discordStatus.username})` : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan === 'ultimate' ? (
                    <button
                      onClick={handleSendTestAlert}
                      disabled={testSending}
                      className="px-4 py-2 rounded-lg bg-[#00FFA3]/20 hover:bg-[#00FFA3]/30 border border-[#00FFA3]/50 text-[#00FFA3] font-semibold text-sm transition-colors disabled:opacity-60"
                    >
                      {testSending ? 'Sending...' : 'Send Test Alert'}
                    </button>
                  ) : (
                    <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs text-[#6b7280] flex items-center space-x-1">
                      <Lock className="h-3 w-3" />
                      <span>Ultimate only</span>
                    </div>
                  )}
                  <button
                    onClick={handleUnlinkDiscord}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-colors"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            </div>
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
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#00FFA3] focus:outline-none text-white placeholder-[#6b7280] font-mono text-sm"
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
              <p className="mt-2 text-xs text-[#6b7280]">
                {plan === 'free'
                  ? 'Free users receive alerts at 95%+ scores. Upgrade for earlier alerts.'
                  : plan === 'pro'
                  ? 'Pro users can receive alerts as early as 85%.'
                  : 'Ultimate users get the earliest alerts at 80%+'}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !discordStatus?.linked}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-[#00FFA3] to-[#1DB8A3] text-[#050712] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Alert...' : 'Create Alert'}
            </button>

            {!discordStatus?.linked && (
              <p className="text-xs text-center text-[#6b7280]">
                You must link Discord before creating alerts.
              </p>
            )}
          </form>

          <div className="mt-8 space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-2">Alert Limits</h2>
              <ul className="text-sm text-[#b8c5d6] space-y-1">
                <li>• Track up to {maxTokens} token{maxTokens > 1 ? 's' : ''} with your current plan</li>
                <li>• Max {maxPerDay} alerts per day</li>
                <li>• Alerts are delivered to the CryptoFlash Discord server</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-2">Need faster signals?</h2>
              <p className="text-sm text-[#b8c5d6]">
                Upgrade to <Link href="/pricing" className="text-[#00FFA3] underline">Pro</Link> or{' '}
                <Link href="/pricing" className="text-[#00FFA3] underline">Ultimate</Link> for earlier thresholds,
                more tracked tokens, and premium analytics. Ultimate also unlocks Whale Alerts via Discord.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


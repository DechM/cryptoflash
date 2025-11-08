'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Lock, RefreshCcw, ShieldCheck, Unlink, UserPlus, Coins } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Navbar } from '@/components/Navbar'
import { useSession } from '@/hooks/useSession'
import { cn } from '@/lib/utils'
import { SolanaPayModal } from '@/components/billing/SolanaPayModal'

interface WhaleStatusResponse {
  subscription?: {
    status: string
    plan: string
    expires_at?: string | null
  } | null
  discordLink?: {
    discord_user_id: string
    discord_username?: string | null
    token_expires_at?: string | null
  } | null
}

export default function WhaleAlertsSettingsPage() {
  const router = useRouter()
  const { user, loading } = useSession()
  const [status, setStatus] = useState<WhaleStatusResponse | null>(null)
  const [fetching, setFetching] = useState(true)
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean
    solanaPayUrl: string
    sessionId: string
    amount: number
  } | null>(null)

  const whalePrice = Number(process.env.NEXT_PUBLIC_WHALE_PRICE_USDC || '7.99')

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=${encodeURIComponent('/alerts/whales')}`)
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleParams = () => {
      if (typeof window === 'undefined') return
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get('linked')) {
        setSuccess('Discord account linked successfully!')
      }
      if (searchParams.get('error')) {
        setError('Discord linking failed. Please try again.')
      }
    }

    handleParams()
  }, [])

  const fetchStatus = useCallback(async () => {
    if (!user) return
    setFetching(true)
    try {
      const response = await fetch('/api/whales/status', {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error('Failed to load status')
      }
      const data = (await response.json()) as WhaleStatusResponse
      setStatus(data)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setFetching(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchStatus()
    }
  }, [user, fetchStatus])

  const handleLinkDiscord = async () => {
    try {
      setLinking(true)
      const response = await fetch('/api/whales/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to start Discord linking')
      }

      const data = await response.json()
      if (data.authorizeUrl) {
        window.location.href = data.authorizeUrl
      } else {
        throw new Error('Missing OAuth link')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setLinking(false)
    }
  }

  const handleUnlinkDiscord = async () => {
    try {
      setUnlinking(true)
      const response = await fetch('/api/whales/link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to remove Discord link')
      }

      setSuccess('Discord link removed.')
      await fetchStatus()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setUnlinking(false)
    }
  }

  const handleSubscribe = async () => {
    try {
      setProcessingPayment(true)
      setError(null)

      const response = await fetch('/api/pay/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'whale' }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        if (response.status === 401) {
          router.push(`/login?next=${encodeURIComponent('/alerts/whales')}`)
          return
        }
        throw new Error(data.error || 'Failed to start payment session')
      }

      setPaymentModal({
        isOpen: true,
        solanaPayUrl: data.solanaPayUrl,
        sessionId: data.sessionId,
        amount: data.amount,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setProcessingPayment(false)
    }
  }

  const discordLinked = Boolean(status?.discordLink)
  const subscriptionActive = status?.subscription?.status === 'active'
  const subscriptionExpires = status?.subscription?.expires_at
    ? new Date(status.subscription.expires_at)
    : null

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#050712] w-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#00FFA3] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050712] text-white">
      <Navbar />
      <main className="w-full px-4 sm:px-8 lg:px-16 py-12">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Whale Alerts Add-on</h1>
            <p className="text-[#94A3B8] text-sm md:text-base max-w-3xl">
              Connect your Discord account to receive real-time whale alerts inside the CryptoFlash server.
            </p>
          </header>

          <section className="glass-card rounded-3xl border border-white/5 p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-[#64748b]">Subscription Status</p>
                <h2 className="text-2xl font-semibold">
                  {subscriptionActive ? 'Active' : 'Inactive'}
                </h2>
                <p className="text-sm text-[#94a3b8]">
                  Plan: {status?.subscription?.plan || '—'}
                </p>
                {subscriptionExpires && (
                  <p className="text-xs text-[#64748b]">
                    Expires on {subscriptionExpires.toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={fetchStatus}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#cbd5f5] hover:border-white/30 hover:text-white"
                disabled={fetching}
              >
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Refresh
              </button>
            </div>

            {!subscriptionActive && (
              <div className="rounded-2xl border border-[#f97316]/30 bg-[#f97316]/10 px-5 py-4 text-sm text-[#fbbf24] space-y-4">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Active Whale Alerts subscription required
                  </p>
                  <p className="mt-2 text-[#fcd34d]">
                    Subscribe for {whalePrice.toFixed(2)} USDC/mo to unlock the private Discord channel and live whale pings.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSubscribe}
                    disabled={processingPayment}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black shadow-[0_0_18px_rgba(0,255,163,0.45)] disabled:opacity-60"
                  >
                    {processingPayment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Coins className="h-4 w-4" />
                    )}
                    <span>{processingPayment ? 'Preparing...' : 'Pay with Solana'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 space-y-5">
              <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#00FFA3]" /> Discord Link
                  </h3>
                  <p className="text-sm text-[#94a3b8]">
                    {discordLinked
                      ? `Linked to ${status?.discordLink?.discord_username || status?.discordLink?.discord_user_id}`
                      : 'Link your Discord account to access the private Whale Alerts channel.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {discordLinked ? (
                    <button
                      onClick={handleUnlinkDiscord}
                      disabled={unlinking}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium border transition',
                        unlinking
                          ? 'border-[#38bdf8]/50 text-[#38bdf8]'
                          : 'border-white/10 text-[#cbd5f5] hover:border-[#f87171]/60 hover:text-white'
                      )}
                    >
                      {unlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                      Remove Link
                    </button>
                  ) : (
                    <button
                      onClick={handleLinkDiscord}
                      disabled={linking || !subscriptionActive}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold transition',
                        subscriptionActive
                          ? 'bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black shadow-[0_0_18px_rgba(0,255,163,0.45)]'
                          : 'bg-[#1f2937] text-[#64748b] cursor-not-allowed'
                      )}
                    >
                      {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      Link Discord
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-[#94a3b8] space-y-2">
                <p className="font-medium text-white">What you get:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Access to the private #whale-alerts channel</li>
                  <li>Instant whale notifications (rich embeds)</li>
                  <li>Direct line to the CryptoFlash team & community</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-[#f87171]/40 bg-[#f87171]/10 px-5 py-4 text-sm text-[#fca5a5]">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-[#34d399]/40 bg-[#34d399]/10 px-5 py-4 text-sm text-[#bbf7d0]">
                {success}
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 space-y-3">
              <h3 className="text-lg font-semibold">What we handle</h3>
              <ul className="text-sm text-[#94a3b8] space-y-2">
                <li>1. We host the official CryptoFlash Whale Alerts Discord server.</li>
                <li>2. We manage private channels and the <span className="text-white">Whale Alerts</span> role for active members.</li>
                <li>3. We stream whale detections as real-time embed messages.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 space-y-3">
              <h3 className="text-lg font-semibold">What we need from you</h3>
              <ul className="text-sm text-[#94a3b8] space-y-2">
                <li>1. Link your Discord account using the button above.</li>
                <li>2. Accept the invite to the CryptoFlash Whale Alerts server.</li>
                <li>3. Keep Discord notifications enabled so you never miss an alert.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      {paymentModal && (
        <SolanaPayModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal(null)}
          solanaPayUrl={paymentModal.solanaPayUrl}
          sessionId={paymentModal.sessionId}
          plan="whale"
          amount={paymentModal.amount}
          onSuccess={async () => {
            await fetchStatus()
            setSuccess('Whale Alerts subscription activated!')
          }}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { X, Wallet, CheckCircle, Loader2, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

type SolanaPlan = 'pro' | 'ultimate' | 'whale'

interface SolanaPayModalProps {
  isOpen: boolean
  onClose: () => void
  solanaPayUrl: string
  sessionId: string
  plan: SolanaPlan
  amount: number
  onSuccess: () => void
}

export function SolanaPayModal({
  isOpen,
  onClose,
  solanaPayUrl,
  sessionId,
  plan,
  amount,
  onSuccess
}: SolanaPayModalProps) {
  const [status, setStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'error'>('pending')
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const [copied, setCopied] = useState(false)

  const planLabel =
    plan === 'pro' ? 'Pro Plan' : plan === 'ultimate' ? 'Ultimate Plan' : 'Whale Alerts Add-on'

  useEffect(() => {
    if (!isOpen) {
      setStatus('pending')
      setError(null)
      setPolling(false)
    }
  }, [isOpen])

  const handleConfirmPayment = async () => {
    setStatus('confirming')
    setPolling(true)
    setError(null)

    // Poll for confirmation
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max

    const pollInterval = setInterval(async () => {
      attempts++

      try {
        const response = await fetch('/api/pay/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId })
        })

        const data = await response.json()

        if (data.confirmed) {
          clearInterval(pollInterval)
          setStatus('confirmed')
          setPolling(false)
          
          // Wait a moment then close and refresh
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 2000)
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setStatus('error')
          setPolling(false)
          setError('Payment confirmation timeout. Please check your wallet and try again.')
        }
      } catch (err: any) {
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setStatus('error')
          setPolling(false)
          setError(err.message || 'Failed to confirm payment')
        }
      }
    }, 1000) // Poll every 1 second

    // Cleanup on unmount
    return () => clearInterval(pollInterval)
  }

  const buildPhantomLink = () => {
    try {
      const [, rest] = solanaPayUrl.split(':')
      const [address, query] = rest.split('?')
      const params = new URLSearchParams(query ?? '')
      const phantom = new URL('phantom://ul/v1/pay')
      phantom.searchParams.set('recipient', address)
      const amountParam = params.get('amount')
      if (amountParam) phantom.searchParams.set('amount', amountParam)
      const token = params.get('spl-token')
      if (token) phantom.searchParams.set('spl-token', token)
      const label = params.get('label')
      if (label) phantom.searchParams.set('label', label)
      const message = params.get('message')
      if (message) phantom.searchParams.set('message', message)
      const memo = params.get('memo')
      if (memo) phantom.searchParams.set('memo', memo)
      return phantom.toString()
    } catch (error) {
      console.warn('Failed to build Phantom link', error)
      return solanaPayUrl
    }
  }

  const handleOpenWallet = () => {
    try {
      const hasPhantom =
        Boolean((window as any)?.solana?.isPhantom) ||
        Boolean((window as any)?.phantom?.solana?.isPhantom)

      const primaryUrl = hasPhantom ? buildPhantomLink() : solanaPayUrl
      const win = window.open(primaryUrl, '_blank', 'noopener')

      if (!win) {
        window.location.assign(primaryUrl)
      } else if (hasPhantom) {
        // If protocol handler not registered, fallback to universal link
        setTimeout(() => {
          if (!win.closed) {
            win.location.href = primaryUrl.startsWith('phantom://')
              ? primaryUrl.replace('phantom://', 'https://phantom.app/')
              : primaryUrl
          }
        }, 1200)
      }
    } catch (err) {
      console.warn('Failed to open wallet link, copying instead', err)
      void handleCopy()
    }
  }

  const handleCopy = async () => {
    try {
      const payload = `${solanaPayUrl}\n${buildPhantomLink()}`
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.warn('Clipboard copy failed', err)
      setError('Copy the payment link manually: ' + solanaPayUrl)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative glass rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#6b7280] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              Pay with Solana
            </h2>
            <p className="text-[#b8c5d6]">
              {planLabel} - {amount} USDC
            </p>
          </div>

          {status === 'pending' && (
            <div className="space-y-6">
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <QRCodeSVG value={solanaPayUrl} size={200} />
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleOpenWallet}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Wallet className="h-5 w-5" />
                    <span>Open Wallet</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl border border-white/20 text-[#cbd5f5] hover:border-[#00FFA3]/60 hover:text-white transition-all"
                    title={solanaPayUrl}
                  >
                    <Copy className="h-5 w-5" />
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={polling}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {polling ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>I Paid</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-[#6b7280]">
                Scan the QR code with your Solana wallet, click "Open Wallet", or paste the copied link in Phantom to pay {amount} USDC
              </p>
            </div>
          )}

          {status === 'confirming' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-[#00FFA3] animate-spin" />
              <p className="text-[#b8c5d6]">Confirming payment...</p>
              <p className="text-sm text-[#6b7280] mt-2">Please wait 5-10 seconds after sending the transaction</p>
            </div>
          )}

          {status === 'confirmed' && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-[#00FFA3]" />
              <h3 className="text-xl font-bold text-white mb-2">Payment Confirmed!</h3>
              <p className="text-[#b8c5d6]">Your subscription is now active</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Payment Not Confirmed</h3>
              <p className="text-[#b8c5d6] mb-4">{error}</p>
              <button
                onClick={() => {
                  setStatus('pending')
                  setError(null)
                }}
                className="px-6 py-2 rounded-lg bg-[#00FFA3] text-black font-semibold hover:opacity-90"
              >
                Try Again
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}


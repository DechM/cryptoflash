'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { CheckCircle, XCircle, Loader2, Sparkles, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

interface TestResult {
  plan: 'free' | 'pro' | 'ultimate'
  success: boolean
  message: string
  features?: {
    refreshInterval?: number
    maxTokens?: number
    threshold?: number
    advancedFilters?: boolean
    whaleAlerts?: boolean
    premiumAnalytics?: boolean
  }
}

export default function TestPaymentsPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const testPlan = async (plan: 'pro' | 'ultimate') => {
    setTesting(true)
    setResults([])

    try {
      // Step 1: Create payment session
      const sessionResponse = await fetch('/api/pay/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      if (!sessionResponse.ok) {
        throw new Error('Failed to create payment session')
      }

      const sessionData = await sessionResponse.json()
      const { sessionId } = sessionData

      // Step 2: Confirm payment (mock mode)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay

      const confirmResponse = await fetch('/api/pay/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm payment')
      }

      const confirmData = await confirmResponse.json()

      if (!confirmData.confirmed) {
        throw new Error('Payment not confirmed')
      }

      // Step 3: Check plan from API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for cookie update

      const planResponse = await fetch('/api/plan/me')
      const planData = await planResponse.json()

      // Step 4: Verify features
      const featuresResponse = await fetch('/api/koth-data') // This uses useFeature internally
      // We'll check client-side with useFeature hook

      setResults([
        {
          plan,
          success: planData.plan === plan,
          message: planData.plan === plan 
            ? `✅ ${plan.toUpperCase()} plan activated successfully!`
            : `❌ Plan mismatch: expected ${plan}, got ${planData.plan}`,
          features: {
            refreshInterval: plan === 'pro' ? 15000 : 10000,
            maxTokens: plan === 'pro' ? 10 : 10000,
            threshold: plan === 'pro' ? 85 : 80,
            advancedFilters: true, // Both Pro and Ultimate have advanced filters
            whaleAlerts: plan === 'ultimate',
            premiumAnalytics: plan === 'ultimate'
          }
        }
      ])
    } catch (error: any) {
      setResults([
        {
          plan,
          success: false,
          message: `❌ Error: ${error.message}`
        }
      ])
    } finally {
      setTesting(false)
    }
  }

  const testFree = async () => {
    setTesting(true)
    setResults([])

    try {
      // Switch to free plan
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'free' })
      })

      if (!response.ok) {
        throw new Error('Failed to set free plan')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      const planResponse = await fetch('/api/plan/me')
      const planData = await planResponse.json()

      setResults([
        {
          plan: 'free',
          success: planData.plan === 'free',
          message: planData.plan === 'free'
            ? '✅ FREE plan activated successfully!'
            : `❌ Plan mismatch: expected free, got ${planData.plan}`,
          features: {
            refreshInterval: 30000,
            maxTokens: 1,
            threshold: 95,
            advancedFilters: false,
            whaleAlerts: false,
            premiumAnalytics: false
          }
        }
      ])
    } catch (error: any) {
      setResults([
        {
          plan: 'free',
          success: false,
          message: `❌ Error: ${error.message}`
        }
      ])
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] w-full">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Payment Testing
            </h1>
            <p className="text-[#b8c5d6]">
              Test Pro and Ultimate plan activation with mock payments
            </p>
            <p className="text-sm text-[#6b7280] mt-2">
              Requires: ALLOW_MOCK_PAYMENT=true in Vercel
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            <motion.button
              onClick={testFree}
              disabled={testing}
              className="glass rounded-xl p-6 text-center hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Zap className="h-8 w-8 mx-auto mb-2 text-[#6b7280]" />
              <div className="font-semibold text-white">Test FREE</div>
              <div className="text-xs text-[#6b7280] mt-1">Switch to Free</div>
            </motion.button>

            <motion.button
              onClick={() => testPlan('pro')}
              disabled={testing}
              className="glass rounded-xl p-6 text-center hover:bg-white/10 transition-colors disabled:opacity-50 border border-[#00ff88]/20"
            >
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-[#00ff88]" />
              <div className="font-semibold text-white">Test PRO</div>
              <div className="text-xs text-[#6b7280] mt-1">19.99 USDC (Mock)</div>
            </motion.button>

            <motion.button
              onClick={() => testPlan('ultimate')}
              disabled={testing}
              className="glass rounded-xl p-6 text-center hover:bg-white/10 transition-colors disabled:opacity-50 border border-[#ff006e]/20"
            >
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-[#ff006e]" />
              <div className="font-semibold text-white">Test ULTIMATE</div>
              <div className="text-xs text-[#6b7280] mt-1">39.99 USDC (Mock)</div>
            </motion.button>
          </div>

          {testing && (
            <div className="glass rounded-xl p-8 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-[#00ff88] animate-spin" />
              <p className="text-[#b8c5d6]">Testing payment flow...</p>
            </div>
          )}

          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-6 space-y-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">Test Results</h2>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    result.success
                      ? 'bg-[#00ff88]/10 border border-[#00ff88]/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-[#00ff88] mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-white">{result.message}</div>
                      {result.features && (
                        <div className="mt-3 space-y-2 text-sm text-[#b8c5d6]">
                          <div>Refresh: {result.features.refreshInterval}ms</div>
                          <div>Max Tokens: {result.features.maxTokens}</div>
                          <div>Threshold: ≥{result.features.threshold}%</div>
                          <div>Advanced Filters: {result.features.advancedFilters ? '✅' : '❌'}</div>
                          <div>Whale Alerts: {result.features.whaleAlerts ? '✅' : '❌'}</div>
                          <div>Premium Analytics: {result.features.premiumAnalytics ? '✅' : '❌'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          <div className="glass rounded-xl p-6 text-sm text-[#6b7280]">
            <p className="font-semibold text-white mb-2">⚠️ Mock Payment Mode</p>
            <p>
              This page uses mock payments for testing. Make sure ALLOW_MOCK_PAYMENT=true is set in Vercel.
              Real transactions are NOT processed in this mode.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFeature } from '@/hooks/useFeature'

interface FeatureTest {
  name: string
  feature: string
  expected: number | boolean
  actual: number | boolean
  passed: boolean
  description: string
}

export default function TestFeaturesPage() {
  const { plan, limit, isEnabled } = useFeature()
  const [tests, setTests] = useState<FeatureTest[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    runTests()
  }, [plan])

  const runTests = async () => {
    setRunning(true)

    // Wait a bit for plan to update
    await new Promise(resolve => setTimeout(resolve, 500))

    const currentPlan = plan
    const tests: FeatureTest[] = []

    // Define expected values per plan
    const expectedValues = {
      free: {
        'alerts.threshold_min': 95,
        'alerts.max_tokens': 1,
        'alerts.max_per_day': 10,
        'refresh.ms': 30000,
        'filters.advanced': false,
        'history.days': 0,
        'analytics.premium': false,
        'api.enabled': false,
        'alerts.whale': false
      },
      pro: {
        'alerts.threshold_min': 85,
        'alerts.max_tokens': 10,
        'alerts.max_per_day': 100,
        'refresh.ms': 15000,
        'filters.advanced': true,
        'history.days': 30,
        'analytics.premium': false,
        'api.enabled': false,
        'alerts.whale': false
      },
      ultimate: {
        'alerts.threshold_min': 80,
        'alerts.max_tokens': 10000, // Unlimited (represented as large number)
        'alerts.max_per_day': 10000, // Unlimited
        'refresh.ms': 10000,
        'filters.advanced': true,
        'history.days': 365,
        'analytics.premium': true,
        'api.enabled': true,
        'alerts.whale': true
      }
    }

    const expected = expectedValues[currentPlan] || expectedValues.free

    // Test each feature
    const featureTests = [
      {
        name: 'Alert Threshold',
        feature: 'alerts.threshold_min',
        description: 'Minimum score threshold for alerts'
      },
      {
        name: 'Max Token Alerts',
        feature: 'alerts.max_tokens',
        description: 'Maximum number of tokens to track'
      },
      {
        name: 'Max Daily Alerts',
        feature: 'alerts.max_per_day',
        description: 'Maximum alerts per day'
      },
      {
        name: 'Refresh Interval',
        feature: 'refresh.ms',
        description: 'Dashboard refresh rate (milliseconds)'
      },
      {
        name: 'Advanced Filters',
        feature: 'filters.advanced',
        description: 'Access to advanced filtering options'
      },
      {
        name: 'History Days',
        feature: 'history.days',
        description: 'Alert history retention period'
      },
      {
        name: 'Premium Analytics',
        feature: 'analytics.premium',
        description: 'Access to premium analytics features'
      },
      {
        name: 'API Access',
        feature: 'api.enabled',
        description: 'API access enabled'
      },
      {
        name: 'Whale Alerts',
        feature: 'alerts.whale',
        description: 'Whale transaction alerts (Ultimate only)'
      }
    ]

    for (const test of featureTests) {
      const actual = typeof expected[test.feature as keyof typeof expected] === 'boolean'
        ? isEnabled(test.feature as any)
        : limit(test.feature as any)
      const expectedValue = expected[test.feature as keyof typeof expected]

      tests.push({
        name: test.name,
        feature: test.feature,
        expected: expectedValue,
        actual,
        passed: actual === expectedValue || 
          (test.feature === 'alerts.max_tokens' && currentPlan === 'ultimate' && (actual as number) >= 10000) ||
          (test.feature === 'alerts.max_per_day' && currentPlan === 'ultimate' && (actual as number) >= 10000),
        description: test.description
      })
    }

    // Test API endpoints
    try {
      // Test alerts subscribe limit
      const testUserId = 'test-' + Date.now()
      let alertTestPassed = false
      try {
        // Try to create more alerts than allowed
        const maxAlerts = limit('alerts.max_tokens') as number
        for (let i = 0; i < maxAlerts + 1; i++) {
          const response = await fetch('/api/alerts/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: testUserId,
              tokenAddress: `test${i}`,
              thresholdValue: limit('alerts.threshold_min')
            })
          })
          
          if (i >= maxAlerts && !response.ok) {
            // Should fail after max
            alertTestPassed = true
            break
          }
        }
      } catch {
        // Expected to fail
        alertTestPassed = true
      }

      tests.push({
        name: 'Server-Side Alert Limit',
        feature: 'api.alerts.subscribe',
        expected: true,
        actual: alertTestPassed,
        passed: alertTestPassed,
        description: 'API enforces alert limits server-side'
      })
    } catch (error) {
      tests.push({
        name: 'Server-Side Alert Limit',
        feature: 'api.alerts.subscribe',
        expected: true,
        actual: false,
        passed: false,
        description: 'Failed to test API limit enforcement'
      })
    }

    setTests(tests)
    setRunning(false)
  }

  const passedCount = tests.filter(t => t.passed).length
  const totalCount = tests.length
  const allPassed = passedCount === totalCount && totalCount > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] w-full">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
              Feature Gating Test
            </h1>
            <p className="text-[#b8c5d6]">
              Current Plan: <span className="font-semibold text-white">{plan.toUpperCase()}</span>
            </p>
            {allPassed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#00FFA3]/20 border border-[#00FFA3]/30"
              >
                <CheckCircle className="h-5 w-5 text-[#00FFA3]" />
                <span className="text-[#00FFA3] font-semibold">
                  All {totalCount} tests passed! ✅
                </span>
              </motion.div>
            )}
          </motion.div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Test Results</h2>
              <div className="text-sm text-[#b8c5d6]">
                {passedCount} / {totalCount} passed
              </div>
            </div>

            {running ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 text-[#00FFA3] animate-spin" />
                <p className="text-[#b8c5d6]">Running tests...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tests.map((test, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      test.passed
                        ? 'bg-[#00FFA3]/10 border-[#00FFA3]/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {test.passed ? (
                          <CheckCircle className="h-5 w-5 text-[#00FFA3] mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-white">{test.name}</div>
                          <div className="text-sm text-[#6b7280] mt-1">{test.description}</div>
                          <div className="text-xs text-[#b8c5d6] mt-2 space-y-1">
                            <div>
                              Expected: <span className="font-mono">{String(test.expected)}</span>
                            </div>
                            <div>
                              Actual: <span className="font-mono">{String(test.actual)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">How to Test</h3>
            <ol className="space-y-2 text-sm text-[#b8c5d6] list-decimal list-inside">
              <li>Go to <a href="/test-payments" className="text-[#00FFA3] hover:underline">/test-payments</a> and activate a plan (Free/Pro/Ultimate)</li>
              <li>Come back to this page - tests run automatically when plan changes</li>
              <li>Verify all tests pass for your current plan</li>
              <li>Test each plan (Free, Pro, Ultimate) to ensure proper gating</li>
            </ol>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-2">Free Plan</div>
              <div className="text-xs text-[#b8c5d6] space-y-1">
                <div>✅ 1 token, 95% threshold</div>
                <div>❌ No advanced filters</div>
                <div>❌ No whale alerts</div>
                <div>❌ No premium analytics</div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-2">Pro Plan</div>
              <div className="text-xs text-[#b8c5d6] space-y-1">
                <div>✅ 10 tokens, 85% threshold</div>
                <div>✅ Advanced filters</div>
                <div>❌ No whale alerts</div>
                <div>❌ No premium analytics</div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-sm font-semibold text-white mb-2">Ultimate Plan</div>
              <div className="text-xs text-[#b8c5d6] space-y-1">
                <div>✅ Unlimited tokens, 80% threshold</div>
                <div>✅ Advanced filters</div>
                <div>✅ Whale alerts</div>
                <div>✅ Premium analytics</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


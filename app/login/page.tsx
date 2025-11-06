'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { useSession } from '@/hooks/useSession'
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const verified = searchParams.get('verified')
  const urlError = searchParams.get('error')
  const urlMessage = searchParams.get('message')
  const { user, loading: sessionLoading } = useSession()

  // Redirect if already logged in
  useEffect(() => {
    if (!sessionLoading && user) {
      router.push(next)
    }
  }, [user, sessionLoading, router, next])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        router.push(next)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
        }
      })

      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
      // Redirect happens automatically
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1020] w-full">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 border border-white/10"
          >
            <h1 className="text-3xl font-bold gradient-text mb-2 text-center">
              Sign In
            </h1>
            <p className="text-[#b8c5d6] text-center mb-8">
              Welcome back to CryptoFlash
            </p>

            {/* Email verification required message (only if not logged in) */}
            {verified === 'false' && !user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start space-x-3"
              >
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-400 font-semibold mb-1">Email verification required</p>
                  <p className="text-xs text-[#6b7280]">Please check your email and click the verification link.</p>
                </div>
              </motion.div>
            )}

            {/* Verification error messages */}
            {urlError && !user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                  urlError === 'expired'
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : urlError === 'invalid_link' || urlError === 'verification_failed'
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-blue-500/10 border border-blue-500/30'
                }`}
              >
                <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  urlError === 'expired'
                    ? 'text-yellow-400'
                    : urlError === 'invalid_link' || urlError === 'verification_failed'
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`} />
                <div>
                  <p className={`text-sm font-semibold mb-1 ${
                    urlError === 'expired'
                      ? 'text-yellow-400'
                      : urlError === 'invalid_link' || urlError === 'verification_failed'
                      ? 'text-red-400'
                      : 'text-blue-400'
                  }`}>
                    {urlError === 'expired' && 'Verification Link Expired'}
                    {urlError === 'invalid_link' && 'Invalid Link'}
                    {urlError === 'verification_failed' && 'Verification Failed'}
                    {urlError === 'server_error' && 'Server Error'}
                    {!['expired', 'invalid_link', 'verification_failed', 'server_error'].includes(urlError) && 'Verification Error'}
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    {urlMessage ? decodeURIComponent(urlMessage) : 'Please try signing up again or contact support.'}
                  </p>
                  {urlError === 'expired' && (
                    <Link
                      href="/register"
                      className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                    >
                      Sign up again →
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-3"
              >
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#b8c5d6] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6b7280]" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#00FFA3] focus:outline-none text-white placeholder-[#6b7280]"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#b8c5d6] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6b7280]" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#00FFA3] focus:outline-none text-white placeholder-[#6b7280]"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#00FFA3] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#00FFA3] to-[#00D1FF] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#0B1020] text-[#6b7280]">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-6 w-full px-6 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-white font-semibold">Continue with Google</span>
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-[#6b7280]">
              Don't have an account?{' '}
              <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-[#00FFA3] hover:underline">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B1020] w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFA3] mx-auto mb-4"></div>
          <p className="text-[#b8c5d6]">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}


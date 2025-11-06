'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

/**
 * Client-side verification page
 * Handles Supabase redirects when session cookies might not be set yet
 */
function VerifyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if we have a code from Supabase redirect
        const code = searchParams.get('code')
        const token = searchParams.get('token') || searchParams.get('token_hash')
        const type = searchParams.get('type')

        console.log('Client-side verification:', { code, token, type })

        // If we have a code, exchange it for session
        if (code) {
          console.log('Exchanging code for session...')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Code exchange error:', error)
            setStatus('error')
            setMessage('Verification failed: ' + error.message)
            setTimeout(() => router.push('/login?error=verification_failed'), 3000)
            return
          }

          if (data.session) {
            console.log('Session created successfully:', data.user?.email)
            setStatus('success')
            setMessage('Email verified! Redirecting...')
            setTimeout(() => router.push('/dashboard'), 1500)
            return
          }
        }

        // If we have a token, verify it
        if (token && type) {
          console.log('Verifying token...')
          const { data, error } = await supabase.auth.verifyOtp({
            type: type as 'signup' | 'email' | 'recovery',
            token_hash: token,
          })

          if (error) {
            console.error('Token verification error:', error)
            setStatus('error')
            setMessage('Verification failed: ' + error.message)
            setTimeout(() => {
              const errorType = error.message?.includes('expired') ? 'expired' : 'verification_failed'
              router.push(`/login?error=${errorType}`)
            }, 3000)
            return
          }

          if (data.user) {
            console.log('Email verified successfully:', data.user.email)
            setStatus('success')
            setMessage('Email verified! Redirecting...')
            setTimeout(() => router.push('/dashboard'), 1500)
            return
          }
        }

        // Check if user is already authenticated (Supabase set session cookie)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (user && !userError) {
          console.log('User already authenticated:', user.email)
          setStatus('success')
          setMessage('Email verified! Redirecting...')
          setTimeout(() => router.push('/dashboard'), 1500)
          return
        }

        // No code, no token, no session - invalid link
        console.error('Verification failed: no code, token, or session')
        setStatus('error')
        setMessage('Invalid verification link. Please request a new one.')
        setTimeout(() => router.push('/login?error=invalid_link'), 3000)

      } catch (error: any) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An error occurred during verification')
        setTimeout(() => router.push('/login?error=server_error'), 3000)
      }
    }

    verifyEmail()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#0B1020] w-full flex items-center justify-center">
      <div className="glass rounded-2xl p-8 border border-white/10 text-center max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 text-[#00FFA3] animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold gradient-text mb-2">Verifying Email</h1>
            <p className="text-[#b8c5d6]">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="h-12 w-12 bg-[#00FFA3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-[#00FFA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-2">Email Verified!</h1>
            <p className="text-[#b8c5d6]">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-400 mb-2">Verification Failed</h1>
            <p className="text-[#b8c5d6]">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B1020] w-full flex items-center justify-center">
        <div className="glass rounded-2xl p-8 border border-white/10 text-center max-w-md">
          <Loader2 className="h-12 w-12 text-[#00FFA3] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold gradient-text mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  )
}


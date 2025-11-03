import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Email verification handler
 * Handles email confirmation links from Supabase
 * 
 * Supabase can redirect in two ways:
 * 1. Direct link with token: /auth/verify?token=...&type=signup
 * 2. After processing: /auth/verify (token already processed, session set)
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // Handle redirect_to parameter (clean up double slashes)
  let next = '/dashboard'
  const redirect_to = requestUrl.searchParams.get('redirect_to')
  if (redirect_to) {
    // Remove double slashes and normalize
    next = redirect_to.replace(/([^:]\/)\/+/g, '$1')
    // Extract pathname if it's a full URL
    try {
      const urlObj = new URL(next)
      next = urlObj.pathname + urlObj.search + urlObj.hash
    } catch {
      // If not a valid URL, treat as path
      next = redirect_to.replace(/([^:]\/)\/+/g, '$1')
    }
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Check if user is already authenticated (Supabase may have already processed the token)
    const { data: { user: existingUser }, error: userError } = await supabase.auth.getUser()
    
    if (existingUser && !userError) {
      // User is already authenticated - Supabase processed the token
      console.log('User already authenticated via session:', existingUser.email)
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    // Try to get token/code from URL
    // Supabase email links can have token in query params, hash, or Supabase might redirect with code
    const token = requestUrl.searchParams.get('token') || requestUrl.searchParams.get('token_hash')
    const code = requestUrl.searchParams.get('code') // Supabase might send code instead
    const type = requestUrl.searchParams.get('type')
    
    // Check hash fragment (Supabase sometimes puts token in #)
    const hash = requestUrl.hash
    let tokenFromHash = null
    if (hash) {
      try {
        const hashParams = new URLSearchParams(hash.substring(1)) // Remove #
        tokenFromHash = hashParams.get('token') || hashParams.get('token_hash')
      } catch (e) {
        // Hash might not be URLSearchParams format
        console.warn('Failed to parse hash:', e)
      }
    }
    
    const finalToken = token || tokenFromHash

    // If we have a code, try to exchange it for session (Supabase redirect flow)
    if (code && !finalToken) {
      console.log('Found code in URL, exchanging for session...')
      try {
        const { data: sessionData, error: codeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!codeError && sessionData.session) {
          console.log('Session created from code:', sessionData.user?.email)
          return NextResponse.redirect(new URL(next, requestUrl.origin))
        }
      } catch (e) {
        console.warn('Code exchange failed:', e)
      }
    }

    if (!finalToken || !type) {
      // No token and no session - invalid link
      console.error('Verification failed: no token/code and no session', { 
        hasToken: !!token, 
        hasTokenHash: !!tokenFromHash,
        hasCode: !!code,
        hasType: !!type,
        hasSession: !!existingUser,
        url: requestUrl.toString(),
        searchParams: Object.fromEntries(requestUrl.searchParams)
      })
      return NextResponse.redirect(
        new URL('/login?error=invalid_link&message=' + encodeURIComponent('Invalid verification link. The link may have expired or already been used. Please request a new one.'), requestUrl.origin)
      )
    }

    // Verify email token directly
    console.log('Verifying token directly...', { 
      type, 
      hasToken: !!finalToken,
      tokenSource: token ? 'query' : 'hash'
    })
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'recovery',
      token_hash: finalToken,
    })

    if (error) {
      console.error('Email verification error:', error)
      
      // Handle specific error types
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        return NextResponse.redirect(
          new URL(
            `/login?error=expired&message=${encodeURIComponent('Verification link has expired. Please request a new one.')}`,
            requestUrl.origin
          )
        )
      }

      return NextResponse.redirect(
        new URL(
          `/login?error=verification_failed&message=${encodeURIComponent(error.message || 'Verification failed')}`,
          requestUrl.origin
        )
      )
    }

    // Success - user is now verified and logged in
    if (data.user) {
      console.log('Email verification successful:', data.user.email)
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    // Fallback - redirect to login
    return NextResponse.redirect(new URL('/login', requestUrl.origin))
  } catch (error: any) {
    console.error('Error in email verification:', error)
    return NextResponse.redirect(
      new URL(
        `/login?error=server_error&message=${encodeURIComponent('An error occurred during verification')}`,
        requestUrl.origin
      )
    )
  }
}


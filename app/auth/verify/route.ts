import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Email verification handler
 * Handles email confirmation links from Supabase
 * GET /auth/verify?token_hash=...&type=signup
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') // 'signup', 'email', или 'recovery'
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (!token_hash || !type) {
    // Missing parameters - redirect to login with error
    return NextResponse.redirect(
      new URL('/login?error=invalid_link&message=' + encodeURIComponent('Invalid verification link'), requestUrl.origin)
    )
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

    // Verify email token
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'recovery',
      token_hash,
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
      // Redirect to dashboard or next parameter
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


import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * OAuth callback handler
 * Handles Google OAuth redirect and creates/updates user in public.users
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    const errorParam = error === 'access_denied' ? 'verification_failed' : 'auth_error'
    return NextResponse.redirect(
      new URL(`/login?error=${errorParam}`, requestUrl.origin)
    )
  }

  // Handle OAuth callback (Google, etc.) - has code parameter
  if (code) {
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

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError || !data.user) {
        console.error('OAuth callback error:', exchangeError)
        return NextResponse.redirect(
          new URL(`/login?error=oauth_failed`, requestUrl.origin)
        )
      }

      // The trigger handle_new_user() will automatically create public.users record
      // But we can also ensure it exists and update if needed
      try {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existingUser) {
          // Create user record (fallback if trigger didn't fire)
          await supabaseAdmin
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              subscription_status: 'free'
            }, {
              onConflict: 'id'
            })
        } else {
          // Update email if changed
          await supabaseAdmin
            .from('users')
            .update({
              email: data.user.email
            })
            .eq('id', data.user.id)
        }
      } catch (dbError) {
        console.error('Error ensuring user record:', dbError)
        // Continue anyway - trigger should handle it
      }

      // Redirect to the original destination or dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    } catch (err: any) {
      console.error('Error in OAuth callback:', err)
      return NextResponse.redirect(
        new URL(`/login?error=oauth_failed`, requestUrl.origin)
      )
    }
  }

  // Handle email verification - has token parameter
  if (token && type === 'email') {
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

    try {
      // Verify email token
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      })

      if (verifyError || !data.user) {
        console.error('Email verification error:', verifyError)
        return NextResponse.redirect(
          new URL(`/login?error=verification_failed`, requestUrl.origin)
        )
      }

      // Ensure user record exists
      try {
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existingUser) {
          await supabaseAdmin
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              subscription_status: 'free'
            }, {
              onConflict: 'id'
            })
        }
      } catch (dbError) {
        console.error('Error ensuring user record:', dbError)
      }

      // Redirect to login or dashboard
      return NextResponse.redirect(new URL(`/login?verified=true&next=${encodeURIComponent(next)}`, requestUrl.origin))
    } catch (err: any) {
      console.error('Error in email verification callback:', err)
      return NextResponse.redirect(
        new URL(`/login?error=verification_failed`, requestUrl.origin)
      )
    }
  }

  // No code or token parameter - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}


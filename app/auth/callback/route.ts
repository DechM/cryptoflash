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
  const next = requestUrl.searchParams.get('next') || '/dashboard'

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

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      console.error('OAuth callback error:', error)
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
            email: data.user.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)
      }
    } catch (dbError) {
      console.error('Error ensuring user record:', dbError)
      // Continue anyway - trigger should handle it
    }

    // Redirect to the original destination or dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}


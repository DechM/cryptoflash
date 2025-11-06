import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/**
 * Get Supabase client for server-side operations (Server Components)
 * Handles cookie-based session management
 * IMPORTANT: Never throws redirect errors - returns null on auth failure
 */
export async function createClient() {
  try {
    const cookieStore = await cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if we have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  } catch (error: any) {
    // Catch any redirect errors from Supabase SSR
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      console.error('Supabase SSR attempted redirect in API route context')
      throw new Error('Authentication failed - no redirect in API routes')
    }
    throw error
  }
}

/**
 * Get Supabase client from NextRequest (for API routes)
 * This is more reliable in API route context
 */
export function createClientFromRequest(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // In API routes, we can't set cookies directly
          // Middleware handles this
        },
      },
    }
  )
}

/**
 * Get current authenticated user (for Server Components)
 * Returns null if not authenticated
 * NEVER throws redirect errors - safe for Server Components
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    
    // First try to get session (might have session but not user)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError.message)
      return null
    }
    
    // If we have a session, try to get user
    if (session?.user) {
      return session.user
    }
    
    // Fallback: try getUser directly (this uses the session token)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Don't log "Auth session missing" as error - it's normal for unauthenticated users
      // Only log actual errors (network issues, etc.)
      if (!error.message?.includes('session') && !error.message?.includes('missing')) {
        console.error('Error getting user:', error.message)
      }
      return null
    }

    if (!user) {
      return null
    }

    return user
  } catch (error: any) {
    // Explicitly catch NEXT_REDIRECT errors and prevent them
    if (error?.digest?.includes('NEXT_REDIRECT') || error?.message?.includes('redirect')) {
      console.error('Blocked redirect in getCurrentUser (API route context)')
      return null
    }
    console.error('Error getting current user:', error?.message || error)
    return null
  }
}

/**
 * Get current authenticated user from NextRequest (for API routes)
 * This is more reliable in API route context
 */
export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    const supabase = createClientFromRequest(request)
    
    // Try getUser directly (this uses the session token from cookies)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Don't log "Auth session missing" as error - it's normal for unauthenticated users
      if (!error.message?.includes('session') && !error.message?.includes('missing')) {
        console.error('Error getting user from request:', error.message)
      }
      return null
    }

    return user || null
  } catch (error: any) {
    // Explicitly catch NEXT_REDIRECT errors and prevent them
    if (error?.digest?.includes('NEXT_REDIRECT') || error?.message?.includes('redirect')) {
      console.error('Blocked redirect in getCurrentUserFromRequest')
      return null
    }
    console.error('Error getting current user from request:', error?.message || error)
    return null
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in Server Components and API routes
 * 
 * NOTE: In API routes, throws a special error that should be caught and handled
 * with NextResponse.redirect() or NextResponse.json() with 401 status
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    // In API routes, we should return 401 instead of redirecting
    // Check if we're in an API route context
    const error = new Error('Unauthorized') as any
    error.status = 401
    error.redirectTo = '/login'
    throw error
  }

  return user
}

/**
 * Get current user's ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

// Re-export getUserPlan from plan.ts
export { getUserPlan } from './plan'


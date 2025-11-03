import { NextResponse } from "next/server";
import { getUserPlan, getCurrentUserId } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    // Get user ID from auth session
    const userId = await getCurrentUserId()
    
    if (!userId) {
      // Not authenticated - return free plan
      return NextResponse.json({ plan: 'free' })
    }

    // Get plan from database (source of truth)
    const plan = await getUserPlan(userId)
    
    // Also set cookie for client-side caching (optional)
    const res = NextResponse.json({ plan })
    res.cookies.set('cf_plan', plan, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    })
    
    return res
  } catch (error) {
    console.error('Error in /api/plan/me:', error)
    // Fallback to free on error
    return NextResponse.json({ plan: 'free' })
  }
}


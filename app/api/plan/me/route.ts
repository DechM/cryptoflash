import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    // Try to get userId from cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").map(s => s.trim());
    const userIdCookie = cookies.find(s => s.startsWith("userId="));
    const userId = userIdCookie?.split("=")[1];

    // If userId exists, get plan from Supabase (source of truth)
    if (userId) {
      try {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('subscription_status')
          .eq('id', userId)
          .single()

        if (user?.subscription_status) {
          const plan = user.subscription_status as 'free' | 'pro' | 'ultimate'
          
          // Validate plan
          const validPlans = ["free", "pro", "ultimate"];
          const validPlan = validPlans.includes(plan) ? plan : "free";
          
          // Also set cookie for consistency
          const res = NextResponse.json({ plan: validPlan })
          res.cookies.set('cf_plan', validPlan, {
            httpOnly: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 365 // 1 year
          })
          return res
        }
      } catch (supabaseError) {
        // If Supabase query fails, fall through to cookie
        console.warn('Error fetching plan from Supabase:', supabaseError)
      }
    }

    // Fallback to cookie if no userId or no Supabase data
    const planCookie = cookies.find(s => s.startsWith("cf_plan="));
    const plan = planCookie?.split("=")[1] || "free";
    
    // Validate plan
    const validPlans = ["free", "pro", "ultimate"];
    const validPlan = validPlans.includes(plan) ? plan : "free";
    
    return NextResponse.json({ plan: validPlan });
  } catch (error) {
    // Fallback on error - read from cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").map(s => s.trim());
    const planCookie = cookies.find(s => s.startsWith("cf_plan="));
    const plan = planCookie?.split("=")[1] || "free";
    const validPlans = ["free", "pro", "ultimate"];
    const validPlan = validPlans.includes(plan) ? plan : "free";
    return NextResponse.json({ plan: validPlan });
  }
}


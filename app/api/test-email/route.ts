import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Test endpoint to manually trigger email sending
 * This helps diagnose if Supabase is sending emails at all
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use Supabase Admin API to resend confirmation email
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify`
          : 'http://localhost:3000/auth/verify'
      }
    })

    if (error) {
      console.error('Error generating link:', error)
      return NextResponse.json({ 
        error: 'Failed to generate link',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Link generated successfully',
      hasLink: !!data.properties?.action_link,
      user: data.user,
      // Don't return the actual link for security
    })
  } catch (error: any) {
    console.error('Error in test-email:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}


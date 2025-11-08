import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

// Generate UUID without external library
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'stripe'
const ENABLE_SOL_PAY = process.env.ENABLE_SOL_PAY === 'true'
const MERCHANT_WALLET = process.env.MERCHANT_WALLET || ''
const USDC_MINT = process.env.USDC_MINT || ''
const PRO_PRICE_USDC = parseFloat(process.env.PRO_PRICE_USDC || '19.99')
const ULTIMATE_PRICE_USDC = parseFloat(process.env.ULTIMATE_PRICE_USDC || '39.99')
const WHALE_PRICE_USDC = parseFloat(process.env.WHALE_PLAN_PRICE_USDC || '7.99')

/**
 * Create Solana Pay session
 * POST /api/pay/create-session
 * Body: { plan: "pro" | "ultimate", userId?: string }
 */
export async function POST(req: Request) {
  try {
    // Check if Solana Pay is enabled
    if (PAYMENT_PROVIDER !== 'solana' && !ENABLE_SOL_PAY) {
      return NextResponse.json(
        { error: 'Solana Pay is not enabled' },
        { status: 400 }
      )
    }

    if (!MERCHANT_WALLET || !USDC_MINT) {
      return NextResponse.json(
        { error: 'Solana Pay configuration missing. Please set MERCHANT_WALLET and USDC_MINT environment variables.' },
        { status: 500 }
      )
    }

    // Check Supabase configuration
    if (!isSupabaseConfigured) {
      const missing = []
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
        missing.push('NEXT_PUBLIC_SUPABASE_URL')
      }
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-service-key') {
        missing.push('SUPABASE_SERVICE_ROLE_KEY')
      }
      
      return NextResponse.json(
        { 
          error: 'Database not configured',
          details: `Please set these environment variables in Vercel: ${missing.join(', ')}`
        },
        { status: 500 }
      )
    }

    // Check authentication - no anonymous payments
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to purchase a subscription' },
        { status: 401 }
      )
    }
    
    const finalUserId = user.id

    const body = await req.json()
    const { plan } = body

    // Validate plan
    if (plan !== 'pro' && plan !== 'ultimate' && plan !== 'whale') {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "pro", "ultimate" or "whale"' },
        { status: 400 }
      )
    }

    // Determine price
    const priceUsdc = plan === 'pro'
      ? PRO_PRICE_USDC
      : plan === 'ultimate'
        ? ULTIMATE_PRICE_USDC
        : WHALE_PRICE_USDC
    const planLabel =
      plan === 'pro'
        ? 'Pro Plan'
        : plan === 'ultimate'
          ? 'Ultimate Plan'
          : 'Whale Alerts Add-on'

    // Generate session ID
    const sessionId = generateUUID()

    // Insert pending payment (user must exist due to auth trigger)
    const { error: insertError } = await supabaseAdmin
      .from('crypto_payments')
      .insert({
        user_id: finalUserId,
        plan,
        amount_usdc: priceUsdc,
        session_id: sessionId,
        status: 'pending'
      })

    if (insertError) {
      console.error('Error creating payment session:', insertError)
      
      // Check if it's a foreign key constraint error (user doesn't exist)
      if (insertError.code === '23503' || insertError.message?.includes('foreign key') || insertError.message?.includes('violates foreign key constraint')) {
        // User doesn't exist, try to create it first
        try {
          const { error: createUserError } = await supabaseAdmin
            .from('users')
            .insert({
              id: finalUserId,
              subscription_status: 'free'
            })

          if (!createUserError) {
            // Retry payment insert
            const { error: retryError } = await supabaseAdmin
              .from('crypto_payments')
              .insert({
                user_id: finalUserId,
                plan,
                amount_usdc: priceUsdc,
                session_id: sessionId,
                status: 'pending'
              })

            if (retryError) {
              return NextResponse.json(
                { 
                  error: 'Failed to create payment session after creating user',
                  details: process.env.NODE_ENV === 'development' ? retryError.message : undefined
                },
                { status: 500 }
              )
            }
          } else {
            return NextResponse.json(
              { 
                error: 'User account required. Please create an account first.',
                details: process.env.NODE_ENV === 'development' ? createUserError.message : undefined
              },
              { status: 500 }
            )
          }
        } catch (error: any) {
          return NextResponse.json(
            { 
              error: 'Database error. Please try again.',
              details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
          )
        }
      } else if (insertError.code === '42P01' || insertError.message?.includes('does not exist') || insertError.message?.includes('relation')) {
        // Table doesn't exist - crypto_payments table needs to be created
        return NextResponse.json(
          { 
            error: 'Payment system not configured. Please run database migrations.',
            details: process.env.NODE_ENV === 'development' 
              ? `Table 'crypto_payments' does not exist. Please run the crypto_payments table creation SQL from supabase-schema.sql in your Supabase SQL Editor.`
              : 'Please contact support or check database setup.'
          },
          { status: 500 }
        )
      } else if (insertError.message?.includes('Invalid API key') || insertError.message?.includes('JWT')) {
        return NextResponse.json(
          { 
            error: 'Database configuration error',
            details: process.env.NODE_ENV === 'development' 
              ? 'Invalid Supabase credentials. Please check SUPABASE_SERVICE_ROLE_KEY in environment variables.'
              : undefined
          },
          { status: 500 }
        )
      } else {
        // Other database errors
        return NextResponse.json(
          { 
            error: 'Failed to create payment session',
            details: process.env.NODE_ENV === 'development' ? `${insertError.message || insertError.code || 'Unknown error'}` : undefined
          },
          { status: 500 }
        )
      }
    }

    // Generate Solana Pay URL
    // Format: solana:<recipient>?amount=<amount>&spl-token=<token>&label=<label>&message=<message>&memo=<memo>
    const solanaPayUrl = `solana:${MERCHANT_WALLET}?amount=${priceUsdc}&spl-token=${USDC_MINT}&label=CryptoFlash&message=${encodeURIComponent(planLabel)}&memo=${sessionId}`

    return NextResponse.json({
      sessionId,
      solanaPayUrl,
      amount: priceUsdc,
      plan,
      merchantWallet: MERCHANT_WALLET,
      usdcMint: USDC_MINT
    })
  } catch (error: any) {
    console.error('Error in create-session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


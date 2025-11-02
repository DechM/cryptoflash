import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
        { error: 'Solana Pay configuration missing' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { plan, userId } = body

    // Validate plan
    if (plan !== 'pro' && plan !== 'ultimate') {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "pro" or "ultimate"' },
        { status: 400 }
      )
    }

    // Determine price
    const priceUsdc = plan === 'pro' ? PRO_PRICE_USDC : ULTIMATE_PRICE_USDC

    // Generate session ID
    const sessionId = generateUUID()

    // Get or create user
    let finalUserId = userId
    if (!finalUserId) {
      // Try to get from cookie or create anonymous user
      const cookieHeader = req.headers.get('cookie') || ''
      const userIdCookie = cookieHeader.split(';').find(s => s.trim().startsWith('cf_user_id='))
      finalUserId = userIdCookie?.split('=')[1] || generateUUID()
    }

    // Insert pending payment
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
      return NextResponse.json(
        { error: 'Failed to create payment session' },
        { status: 500 }
      )
    }

    // Generate Solana Pay URL
    // Format: solana:<recipient>?amount=<amount>&spl-token=<token>&label=<label>&message=<message>&memo=<memo>
    const solanaPayUrl = `solana:${MERCHANT_WALLET}?amount=${priceUsdc}&spl-token=${USDC_MINT}&label=CryptoFlash&message=Subscription ${plan}&memo=${sessionId}`

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


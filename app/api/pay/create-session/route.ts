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
      // Try to get from cookie
      const cookieHeader = req.headers.get('cookie') || ''
      const userIdCookie = cookieHeader.split(';').find(s => s.trim().startsWith('cf_user_id='))
      finalUserId = userIdCookie?.split('=')[1] || null
    }

    // If no userId, create anonymous user in database
    if (!finalUserId) {
      try {
        const { data: newUser, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            subscription_status: 'free'
          })
          .select()
          .single()

        if (userError) {
          console.error('Error creating user:', userError)
          // If database error, allow payment without user (for development)
          // In production, this should fail
          if (process.env.NODE_ENV === 'production') {
            return NextResponse.json(
              { error: 'Failed to create user account. Please try again.' },
              { status: 500 }
            )
          }
          // Development: use generated UUID but warn
          finalUserId = generateUUID()
          console.warn('Using generated userId without database entry:', finalUserId)
        } else {
          finalUserId = newUser.id
        }
      } catch (error: any) {
        console.error('Error creating user:', error)
        // Fallback for development
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json(
            { error: 'Database error. Please try again.' },
            { status: 500 }
          )
        }
        finalUserId = generateUUID()
      }
    } else {
      // Verify user exists in database
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', finalUserId)
        .single()

      if (fetchError || !existingUser) {
        // User doesn't exist, create it
        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: finalUserId,
            subscription_status: 'free'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user with ID:', createError)
          // If we can't create with provided ID, generate new one
          const { data: autoUser } = await supabaseAdmin
            .from('users')
            .insert({
              subscription_status: 'free'
            })
            .select()
            .single()

          if (autoUser) {
            finalUserId = autoUser.id
          } else {
            return NextResponse.json(
              { error: 'Failed to create user account' },
              { status: 500 }
            )
          }
        }
      }
    }

    // Insert pending payment
    // Note: user_id might not exist in users table if database is not configured
    // In that case, we'll allow it for development but log a warning
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
              ? `Table 'crypto_payments' does not exist. Please run supabase-schema.sql in your Supabase SQL Editor.`
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


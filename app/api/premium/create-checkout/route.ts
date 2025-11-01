import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY || ''
const stripe = stripeKey ? new Stripe(stripeKey) : null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, email, tier = 'pro' } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Check if Stripe is configured
    if (!stripe || !stripeKey || stripeKey === 'sk_test_placeholder') {
      console.error('Stripe not configured - STRIPE_SECRET_KEY missing or invalid')
      return NextResponse.json(
        { 
          error: 'Payment system not configured',
          details: 'STRIPE_SECRET_KEY environment variable is missing. Please configure Stripe in your environment variables.'
        },
        { status: 500 }
      )
    }

    // Determine price and product info based on tier
    const pricing = {
      pro: {
        priceId: process.env.STRIPE_PRICE_PRO,
        name: 'CryptoFlash Pro',
        description: 'Early alerts, 10 token tracking, advanced features'
      },
      ultimate: {
        priceId: process.env.STRIPE_PRICE_ULTIMATE,
        name: 'CryptoFlash Ultimate',
        description: 'Earliest alerts, unlimited tracking, API access, priority support'
      }
    }

    const plan = pricing[tier as 'pro' | 'ultimate'] || pricing.pro

    if (!plan.priceId) {
      return NextResponse.json(
        { 
          error: 'Price ID not configured',
          details: `STRIPE_PRICE_${tier.toUpperCase()} environment variable is missing`
        },
        { status: 500 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium?canceled=true`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId,
        tier: tier
      }
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    
    // More detailed error message
    let errorMessage = 'Failed to create checkout session'
    if (error.type === 'StripeInvalidRequestError') {
      errorMessage = `Stripe error: ${error.message}`
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}


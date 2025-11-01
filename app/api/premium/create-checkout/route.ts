import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

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

    // Determine price and product info based on tier
    const pricing = {
      pro: {
        unit_amount: 499, // $4.99
        name: 'PumpKing Pro',
        description: 'Early alerts, 10 token tracking, advanced features'
      },
      ultimate: {
        unit_amount: 1999, // $19.99
        name: 'PumpKing Ultimate',
        description: 'Earliest alerts, unlimited tracking, API access, priority support'
      }
    }

    const plan = pricing[tier as 'pro' | 'ultimate'] || pricing.pro

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.unit_amount,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/premium?canceled=true`,
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
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripeKey = process.env.STRIPE_SECRET_KEY || ''
const stripe = stripeKey ? new Stripe(stripeKey) : null as any // Type assertion for webhook handler

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    if (!stripe) {
      console.error('Stripe not configured - webhook cannot process')
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription') {
          const userId = session.client_reference_id || session.metadata?.userId
          const subscriptionId = session.subscription as string

          if (userId && subscriptionId) {
            // Get tier from metadata
            const tier = session.metadata?.tier || 'pro'
            // Validate tier
            const subscriptionTier = (tier === 'ultimate' ? 'ultimate' : 'pro') as 'pro' | 'ultimate'
            
            // Get subscription details to determine actual tier from price
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId)
              const priceId = subscription.items.data[0]?.price?.id
              
              // Check if priceId matches Ultimate tier
              const isUltimate = priceId === process.env.STRIPE_PRICE_ULTIMATE
              const finalTier = isUltimate ? 'ultimate' : 'pro'
              
              // Calculate expiration from subscription period
              const subscriptionAny = subscription as any
              const currentPeriodEnd = subscriptionAny.current_period_end
              const expiresAt = new Date(typeof currentPeriodEnd === 'number' ? currentPeriodEnd * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000)
              
              await supabaseAdmin
                .from('users')
                .update({
                  subscription_status: finalTier,
                  stripe_customer_id: session.customer as string,
                  stripe_subscription_id: subscriptionId,
                  subscription_expires_at: expiresAt.toISOString()
                })
                .eq('id', userId)
            } catch (err) {
              // Fallback: use metadata tier
              console.error('Error retrieving subscription:', err)
              const expiresAt = new Date()
              expiresAt.setDate(expiresAt.getDate() + 30)
              
              await supabaseAdmin
                .from('users')
                .update({
                  subscription_status: subscriptionTier,
                  stripe_customer_id: session.customer as string,
                  stripe_subscription_id: subscriptionId,
                  subscription_expires_at: expiresAt.toISOString()
                })
                .eq('id', userId)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find user by subscription ID
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1)

        if (users && users.length > 0) {
          const userId = users[0].id

          if (subscription.status === 'active' || subscription.status === 'trialing') {
            // Determine tier from subscription price
            const priceId = subscription.items.data[0]?.price?.id
            const tier = priceId === process.env.STRIPE_PRICE_ULTIMATE ? 'ultimate' : 'pro'
            
            // Update expiration from subscription period
            const subscriptionAny = subscription as any
            const currentPeriodEnd = subscriptionAny.current_period_end
            const expiresAt = new Date(typeof currentPeriodEnd === 'number' ? currentPeriodEnd * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000)
            
            await supabaseAdmin
              .from('users')
              .update({
                subscription_status: tier,
                subscription_expires_at: expiresAt.toISOString()
              })
              .eq('id', userId)
          } else {
            // Subscription canceled or past due
            await supabaseAdmin
              .from('users')
              .update({
                subscription_status: 'free',
                subscription_expires_at: null
              })
              .eq('id', userId)
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Invoice subscription can be string ID or Subscription object
        const subscriptionId = (invoice as any).subscription
          ? (typeof (invoice as any).subscription === 'string' 
              ? (invoice as any).subscription 
              : (invoice as any).subscription?.id)
          : null
          
        if (subscriptionId) {
          const { data: users } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .limit(1)

          if (users && users.length > 0) {
            // Get subscription to determine tier and expiration
            try {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId)
              const priceId = subscription.items.data[0]?.price?.id
              const tier = priceId === process.env.STRIPE_PRICE_ULTIMATE ? 'ultimate' : 'pro'
              
              const subscriptionAny = subscription as any
              const currentPeriodEnd = subscriptionAny.current_period_end
              const expiresAt = new Date(typeof currentPeriodEnd === 'number' ? currentPeriodEnd * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000)
              
              await supabaseAdmin
                .from('users')
                .update({
                  subscription_status: tier,
                  subscription_expires_at: expiresAt.toISOString()
                })
                .eq('id', users[0].id)
            } catch (err) {
              console.error('Error retrieving subscription for invoice:', err)
              // Fallback: use default pro with 30 days
              const expiresAt = new Date()
              expiresAt.setDate(expiresAt.getDate() + 30)
              
              await supabaseAdmin
                .from('users')
                .update({
                  subscription_status: 'pro',
                  subscription_expires_at: expiresAt.toISOString()
                })
                .eq('id', users[0].id)
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        // Handle failed payment - could downgrade to free or send notification
        // For MVP, we'll let Stripe handle retries
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

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
            // Get tier from metadata or determine from price
            const tier = session.metadata?.tier || 'pro'
            // If no tier in metadata, determine from amount
            const subscriptionTier = tier === 'ultimate' ? 'ultimate' : 'pro'
            
            // Calculate expiration (30 days from now for monthly subscription)
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
            // Update expiration date (30 days from now for monthly)
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 30)
            
            await supabaseAdmin
              .from('users')
              .update({
                subscription_status: 'pro',
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


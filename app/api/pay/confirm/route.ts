import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { activateWhaleSubscription } from '@/lib/whale-subscription'

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || ''
const HELIUS_BASE_URL = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : `https://api.devnet.solana.com` // Fallback to public RPC

const MERCHANT_WALLET = process.env.MERCHANT_WALLET || ''
const USDC_MINT = process.env.USDC_MINT || ''
const PRO_PRICE_USDC = parseFloat(process.env.PRO_PRICE_USDC || '19.99')
const ULTIMATE_PRICE_USDC = parseFloat(process.env.ULTIMATE_PRICE_USDC || '39.99')
const WHALE_PRICE_USDC = parseFloat(process.env.WHALE_PLAN_PRICE_USDC || '7.99')
const WHALE_DURATION_DAYS = Number(process.env.WHALE_PLAN_DURATION_DAYS || '30')

/**
 * Confirm Solana Pay transaction
 * POST /api/pay/confirm
 * Body: { sessionId: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    // Get payment session from database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('crypto_payments')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment session not found' },
        { status: 404 }
      )
    }

    const expectedAmount =
      payment.plan === 'pro'
        ? PRO_PRICE_USDC
        : payment.plan === 'ultimate'
          ? ULTIMATE_PRICE_USDC
          : WHALE_PRICE_USDC

    if (expectedAmount && Math.abs((payment.amount_usdc || 0) - expectedAmount) > 0.01) {
      console.warn(
        `[Payment Confirm] Amount mismatch for plan ${payment.plan}: expected ${expectedAmount}, got ${payment.amount_usdc}`
      )
    }

    // Check if already confirmed
    if (payment.status === 'confirmed') {
      const res = NextResponse.json({
        confirmed: true,
        plan: payment.plan,
        expiresAt: payment.expires_at
      })
      
      // Ensure cookie is set even if already confirmed
      res.cookies.set('cf_plan', payment.plan, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      })
      
      return res
    }

    // Check if expired
    if (payment.status === 'expired' || payment.status === 'failed') {
      return NextResponse.json(
        { error: 'Payment session expired or failed' },
        { status: 400 }
      )
    }

    // MOCK PAYMENT MODE (for testing only)
    const ALLOW_MOCK_PAYMENT = process.env.ALLOW_MOCK_PAYMENT === 'true'
    if (ALLOW_MOCK_PAYMENT) {
      let expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // default 30 days subscription
      let whaleActivated = false

      if (payment.plan === 'whale') {
        try {
          const newExpiry = await activateWhaleSubscription(payment.user_id, {
            plan: payment.plan,
            durationDays: WHALE_DURATION_DAYS,
          })
          expiresAt = newExpiry
          whaleActivated = true
        } catch (error) {
          console.error('[Whale Subscription] Failed to activate (mock):', error)
        }
      }

      // Confirm payment (mock)
      const { error: updateError } = await supabaseAdmin
        .from('crypto_payments')
        .update({
          status: 'confirmed',
          tx_signature: 'mock-tx-' + sessionId,
          confirmed_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq('session_id', sessionId)

      if (updateError) {
        console.error('Error updating mock payment:', updateError)
        return NextResponse.json(
          { error: 'Failed to confirm payment' },
          { status: 500 }
        )
      }

      if (payment.plan === 'pro' || payment.plan === 'ultimate') {
        const { error: userUpdateError } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: payment.plan,
            subscription_expires_at: expiresAt.toISOString()
          })
          .eq('id', payment.user_id)

        if (userUpdateError) {
          console.error('Error updating user subscription:', userUpdateError)
          // Don't fail - payment is confirmed
        }
      }

      const res = NextResponse.json({
        confirmed: true,
        plan: payment.plan,
        expiresAt: expiresAt.toISOString(),
        txSignature: 'mock-tx-' + sessionId,
        mock: true,
        whaleActive: whaleActivated
      })

      if (payment.plan === 'pro' || payment.plan === 'ultimate') {
        res.cookies.set('cf_plan', payment.plan, {
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 365 // 1 year
        })
      }

      if (payment.plan === 'whale' && whaleActivated) {
        res.cookies.set('cf_whale', 'active', {
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30
        })
      }

      return res
    }

    // Validate transaction via Helius/Solana RPC
    // Look for transactions to MERCHANT_WALLET with memo = sessionId
    const txSignature = await findTransactionByMemo(sessionId, payment.amount_usdc)

    if (!txSignature) {
      // Payment not found yet
      return NextResponse.json({
        confirmed: false,
        message: 'Transaction not found. Please wait a moment and try again.'
      })
    }

    let expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // default 30 days subscription
    let whaleActivated = false

    if (payment.plan === 'whale') {
      try {
        const newExpiry = await activateWhaleSubscription(payment.user_id, {
          plan: payment.plan,
          durationDays: WHALE_DURATION_DAYS,
        })
        expiresAt = newExpiry
        whaleActivated = true
      } catch (error) {
        console.error('[Whale Subscription] Failed to activate:', error)
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from('crypto_payments')
      .update({
        status: 'confirmed',
        tx_signature: txSignature,
        confirmed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .eq('session_id', sessionId)

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm payment' },
        { status: 500 }
      )
    }

    if (payment.plan === 'pro' || payment.plan === 'ultimate') {
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({
          subscription_status: payment.plan,
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', payment.user_id)

      if (userUpdateError) {
        console.error('Error updating user subscription:', userUpdateError)
        // Don't fail - payment is confirmed
      }
    }

    const res = NextResponse.json({
      confirmed: true,
      plan: payment.plan,
      expiresAt: expiresAt.toISOString(),
      txSignature,
      whaleActive: whaleActivated
    })

    if (payment.plan === 'pro' || payment.plan === 'ultimate') {
      res.cookies.set('cf_plan', payment.plan, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      })
    }

    if (payment.plan === 'whale' && whaleActivated) {
      res.cookies.set('cf_whale', 'active', {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30
      })
    }

    return res
  } catch (error: any) {
    console.error('Error in confirm payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Find transaction by memo and validate amount
 */
async function findTransactionByMemo(memo: string, expectedAmount: number): Promise<string | null> {
  try {
    // Use Helius DAS API or standard RPC to find transactions
    // This is a simplified version - in production, use proper Solana transaction parsing

    // Method 1: Try Helius DAS API (if available)
    if (HELIUS_API_KEY) {
      try {
        const response = await fetch(HELIUS_BASE_URL.replace('/?api-key=', '/v0/addresses/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'get-signatures',
            method: 'getSignaturesForAddress',
            params: [
              MERCHANT_WALLET,
              {
                limit: 100
              }
            ]
          })
        })

        const data = await response.json()
        const signatures = data.result || []

        // For each signature, get transaction details and check memo
        for (const sig of signatures.slice(0, 10)) { // Check last 10 transactions
          const txDetails = await getTransactionDetails(sig.signature)
          if (txDetails && txDetails.memo === memo && txDetails.amount >= expectedAmount) {
            return sig.signature
          }
        }
      } catch (heliusError) {
        console.warn('Helius API error, falling back to RPC:', heliusError)
      }
    }

    // Method 2: Fallback to public RPC (for devnet testing)
    // Note: This is less reliable, recommend using Helius in production
    const response = await fetch(HELIUS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-signatures',
        method: 'getSignaturesForAddress',
        params: [
          MERCHANT_WALLET,
          {
            limit: 50
          }
        ]
      })
    })

    const data = await response.json()
    const signatures = data.result || []

    // Check recent transactions
    for (const sig of signatures.slice(0, 20)) {
      const txDetails = await getTransactionDetails(sig.signature)
      if (txDetails && txDetails.memo === memo && txDetails.amount >= expectedAmount) {
        return sig.signature
      }
    }

    return null
  } catch (error: any) {
    console.error('Error finding transaction:', error)
    return null
  }
}

/**
 * Get transaction details and parse memo + amount
 */
async function getTransactionDetails(signature: string): Promise<{ memo: string | null; amount: number } | null> {
  try {
    const response = await fetch(HELIUS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-transaction',
        method: 'getTransaction',
        params: [
          signature,
          {
            maxSupportedTransactionVersion: 0
          }
        ]
      })
    })

    const data = await response.json()
    const transaction = data.result

    if (!transaction || !transaction.meta?.err === null) {
      return null // Transaction failed
    }

    // Parse memo from transaction message
    let memo: string | null = null
    const instructions = transaction.transaction?.message?.instructions || []
    for (const ix of instructions) {
      // Memo instruction type 18
      if (ix.programId === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr' || ix.program === 'spl-memo') {
        try {
          // Decode memo
          const memoData = Buffer.from(ix.data, 'base64').toString('utf-8')
          memo = memoData
        } catch {
          // Ignore decode errors
        }
      }
    }

    // Parse SPL token transfer amount
    let amount = 0
    const preBalances = transaction.meta?.preTokenBalances || []
    const postBalances = transaction.meta?.postTokenBalances || []

    for (let i = 0; i < preBalances.length; i++) {
      const pre = preBalances[i]
      const post = postBalances.find(
        (p: any) => p.accountIndex === pre.accountIndex && p.mint === USDC_MINT
      )

      if (post && pre.mint === USDC_MINT) {
        const preAmount = parseFloat(pre.uiTokenAmount?.uiAmountString || '0')
        const postAmount = parseFloat(post.uiTokenAmount?.uiAmountString || '0')
        
        // Check if this is a transfer TO the merchant wallet
        const accounts = transaction.transaction?.message?.accountKeys || []
        const merchantAccountIndex = accounts.findIndex((acc: any) => acc.pubkey === MERCHANT_WALLET)
        
        if (merchantAccountIndex === post.accountIndex && postAmount > preAmount) {
          amount = postAmount - preAmount
          break
        }
      }
    }

    return { memo, amount }
  } catch (error: any) {
    console.error('Error getting transaction details:', error)
    return null
  }
}


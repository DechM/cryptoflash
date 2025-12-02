import { NextRequest, NextResponse } from 'next/server'
import { postTweet, formatNewsTweet } from '@/lib/api/twitter'
import { sendNewsToDiscord } from '@/lib/discord'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/admin'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Manual Twitter Post Endpoint
 * Allows admins to manually post to Twitter and automatically post to Discord
 * 
 * POST /api/twitter/manual-post
 * Body: { text: string, imageUrl?: string, videoUrl?: string, postToDiscord?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { text, imageUrl, videoUrl, postToDiscord = true } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Post to Twitter
    const tweetResult = await postTweet(text, imageUrl || null, videoUrl || null)

    if (!tweetResult || 'rateLimited' in tweetResult) {
      return NextResponse.json({
        error: 'Failed to post to Twitter',
        rateLimited: 'rateLimited' in tweetResult,
        details: tweetResult
      }, { status: 500 })
    }

    const result: any = {
      success: true,
      tweetId: tweetResult.id,
      tweetUrl: `https://twitter.com/i/web/status/${tweetResult.id}`
    }

    // Post to Discord if requested
    if (postToDiscord) {
      try {
        // Try to extract hook and US flag from text
        const hookMatch = text.match(/^(JUST IN|BREAKING|ALERT|🚨|⚠️)/i)
        const hook = hookMatch ? hookMatch[1] : null
        const isUSRelated = text.includes('🇺🇸') || /(US|USA|United States|Trump|SEC|Federal)/i.test(text)

        await sendNewsToDiscord({
          title: text,
          hook: hook || null,
          isUSRelated,
          link: result.tweetUrl,
          imageUrl: imageUrl || null,
          videoUrl: videoUrl || null,
          source: 'CryptoFlash Manual'
        })

        result.discordPosted = true
        console.log('[Manual Post] Posted to Discord successfully')
      } catch (discordError: any) {
        console.warn('[Manual Post] Failed to post to Discord:', discordError.message)
        result.discordPosted = false
        result.discordError = discordError.message
        // Don't fail the whole request if Discord fails
      }
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Manual Post] Error:', message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


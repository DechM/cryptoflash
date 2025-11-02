import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegramMessage } from '@/lib/api/telegram'

/**
 * Telegram Webhook Handler
 * Handles incoming messages from Telegram Bot API
 * Set webhook URL in Telegram: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_DOMAIN>/api/telegram/webhook
 */
export async function POST(req: Request) {
  try {
    const update = await req.json().catch(() => ({}))
    
    // Handle both message and edited_message
    const msg = update.message || update.edited_message
    
    if (!msg?.chat?.id) {
      // Not a message we care about (e.g., callback_query, channel_post)
      return NextResponse.json({ ok: true })
    }

    const chatId = msg.chat.id as number
    const username = msg.from?.username || null
    const firstName = msg.from?.first_name || null
    const lastName = msg.from?.last_name || null
    const text = msg.text || ''
    const command = text.toLowerCase().trim()

    // Handle /start command
    if (command === '/start' || command.startsWith('/start ')) {
      // Create or update user by telegram_chat_id
      // First, try to find existing user by telegram_chat_id
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('telegram_chat_id', chatId.toString())
        .single()

      if (existingUser) {
        // Update existing user
        await supabaseAdmin
          .from('users')
          .update({
            telegram_username: username,
            telegram_chat_id: chatId.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
      } else {
        // Create new user - use upsert with telegram_chat_id as unique identifier
        const { error: upsertError } = await supabaseAdmin
          .from('users')
          .upsert(
            {
              telegram_chat_id: chatId.toString(),
              telegram_username: username,
              subscription_status: 'free'
            },
            {
              onConflict: 'telegram_chat_id'
            }
          )

        if (upsertError) {
          console.error('Error upserting user in Telegram webhook:', upsertError)
          // Log error but continue - user might already exist
        }
      }

      // Send welcome message
      const welcomeMessage = `✅ <b>CryptoFlash Alerts Activated!</b>

🚀 You will now receive KOTH alert signals here when tokens match your criteria.

📊 <b>How it works:</b>
1. Set up alerts on <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'}/alerts">cryptoflash.app/alerts</a>
2. We'll notify you when tokens hit your threshold score
3. Get early signals and snipe winners! 🎯

⚠️ <i>DYOR - This is not financial advice</i>`

      await sendTelegramMessage({
        chat_id: chatId,
        text: welcomeMessage
      })

      return NextResponse.json({ ok: true })
    }

    // Handle other commands (optional - for future features)
    if (command === '/help') {
      const helpMessage = `📚 <b>CryptoFlash Bot Commands:</b>

/start - Activate alerts and link your Telegram
/help - Show this help message

🌐 <b>Web Dashboard:</b>
${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'}

Create alerts and manage your settings on our website!`

      await sendTelegramMessage({
        chat_id: chatId,
        text: helpMessage
      })

      return NextResponse.json({ ok: true })
    }

    // Unknown command - send default message
    if (command.startsWith('/')) {
      await sendTelegramMessage({
        chat_id: chatId,
        text: `❓ Unknown command. Use /start to activate alerts or /help for more info.`
      })
    }

    // Default: acknowledge any other message
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error processing Telegram webhook:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'


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
      // Try to find existing user by telegram_chat_id
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('telegram_chat_id', chatId.toString())
        .single()

      if (existingUser) {
        // User already linked - update info and send welcome message
        await supabaseAdmin
          .from('users')
          .update({
            telegram_username: username,
            telegram_chat_id: chatId.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)

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

      // Try to find user by telegram_username if provided
      let foundUser = null
      if (username) {
        const { data: userByUsername } = await supabaseAdmin
          .from('users')
          .select('id, email, telegram_chat_id')
          .eq('telegram_username', username)
          .single()
        
        if (userByUsername && !userByUsername.telegram_chat_id) {
          // Found user by username, link it
          foundUser = userByUsername
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              telegram_username: username,
              telegram_chat_id: chatId.toString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', foundUser.id)
          
          if (updateError) {
            console.error('Error updating telegram_chat_id by username:', updateError)
            foundUser = null // Reset if update failed
          } else {
            console.log(`✅ Successfully linked Telegram chat_id ${chatId} to user ${foundUser.id} by username`)
          }
        }
      }

      // If not found by username, check if user sent /start with a linking code
      // Format: /start <linking_code> or /start email:<email>
      if (!foundUser && command.startsWith('/start ')) {
        const startParam = command.substring(7).trim() // Get part after "/start "
        
        // Try to find by email if format is /start email:user@example.com
        if (startParam.startsWith('email:')) {
          const email = startParam.substring(6).trim()
          if (email) {
            const { data: userByEmail } = await supabaseAdmin
              .from('users')
              .select('id, email, telegram_chat_id')
              .eq('email', email)
              .single()
            
            if (userByEmail) {
              if (userByEmail.telegram_chat_id && userByEmail.telegram_chat_id !== chatId.toString()) {
                // Already linked to different Telegram account
                await sendTelegramMessage({
                  chat_id: chatId,
                  text: `⚠️ <b>Account Already Linked</b>\n\nThis email is already linked to another Telegram account. Please contact support if you need to change it.`
                })
                return NextResponse.json({ ok: true })
              }
              
              // Link this Telegram account
              foundUser = userByEmail
              const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                  telegram_username: username,
                  telegram_chat_id: chatId.toString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', foundUser.id)
              
              if (updateError) {
                console.error('Error updating telegram_chat_id:', updateError)
                // Continue anyway - we'll try to send the message
              } else {
                console.log(`✅ Successfully linked Telegram chat_id ${chatId} to user ${foundUser.id}`)
              }
            }
          }
        }
      }

      if (!foundUser) {
        // No existing user found - user needs to create account first
        const welcomeMessage = `👋 <b>Welcome to CryptoFlash!</b>

🔐 <b>To activate alerts:</b>
1. Create an account at <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'}/register">cryptoflash.app/register</a>
2. Or login at <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'}/login">cryptoflash.app/login</a>
3. Set up alerts on <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'}/alerts">cryptoflash.app/alerts</a>
4. Click "Open Telegram Bot" to link your account

📊 Once linked, you'll receive KOTH alert signals here! 🚀

⚠️ <i>DYOR - This is not financial advice</i>`

        await sendTelegramMessage({
          chat_id: chatId,
          text: welcomeMessage
        })

        return NextResponse.json({ ok: true })
      }

      // Successfully linked - send confirmation
      // Double-check that the update was successful
      const { data: verifyUser } = await supabaseAdmin
        .from('users')
        .select('telegram_chat_id')
        .eq('id', foundUser.id)
        .single()
      
      if (verifyUser?.telegram_chat_id !== chatId.toString()) {
        console.error(`⚠️ Warning: telegram_chat_id mismatch after update. Expected: ${chatId}, Got: ${verifyUser?.telegram_chat_id}`)
        // Try one more time
        await supabaseAdmin
          .from('users')
          .update({
            telegram_chat_id: chatId.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', foundUser.id)
      }
      
      const linkedMessage = `✅ <b>Telegram Account Linked Successfully!</b>

🎉 Your CryptoFlash account is now connected to Telegram.

📊 <b>Next Steps:</b>
1. Go to <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://cryptoflash.app'}/alerts">cryptoflash.app/alerts</a>
2. Create alerts for tokens you want to track
3. You'll receive real-time alerts here when tokens match your criteria! 🚀

💡 <b>Test Alert:</b>
You can test if alerts work by clicking "Send Test Alert" on the alerts page.

⚠️ <i>DYOR - This is not financial advice</i>`

      await sendTelegramMessage({
        chat_id: chatId,
        text: linkedMessage
      })

      console.log(`✅ Sent linked confirmation message to chat_id ${chatId}`)
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


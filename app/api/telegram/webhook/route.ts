import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTelegramMessage } from '@/lib/api/telegram'

/**
 * Telegram Webhook Handler
 * Handles incoming messages from Telegram Bot API
 * Set webhook URL in Telegram: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_DOMAIN>/api/telegram/webhook
 */
// In-memory cache to prevent duplicate processing (simple rate limiting)
const processedUpdates = new Map<string, number>()
const PROCESSING_WINDOW = 5000 // 5 seconds

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
    const messageId = msg.message_id
    
    // Prevent duplicate processing (simple rate limiting)
    const updateKey = `${chatId}-${messageId}`
    const lastProcessed = processedUpdates.get(updateKey)
    const now = Date.now()
    
    if (lastProcessed && (now - lastProcessed) < PROCESSING_WINDOW) {
      console.log(`⏭️ Skipping duplicate update: ${updateKey}`)
      return NextResponse.json({ ok: true, skipped: true })
    }
    
    processedUpdates.set(updateKey, now)
    
    // Clean up old entries (keep last 1000)
    if (processedUpdates.size > 1000) {
      const entries = Array.from(processedUpdates.entries())
      entries.sort((a, b) => b[1] - a[1])
      processedUpdates.clear()
      entries.slice(0, 500).forEach(([key, time]) => processedUpdates.set(key, time))
    }

    // Handle /start command
    if (command === '/start' || command.startsWith('/start ')) {
      console.log(`📨 Received /start command from chat_id: ${chatId}, username: ${username || 'none'}, command: ${command}`)
      
      // Try to find existing user by telegram_chat_id
      const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('telegram_chat_id', chatId.toString())
        .single()
      
      if (existingUserError && existingUserError.code !== 'PGRST116') {
        console.error(`❌ Error checking existing user by telegram_chat_id:`, existingUserError)
      }

      if (existingUser) {
        // User already linked - update info and send welcome message
        await supabaseAdmin
          .from('users')
          .update({
            telegram_username: username,
            telegram_chat_id: chatId.toString()
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
          const { error: updateError, data: updateData } = await supabaseAdmin
            .from('users')
            .update({
              telegram_username: username,
              telegram_chat_id: chatId.toString()
            })
            .eq('id', foundUser.id)
            .select('telegram_chat_id')
            .single()
          
          if (updateError) {
            console.error('❌ Error updating telegram_chat_id by username:', updateError)
            foundUser = null // Reset if update failed
          } else if (updateData?.telegram_chat_id !== chatId.toString()) {
            console.error(`⚠️ Warning: telegram_chat_id mismatch by username. Expected: ${chatId.toString()}, Got: ${updateData?.telegram_chat_id}`)
            // Retry with explicit string conversion
            const { error: retryError } = await supabaseAdmin
              .from('users')
              .update({
                telegram_chat_id: String(chatId)
              })
              .eq('id', foundUser.id)
            
            if (retryError) {
              console.error('❌ Retry update by username also failed:', retryError)
              foundUser = null
            } else {
              console.log(`✅ Successfully linked Telegram chat_id ${chatId} to user ${foundUser.id} by username (retry)`)
            }
          } else {
            console.log(`✅ Successfully linked Telegram chat_id ${chatId} to user ${foundUser.id} by username`)
          }
        }
      }

      // If not found by username, check if user sent /start with a linking code
      // Format: /start <linking_code> or /start email:<email>
      if (!foundUser && command.startsWith('/start ')) {
        const startParam = command.substring(7).trim() // Get part after "/start "
        console.log(`🔍 Processing /start parameter: "${startParam}"`)
        
        // Try to find by email if format is /start email:user@example.com
        if (startParam.startsWith('email:')) {
          let email = startParam.substring(6).trim()
          // Remove all spaces from email (Telegram sometimes adds spaces in URLs)
          email = email.replace(/\s+/g, '')
          const normalizedEmail = email.toLowerCase().trim()
          console.log(`🔍 Looking for user by email: "${email}" (normalized: "${normalizedEmail}")`)
          
          if (email) {
            let userByEmail = null
            let emailError = null
            
            // Try case-insensitive search first
            const { data: userByEmailIlike, error: ilikeError } = await supabaseAdmin
              .from('users')
              .select('id, email, telegram_chat_id')
              .ilike('email', normalizedEmail)
              .single()
            
            if (ilikeError && ilikeError.code === 'PGRST116') {
              // No user found with ilike, try exact match as fallback
              console.log(`⚠️ No user found with ilike, trying exact match...`)
              const { data: userByEmailExact, error: exactError } = await supabaseAdmin
                .from('users')
                .select('id, email, telegram_chat_id')
                .eq('email', normalizedEmail)
                .single()
              
              if (exactError) {
                emailError = exactError
                console.error(`❌ Error finding user by email (exact match) ${normalizedEmail}:`, exactError)
                if (exactError.code === 'PGRST116') {
                  console.log(`⚠️ No user found with exact match either for email: ${normalizedEmail}`)
                }
              } else {
                userByEmail = userByEmailExact
                console.log(`✅ Found user with exact match: ${userByEmailExact?.id}`)
              }
            } else if (ilikeError) {
              emailError = ilikeError
              console.error(`❌ Error finding user by email (ilike) ${normalizedEmail}:`, ilikeError)
            } else {
              userByEmail = userByEmailIlike
              console.log(`✅ Found user with ilike match: ${userByEmailIlike?.id}`)
            }
            
            if (userByEmail) {
              console.log(`✅ Found user by email: ${userByEmail.id}, current telegram_chat_id: ${userByEmail.telegram_chat_id || 'NULL'}`)
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
              console.log(`🔗 Attempting to link chat_id ${chatId} (type: ${typeof chatId}) to user ${foundUser.id}`)
              
              const { error: updateError, data: updateData } = await supabaseAdmin
                .from('users')
                .update({
                  telegram_username: username,
                  telegram_chat_id: String(chatId) // Explicit string conversion
                })
                .eq('id', foundUser.id)
                .select('telegram_chat_id, telegram_username')
                .single()
              
              if (updateError) {
                console.error('❌ Error updating telegram_chat_id:', updateError)
                console.error('Error code:', updateError.code)
                console.error('Error message:', updateError.message)
                console.error('Error details:', JSON.stringify(updateError, null, 2))
                console.error(`User ID: ${foundUser.id}, Chat ID: ${chatId}, Chat ID type: ${typeof chatId}`)
                
                // Check if it's a type mismatch error (column is int8 instead of TEXT)
                const isTypeMismatch = updateError.message?.includes('integer') || 
                                      updateError.message?.includes('int8') ||
                                      updateError.message?.includes('bigint') ||
                                      updateError.code === '42804' // PostgreSQL type mismatch error
                
                if (isTypeMismatch) {
                  console.error('🚨 CRITICAL: Type mismatch detected! Column telegram_chat_id is likely int8, not TEXT!')
                  console.error('🚨 You need to run the SQL migration: supabase-migration-telegram-chat-id.sql')
                }
                
                // Don't spam - only send error message once
                const errorKey = `error-${chatId}`
                const lastError = processedUpdates.get(errorKey)
                if (!lastError || (now - lastError) > 60000) { // 1 minute cooldown
                  const errorMsg = isTypeMismatch 
                    ? `⚠️ <b>Database Configuration Error</b>\n\nYour database column type is incorrect. Please run the SQL migration to fix this.\n\nSee: supabase-migration-telegram-chat-id.sql`
                    : `⚠️ <b>Error Linking Account</b>\n\nThere was an error linking your account. Please try again or contact support.\n\nError: ${updateError.message || 'Unknown error'}`
                  
                  await sendTelegramMessage({
                    chat_id: chatId,
                    text: errorMsg
                  })
                  processedUpdates.set(errorKey, now)
                }
                return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
              }
              
              console.log(`📝 Update response data:`, JSON.stringify(updateData, null, 2))
              
              // Verify the update was successful
              if (!updateData || updateData.telegram_chat_id !== String(chatId)) {
                console.error(`⚠️ Warning: telegram_chat_id mismatch after update.`)
                console.error(`Expected: ${String(chatId)} (type: ${typeof String(chatId)})`)
                console.error(`Got: ${updateData?.telegram_chat_id || 'null'} (type: ${typeof updateData?.telegram_chat_id})`)
                console.error(`User ID: ${foundUser.id}`)
                
                // Try one more time with explicit string conversion and verify column exists
                const { error: retryError, data: retryData } = await supabaseAdmin
                  .from('users')
                  .update({
                    telegram_chat_id: String(chatId)
                  })
                  .eq('id', foundUser.id)
                  .select('telegram_chat_id')
                  .single()
                
                if (retryError) {
                  console.error('❌ Retry update also failed:', retryError)
                  console.error('Retry error details:', JSON.stringify(retryError, null, 2))
                  await sendTelegramMessage({
                    chat_id: chatId,
                    text: `⚠️ <b>Error Linking Account</b>\n\nThere was an error saving your Telegram link. Please try again or contact support.`
                  })
                  return NextResponse.json({ ok: false, error: retryError.message }, { status: 500 })
                }
                
                console.log(`🔄 Retry update response:`, JSON.stringify(retryData, null, 2))
                
                if (retryData?.telegram_chat_id !== String(chatId)) {
                  console.error(`❌ CRITICAL: Even retry failed to save correctly!`)
                  console.error(`Expected: ${String(chatId)}, Got: ${retryData?.telegram_chat_id}`)
                } else {
                  console.log(`✅ Retry successful: telegram_chat_id saved correctly`)
                }
              } else {
                console.log(`✅ Update successful: telegram_chat_id ${updateData.telegram_chat_id} saved for user ${foundUser.id}`)
              }
              
              console.log(`✅ Successfully linked Telegram chat_id ${chatId} to user ${foundUser.id} (email: ${userByEmail.email})`)
            } else {
              console.log(`⚠️ No user found with email: ${email}`)
            }
          } else {
            console.log(`⚠️ Empty email in /start command`)
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

      // Successfully linked - verify one more time before sending confirmation
      const { data: verifyUser, error: verifyError } = await supabaseAdmin
        .from('users')
        .select('telegram_chat_id, email')
        .eq('id', foundUser.id)
        .single()
      
      if (verifyError) {
        console.error('❌ Error verifying telegram_chat_id:', verifyError)
        await sendTelegramMessage({
          chat_id: chatId,
          text: `⚠️ <b>Error Verifying Link</b>\n\nThere was an error verifying your Telegram link. Please try again.`
        })
        return NextResponse.json({ ok: false, error: verifyError.message }, { status: 500 })
      }
      
      if (!verifyUser || verifyUser.telegram_chat_id !== chatId.toString()) {
        console.error(`❌ Verification failed: telegram_chat_id mismatch. Expected: ${chatId.toString()}, Got: ${verifyUser?.telegram_chat_id || 'null'}`)
        console.error(`User ID: ${foundUser.id}, Email: ${verifyUser?.email || 'unknown'}`)
        
        // Final retry with explicit string conversion
        const { error: finalRetryError } = await supabaseAdmin
          .from('users')
          .update({
            telegram_chat_id: String(chatId)
          })
          .eq('id', foundUser.id)
        
        if (finalRetryError) {
          console.error('❌ Final retry also failed:', finalRetryError)
          await sendTelegramMessage({
            chat_id: chatId,
            text: `⚠️ <b>Error Linking Account</b>\n\nThere was an error saving your Telegram link. Please contact support with this error: ${finalRetryError.message}`
          })
          return NextResponse.json({ ok: false, error: finalRetryError.message }, { status: 500 })
        }
        
        // Verify again after final retry
        const { data: finalVerify } = await supabaseAdmin
          .from('users')
          .select('telegram_chat_id')
          .eq('id', foundUser.id)
          .single()
        
        if (!finalVerify || finalVerify.telegram_chat_id !== String(chatId)) {
          console.error('❌ Final verification still failed. Database may have type mismatch issue.')
          await sendTelegramMessage({
            chat_id: chatId,
            text: `⚠️ <b>Database Error</b>\n\nThere seems to be a database configuration issue. Please contact support.`
          })
          return NextResponse.json({ ok: false, error: 'Database verification failed' }, { status: 500 })
        }
      }
      
      console.log(`✅ Verified: telegram_chat_id ${chatId.toString()} is correctly saved for user ${foundUser.id}`)
      
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

      console.log(`✅ Sent linked confirmation message to chat_id ${chatId} for user ${foundUser.id}`)
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


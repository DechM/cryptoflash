const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

export interface TelegramMessage {
  chat_id: string | number
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
}

/**
 * Send message via Telegram Bot API
 */
export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: message.chat_id,
        text: message.text,
        parse_mode: message.parse_mode || 'HTML'
      })
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data)
      return false
    }

    return true
  } catch (error: any) {
    console.error('Error sending Telegram message:', error.message)
    return false
  }
}

/**
 * Format KOTH alert message
 */
export function formatKOTHAlert(token: {
  name: string
  symbol: string
  address: string
  score: number
  progress: number
  priceUsd?: number
}): string {
  const buyUrl = `https://pump.fun/coin/${token.address}?ref=cryptoflash`
  
  return `🚨 <b>KOTH Alert!</b>

💰 <b>${token.name} (${token.symbol})</b>
📊 Score: <b>${token.score.toFixed(1)}/100</b>
📈 Progress: <b>${token.progress.toFixed(1)}%</b>
${token.priceUsd ? `💵 Price: $${token.priceUsd.toFixed(6)}` : ''}

🔥 <b>BUY NOW:</b>
${buyUrl}

⚠️ <i>DYOR - This is not financial advice</i>`
}


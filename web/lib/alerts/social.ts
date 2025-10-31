// Social media integrations for CryptoFlash Alerts
// All using FREE APIs only

import type { CryptoFlashAlert } from './types';
import { formatCompactUSD } from '@/lib/format';

/**
 * Generate X (Twitter) share URL (FREE - no API needed)
 * This creates a pre-filled tweet that users can share
 */
export function generateXShareUrl(alert: CryptoFlashAlert): string {
  const emoji = alert.token.emoji || '🪙';
  const amount = formatCompactUSD(alert.token.amountUsd);
  const symbol = alert.token.symbol;
  const blockchain = alert.blockchain.toUpperCase();
  
  const text = `${emoji} ${amount} ${symbol} transferred on ${blockchain}\n\n🐋 Large transaction detected!\n\n#CryptoFlash #WhaleAlert #${symbol} #${blockchain}`;
  
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(`https://cryptoflash.app/alerts/${alert.id}`)}`;
  
  return url;
}

/**
 * Post alert to Discord webhook (FREE - unlimited webhooks)
 */
export async function postToDiscordWebhook(
  alert: CryptoFlashAlert,
  webhookUrl: string
): Promise<boolean> {
  try {
    const emoji = alert.token.emoji || '🪙';
    const amount = formatCompactUSD(alert.token.amountUsd);
    const symbol = alert.token.symbol;
    
    const severityColors: Record<string, number> = {
      low: 0x3498db,      // Blue
      medium: 0xf39c12,  // Yellow
      high: 0xe67e22,    // Orange
      critical: 0xe74c3c, // Red
    };

    const embed = {
      title: `${emoji} ${amount} ${symbol} Transfer`,
      description: `Large transaction detected on ${alert.blockchain.toUpperCase()}`,
      color: severityColors[alert.severity] || 0x3498db,
      fields: [
        {
          name: 'Token',
          value: `${alert.token.name} (${alert.token.symbol})`,
          inline: true,
        },
        {
          name: 'Amount',
          value: `${amount}`,
          inline: true,
        },
        {
          name: 'Blockchain',
          value: alert.blockchain.toUpperCase(),
          inline: true,
        },
        {
          name: 'From',
          value: `${alert.from.label || 'Unknown'}${alert.from.address ? `\n\`${alert.from.address.substring(0, 20)}...\`` : ''}`,
          inline: false,
        },
        {
          name: 'To',
          value: alert.to.map((t) => `${t.label || 'Unknown'}${t.address ? `\n\`${t.address.substring(0, 20)}...\`` : ''}`).join('\n'),
          inline: false,
        },
        {
          name: 'Transaction',
          value: `[View on Explorer](${getBlockchainExplorerUrl(alert.blockchain, alert.txHash)})`,
          inline: true,
        },
        {
          name: 'Alert Link',
          value: `[View Alert](https://cryptoflash.app/alerts/${alert.id})`,
          inline: true,
        },
      ],
      timestamp: new Date(alert.timestamp).toISOString(),
      footer: {
        text: 'CryptoFlash Alert',
      },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to post to Discord:', error);
    return false;
  }
}

/**
 * Get blockchain explorer URL
 */
function getBlockchainExplorerUrl(blockchain: string, txHash: string): string {
  const explorers: Record<string, string> = {
    ethereum: `https://etherscan.io/tx/${txHash}`,
    bitcoin: `https://blockstream.info/tx/${txHash}`,
    bsc: `https://bscscan.com/tx/${txHash}`,
    solana: `https://solscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
  };

  return explorers[blockchain] || '#';
}


/**
 * Optional: Post to Telegram bot (FREE API)
 * Requires bot token and chat ID
 */
export async function postToTelegram(
  alert: CryptoFlashAlert,
  botToken: string,
  chatId: string
): Promise<boolean> {
  try {
    const emoji = alert.token.emoji || '🪙';
    const amount = formatCompactUSD(alert.token.amountUsd);
    const symbol = alert.token.symbol;
    
    const message = `${emoji} *${amount} ${symbol} Transfer*\n\n` +
      `🐋 Large transaction detected on ${alert.blockchain.toUpperCase()}\n\n` +
      `*From:* ${alert.from.label || 'Unknown'}\n` +
      `*To:* ${alert.to.map(t => t.label || 'Unknown').join(', ')}\n\n` +
      `[View Transaction](${getBlockchainExplorerUrl(alert.blockchain, alert.txHash)})\n` +
      `[View Alert](https://cryptoflash.app/alerts/${alert.id})`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to post to Telegram:', error);
    return false;
  }
}

/**
 * Auto-post alert to social media (optional feature)
 * Can be triggered server-side when new alerts are detected
 */
export async function autoPostAlert(alert: CryptoFlashAlert): Promise<{
  xUrl?: string;
  discordSuccess?: boolean;
  telegramSuccess?: boolean;
}> {
  const results: {
    xUrl?: string;
    discordSuccess?: boolean;
    telegramSuccess?: boolean;
  } = {};

  // Generate X share URL (always available)
  results.xUrl = generateXShareUrl(alert);

  // Post to Discord if webhook is configured
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    results.discordSuccess = await postToDiscordWebhook(alert, discordWebhook);
  }

  // Post to Telegram if bot is configured
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  if (telegramBotToken && telegramChatId) {
    results.telegramSuccess = await postToTelegram(
      alert,
      telegramBotToken,
      telegramChatId
    );
  }

  return results;
}


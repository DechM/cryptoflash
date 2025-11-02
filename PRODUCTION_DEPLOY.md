# 🚀 Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables в Vercel (Production)

Отиди в **Vercel Dashboard → Settings → Environment Variables → Production** и задай:

```bash
# Payment Configuration
ALLOW_MOCK_PAYMENT=false
SOLANA_CLUSTER=mainnet
MERCHANT_WALLET=твоят-реален-mainnet-wallet-address
USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v  # Mainnet USDC

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://твоят-домейн.com
NEXT_PUBLIC_SITE_NAME=CryptoFlash

# Payment Provider
PAYMENT_PROVIDER=solana
ENABLE_SOL_PAY=true

# Pricing
PRO_PRICE_USDC=19.99
ULTIMATE_PRICE_USDC=39.99

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=твоят-реален-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=твоят-реален-anon-key
SUPABASE_SERVICE_ROLE_KEY=твоят-реален-service-role-key

# API Keys (REQUIRED for production)
MORALIS_API_KEY=твоят-реален-key
HELIUS_API_KEY=твоят-реален-key  # Mainnet RPC access required
TELEGRAM_BOT_TOKEN=твоят-реален-token
```

### 2. Mainnet Addresses

**Mainnet USDC Mint:**
```
EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

**Merchant Wallet:**
- Увери се че е mainnet wallet (не devnet)
- Убеди се че имаш контрол над wallet-а
- Убеди се че има достатъчно SOL за transaction fees

### 3. Critical Settings

- [ ] `ALLOW_MOCK_PAYMENT=false` в Production env vars
- [ ] `SOLANA_CLUSTER=mainnet` в Production env vars
- [ ] `USDC_MINT` е mainnet USDC mint
- [ ] Всички API ключове са production-ready
- [ ] Supabase е production database
- [ ] Telegram bot е production bot

---

## 🔄 Deploy Process

1. **Git Push** (ако има нови промени):
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Vercel Auto-Deploy**:
   - Vercel автоматично ще deploy-не след git push
   - Изчакай build да приключи (обикновено 1-2 минути)

3. **Verify Deployment**:
   - Провери Vercel logs за errors
   - Тествай основните страници:
     - `/dashboard`
     - `/premium`
     - `/alerts`

---

## 🧪 Post-Deployment Testing

### Test 1: Basic Functionality
- [ ] Dashboard зарежда данни
- [ ] Premium страница показва планове
- [ ] Alerts страница работи

### Test 2: Payment Flow (TEST MODE)
⚠️ **ВАЖНО:** Тествай с малка сума преди публикуване!

1. Отиди на `/premium`
2. Натисни "Pay with Solana" за Pro или Ultimate
3. Изпрати **РЕАЛНА** транзакция от твоя wallet
4. Натисни "I Paid" след 5-10 секунди
5. Провери че плана се активира

### Test 3: Feature Gating
- [ ] FREE план показва правилни ограничения
- [ ] PRO план позволява правилните features
- [ ] ULTIMATE план позволява всички features

---

## ⚠️ Important Notes

### Production vs Development

**Development (Devnet):**
- `SOLANA_CLUSTER=devnet`
- `ALLOW_MOCK_PAYMENT=true` (optional, за тестване)
- Devnet USDC mint
- Тестови транзакции (без реални пари)

**Production (Mainnet):**
- `SOLANA_CLUSTER=mainnet`
- `ALLOW_MOCK_PAYMENT=false` (задължително!)
- Mainnet USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Реални транзакции с реални USDC

### Transaction Confirmation

В production:
- Транзакциите могат да отнемат 5-10 секунди за финализиране
- Потребителите трябва да изчакат преди да натиснат "I Paid"
- Системата poll-ва до 30 секунди за confirmation

### Safety

- **НЕ** оставяй `ALLOW_MOCK_PAYMENT=true` в production!
- Увери се че `MERCHANT_WALLET` е правилен mainnet address
- Тествай с малка сума преди публикуване
- Мониторирай Vercel logs за errors

---

## 🔧 Troubleshooting

### "Transaction not found"
- Потребителят може да не е изпратил транзакцията
- Транзакцията може все още да се финализира (изчакай 5-10 сек)
- Провери че memo field е правилен (sessionId)

### "Payment confirmation timeout"
- Транзакцията може да е неуспешна
- Провери wallet-а на потребителя
- Провери Vercel logs за детайли

### Plan не се активира
- Провери Supabase `users.subscription_status`
- Провери cookie `cf_plan` в browser
- Провери Vercel logs за API errors

---

## ✅ Success Criteria

Production deployment е успешен ако:
- ✅ Всички страници зареждат без errors
- ✅ Payment flow работи с реални транзакции
- ✅ Plans се активират след confirmation
- ✅ Feature gating работи правилно
- ✅ Няма errors в Vercel logs
- ✅ Няма security vulnerabilities

---

**Готови ли сте за production? Деплойвайте само след като всичко е тествано! 🚀**


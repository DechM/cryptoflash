# Supabase Email Template Configuration

## 🎯 Цел
Кастомизирай email templates в Supabase да изглеждат професионално и да идват от **CryptoFlash**.

## 📧 Email Template: "Confirm signup"

### Стъпка 1: Отвори Email Templates
1. Отиди в **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Избери **"Confirm signup"** template

### Стъпка 2: Кастомизирай Template

#### Subject Line:
```
Verify your CryptoFlash account
```

#### Email Body (HTML):
```html
<h2 style="color: #00ff88; font-family: Arial, sans-serif;">Welcome to CryptoFlash! 🚀</h2>

<p style="color: #333; font-family: Arial, sans-serif;">
  Thanks for signing up! To complete your registration and start tracking KOTH tokens, please verify your email address.
</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #00ff88 0%, #00d9ff 100%); color: #000; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
    Verify Email Address
  </a>
</p>

<p style="color: #666; font-family: Arial, sans-serif; font-size: 14px;">
  If the button doesn't work, copy and paste this link into your browser:<br>
  <a href="{{ .ConfirmationURL }}" style="color: #00ff88;">{{ .ConfirmationURL }}</a>
</p>

<p style="color: #999; font-family: Arial, sans-serif; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
  This link will expire in 24 hours.<br><br>
  <strong>CryptoFlash Team</strong><br>
  Real-time KOTH tracker for Pump.fun
</p>

<p style="color: #999; font-family: Arial, sans-serif; font-size: 11px; margin-top: 20px;">
  ⚠️ <strong>DYOR</strong> - This is not financial advice
</p>
```

#### Plain Text Version (fallback):
```
Welcome to CryptoFlash! 🚀

Thanks for signing up! To complete your registration and start tracking KOTH tokens, please verify your email address.

Verify your email: {{ .ConfirmationURL }}

This link will expire in 24 hours.

CryptoFlash Team
Real-time KOTH tracker for Pump.fun

⚠️ DYOR - This is not financial advice
```

### Стъпка 3: От кого (From)
В **Email Settings** (Authentication → Settings):
- **From email**: `noreply@cryptoflash.app` (или твоят domain)
- **From name**: `CryptoFlash`
- **Reply-to**: `support@cryptoflash.app` (опционално)

Ако нямаш custom domain за email, можеш да използваш:
- **From name**: `CryptoFlash`
- **From email**: (Supabase default ще работи, но името ще е CryptoFlash)

## ✅ Проверка

След като запазиш template-а:

1. **Тест регистрация:**
   - Регистрирай нов акаунт с test email
   - Провери че email-ът идва с правилния subject и content
   - Провери че "From" е "CryptoFlash"
   - Кликни на link-а и провери че работи

2. **Проверка на link:**
   - Link-ът трябва да е: `https://cryptoflash.app/auth/verify?token_hash=...&type=signup`
   - Трябва да те редиректне към `/dashboard` след успешна verification

## 🔧 Допълнителни настройки

### Site URL в Supabase
1. Отиди в **Authentication** → **URL Configuration**
2. **Site URL**: `https://cryptoflash.app`
3. **Redirect URLs**: Добави:
   - `https://cryptoflash.app/auth/callback`
   - `https://cryptoflash.app/auth/verify`

### Email Rate Limits
В **Authentication** → **Email Templates** → **Settings**:
- Провери rate limits (обикновено 4 emails/hour per user)
- Ако искаш по-високи лимити, можеш да upgrade plan

## 📝 Други Templates (опционално)

### "Reset Password"
```
Subject: Reset your CryptoFlash password

[Similar style to confirm signup]
```

### "Magic Link" (ако го използваш)
```
Subject: Your CryptoFlash login link

[Similar style]
```

---

**Важно:** След всяка промяна в templates, тествай с нов email за да видиш промените!


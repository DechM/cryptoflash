# Email Diagnostic Checklist - ИЗПРАЩАНЕ НЕ РАБОТИ

## ⚠️ ВАЖНО: Промените в кода НЕ влияят на изпращането на email-ите!
Кодът, който поправих, е само за **обработка на verification link-а**, не за изпращането.

## 🔍 Стъпка 1: Проверка в Supabase Dashboard

### 1.1 Email Confirmations
**Отиди:** Supabase Dashboard → Authentication → Settings → Email Auth

✅ Провери:
- [ ] **"Enable email confirmations"** е **ON**
- Ако е OFF → включи го СЕГА

### 1.2 Rate Limits
**Отиди:** Supabase Dashboard → Authentication → Rate Limits

✅ Провери:
- [ ] **"Rate limit for sending emails"** - колко е?
- Ако е 2-4/hour → **увеличи на 100-200/hour**
- Провери дали лимита е **достигнат** (червен индикатор)

### 1.3 SMTP Settings (КРИТИЧНО!)
**Отиди:** Supabase Dashboard → Settings → Auth → SMTP Settings

✅ Провери ВСИЧКО:
- [ ] **"Enable Custom SMTP"** е **ON** (зелен toggle)
- [ ] **SMTP Host:** `smtp.sendgrid.net`
- [ ] **SMTP Port:** `587`
- [ ] **SMTP User:** `apikey`
- [ ] **SMTP Password:** твоят SendGrid API Key (правилен ли е?)
- [ ] **Sender email:** какъв email е тук?
  - Ако е `noreply@em2118.cryptoflash.app` → трябва да е verified в SendGrid
  - Ако е личен email → трябва да е verified в SendGrid

## 🔍 Стъпка 2: Проверка в SendGrid Dashboard

### 2.1 Sender Identity
**Отиди:** SendGrid Dashboard → Settings → Sender Authentication

✅ Провери:
- [ ] **Domain Authentication:** `em2118.cryptoflash.app` е **Verified** (зелена отметка)
- [ ] **Single Sender Verification:** ако използваш личен email, трябва да е **Verified**

### 2.2 Activity Log (НАЙ-ВАЖНО!)
**Отиди:** SendGrid Dashboard → Activity

✅ Провери:
- [ ] Филтрирай по твоя recipient email
- [ ] Виж дали има **нови опити** след последната регистрация
- [ ] Какъв е статусът: **Delivered**, **Blocked**, **Bounced**, или **няма опит**?

**Анализ:**
- **Ако няма опит** → Supabase не се свързва с SendGrid (SMTP настройките са грешни)
- **Ако има опит с "Blocked"** → Sender email не е verified или reputation проблем
- **Ако има опит с "Delivered"** → Email-ът е изпратен, но не пристига (spam/reputation)

### 2.3 API Key
**Отиди:** SendGrid Dashboard → Settings → API Keys

✅ Провери:
- [ ] Има ли активен API Key?
- [ ] Това ли е ключът, който използваш в Supabase SMTP Password?

## 🔍 Стъпка 3: Проверка в Supabase Logs

**Отиди:** Supabase Dashboard → Logs → Auth Logs

✅ Провери:
- [ ] Търси за **"email"** или **"send"** или **"confirmation"**
- [ ] Виж дали има **errors** при опит за изпращане на email
- [ ] Виж дали има **rate limit exceeded** errors

## 🔍 Стъпка 4: Тест с Console Logs

1. Отвори браузър Developer Tools (F12)
2. Отиди на вкладката **Console**
3. Направи нова регистрация
4. Виж какво се логва:
   - `Signup attempt:` → показва email, siteUrl, redirectUrl
   - `Signup response:` → показва дали email е изпратен

**Очаквани логове:**
- `emailSent: true` → email трябва да е изпратен
- `emailSent: false` → email НЕ е изпратен (провери Supabase настройките)

## 🔧 Бърз Fix (Ако нищо не работи)

### Option 1: Тест с личен email
1. Отиди в Supabase → SMTP Settings
2. Временно смени "Sender email" на личния ти Gmail email (ако е verified в SendGrid)
3. Тествай регистрация

### Option 2: Ресет на SMTP
1. В Supabase → SMTP Settings
2. Disable Custom SMTP
3. Save
4. Enable Custom SMTP отново
5. Въведи отново всички настройки:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - User: `apikey`
   - Password: SendGrid API Key
   - Sender: verified email
6. Save
7. Тествай

## 📝 Какво да ми кажеш

След като провериш всичко горе, кажи ми:

1. **Supabase SMTP Settings:**
   - Enable Custom SMTP: ON/OFF?
   - Sender email: какъв е?
   - Всички полета попълнени ли са?

2. **SendGrid Activity:**
   - Има ли опити за изпращане след регистрация?
   - Какъв е статусът (Delivered/Blocked/Bounced)?

3. **Supabase Rate Limits:**
   - Какъв е лимита?
   - Достигнат ли е?

4. **Console Logs:**
   - Какво показва `Signup response:`?
   - Има ли errors?

5. **Supabase Auth Logs:**
   - Има ли errors при email sending?

---

## 🚨 Най-чести причини

1. **SMTP Password е грешен** (SendGrid API Key не е правилен)
2. **Sender email не е verified** в SendGrid
3. **Rate limit е достигнат** в Supabase
4. **Email confirmations са disabled** в Supabase
5. **SMTP Host/Port са грешни** (трябва `smtp.sendgrid.net:587`)


# Email Confirmation Troubleshooting Guide

## Проверка на Supabase настройките

### 1. Email Verification Settings

Отиди в **Supabase Dashboard → Authentication → Settings**:

✅ **Enable email confirmations** трябва да е **ON**
- Ако е OFF, потребителите ще се логират веднага без confirmation email

✅ **Enable email change confirmations** трябва да е **ON** (опционално)

### 2. Rate Limits

Отиди в **Supabase Dashboard → Authentication → Rate Limits**:

✅ **Rate limit for sending emails** трябва да е минимум **100-200/hour**
- Ако е 2-4/hour, ще изчерпиш лимита бързо
- Ако е достигнат лимита, не ще получаваш email-и

### 3. SMTP Configuration (SendGrid)

Отиди в **Supabase Dashboard → Settings → Auth → SMTP Settings**:

✅ **Enable Custom SMTP** трябва да е **ON**

✅ **SMTP Host:** `smtp.sendgrid.net`
✅ **SMTP Port:** `587`
✅ **SMTP User:** `apikey`
✅ **SMTP Password:** твоят SendGrid API Key
✅ **Sender email:** използвай VERIFIED email от SendGrid
  - Пример: `noreply@em2118.cryptoflash.app` (за verified subdomain)
  - ИЛИ: твоя личен email (ако е verified в SendGrid)
  - НЕ използвай непроверен email!

### 4. SendGrid Verification

Отиди в **SendGrid Dashboard → Settings → Sender Identity**:

✅ Провери дали имаш verified domain/subdomain:
  - Зелена отметка = Verified ✅
  - Сива иконка = Pending ⏳
  - Червена иконка = Failed ❌

✅ Използвай само **Verified** subdomain/email в Supabase SMTP Settings

### 5. URL Configuration

Отиди в **Supabase Dashboard → Authentication → URL Configuration**:

✅ **Site URL:** `https://cryptoflash.app`
✅ **Redirect URLs:** добави:
  - `https://cryptoflash.app/auth/verify`
  - `https://cryptoflash.app/auth/callback`
  - `https://cryptoflash.app/**`

### 6. Email Templates

Отиди в **Supabase Dashboard → Authentication → Email Templates**:

✅ **Confirm signup** template трябва да е активна
✅ Провери дали има грешки в template-а

### 7. Debug Steps

1. **Провери Console Logs** (браузър):
   - Отвори Developer Tools (F12)
   - Направи нова регистрация
   - Виж какво се логва в Console

2. **Провери Vercel Logs**:
   - Отиди в Vercel Dashboard → твоят проект → Logs
   - Търси за errors при signup

3. **Провери Supabase Logs**:
   - Отиди в Supabase Dashboard → Logs → Auth Logs
   - Търси за failed email sends или errors

4. **Тествай SendGrid**:
   - Отиди в SendGrid Dashboard → Activity
   - Виж дали има опити за изпращане
   - Ако няма опити, проблемът е в Supabase конфигурацията
   - Ако има опити с errors, проблемът е в SendGrid (unverified sender, etc.)

### 8. Често срещани проблеми

❌ **"Email not sent"**:
- Rate limit достигнат → увеличи limit в Supabase
- SMTP не е конфигуриран → активирай SendGrid SMTP
- Sender email не е verified → използвай verified email

❌ **"Email arrives but link is invalid"**:
- `NEXT_PUBLIC_SITE_URL` е грешен в Vercel
- `redirect_to` URL не е в Supabase Redirect URLs list

❌ **"Email arrives but expired"**:
- Токенът е стар (24 часа валидност)
- Потребителят трябва да направи нова регистрация

### 9. Quick Fix Checklist

- [ ] Email confirmations са enabled в Supabase
- [ ] Rate limit е минимум 100/hour
- [ ] SendGrid SMTP е конфигуриран и enabled
- [ ] Sender email в Supabase е verified в SendGrid
- [ ] `NEXT_PUBLIC_SITE_URL` е правилен в Vercel (без trailing slash)
- [ ] `https://cryptoflash.app/auth/verify` е в Supabase Redirect URLs
- [ ] SendGrid Activity показва опити за изпращане

## Ако все още не работи:

1. Провери дали `NEXT_PUBLIC_SITE_URL` в Vercel е точно `https://cryptoflash.app` (без `/`)
2. В Supabase, провери дали `emailRedirectTo` в code-а съвпада с Redirect URLs
3. Времено disable email confirmation в Supabase, за да видим дали проблемът е в email-а или в кода
4. Провери дали има други errors в Supabase Dashboard → Logs


# 🔴 ФИНАЛНА ДИАГНОСТИКА - Email-ите не идват

## ✅ Проверено:
- [x] Redirect URLs са правилни в Supabase ✅
- [x] Site URL е правилен ✅
- [x] SendGrid показва "Delivered" ✅

## ❓ ПРОВЕРИ ТЕЗИ В SUPABASE:

### 1. Email Confirmations Enabled?
**Отиди:** Supabase Dashboard → Authentication → Settings → Email Auth

✅ Провери:
- [ ] **"Enable email confirmations"** е **ON** (зелен toggle)
- Ако е OFF → Supabase НЕ изпраща email-и изобщо!

### 2. Rate Limit?
**Отиди:** Supabase Dashboard → Authentication → Rate Limits

✅ Провери:
- [ ] **"Rate limit for sending emails"** - колко е?
- [ ] Достигнат ли е лимита? (червен индикатор?)
- Ако е достигнат → увеличай лимита или изчакай

### 3. SMTP Settings?
**Отиди:** Supabase Dashboard → Settings → Auth → SMTP Settings

✅ Провери ВСИЧКО:
- [ ] **"Enable Custom SMTP"** е **ON** (зелен toggle)
- [ ] **SMTP Host:** `smtp.sendgrid.net`
- [ ] **SMTP Port:** `587`
- [ ] **SMTP User:** `apikey`
- [ ] **SMTP Password:** правилен ли е SendGrid API Key?
- [ ] **Sender email:** какъв е? Трябва да е verified в SendGrid

### 4. Supabase Auth Logs?
**Отиди:** Supabase Dashboard → Logs → Auth Logs

✅ Провери:
- [ ] Филтрирай по твоя email
- [ ] Търси за **errors** при signup
- [ ] Търси за **"email"** или **"send"** в логовете
- [ ] Виж дали има **rate limit exceeded** errors

---

## 🔍 КОНСОЛЕ ЛОГОВЕ (важни!)

1. Отвори браузър Developer Tools (F12) → Console
2. Направи нова регистрация
3. Виж точно какво се логва:

**Очаквани логове:**
```
Signup attempt: { email: "...", redirectUrl: "https://cryptoflash.app/auth/verify", ... }
Signup response: { 
  user: "...", 
  session: false,  // <- Ако е false, email трябва да е изпратен
  emailSent: true, // <- Това трябва да е TRUE
  emailConfirmed: null // <- Това трябва да е null преди verification
}
```

**Ако виждаш:**
- `session: true` → Email confirmations са disabled или user вече е logged in
- `emailSent: false` → Supabase не е изпратил email (провери настройките горе)
- `emailConfirmed: "дата"` → Email вече е confirmed (няма нужда от нов)

---

## 🧪 ТЕСТ: Използвай Test Endpoint

Направи POST заявка:
```bash
curl -X POST https://cryptoflash.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123456"}'
```

Или от браузър Console:
```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'test123456' })
}).then(r => r.json()).then(console.log)
```

Виж какво връща - ако има error, това ще покаже какъв е проблемът.

---

## 📋 ЧЕКЛИСТ - Направи сега:

1. **Email Confirmations:** Enabled? ✅/❌
2. **Rate Limit:** Какъв е? Достигнат? ✅/❌
3. **SMTP Settings:** Всички полета попълнени? Enabled? ✅/❌
4. **Console Logs:** Какво показва `emailSent:`? ✅/❌
5. **Supabase Auth Logs:** Има ли errors? ✅/❌

---

## 🚨 Най-вероятна причина:

**Ако всичко горе е OK, но пак не работи:**

1. **Email Confirmations са disabled** → Включи ги СЕГА!
2. **Rate limit е достигнат** → Увеличи или изчакай
3. **SMTP Password е грешен** → Провери SendGrid API Key отново
4. **Sender email не е verified** → Смени на verified email

---

## 📸 Моля те, кажи ми:

1. **Email Confirmations:** ON или OFF?
2. **Rate Limit:** Какъв е и достигнат ли е?
3. **Console Logs:** Какво показва `emailSent:` (true/false)?
4. **Supabase Auth Logs:** Има ли errors?

След като провериш всичко това, ще знаем точно какъв е проблемът!


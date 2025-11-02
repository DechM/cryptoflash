# CryptoFlash Feature Testing Guide

## 🎯 Какво да тестваме

Тестваме feature gating - да се уверим че:
- **Free план** - само Free features работят, Pro/Ultimate features НЕ работят
- **Pro план** - Pro features работят, Ultimate features НЕ работят  
- **Ultimate план** - всичко работи

---

## 🧪 Стъпки за тестване

### 1. Подготовка

✅ Увери се че в Vercel е добавен:
```
ALLOW_MOCK_PAYMENT=true
```

### 2. Тестване на планове

#### Тест 1: FREE план
1. Отиди на `/test-payments`
2. Натисни **"Test FREE"**
3. Отиди на `/test-features`
4. Провери че всички тестове са ✅ (green)
5. Отиди на `/dashboard` - трябва да виждаш:
   - ✅ 30s refresh rate
   - ✅ Advanced Filters НЕ са видими (трябва upgrade message)
   - ✅ Export button НЕ е видим
6. Отиди на `/alerts` - трябва да виждаш:
   - ✅ Threshold е locked на 95%
   - ✅ Max 1 token tracking

#### Тест 2: PRO план
1. Отиди на `/test-payments`
2. Натисни **"Test PRO"**
3. Изчакай confirmation (5-10 секунди)
4. Отиди на `/test-features`
5. Провери че всички тестове са ✅ (green)
6. Отиди на `/dashboard` - трябва да виждаш:
   - ✅ 15s refresh rate
   - ✅ Advanced Filters са видими и работят
   - ✅ Export button НЕ е видим (Ultimate only)
7. Отиди на `/alerts` - трябва да виждаш:
   - ✅ Threshold може да се променя (85-100%)
   - ✅ Max 10 tokens tracking
   - ✅ Whale Alerts НЕ са активни

#### Тест 3: ULTIMATE план
1. Отиди на `/test-payments`
2. Натисни **"Test ULTIMATE"**
3. Изчакай confirmation (5-10 секунди)
4. Отиди на `/test-features`
5. Провери че всички тестове са ✅ (green)
6. Отиди на `/dashboard` - трябва да виждаш:
   - ✅ 10s refresh rate
   - ✅ Advanced Filters са видими и работят
   - ✅ Export button е видим и работи
7. Отиди на `/alerts` - трябва да виждаш:
   - ✅ Threshold може да се променя (80-100%)
   - ✅ Unlimited tokens tracking
   - ✅ Whale Alerts са активни

---

## 🔍 Checklist за всеки план

### FREE Plan Features
- [ ] Refresh interval = 30s
- [ ] Max tokens = 1
- [ ] Threshold = 95% (locked)
- [ ] Advanced Filters = ❌ (not visible)
- [ ] Export = ❌ (not visible)
- [ ] History = ❌ (blocked)
- [ ] Whale Alerts = ❌
- [ ] Premium Analytics = ❌

### PRO Plan Features
- [ ] Refresh interval = 15s
- [ ] Max tokens = 10
- [ ] Threshold = 85-100% (custom)
- [ ] Advanced Filters = ✅ (visible & working)
- [ ] Export = ❌ (not visible - Ultimate only)
- [ ] History = ✅ (30 days)
- [ ] Whale Alerts = ❌
- [ ] Premium Analytics = ❌

### ULTIMATE Plan Features
- [ ] Refresh interval = 10s
- [ ] Max tokens = Unlimited
- [ ] Threshold = 80-100% (custom)
- [ ] Advanced Filters = ✅ (visible & working)
- [ ] Export = ✅ (visible & working)
- [ ] History = ✅ (365 days)
- [ ] Whale Alerts = ✅
- [ ] Premium Analytics = ✅

---

## 🐛 Потенциални проблеми

### "Payment not confirmed"
- Провери че `ALLOW_MOCK_PAYMENT=true` е в Vercel
- Провери че Supabase е конфигуриран
- Провери Vercel logs за errors

### "Plan mismatch"
- Изчакай 2-3 секунди след payment confirmation
- Refresh страницата
- Провери cookie `user-plan` в browser dev tools

### "Feature test failed"
- Провери че `/api/plan/me` връща правилния план
- Провери че `useFeature` hook връща правилни стойности
- Провери browser console за errors

---

## 📊 API Endpoints за тестване

### Server-side guards (задължително да работят):
- `POST /api/alerts/subscribe` - проверява `max_tokens` limit
- `GET /api/alerts/history` - проверява `history.days > 0`
- `GET /api/koth-data` - използва правилния refresh interval

### Client-side guards (UI):
- Dashboard: `isEnabled('filters.advanced')`
- Dashboard: `isEnabled('analytics.premium')` (Export button)
- Alerts: `limit('alerts.threshold_min')`
- Alerts: `limit('alerts.max_tokens')`

---

## ✅ Success Criteria

**Тестът е успешен ако:**
1. Всички тестове в `/test-features` са ✅ (green)
2. UI елементи се показват/скриват според плана
3. Server-side guards блокират неразрешени actions
4. Плановете се активират правилно през `/test-payments`
5. Няма TypeScript или runtime errors

---

## 🚀 Следващи стъпки

След като тестваш всички планове:
1. Деплой на production (ако всичко работи)
2. Тестване с реални Solana Pay транзакции (devnet)
3. Мониторинг на feature gates в production

---

**Note:** Тестовете са автоматични в `/test-features`, но препоръчвам и ръчно тестване на UI за най-добра увереност.


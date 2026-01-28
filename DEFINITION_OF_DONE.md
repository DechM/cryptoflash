# 🚀 FINAL PRODUCTION READINESS PROMPT

## Цел

Подготовка на приложението за **PRODUCTION release** (App Store submission).

**Без нови функционалности.**
**Без архитектурни промени.**
**Без refactor.**
**Само стабилизация, проверки и production hardening.**

---

## 🔒 ЗАБРАНЕНО

❌ НОВИ features
❌ Refactor
❌ Архитектурни промени
❌ Feature flags
❌ "По-добър дизайн"
❌ "По-чист код"
❌ Оптимизации
❌ Пренаписване на логика
❌ Нови зависимости

---

## ✅ ЗАДАЧИ

### 1) PRO gating – финална проверка

Провери, че всички PRO features са правилно gated:

- Background Audio
- Bluetooth Audio
- Custom Sounds
- Voice Countdown (10→0)
- Save History
- PRO toggles
- PRO-only UI rows

**FREE user:**
- вижда UI
- при опит → paywall
- нищо не се активира

**PRO user:**
- всичко работи без ограничения

---

### 2) RevenueCat – production safety

Провери:

- стабилен appUserID (Keychain)
- няма auto-restore на launch
- няма restore в onAppear
- isPro идва само от customerInfoUpdateListener
- няма fallback логика
- няма дублирани Purchases.configure
- няма multiple logIn()
- няма multiple configure()

---

### 3) Audio system – production mode

**Провери:**

**Foreground**
- beep
- custom sound
- countdown
- bluetooth routing
- background toggle respected

**Background**
- background audio ON → работи
- background audio OFF → не свири
- bluetooth ON → routing OK
- bluetooth OFF → routing OK

---

### 4) Countdown system

Провери:

- start at 10
- pause → stop audio
- resume → continue from correct second
- reset → stop audio
- phase change → stop audio
- multi-round → works
- rest phase → correct behavior
- skip rest → no countdown bug

---

### 5) Notifications

Провери:

- няма multiple pending notifications
- cancel works
- no orphan notifications
- background cue scheduling OK
- no duplicate triggers
- no stacking

---

### 6) History

Провери:

- save works
- cancel delete works
- edit works
- history list stable
- no duplication
- no corrupt data
- migration safe

---

### 7) UI / UX

Провери:

- no frozen screens
- no black screens
- no stuck sheets
- no infinite loaders
- no blocked navigation
- no dead buttons

---

### 8) Logs (PRODUCTION CLEAN)

**Преди build:**

- махни DEBUG logs
- махни verbose prints
- остави само critical logs
- няма sensitive data logs
- няма revenuecat verbose logs
- няма audio debug spam

---

## 🧪 TEST MATRIX

### FREE USER

- install fresh
- start workout
- background OFF
- bluetooth OFF
- countdown OFF
- custom sound locked
- paywall shows
- no PRO feature usable

### PRO USER

- purchase
- restart app
- isPro = true
- background audio works
- bluetooth works
- countdown works
- custom sounds work
- history works
- save works
- reset works

---

## 🟢 Definition of Done (DoD)

Системата е **PRODUCTION READY** ако:

### Functional

✅ Timer stable
✅ Audio stable
✅ Background stable
✅ Bluetooth stable
✅ Countdown stable
✅ Notifications stable
✅ History stable
✅ Save flow stable
✅ PRO gating stable
✅ RevenueCat stable

### Technical

✅ No crashes
✅ No race conditions
✅ No duplicate timers
✅ No memory leaks
✅ No zombie notifications
✅ No state desync
✅ No stuck audio
✅ No stuck UI

### Product

✅ PRO gating correct
✅ FREE restrictions correct
✅ Paywall correct
✅ UX flows correct
✅ No fake features in UI

### Release

✅ Clean logs
✅ No debug flags
✅ No dev toggles
✅ No test hooks
✅ Production config
✅ Store-ready build

---

## 🚨 RULE

**Ако нещо не покрива DoD:**
→ НЕ се пуска в production
→ НЕ се добавят нови features
→ НЕ се refactor-ва
→ **Само fix**

---

## OUTPUT FORMAT (отговор от теб):

✅ **Checklist status** (pass/fail)

❌ **Issues list** (if any)

🔧 **Fix list** (minimal only)

🟢 **PROD READY: YES / NO**

---

**Това е.**
**Това е production prompt, не dev prompt.**
**Не feature prompt.**
**Не experimental prompt.**
**Не research prompt.**

👉 **Това е checklist за release, не за разработка.**

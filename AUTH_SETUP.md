# CryptoFlash Auth Setup Guide

## ✅ Имплементирано

### 1. Database Schema
- ✅ Trigger за auto-create на `public.users` при signup в `auth.users`
- ✅ RLS политики за всички таблици
- ✅ Indexes за email, telegram_chat_id, telegram_username
- ✅ Migration function за linking на Telegram

**Файл:** `supabase-auth-schema.sql`

**Инструкции:** Изпълни този SQL в Supabase SQL Editor след основния schema.

### 2. Auth Pages
- ✅ `/register` - Email + Password + Google OAuth
- ✅ `/login` - Email + Password + Google OAuth
- ✅ `/auth/callback` - OAuth redirect handler

### 3. Auth Helpers (`lib/auth.ts`)
- ✅ `getCurrentUser()` - Взима текущия auth user
- ✅ `requireAuth()` - Защита на routes (redirect към /login)
- ✅ `getCurrentUserId()` - Взима user ID
- ✅ `isAuthenticated()` - Проверка за auth
- ✅ `getUserPlan()` - Взима plan от database

### 4. Client Hooks
- ✅ `useSession()` - Client-side session hook
- ✅ `usePlan()` - Обновен да чете от `/api/plan/me` (което използва auth)

### 5. Protected Routes
- ✅ `/alerts` - Изисква login (redirect към /login?next=/alerts)
- ✅ `/api/alerts/subscribe` - Изисква auth
- ✅ `/api/alerts/history` - Изисква auth
- ✅ `/api/pay/create-session` - Изисква auth (не анонимни покупки)

### 6. Navbar Auth UI
- ✅ Login бутон ако не е логнат
- ✅ User menu (email + logout) ако е логнат
- ✅ Mobile responsive

### 7. Premium Page
- ✅ Pay бутони disabled ако не е логнат
- ✅ Tooltip "Login to Purchase"
- ✅ Auto redirect към login при клик

### 8. Telegram Linking
- ✅ `/api/me/link-telegram` - POST endpoint за linking
- ✅ GET endpoint за проверка на link status
- ✅ Webhook обновен - не създава нови users без auth

## 🔧 Настройки в Supabase Dashboard

### 1. Enable Auth Providers
1. Отиди в **Authentication → Providers**
2. Enable **Email** provider
3. Enable **Google** provider
   - Добави Client ID и Secret от Google OAuth
   - Redirect URL: `https://<your-domain>/auth/callback`

### 2. Email Settings (Optional)
- Email verification: **ON** (препоръчително за production)
- Magic Link: **OFF** (по изискване)

### 3. Run Database Schema
1. Отвори **SQL Editor** в Supabase
2. Изпълни `supabase-auth-schema.sql`
3. Провери че trigger-ът `on_auth_user_created` съществува

## 📝 Environment Variables

Всички от `env.example` + следните са важни:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # За server-side operations
```

## 🧪 Testing

### 1. Signup Flow
```
1. Отиди на /register
2. Въведи email + password
3. Провери че се създаде запис в public.users с id = auth.users.id
```

### 2. Login Flow
```
1. Отиди на /login
2. Влез с email/password или Google
3. Провери че Navbar показва email
4. Провери че /alerts работи
```

### 3. Protected Routes
```
1. Не логнат → отиди на /alerts
2. Трябва да редиректне към /login?next=/alerts
3. След login → трябва да се върне на /alerts
```

### 4. Payment Flow
```
1. Отиди на /premium (без login)
2. Pay бутони трябва да са disabled
3. Login
4. Pay бутони трябва да работят
```

### 5. Telegram Linking
```
1. Login
2. POST /api/me/link-telegram с { chatId: "...", username: "..." }
3. GET /api/me/link-telegram → трябва да върне linked: true
```

## ⚠️ Important Notes

1. **RLS Policies:** Server-side код (със Service Role Key) bypass-ва RLS автоматично. Това е OK за cron jobs и background tasks.

2. **Migration:** Legacy users (със само telegram_chat_id, без email) трябва да се link-нат ръчно или автоматично при първи login.

3. **Telegram Webhook:** Вече не създава нови users. User трябва да създаде акаунт първо и после да link-не Telegram.

4. **Plan Management:** Plan се чете от `users.subscription_status` в database (source of truth), не от cookies.

## 🚀 Deployment Checklist

- [ ] Supabase Auth providers enabled (Email + Google)
- [ ] Database schema executed (`supabase-auth-schema.sql`)
- [ ] RLS policies active
- [ ] Environment variables set в Vercel
- [ ] Google OAuth credentials configured
- [ ] Auth redirect URL правилен (`/auth/callback`)
- [ ] Test signup/login flow
- [ ] Test protected routes
- [ ] Test payment flow (requires login)

## 📚 Next Steps (Optional)

- [ ] Forgot password flow
- [ ] Email verification UI
- [ ] Profile page (`/settings`)
- [ ] Telegram unlinking
- [ ] Legacy user migration UI


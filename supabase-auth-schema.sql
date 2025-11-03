-- CryptoFlash Auth Schema Updates
-- Run this AFTER the base schema in supabase-schema.sql
-- This adds auth integration, RLS, and triggers

-- ============================================
-- 1. User Table Updates
-- ============================================

-- Ensure email column exists and is unique
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Indexes for Telegram fields
CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_telegram_chat
  ON public.users(telegram_chat_id) 
  WHERE telegram_chat_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_telegram_username
  ON public.users(telegram_username);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users(email)
  WHERE email IS NOT NULL;

-- ============================================
-- 2. Auto-create user in public.users on auth signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, public.users.email),
        updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- Users: Can select and update only their own record
DROP POLICY IF EXISTS "users_self_select" ON public.users;
CREATE POLICY "users_self_select" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_self_update" ON public.users;
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User Alerts: Can do all operations on their own alerts
DROP POLICY IF EXISTS "alerts_owner_all" ON public.user_alerts;
CREATE POLICY "alerts_owner_all" ON public.user_alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alert History: Can only select their own history
DROP POLICY IF EXISTS "history_owner_select" ON public.alert_history;
CREATE POLICY "history_owner_select" ON public.alert_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Crypto Payments: Can only select their own payments
DROP POLICY IF EXISTS "payments_owner_select" ON public.crypto_payments;
CREATE POLICY "payments_owner_select" ON public.crypto_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Watchlist: Can do all operations on their own watchlist
DROP POLICY IF EXISTS "watchlist_owner_all" ON public.user_watchlist;
CREATE POLICY "watchlist_owner_all" ON public.user_watchlist
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. Service Role Functions (for server jobs)
-- ============================================

-- Note: Server-side code using supabaseAdmin (Service Role Key)
-- automatically bypasses RLS. This is intentional for:
-- - /api/alerts/send (cron job)
-- - /api/pay/confirm (background processing)
-- - Admin operations

-- ============================================
-- 5. Migration Helper (for linking legacy users)
-- ============================================

-- Function to link telegram_chat_id to existing auth user
CREATE OR REPLACE FUNCTION public.link_telegram_to_user(
  p_user_id UUID,
  p_telegram_chat_id TEXT,
  p_telegram_username TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_existing_user_id UUID;
BEGIN
  -- Check if telegram_chat_id is already linked to another user
  SELECT id INTO v_existing_user_id
  FROM public.users
  WHERE telegram_chat_id = p_telegram_chat_id
    AND id != p_user_id;
  
  IF v_existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Telegram chat ID already linked to another user';
  END IF;
  
  -- Update user with telegram info
  UPDATE public.users
  SET 
    telegram_chat_id = p_telegram_chat_id,
    telegram_username = COALESCE(p_telegram_username, telegram_username),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Notes:
-- ============================================
-- 1. All RLS policies use auth.uid() - the authenticated user's ID
-- 2. Server-side operations using SUPABASE_SERVICE_ROLE_KEY bypass RLS
-- 3. The trigger automatically creates public.users record on auth.users signup
-- 4. Email verification is optional - configure in Supabase Dashboard
-- 5. Google OAuth requires setup in Supabase Dashboard → Authentication → Providers


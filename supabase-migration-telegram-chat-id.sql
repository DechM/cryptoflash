-- Migration: Change telegram_chat_id from int8 to TEXT
-- Run this in Supabase SQL Editor

-- Step 1: Drop the unique index if it exists
DROP INDEX IF EXISTS idx_users_telegram_chat_id;

-- Step 2: Alter the column type from int8 to TEXT
-- Note: This will convert existing values automatically
ALTER TABLE users 
ALTER COLUMN telegram_chat_id TYPE TEXT USING telegram_chat_id::TEXT;

-- Step 3: Recreate the unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_chat_id 
ON users(telegram_chat_id) 
WHERE telegram_chat_id IS NOT NULL;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'telegram_chat_id';


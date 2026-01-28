-- Add telegram_chat_id column to price_groups table
-- Run this in Supabase SQL Editor

ALTER TABLE price_groups 
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

COMMENT ON COLUMN price_groups.telegram_chat_id IS 'Telegram Chat ID for sending price group images';

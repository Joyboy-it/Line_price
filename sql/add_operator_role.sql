-- Add operator role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_operator BOOLEAN DEFAULT FALSE;

-- Add user_branches junction table for many-to-many relationship
-- Run this script in Supabase SQL Editor

-- Create user_branches table (junction table)
CREATE TABLE IF NOT EXISTS user_branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, branch_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_branches_user_id ON user_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branches_branch_id ON user_branches(branch_id);

-- Enable Row Level Security
ALTER TABLE user_branches ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
CREATE POLICY "Service role can do everything on user_branches" ON user_branches
  FOR ALL USING (true) WITH CHECK (true);

-- Add columns to users table for backward compatibility (optional)
ALTER TABLE users ADD COLUMN IF NOT EXISTS shop_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS note TEXT;

-- Add is_operator column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_operator BOOLEAN DEFAULT FALSE;

-- Comment
COMMENT ON TABLE user_branches IS 'Junction table for many-to-many relationship between users and branches';
COMMENT ON COLUMN user_branches.assigned_by IS 'Admin/Operator who assigned this branch to the user';

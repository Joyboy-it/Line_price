-- Line Price Check Database Schema
-- Run this script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  image TEXT,
  provider VARCHAR(50) DEFAULT 'line',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branches table (สาขา)
CREATE TABLE IF NOT EXISTS branches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price Groups table (กลุ่มราคา)
CREATE TABLE IF NOT EXISTS price_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access Requests table (คำขอสิทธิ์)
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  note TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Group Access table (สิทธิ์การเข้าถึงกลุ่มราคา)
CREATE TABLE IF NOT EXISTS user_group_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  price_group_id UUID REFERENCES price_groups(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, price_group_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_user_id ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_group_access_user_id ON user_group_access(user_id);
CREATE INDEX IF NOT EXISTS idx_price_groups_branch_id ON price_groups(branch_id);

-- Insert sample data
INSERT INTO branches (name, code) VALUES 
  ('กรุงเทพ', 'BKK'),
  ('เชียงใหม่', 'CNX'),
  ('ภูเก็ต', 'HKT'),
  ('ขอนแก่น', 'KKC')
ON CONFLICT (code) DO NOTHING;

-- Insert sample price groups
INSERT INTO price_groups (name, description, branch_id) 
SELECT 'ราคาปลีก', 'ราคาขายปลีกทั่วไป', id FROM branches WHERE code = 'BKK'
ON CONFLICT DO NOTHING;

INSERT INTO price_groups (name, description, branch_id) 
SELECT 'ราคาส่ง', 'ราคาสำหรับร้านค้าส่ง', id FROM branches WHERE code = 'BKK'
ON CONFLICT DO NOTHING;

INSERT INTO price_groups (name, description, branch_id) 
SELECT 'ราคา VIP', 'ราคาพิเศษสำหรับลูกค้า VIP', id FROM branches WHERE code = 'BKK'
ON CONFLICT DO NOTHING;

INSERT INTO price_groups (name, description, branch_id) 
SELECT 'ราคาปลีก', 'ราคาขายปลีกทั่วไป', id FROM branches WHERE code = 'CNX'
ON CONFLICT DO NOTHING;

INSERT INTO price_groups (name, description, branch_id) 
SELECT 'ราคาส่ง', 'ราคาสำหรับร้านค้าส่ง', id FROM branches WHERE code = 'CNX'
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_requests_updated_at ON access_requests;
CREATE TRIGGER update_access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_access ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS
CREATE POLICY "Service role can do everything on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on branches" ON branches
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on price_groups" ON price_groups
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on access_requests" ON access_requests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on user_group_access" ON user_group_access
  FOR ALL USING (true) WITH CHECK (true);

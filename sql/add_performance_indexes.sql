-- Performance Indexes สำหรับเพิ่มความเร็วของ API queries
-- รันใน Supabase SQL Editor

-- Index สำหรับ announcements (ใช้ is_published แทน is_active)
CREATE INDEX IF NOT EXISTS idx_announcements_published_created 
ON announcements(is_published, created_at DESC);

-- Index สำหรับ user_group_access (ปรับปรุงการ query กลุ่มราคาของ user)
CREATE INDEX IF NOT EXISTS idx_user_group_access_user_group 
ON user_group_access(user_id, price_group_id);

-- Index สำหรับ access_requests (ปรับปรุงการ query คำขอของ user)
CREATE INDEX IF NOT EXISTS idx_access_requests_user_status 
ON access_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_access_requests_status_created 
ON access_requests(status, created_at DESC);

-- Index สำหรับ price_groups
CREATE INDEX IF NOT EXISTS idx_price_groups_created 
ON price_groups(created_at DESC);

-- Index สำหรับ user_logs (ปรับปรุงหน้า logs)
CREATE INDEX IF NOT EXISTS idx_user_logs_user_created 
ON user_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_logs_action_created 
ON user_logs(action, created_at DESC);

-- Index สำหรับ branches
CREATE INDEX IF NOT EXISTS idx_branches_name 
ON branches(name);

-- Analyze tables เพื่ออัปเดต statistics
ANALYZE announcements;
ANALYZE user_group_access;
ANALYZE access_requests;
ANALYZE price_groups;
ANALYZE user_logs;
ANALYZE branches;

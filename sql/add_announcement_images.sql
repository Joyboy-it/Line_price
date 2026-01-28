-- เพิ่มตาราง announcement_images สำหรับรองรับรูปภาพหลายรูปต่อประกาศ (สูงสุด 5 รูปต่อโพสต์ในฝั่งแอป)
-- รันใน Supabase SQL Editor หลังจาก sql/add_images_announcements.sql

CREATE TABLE IF NOT EXISTS announcement_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcement_images_announcement_id ON announcement_images(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_images_order ON announcement_images(announcement_id, sort_order);

ALTER TABLE announcement_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything on announcement_images" ON announcement_images
  FOR ALL USING (true) WITH CHECK (true);

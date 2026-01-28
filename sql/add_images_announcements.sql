-- เพิ่มตาราง price_group_images และ announcements
-- รันใน Supabase SQL Editor หลังจาก setup.sql

-- ตารางเก็บรูปภาพราคาของแต่ละกลุ่ม
CREATE TABLE IF NOT EXISTS price_group_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  price_group_id UUID NOT NULL REFERENCES price_groups(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name VARCHAR(255),
  title VARCHAR(255),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตารางประกาศ/ประชาสัมพันธ์
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  image_path TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_group_images_group_id ON price_group_images(price_group_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, created_at DESC);

-- RLS
ALTER TABLE price_group_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policies for service role
CREATE POLICY "Service role can do everything on price_group_images" ON price_group_images
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on announcements" ON announcements
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger for announcements updated_at
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

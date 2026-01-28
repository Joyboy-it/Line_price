# 📱 Line Price AI - ระบบเช็คราคาสินค้าผ่าน LINE

ระบบเว็บแอปพลิเคชันสำหรับจัดการและแชร์ราคาสินค้าให้กับผู้ใช้ผ่าน LINE Login พร้อมระบบจัดการสิทธิ์การเข้าถึงแบบละเอียด รองรับการอัปโหลดรูปภาพราคา ประกาศข่าวสาร และระบบ log การใช้งาน

---

## 🚀 Tech Stack

| เทคโนโลยี | รายละเอียด |
|-----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Authentication** | NextAuth.js v4 with LINE Provider |
| **UI Components** | Custom components with Lucide React icons |
| **Image Handling** | Next.js Image Optimization |

---

## ✨ Features

### 👤 สำหรับผู้ใช้ทั่วไป
- ✅ **เข้าสู่ระบบด้วย LINE Account** - ไม่ต้องสมัครสมาชิก
- 📋 **ขอสิทธิ์เข้าถึงกลุ่มราคา** - ระบุชื่อร้านและหมายเหตุ
- 📊 **ดูรายการกลุ่มราคา** - แสดงกลุ่มที่ได้รับอนุญาตพร้อมวันที่อัปเดตล่าสุด
- 🖼️ **ดูรูปภาพราคา** - Lightbox gallery พร้อม zoom และ navigation
- 📢 **ดูประกาศข่าวสาร** - อ่านข่าวสารจากแอดมิน

### 👨‍💼 สำหรับ Admin
- 📥 **จัดการคำขอสิทธิ์** - อนุมัติ/ปฏิเสธคำขอพร้อมเลือกกลุ่มราคา
- 👥 **จัดการผู้ใช้** - แก้ไขข้อมูล, กำหนดสิทธิ์, จัดการกลุ่ม (ลิมิต 50 รายการ)
- 🏷️ **จัดการกลุ่มราคา** - สร้าง/แก้ไข/ลบกลุ่มราคา พร้อมช่องค้นหา
- 🖼️ **อัปโหลดรูปภาพราคา** - อัปโหลดหลายไฟล์พร้อมกัน ลบรูปได้
- 📢 **จัดการประกาศ** - สร้าง/แก้ไข/ลบประกาศพร้อมรูปภาพ
- 📊 **Dashboard** - สรุปสถิติคำขอและลิงก์ไปยังหน้าจัดการต่างๆ
- 📜 **ประวัติการใช้งาน** - ดู log การ login/register (ลิมิต 100 รายการ)

### 🔧 สำหรับ Operator
- 🛠️ **สิทธิ์ระดับกลาง** - สำหรับทีมงานที่ต้องการสิทธิ์เฉพาะส่วน

---

## 📦 Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd Line_price_ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

สร้างไฟล์ `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LINE OAuth (จาก LINE Developers Console)
LINE_CLIENT_ID=your_line_channel_id
LINE_CLIENT_SECRET=your_line_channel_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_generate_with_openssl
```

**สร้าง NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Setup Supabase Database

รัน SQL scripts ใน Supabase SQL Editor **ตามลำดับ:**

```sql
-- 1. สร้างตารางหลัก
sql/setup.sql

-- 2. สร้างตาราง NextAuth
sql/recreate_nextauth_tables.sql

-- 3. เพิ่มฟีเจอร์รูปภาพและประกาศ
sql/add_images_announcements.sql

-- 4. เพิ่มฟิลด์รายละเอียดผู้ใช้
sql/add_user_details.sql

-- 5. เพิ่มสิทธิ์ Operator
sql/add_operator_role.sql

-- 6. สร้างระบบ log
sql/add_user_logs.sql
```

### 5. Setup Supabase Storage

สร้าง Storage Bucket ใน Supabase:

1. ไปที่ **Storage** → **Create a new bucket**
2. ชื่อ bucket: `price-images`
3. ตั้งค่า **Public bucket** (เพื่อให้เข้าถึงรูปได้)
4. ตั้งค่า **File size limit:** 5MB (หรือตามต้องการ)

### 6. Setup LINE Login

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง **Provider** ใหม่
3. สร้าง **LINE Login Channel**
4. ตั้งค่า **Callback URL:**
   - Development: `http://localhost:3000/api/auth/callback/line`
   - Production: `https://yourdomain.com/api/auth/callback/line`
5. คัดลอก **Channel ID** และ **Channel Secret** ไปใส่ใน `.env.local`

### 7. Run Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Project Structure

```
Line_price_ai/
├── sql/                                    # SQL Migration Scripts
│   ├── setup.sql                          # ตารางหลัก (users, branches, price_groups, etc.)
│   ├── recreate_nextauth_tables.sql       # ตาราง NextAuth
│   ├── add_images_announcements.sql       # ตารางรูปภาพและประกาศ
│   ├── add_user_details.sql               # ฟิลด์รายละเอียดผู้ใช้
│   ├── add_operator_role.sql              # สิทธิ์ Operator
│   └── add_user_logs.sql                  # ระบบ log
│
├── src/
│   ├── app/
│   │   ├── api/                           # API Routes
│   │   │   ├── auth/[...nextauth]/        # NextAuth endpoints
│   │   │   ├── access-requests/           # จัดการคำขอสิทธิ์
│   │   │   │   └── [id]/
│   │   │   │       ├── approve/           # อนุมัติคำขอ
│   │   │   │       └── reject/            # ปฏิเสธคำขอ
│   │   │   ├── admin/
│   │   │   │   ├── price-groups/          # จัดการกลุ่มราคา (admin)
│   │   │   │   └── users/                 # จัดการผู้ใช้
│   │   │   │       └── [id]/              # แก้ไข/ลบผู้ใช้
│   │   │   ├── announcements/             # จัดการประกาศ
│   │   │   │   └── [id]/                  # แก้ไข/ลบประกาศ
│   │   │   ├── branches/                  # จัดการสาขา
│   │   │   ├── price-groups/              # ดูกลุ่มราคา
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts           # ดูรายละเอียดกลุ่ม
│   │   │   │       └── images/            # จัดการรูปภาพ
│   │   │   ├── user-access/               # ดูกลุ่มที่ผู้ใช้เข้าถึงได้
│   │   │   └── user-logs/                 # ระบบ log
│   │   │
│   │   ├── admin/                         # Admin Pages
│   │   │   ├── page.tsx                   # Dashboard
│   │   │   ├── users/                     # จัดการผู้ใช้
│   │   │   ├── manage-groups/             # จัดการกลุ่มราคา
│   │   │   ├── price-groups/              # จัดการรูปภาพราคา
│   │   │   │   └── [id]/                  # อัปโหลด/ลบรูป
│   │   │   ├── announcements/             # จัดการประกาศ
│   │   │   └── logs/                      # ประวัติการใช้งาน
│   │   │
│   │   ├── auth/signin/                   # หน้า Login
│   │   ├── price-groups/[id]/             # หน้าดูรูปภาพราคา
│   │   ├── layout.tsx                     # Root Layout
│   │   ├── page.tsx                       # Home Page
│   │   └── globals.css                    # Global Styles
│   │
│   ├── components/
│   │   ├── Navbar.tsx                     # Navigation Bar
│   │   ├── Providers.tsx                  # Session Provider
│   │   ├── RequestAccessForm.tsx          # ฟอร์มขอสิทธิ์
│   │   └── PriceGroupList.tsx             # รายการกลุ่มราคา
│   │
│   ├── lib/
│   │   ├── auth.ts                        # NextAuth Configuration
│   │   └── supabase.ts                    # Supabase Client
│   │
│   └── types/
│       ├── index.ts                       # Type Definitions
│       └── next-auth.d.ts                 # NextAuth Types
│
├── .env.local.example                     # ตัวอย่าง Environment Variables
├── next.config.js                         # Next.js Configuration
├── tailwind.config.ts                     # Tailwind Configuration
├── tsconfig.json                          # TypeScript Configuration
└── package.json                           # Dependencies
```

---

## 🗄️ Database Schema

### หลักการออกแบบ
- **users** - ข้อมูลผู้ใช้จาก LINE Login
- **branches** - สาขา (ไม่ได้ใช้งานในปัจจุบัน)
- **price_groups** - กลุ่มราคาสินค้า
- **price_group_images** - รูปภาพราคาในแต่ละกลุ่ม
- **user_group_access** - สิทธิ์การเข้าถึงกลุ่มราคาของผู้ใช้
- **access_requests** - คำขอสิทธิ์เข้าถึง
- **announcements** - ประกาศข่าวสาร
- **user_logs** - บันทึกการใช้งาน (login, register)

### ความสัมพันธ์
```
users (1) ──< (N) user_group_access (N) >── (1) price_groups
users (1) ──< (N) access_requests
users (1) ──< (N) user_logs
price_groups (1) ──< (N) price_group_images
users (1) ──< (N) announcements (created_by)
```

---

## 👨‍💼 User Roles

### 1. **User (ผู้ใช้ทั่วไป)**
- เข้าสู่ระบบด้วย LINE
- ขอสิทธิ์เข้าถึงกลุ่มราคา
- ดูกลุ่มราคาที่ได้รับอนุญาต
- ดูประกาศ

### 2. **Operator**
- สิทธิ์เพิ่มเติมสำหรับทีมงาน (ยังไม่ได้กำหนดฟีเจอร์เฉพาะ)

### 3. **Admin**
- สิทธิ์เต็มทุกอย่าง
- จัดการผู้ใช้และกลุ่มราคา
- อนุมัติคำขอสิทธิ์
- อัปโหลดรูปภาพและจัดการประกาศ
- ดู log การใช้งาน

### ตั้งค่าสิทธิ์ Admin/Operator

```sql
-- ตั้งค่า Admin
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';

-- ตั้งค่า Operator
UPDATE users SET is_operator = true WHERE email = 'operator@example.com';

-- ตั้งค่าทั้งสองสิทธิ์
UPDATE users SET is_admin = true, is_operator = true WHERE provider_id = 'line_user_id';
```

---

## 🔐 Authentication Flow

1. ผู้ใช้คลิก "เข้าสู่ระบบด้วย LINE"
2. Redirect ไป LINE Login
3. LINE ส่ง callback กลับมาพร้อม user profile
4. NextAuth สร้าง/อัปเดตข้อมูลใน `users` table
5. บันทึก log การ login/register ใน `user_logs`
6. สร้าง session และ redirect กลับหน้าหลัก

---

## 📸 Image Upload Flow

1. Admin เลือกกลุ่มราคาที่ต้องการอัปโหลด
2. เลือกไฟล์รูปภาพ (รองรับหลายไฟล์)
3. อัปโหลดไปยัง Supabase Storage bucket `price-images`
4. บันทึก metadata ใน `price_group_images` table
5. ผู้ใช้ที่มีสิทธิ์สามารถดูรูปได้ทันที

---

## 🎯 Key Features Explained

### 1. **ระบบจัดการสิทธิ์แบบละเอียด**
- ผู้ใช้ขอสิทธิ์ผ่านฟอร์ม
- Admin เลือกกลุ่มราคาที่จะให้สิทธิ์
- รองรับหลายกลุ่มต่อ 1 ผู้ใช้

### 2. **Lightbox Gallery**
- ดูรูปภาพแบบ fullscreen
- Navigation ด้วยปุ่มหรือ keyboard (Arrow keys, Escape)
- แสดงวันที่อัปเดตล่าสุด

### 3. **ระบบ Log การใช้งาน**
- บันทึกอัตโนมัติเมื่อ login/register
- Admin ดูได้ที่หน้า `/admin/logs`
- Filter ตาม action และค้นหาตามชื่อผู้ใช้

### 4. **ข้อมูลผู้ใช้แบบละเอียด**
- ชื่อร้าน (shop_name)
- เบอร์โทร (phone)
- ที่อยู่ (address)
- บัญชีธนาคาร (bank_account, bank_name)
- หมายเหตุ (note)

### 5. **Performance Optimization**
- ใช้ Next.js Image Optimization
- Nested SELECT queries แทน N+1 queries
- Non-blocking log inserts
- Limit รายการแสดงผล (50-100 รายการ)

---

## 🚀 Deployment

### Vercel (แนะนำ)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

ตั้งค่า Environment Variables ใน Vercel Dashboard:
- เหมือนกับใน `.env.local`
- เปลี่ยน `NEXTAUTH_URL` เป็น production URL

### อื่นๆ
- **Netlify:** รองรับ Next.js
- **Railway:** รองรับ Next.js
- **Self-hosted:** ใช้ `npm run build && npm start`

---

## 🔧 Development Tips

### ดู Logs
```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

### Debug NextAuth
เพิ่มใน `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

### ตรวจสอบ Database
ใช้ Supabase Table Editor หรือ SQL Editor

---

## 📝 Common Issues

### 1. LINE Login ไม่ทำงาน
- ตรวจสอบ Callback URL ใน LINE Developers Console
- ตรวจสอบ `LINE_CLIENT_ID` และ `LINE_CLIENT_SECRET`

### 2. รูปภาพไม่แสดง
- ตรวจสอบว่า bucket `price-images` เป็น public
- ตรวจสอบ `NEXT_PUBLIC_SUPABASE_URL`

### 3. Session หาย
- ตรวจสอบ `NEXTAUTH_SECRET`
- ลบ cookies และ login ใหม่

### 4. Error 500 ที่ /api/user-logs
- ตรวจสอบว่ารัน `sql/add_user_logs.sql` แล้ว
- ตรวจสอบว่า indexes ถูกสร้างแล้ว

---

## 📚 API Documentation

### Public APIs
- `GET /api/price-groups` - ดูกลุ่มราคาทั้งหมด
- `GET /api/price-groups/[id]` - ดูรายละเอียดกลุ่ม
- `GET /api/price-groups/[id]/images` - ดูรูปภาพในกลุ่ม
- `GET /api/user-access` - ดูกลุ่มที่ผู้ใช้เข้าถึงได้
- `POST /api/access-requests` - ขอสิทธิ์เข้าถึง
- `GET /api/announcements` - ดูประกาศ

### Admin APIs
- `GET /api/admin/users` - ดูผู้ใช้ทั้งหมด
- `PATCH /api/admin/users/[id]` - แก้ไขผู้ใช้
- `DELETE /api/admin/users/[id]` - ลบผู้ใช้
- `GET /api/access-requests` - ดูคำขอทั้งหมด
- `POST /api/access-requests/[id]/approve` - อนุมัติ
- `POST /api/access-requests/[id]/reject` - ปฏิเสธ
- `GET /api/user-logs` - ดู logs

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👥 Contact

สำหรับข้อสงสัยหรือปัญหา กรุณาติดต่อผู้พัฒนาระบบ

---

## 🎉 Changelog

### v1.0.0 (Latest)
- ✅ ระบบ Login ด้วย LINE
- ✅ ระบบจัดการสิทธิ์การเข้าถึง
- ✅ อัปโหลดและจัดการรูปภาพราคา
- ✅ ระบบประกาศข่าวสาร
- ✅ ระบบ log การใช้งาน
- ✅ สิทธิ์ Admin และ Operator
- ✅ ข้อมูลผู้ใช้แบบละเอียด (ชื่อร้าน, เบอร์โทร, ฯลฯ)
- ✅ Performance optimization (N+1 query fix, non-blocking logs)
- ✅ UI/UX improvements (search, filters, limits)

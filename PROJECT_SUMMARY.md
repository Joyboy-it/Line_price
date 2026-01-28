# Line Price Check Project Summary

## Overview
ระบบเว็บเช็คราคา (วงษ์พาณิชย์ ส.เจริญชัย รีไซเคิล) เป็นเว็บแอปพลิเคชันที่ช่วยให้ผู้ใช้งานสามารถตรวจสอบราคาสินค้าตามกลุ่มราคาที่ได้รับสิทธิ์ โดยใช้ LINE Login ในการยืนยันตัวตน และมีระบบขอสิทธิ์เข้าถึงข้อมูล (Access Request) ที่ต้องได้รับการอนุมัติจาก Admin ก่อน

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** NextAuth.js (v4) with LINE Provider & Supabase Adapter
- **Icons:** Lucide React

## Key Features

### 1. Authentication (ระบบยืนยันตัวตน)
- เข้าสู่ระบบด้วย **LINE Account**
- ใช้ **NextAuth.js** เชื่อมต่อกับ Supabase Adapter
- เก็บข้อมูล Session และ Account ลงในฐานข้อมูล Supabase

### 2. Access Control (ระบบจัดการสิทธิ์)
- **User Roles:**
  - **General User:** ผู้ใช้งานทั่วไป ต้องขอสิทธิ์ก่อนดูราคา
  - **Admin:** ผู้ดูแลระบบ สามารถอนุมัติ/ปฏิเสธคำขอ และจัดการสิทธิ์ผู้ใช้
- **Access Request Flow:**
  1. User ใหม่ล็อกอินเข้ามา -> เห็นหน้าแจ้งเตือนให้ Login
  2. เมื่อ Login แล้ว -> เห็นฟอร์มขอสิทธิ์ (Request Access Form)
  3. User เลือกสาขาที่ต้องการขอราคาและหใส่ชื่อร้านและหมายเหตุ -> กดส่งคำขอ (สถานะ `pending`)
  4. Admin เห็นรายการคำขอ -> กดอนุมัติ (Approve) พร้อมเลือกกลุ่มราคา (Price Groups) ให้ User
  5. User ได้รับสิทธิ์ -> สามารถดูรายการกลุ่มราคาที่ได้รับอนุญาต

### 3. Admin Dashboard (หน้าจัดการสำหรับแอดมิน)
- แสดงรายการคำขอที่รออนุมัติ (Pending Requests)
- อนุมัติคำขอ (Approve) และกำหนดสิทธิ์เข้าถึงกลุ่มราคา
- ปฏิเสธคำขอ (Reject) พร้อมระบุเหตุผล
- ดูประวัติหรือรายการผู้ใช้ในระบบ

### 4. Database Schema
- **users:** เก็บข้อมูลผู้ใช้ (เชื่อมกับ NextAuth) + `is_admin` flag
- **accounts, sessions:** ตารางมาตราฐานของ NextAuth
- **branches:** เก็บข้อมูลสาขา (เช่น กรุงเทพ, เชียงใหม่)
- **price_groups:** เก็บข้อมูลกลุ่มราคา (เช่น ราคา VIP, ราคาขายส่ง)
- **access_requests:** เก็บข้อมูลการขอสิทธิ์ (User ขอ Branch ไหน, สถานะเป็นยังไง)
- **user_group_access:** เก็บสิทธิ์จริงที่ User ได้รับ (User A ได้สิทธิ์ดู Price Group B)

## Installation & Setup

1. **Clone Project**
2. **Install Dependencies:** `npm install`
3. **Setup Environment Variables (`.env.local`):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...
   LINE_CLIENT_ID=...
   LINE_CLIENT_SECRET=...
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=...
   ```
4. **Database Setup:**
   - Run SQL scripts in Supabase SQL Editor:
     1. `setup.sql` (Initial Schema)
     2. `recreate_nextauth_tables.sql` (Fix NextAuth Schema)
5. **Run Development Server:** `npm run dev`

## Important SQL Scripts
- `setup.sql`: สร้างตารางหลักของระบบ
- `recreate_nextauth_tables.sql`: **สำคัญ** ใช้สำหรับ Reset ตาราง `accounts`, `sessions` ให้ตรงกับ Snake Case Schema ของ NextAuth Adapter เพื่อแก้ปัญหา Login Error

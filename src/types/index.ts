export interface User {
  id: string
  provider_id: string
  name: string
  email?: string
  image?: string
  provider: string
  is_admin: boolean
  is_operator: boolean
  created_at: string
  shop_name?: string
  phone?: string
  address?: string
  bank_account?: string
  bank_name?: string
  note?: string
  // Joined fields
  user_branches?: UserBranch[]
}

export interface UserBranch {
  id: string
  user_id: string
  branch_id: string
  assigned_by?: string
  created_at: string
  // Joined fields
  branch?: Branch
}

export interface Branch {
  id: string
  name: string
  code: string
  created_at: string
}

export interface PriceGroup {
  id: string
  name: string
  description?: string
  branch_id: string
  telegram_chat_id?: string
  created_at: string
  last_updated_at?: string | null
}

export interface AccessRequest {
  id: string
  user_id: string
  branch_id: string
  shop_name: string
  note?: string
  status: 'pending' | 'approved' | 'rejected'
  reject_reason?: string
  created_at: string
  updated_at: string
  // Joined fields
  user?: User
  branch?: Branch
}

export interface UserGroupAccess {
  id: string
  user_id: string
  price_group_id: string
  granted_by: string
  created_at: string
  last_updated_at?: string | null
  // Joined fields
  price_group?: PriceGroup
}

export interface PriceGroupImage {
  id: string
  price_group_id: string
  file_path: string
  file_name?: string
  title?: string
  uploaded_by?: string
  created_at: string
}

export interface AnnouncementImage {
  id: string
  announcement_id: string
  image_path: string
  sort_order: number
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  body?: string
  image_path?: string
  images?: AnnouncementImage[]
  is_published: boolean
  created_by?: string
  created_at: string
  updated_at: string
  // Joined fields
  creator?: User
}

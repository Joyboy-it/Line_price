import { supabaseAdmin } from '@/lib/supabase'
import { unstable_cache } from 'next/cache'

export async function getUserAccess(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_group_access')
      .select(`
        *,
        price_group:price_groups(*)
      `)
      .eq('user_id', userId)

    if (error) throw error

    const groupIds = (data || [])
      .map((row) => row.price_group_id)
      .filter(Boolean)

    if (groupIds.length === 0) {
      return data || []
    }

    const { data: images, error: imagesError } = await supabaseAdmin
      .from('price_group_images')
      .select('price_group_id, created_at')
      .in('price_group_id', groupIds)
      .order('created_at', { ascending: false })

    if (imagesError) throw imagesError

    const latestMap = new Map<string, string>()
    for (const img of images || []) {
      if (!latestMap.has(img.price_group_id)) {
        latestMap.set(img.price_group_id, img.created_at)
      }
    }

    const enriched = (data || []).map((row) => ({
      ...row,
      last_updated_at: latestMap.get(row.price_group_id) || null,
    }))

    return enriched
  } catch (error) {
    console.error('Error fetching user access:', error)
    return []
  }
}

const getBranchesDb = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .order('name')

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching branches:', error)
    return []
  }
}

export const getBranches = unstable_cache(
  async () => getBranchesDb(),
  ['branches-list'],
  { revalidate: 3600, tags: ['branches'] }
)

export async function getUserAccessRequest(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .select(`
        *,
        branch:branches(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return data || null
  } catch (error) {
    console.error('Error fetching user request:', error)
    return null
  }
}

const getAnnouncementsDb = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) throw error

    const announcementIds = (data || []).map((a) => a.id).filter(Boolean)
    if (announcementIds.length === 0) {
      return data || []
    }

    const { data: images, error: imagesError } = await supabaseAdmin
      .from('announcement_images')
      .select('*')
      .in('announcement_id', announcementIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (imagesError) throw imagesError

    const byAnnouncement = new Map<string, any[]>()
    for (const img of images || []) {
      const arr = byAnnouncement.get(img.announcement_id) || []
      arr.push(img)
      byAnnouncement.set(img.announcement_id, arr)
    }

    const enriched = (data || []).map((a) => ({
      ...a,
      images: byAnnouncement.get(a.id) || [],
      image_path: a.image_path || (byAnnouncement.get(a.id)?.[0]?.image_path ?? null)
    }))

    return enriched
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return []
  }
}

export const getAnnouncements = unstable_cache(
  async () => getAnnouncementsDb(),
  ['announcements-list'],
  { revalidate: 600, tags: ['announcements'] }
)

export async function getAdminUsers() {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError
    if (!users || users.length === 0) return []

    const userIds = users.map(u => u.id)

    // Get user branches
    const { data: userBranches } = await supabaseAdmin
      .from('user_branches')
      .select(`
        id,
        user_id,
        branch_id,
        assigned_by,
        created_at,
        branches:branch_id (
          id,
          name,
          code
        )
      `)
      .in('user_id', userIds)

    // Get user_group_access
    const { data: accessData } = await supabaseAdmin
      .from('user_group_access')
      .select(`
        id,
        user_id,
        price_group_id,
        created_at,
        price_groups (
          id,
          name
        )
      `)

    // Merge data
    const usersWithGroups = users.map(user => ({
      ...user,
      user_group_access: (accessData || [])
        .filter(ga => ga.user_id === user.id)
        .map(ga => ({
          id: ga.id,
          price_group_id: ga.price_group_id,
          created_at: ga.created_at,
          price_groups: ga.price_groups
        })),
      user_branches: (userBranches || [])
        .filter(ub => ub.user_id === user.id)
        .map(ub => ({
          id: ub.id,
          user_id: ub.user_id,
          branch_id: ub.branch_id,
          assigned_by: ub.assigned_by,
          created_at: ub.created_at,
          branch: ub.branches
        }))
    }))

    return usersWithGroups
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return []
  }
}

export async function getAdminPriceGroups() {
  try {
    const { data, error } = await supabaseAdmin
      .from('price_groups')
      .select('*')
      .order('name')

    if (error) throw error

    const groupIds = (data || []).map((g) => g.id).filter(Boolean)
    if (groupIds.length === 0) return data || []

    const { data: images, error: imagesError } = await supabaseAdmin
      .from('price_group_images')
      .select('price_group_id, created_at')
      .in('price_group_id', groupIds)
      .order('created_at', { ascending: false })

    if (imagesError) throw imagesError

    const latestMap = new Map<string, string>()
    for (const img of images || []) {
      if (!latestMap.has(img.price_group_id)) {
        latestMap.set(img.price_group_id, img.created_at)
      }
    }

    const enriched = (data || []).map((group) => ({
      ...group,
      last_updated_at: latestMap.get(group.id) || null,
    }))

    return enriched
  } catch (error) {
    console.error('Error fetching admin price groups:', error)
    return []
  }
}

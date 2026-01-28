import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface UserRecord {
  id: string
  name: string
  email: string
  image?: string
  shop_name?: string
  created_at: string
}

interface RequestRecord {
  id: string
  status: string
  created_at: string
  updated_at: string
}

interface LogRecord {
  id: string
  user_id: string
  action: string
  details?: Record<string, unknown>
  created_at: string
  users?: {
    id: string
    name: string
    image?: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin/Operator only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const inactiveDays = parseInt(searchParams.get('inactiveDays') || '30')

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Calculate inactive threshold
    const inactiveThreshold = new Date()
    inactiveThreshold.setDate(inactiveThreshold.getDate() - inactiveDays)

    // Active (30 days) threshold
    const activeThreshold = new Date()
    activeThreshold.setDate(activeThreshold.getDate() - 30)

    // Parallel queries for stats
    const [
      usersResult,
      requestsResult,
      priceGroupsResult,
      logsResult,
      recentLogsResult,
      branchesResult,
      userBranchesResult
    ] = await Promise.all([
      // Total users with access
      supabaseAdmin
        .from('users')
        .select('id, name, email, image, shop_name, created_at', { count: 'exact' }),
      
      // Access requests
      supabaseAdmin
        .from('access_requests')
        .select('id, status, created_at, updated_at'),
      
      // Price groups with last update
      supabaseAdmin
        .from('price_groups')
        .select('id, name'),
      
      // User logs for activity tracking
      supabaseAdmin
        .from('user_logs')
        .select('user_id, action, created_at')
        .in('action', ['login', 'register'])
        .order('created_at', { ascending: false }),
      
      // Recent activity logs
      supabaseAdmin
        .from('user_logs')
        .select(`
          id,
          user_id,
          action,
          details,
          created_at,
          users:user_id (
            id,
            name,
            image
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      ,

      // Branches for users-by-branch pie
      supabaseAdmin
        .from('branches')
        .select('id, name'),

      // User-branch mapping
      supabaseAdmin
        .from('user_branches')
        .select('user_id, branch_id')
    ])

    const users = (usersResult.data || []) as UserRecord[]
    const requests = (requestsResult.data || []) as RequestRecord[]
    const priceGroups = priceGroupsResult.data || []
    const logs = (logsResult.data || []) as { user_id: string; action: string; created_at: string }[]
    const recentLogs = (recentLogsResult.data || []) as unknown as LogRecord[]
    const branches = (branchesResult.data || []) as { id: string; name: string }[]
    const userBranches = (userBranchesResult.data || []) as { user_id: string; branch_id: string }[]

    // Calculate KPIs
    const pendingRequests = requests.filter(r => r.status === 'pending')
    const approvedRequests = requests.filter(r => r.status === 'approved')
    const rejectedRequests = requests.filter(r => r.status === 'rejected')
    
    // Requests today
    const requestsToday = requests.filter(r => {
      const created = new Date(r.created_at)
      return created >= today && created < tomorrow
    })

    // Get users with group access
    const { data: usersWithAccess } = await supabaseAdmin
      .from('user_group_access')
      .select('user_id')
    
    const userIdsWithAccess = new Set((usersWithAccess || []).map(u => u.user_id))

    // Active users in last 30 days (based on login/register logs)
    const activeUserIds30d = new Set<string>()
    logs.forEach(log => {
      const created = new Date(log.created_at)
      if (created >= activeThreshold && userIdsWithAccess.has(log.user_id)) {
        activeUserIds30d.add(log.user_id)
      }
    })
    const activeUsers30d = activeUserIds30d.size
    const activeUsers30dPercent = userIdsWithAccess.size > 0
      ? Math.round((activeUsers30d / userIdsWithAccess.size) * 100)
      : 0

    // Calculate inactive users
    const lastLoginMap = new Map<string, string>()
    logs.forEach(log => {
      if (!lastLoginMap.has(log.user_id)) {
        lastLoginMap.set(log.user_id, log.created_at)
      }
    })

    const inactiveUsers = users
      .filter((user: UserRecord) => userIdsWithAccess.has(user.id))
      .map((user: UserRecord) => {
        const lastLogin = lastLoginMap.get(user.id)
        const lastLoginDate = lastLogin ? new Date(lastLogin) : new Date(user.created_at)
        const daysSinceLogin = Math.floor((Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          shop_name: user.shop_name,
          last_login: lastLogin || user.created_at,
          days_since_login: daysSinceLogin
        }
      })
      .filter(user => {
        const lastLoginDate = new Date(user.last_login)
        return lastLoginDate < inactiveThreshold
      })
      .sort((a, b) => b.days_since_login - a.days_since_login)

    // Calculate request monthly trends (last 12 months)
    const requestMonthlyTrends = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date()
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      start.setMonth(start.getMonth() - i)

      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)

      const monthRequests = requests.filter(r => {
        const created = new Date(r.created_at)
        return created >= start && created < end
      })

      const year = start.getFullYear()
      const month = String(start.getMonth() + 1).padStart(2, '0')
      requestMonthlyTrends.push({
        month: `${year}-${month}`,
        total: monthRequests.length,
        approved: monthRequests.filter((r: RequestRecord) => r.status === 'approved').length,
        rejected: monthRequests.filter((r: RequestRecord) => r.status === 'rejected').length,
        pending: monthRequests.filter((r: RequestRecord) => r.status === 'pending').length
      })
    }

    // Users by branch (distinct users per branch)
    const branchToUsers = new Map<string, Set<string>>()
    userBranches.forEach(ub => {
      if (!userIdsWithAccess.has(ub.user_id)) return
      if (!branchToUsers.has(ub.branch_id)) branchToUsers.set(ub.branch_id, new Set<string>())
      branchToUsers.get(ub.branch_id)!.add(ub.user_id)
    })

    const usersByBranch = branches
      .map(b => ({
        name: b.name,
        value: branchToUsers.get(b.id)?.size || 0
      }))
      .filter(b => b.value > 0)
      .sort((a, b) => b.value - a.value)

    // Urgent tasks
    const urgentTasks = []
    
    // Pending requests > 24 hours
    const oldPendingRequests = pendingRequests.filter(r => {
      const created = new Date(r.created_at)
      const hoursSince = (Date.now() - created.getTime()) / (1000 * 60 * 60)
      return hoursSince > 24
    })
    if (oldPendingRequests.length > 0) {
      urgentTasks.push({
        type: 'pending_requests',
        title: `${oldPendingRequests.length} คำขอรออนุมัติมากกว่า 24 ชม.`,
        count: oldPendingRequests.length,
        severity: 'high',
        link: '/admin'
      })
    }

    // Inactive users
    if (inactiveUsers.length > 0) {
      urgentTasks.push({
        type: 'inactive_users',
        title: `${inactiveUsers.length} ผู้ใช้ไม่ได้เข้าระบบ ${inactiveDays} วัน`,
        count: inactiveUsers.length,
        severity: inactiveUsers.length > 10 ? 'high' : 'medium',
        link: '/admin/users'
      })
    }

    return NextResponse.json({
      kpis: {
        totalUsers: users.length,
        usersWithAccess: userIdsWithAccess.size,
        activeUsers30d,
        activeUsers30dPercent,
        pendingRequests: pendingRequests.length,
        approvedRequests: approvedRequests.length,
        rejectedRequests: rejectedRequests.length,
        totalRequests: requests.length,
        requestsToday: requestsToday.length,
        priceGroups: priceGroups.length,
        inactiveUsers: inactiveUsers.length
      },
      requestMonthlyTrends,
      usersByBranch,
      urgentTasks,
      inactiveUsers: inactiveUsers.slice(0, 20),
      recentActivity: recentLogs.map((log: LogRecord) => ({
        id: log.id,
        user_id: log.user_id,
        user_name: log.users?.name || 'Unknown',
        user_image: log.users?.image,
        action: log.action,
        details: log.details,
        created_at: log.created_at
      })),
      pendingRequests: pendingRequests.length
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

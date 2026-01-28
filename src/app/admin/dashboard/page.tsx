'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  UserX,
  Activity,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Tag,
  Megaphone,
  Image as ImageIcon,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface DashboardStats {
  kpis: {
    totalUsers: number
    usersWithAccess: number
    activeUsers30d: number
    activeUsers30dPercent: number
    pendingRequests: number
    approvedRequests: number
    rejectedRequests: number
    totalRequests: number
    requestsToday: number
    priceGroups: number
    inactiveUsers: number
  }
  requestMonthlyTrends: {
    month: string
    total: number
    approved: number
    rejected: number
    pending: number
  }[]
  usersByBranch: {
    name: string
    value: number
  }[]
  urgentTasks: {
    type: string
    title: string
    count: number
    severity: string
    link: string
  }[]
  inactiveUsers: {
    id: string
    name: string
    email: string
    image?: string
    shop_name?: string
    last_login: string
    days_since_login: number
  }[]
  recentActivity: {
    id: string
    user_id: string
    user_name: string
    user_image?: string
    action: string
    details?: Record<string, unknown>
    created_at: string
  }[]
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#84cc16', '#f97316', '#14b8a6', '#64748b']

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [inactiveDays, setInactiveDays] = useState(30)
  const [inactiveUsersPage, setInactiveUsersPage] = useState(0)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      router.push('/')
      return
    }
    fetchStats()
  }, [session, status, router, inactiveDays])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/admin/dashboard-stats?inactiveDays=${inactiveDays}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: 'เข้าสู่ระบบ',
      register: 'ลงทะเบียน',
      view_price: 'ดูราคา',
      request_access: 'ขอสิทธิ์'
    }
    return labels[action] || action
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'เมื่อสักครู่'
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
    return `${diffDays} วันที่แล้ว`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-line mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>
        </main>
      </div>
    )
  }

  const pieData = (stats.usersByBranch || []).filter(d => d.value > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="กลับไปหน้าหลัก"
              title="กลับไปหน้าหลัก"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">ภาพรวมระบบและสถิติการใช้งาน</p>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchStats() }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">⚡ Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100 hover:shadow-md transition"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">จัดการผู้ใช้</p>
                <p className="text-xs text-gray-500">{stats.kpis.totalUsers} คน</p>
              </div>
            </Link>
            {session?.user?.isAdmin && (
              <Link
                href="/admin/manage-groups"
                className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100 hover:shadow-md transition"
              >
                <Tag className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">จัดการกลุ่มราคา</p>
                  <p className="text-xs text-gray-500">{stats.kpis.priceGroups} กลุ่ม</p>
                </div>
              </Link>
            )}
            {session?.user?.isAdmin && (
              <Link
                href="/admin/announcements"
                className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100 hover:shadow-md transition"
              >
                <Megaphone className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">จัดการประกาศ</p>
                  <p className="text-xs text-gray-500">ประกาศประชาสัมพันธ์</p>
                </div>
              </Link>
            )}
            {session?.user?.isAdmin && (
              <Link
                href="/admin/price-groups"
                className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100 hover:shadow-md transition"
              >
                <ImageIcon className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">จัดการรูปภาพราคา</p>
                  <p className="text-xs text-gray-500">อัปโหลด/แก้ไขรูป</p>
                </div>
              </Link>
            )}
            <Link
              href="/admin/logs"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:shadow-md transition"
            >
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">ประวัติใช้งาน</p>
                <p className="text-xs text-gray-500">ประวัติการใช้งาน</p>
              </div>
            </Link>
          </div>

        </div>

        {/* Section 1: KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.kpis.pendingRequests}</p>
                <p className="text-sm text-gray-600">รอการอนุมัติ</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            {stats.kpis.requestsToday > 0 && (
              <p className="text-xs text-yellow-600 mt-2">+{stats.kpis.requestsToday} วันนี้</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.kpis.usersWithAccess}</p>
                <p className="text-sm text-gray-600">ผู้ใช้มีสิทธิ์</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">จาก {stats.kpis.totalUsers} คนทั้งหมด</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.kpis.priceGroups}</p>
                <p className="text-sm text-gray-600">กลุ่มราคา</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.kpis.activeUsers30d}</p>
                <p className="text-sm text-gray-600">Active 1 เดือน</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.kpis.usersWithAccess > 0
                ? `${stats.kpis.activeUsers30dPercent}% ของผู้ใช้มีสิทธิ์`
                : 'ยังไม่มีผู้ใช้มีสิทธิ์'
              }
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.kpis.approvedRequests}</p>
                <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.kpis.totalRequests > 0 
                ? `${Math.round((stats.kpis.approvedRequests / stats.kpis.totalRequests) * 100)}% ของทั้งหมด`
                : 'ยังไม่มีคำขอ'
              }
            </p>
          </div>
        </div>

        {/* Section 2: Urgent Tasks + Inactive Users */}
        {(stats.urgentTasks.length > 0 || stats.inactiveUsers.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Urgent Tasks */}
            {stats.urgentTasks.length > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm p-6 border border-red-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">งานเร่งด่วน</h2>
                    <p className="text-sm text-gray-600">ต้องดำเนินการ</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.urgentTasks.map((task, index) => (
                    <Link
                      key={index}
                      href={task.link}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          task.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="text-sm text-gray-700">{task.title}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Users */}
            {stats.inactiveUsers.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm p-6 border border-orange-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <UserX className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">ผู้ใช้ไม่ได้เข้าระบบ</h2>
                      <p className="text-sm text-gray-600">{stats.kpis.inactiveUsers} คน</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[7, 14, 30].map(days => (
                      <button
                        key={days}
                        onClick={() => setInactiveDays(days)}
                        className={`px-2 py-1 text-xs rounded transition ${
                          inactiveDays === days
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {days}วัน
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {stats.inactiveUsers.slice(inactiveUsersPage * 20, (inactiveUsersPage * 20) + 20).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-orange-100"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.shop_name || user.email}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-orange-600">{user.days_since_login}วัน</span>
                    </div>
                  ))}
                </div>
                {stats.inactiveUsers.length > 20 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-orange-100">
                    <button
                      onClick={() => setInactiveUsersPage(Math.max(0, inactiveUsersPage - 1))}
                      disabled={inactiveUsersPage === 0}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      ก่อนหน้า
                    </button>
                    <span className="text-sm text-gray-600">
                      {inactiveUsersPage * 20 + 1}-{Math.min((inactiveUsersPage + 1) * 20, stats.inactiveUsers.length)} จาก {stats.inactiveUsers.length}
                    </span>
                    <button
                      onClick={() => setInactiveUsersPage(Math.min(Math.floor((stats.inactiveUsers.length - 1) / 20), inactiveUsersPage + 1))}
                      disabled={(inactiveUsersPage + 1) * 20 >= stats.inactiveUsers.length}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ถัดไป
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <Link
                  href="/admin/users?filter=inactive"
                  className="block text-center text-sm text-orange-600 hover:underline mt-3 font-medium"
                >
                  ดูรายชื่อทั้งหมด →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bar Chart - Request Trends */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">คำขอสิทธิ์รายเดือน</h2>
                <p className="text-sm text-gray-600">แนวโน้มคำขอ 12 เดือนล่าสุด</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.requestMonthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: string) => v?.slice(2) || v}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        approved: 'อนุมัติ',
                        rejected: 'ปฏิเสธ',
                        pending: 'รอดำเนินการ'
                      }
                      return [value, labels[name as string] || name]
                    }}
                  />
                  <Bar dataKey="approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded"></span>
                <span className="text-xs text-gray-600">อนุมัติ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded"></span>
                <span className="text-xs text-gray-600">ปฏิเสธ</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                <span className="text-xs text-gray-600">รอดำเนินการ</span>
              </div>
            </div>
          </div>

          {/* Pie Chart - Users by Branch */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">ผู้ใช้ตามสาขา</h2>
                <p className="text-sm text-gray-600">ทั้งหมด {stats.kpis.usersWithAccess} ผู้ใช้มีสิทธิ์</p>
              </div>
            </div>
            {pieData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {pieData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="text-sm text-gray-600 truncate max-w-[9rem]">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                ยังไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">🕐 กิจกรรมล่าสุด</h2>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {activity.user_image ? (
                      <Image
                        src={activity.user_image}
                        alt={activity.user_name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        {activity.user_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      <span className="font-medium">{activity.user_name}</span>
                      {' '}{getActionLabel(activity.action)}
                    </p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">ยังไม่มีกิจกรรม</div>
          )}
          <Link
            href="/admin/logs"
            className="block text-center text-sm text-indigo-600 hover:underline mt-4"
          >
            ดูทั้งหมด →
          </Link>
        </div>

        {/* Section 5: Quick Link to Pending Requests */}
        {stats.kpis.pendingRequests > 0 && (
          <Link
            href="/admin"
            className="block bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-sm p-6 border border-yellow-200 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">คำขอที่รออนุมัติ</h2>
                  <p className="text-sm text-gray-600">มี {stats.kpis.pendingRequests} คำขอที่รอการดำเนินการ</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-yellow-600">
                <span className="text-sm font-medium">ไปจัดการ</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        )}
      </main>
    </div>
  )
}

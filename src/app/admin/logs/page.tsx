'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Activity, Search, User, LogIn, UserPlus, Eye, RefreshCw, CheckCircle, XCircle, Tag, Trash2, Upload, Edit2, Shield, FileText, Megaphone } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface UserLog {
  id: string
  user_id: string
  action: string
  details: Record<string, unknown>
  ip_address: string
  user_agent: string
  created_at: string
  users: {
    id: string
    name: string
    email: string
    image: string
  }
}

const actionLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  login: { label: 'เข้าสู่ระบบ', color: 'bg-blue-100 text-blue-700', icon: <LogIn className="w-4 h-4" /> },
  register: { label: 'ลงทะเบียน', color: 'bg-green-100 text-green-700', icon: <UserPlus className="w-4 h-4" /> },
  view_price: { label: 'ดูราคา', color: 'bg-purple-100 text-purple-700', icon: <Eye className="w-4 h-4" /> },
  approve_request: { label: 'อนุมัติคำขอ', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-4 h-4" /> },
  reject_request: { label: 'ปฏิเสธคำขอ', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" /> },
  create_group: { label: 'สร้างกลุ่มราคา', color: 'bg-indigo-100 text-indigo-700', icon: <Tag className="w-4 h-4" /> },
  edit_group: { label: 'แก้ไขกลุ่มราคา', color: 'bg-indigo-100 text-indigo-700', icon: <Edit2 className="w-4 h-4" /> },
  delete_group: { label: 'ลบกลุ่มราคา', color: 'bg-rose-100 text-rose-700', icon: <Trash2 className="w-4 h-4" /> },
  upload_image: { label: 'อัปโหลดรูปภาพ', color: 'bg-sky-100 text-sky-700', icon: <Upload className="w-4 h-4" /> },
  edit_user: { label: 'แก้ไขผู้ใช้', color: 'bg-amber-100 text-amber-700', icon: <Edit2 className="w-4 h-4" /> },
  grant_admin: { label: 'ให้สิทธิ์ Admin', color: 'bg-violet-100 text-violet-700', icon: <Shield className="w-4 h-4" /> },
  request_access: { label: 'ขอสิทธิ์เข้าถึง', color: 'bg-cyan-100 text-cyan-700', icon: <FileText className="w-4 h-4" /> },
  view_announcement: { label: 'ดูประกาศ', color: 'bg-orange-100 text-orange-700', icon: <Megaphone className="w-4 h-4" /> },
}

export default function AdminLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<UserLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      router.push('/')
      return
    }
    fetchLogs()
  }, [session, status, router])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      let url = '/api/user-logs?limit=100'
      if (actionFilter) {
        url += `&action=${actionFilter}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.isAdmin || session?.user?.isOperator) {
      fetchLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.isAdmin, session?.user?.isOperator, actionFilter])

  const filteredLogs = logs
    .filter(log =>
      !search ||
      log.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.users?.email?.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 100)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-line"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-line/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-line" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ประวัติการใช้งาน</h1>
                <p className="text-sm text-gray-600">ดู log การเข้าใช้งานของผู้ใช้</p>
              </div>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ใช้..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-line/50"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-line/50"
          >
            <option value="">ทุกกิจกรรม</option>
            <option value="login">เข้าสู่ระบบ</option>
            <option value="register">ลงทะเบียน</option>
            <option value="view_price">ดูราคา</option>
            <option value="approve_request">อนุมัติคำขอ</option>
            <option value="reject_request">ปฏิเสธคำขอ</option>
            <option value="create_group">สร้างกลุ่มราคา</option>
            <option value="edit_group">แก้ไขกลุ่มราคา</option>
            <option value="delete_group">ลบกลุ่มราคา</option>
            <option value="upload_image">อัปโหลดรูปภาพ</option>
            <option value="edit_user">แก้ไขผู้ใช้</option>
            <option value="grant_admin">ให้สิทธิ์ Admin</option>
            <option value="request_access">ขอสิทธิ์เข้าถึง</option>
            <option value="view_announcement">ดูประกาศ</option>
          </select>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <p className="text-sm text-gray-600">แสดง {filteredLogs.length} จาก {logs.length} รายการ {filteredLogs.length === 100 && '(จำกัด 100 รายการ)'}</p>
          </div>
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>ยังไม่มีประวัติการใช้งาน</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const actionInfo = actionLabels[log.action] || {
                  label: log.action,
                  color: 'bg-gray-100 text-gray-700',
                  icon: <Activity className="w-4 h-4" />
                }
                return (
                  <div key={log.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {log.users?.image ? (
                        <Image
                          src={log.users.image}
                          alt={log.users.name || ''}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{log.users?.name || 'Unknown'}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${actionInfo.color}`}>
                          {actionInfo.icon}
                          {actionInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{log.users?.email}</p>
                      {log.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(log.details as any).message || JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-600">{formatDate(log.created_at)}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]" title={log.ip_address}>
                        IP: {log.ip_address}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

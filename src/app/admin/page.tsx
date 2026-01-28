'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Shield, Clock, CheckCircle, XCircle, Users, Megaphone, Image as ImageIcon, Tag, Search, BarChart3, FileText } from 'lucide-react'
import Link from 'next/link'
import type { AccessRequest, PriceGroup } from '@/types'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [priceGroups, setPriceGroups] = useState<PriceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [rejectReason, setRejectReason] = useState('')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [historySearch, setHistorySearch] = useState('')

  const logAction = async (action: string, details: any) => {
    try {
      await fetch('/api/user-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details }),
      })
    } catch (error) {
      console.error('Error logging:', error)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      router.push('/')
      return
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.isAdmin, session?.user?.isOperator, status, router])

  const fetchData = async () => {
    try {
      const [requestsRes, groupsRes] = await Promise.all([
        fetch('/api/access-requests'),
        fetch('/api/price-groups'),
      ])

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setRequests(data)
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setPriceGroups(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      const res = await fetch(`/api/access-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceGroupIds: selectedGroups }),
      })

      if (res.ok) {
        logAction('approve_request', {
          message: `อนุมัติคำขอของ ${selectedRequest.user?.name}`,
          request_id: selectedRequest.id,
          groups: selectedGroups
        })
        setShowApproveModal(false)
        setSelectedRequest(null)
        setSelectedGroups([])
        fetchData()
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    try {
      const res = await fetch(`/api/access-requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (res.ok) {
        logAction('reject_request', {
          message: `ปฏิเสธคำขอของ ${selectedRequest.user?.name}`,
          request_id: selectedRequest.id,
          reason: rejectReason
        })
        setShowRejectModal(false)
        setSelectedRequest(null)
        setRejectReason('')
        fetchData()
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const processedRequests = requests
    .filter((r) => r.status !== 'pending')
    .filter((r) =>
      !historySearch ||
      r.user?.name?.toLowerCase().includes(historySearch.toLowerCase()) ||
      r.shop_name?.toLowerCase().includes(historySearch.toLowerCase())
    )
    .slice(0, 20)

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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-line/10 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-line" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">จัดการคำขอสิทธิ์และผู้ใช้งาน</p>
          </div>
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
                <p className="text-xs text-gray-500">ผู้ใช้งานในระบบ</p>
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
                  <p className="text-xs text-gray-500">เพิ่ม/แก้ไข/ลบกลุ่ม</p>
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

            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100 hover:shadow-md transition"
            >
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Analytics Dashboard</p>
                <p className="text-xs text-gray-500">สถิติและกราฟ</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
                <p className="text-sm text-gray-600">รอการอนุมัติ</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter((r) => r.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">อนุมัติแล้ว</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                <p className="text-sm text-gray-600">คำขอทั้งหมด</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">คำขอที่รออนุมัติ</h2>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ไม่มีคำขอที่รออนุมัติ</div>
          ) : (
            <div className="divide-y">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{request.user?.name}</p>
                      <p className="text-sm text-gray-600">
                        ร้าน: {request.shop_name} | สาขา: {request.branch?.name}
                      </p>
                      {request.note && (
                        <p className="text-sm text-gray-500">หมายเหตุ: {request.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowApproveModal(true)
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowRejectModal(true)
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">ประวัติคำขอ</h2>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหรือร้าน..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-line/50"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">แสดง 20 รายการล่าสุด</p>
          </div>
          {processedRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ยังไม่มีประวัติ</div>
          ) : (
            <div className="divide-y">
              {processedRequests.map((request) => (
                <div key={request.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${request.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                    >
                      {request.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{request.user?.name}</p>
                      <p className="text-sm text-gray-600">ร้าน: {request.shop_name}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${request.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {request.status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">อนุมัติคำขอ</h3>
            <p className="text-gray-600 mb-4">
              เลือกกลุ่มราคาที่ต้องการให้สิทธิ์แก่ <strong>{selectedRequest.user?.name}</strong>
            </p>
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {priceGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGroups([...selectedGroups, group.id])
                      } else {
                        setSelectedGroups(selectedGroups.filter((id) => id !== group.id))
                      }
                    }}
                    className="w-4 h-4 text-line rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{group.name}</p>
                    {group.description && (
                      <p className="text-sm text-gray-500">{group.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false)
                  setSelectedRequest(null)
                  setSelectedGroups([])
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleApprove}
                disabled={selectedGroups.length === 0}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
              >
                อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ปฏิเสธคำขอ</h3>
            <p className="text-gray-600 mb-4">
              ระบุเหตุผลในการปฏิเสธคำขอของ <strong>{selectedRequest.user?.name}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เหตุผลในการปฏิเสธ (ไม่บังคับ)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedRequest(null)
                  setRejectReason('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                ปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

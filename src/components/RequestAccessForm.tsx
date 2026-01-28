'use client'

import { useState } from 'react'
import { Send, CheckCircle, Clock, XCircle } from '@/components/icons'
import type { Branch, AccessRequest } from '@/types'

interface RequestAccessFormProps {
  initialBranches: Branch[]
  initialRequest: AccessRequest | null
}

export function RequestAccessForm({ initialBranches, initialRequest }: RequestAccessFormProps) {
  const [branches] = useState<Branch[]>(initialBranches)
  const [existingRequest, setExistingRequest] = useState<AccessRequest | null>(initialRequest)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    branchId: '',
    shopName: '',
    note: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setExistingRequest(data)
      }
    } catch (error) {
      console.error('Error submitting request:', error)
    } finally {
      setSubmitting(false)
    }
  }



  if (existingRequest) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">สถานะคำขอสิทธิ์</h2>
        <div className="flex items-start gap-4">
          {existingRequest.status === 'pending' && (
            <>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">รอการอนุมัติ</p>
                <p className="text-sm text-gray-600">
                  คำขอของคุณกำลังรอ Admin ตรวจสอบและอนุมัติ
                </p>
              </div>
            </>
          )}
          {existingRequest.status === 'approved' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">ได้รับอนุมัติแล้ว</p>
                <p className="text-sm text-gray-600">
                  คุณสามารถดูกลุ่มราคาที่ได้รับสิทธิ์ด้านบน
                </p>
              </div>
            </>
          )}
          {existingRequest.status === 'rejected' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">ถูกปฏิเสธ</p>
                <p className="text-sm text-gray-600">
                  เหตุผล: {existingRequest.reject_reason || 'ไม่ระบุ'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">ขอสิทธิ์เข้าถึงราคา</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เลือกสาขา
          </label>
          <select
            value={formData.branchId}
            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
          >
            <option value="">-- เลือกสาขา --</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อร้าน
          </label>
          <input
            type="text"
            value={formData.shopName}
            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
            required
            placeholder="กรอกชื่อร้านของคุณ"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หมายเหตุ (ถ้ามี)
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="ระบุข้อมูลเพิ่มเติม..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-line text-white py-3 rounded-lg hover:bg-line-dark transition disabled:opacity-50"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              กำลังส่งคำขอ...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              ส่งคำขอ
            </>
          )}
        </button>
      </form>
    </div>
  )
}

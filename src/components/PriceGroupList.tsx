import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, ChevronRight, Clock } from '@/components/icons'
import type { UserGroupAccess } from '@/types'

interface PriceGroupListProps {
  initialData: UserGroupAccess[]
}

export function PriceGroupList({ initialData }: PriceGroupListProps) {
  const router = useRouter()
  const [accessList] = useState<UserGroupAccess[]>(initialData)

  const formatLastUpdated = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    })
  }

  const isUpdatedToday = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    // Compare in the same timezone if possible, but for simple "today" check locally might differ slightly
    // Using local time of browser is standard for "Today" badges usually.
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" style={{ minHeight: '120px' }}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">กลุ่มราคาที่เข้าถึงได้</h2>
      {accessList.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded-lg text-gray-600 text-sm">
          ยังไม่มีกลุ่มราคาที่เข้าถึงได้
        </div>
      ) : (
        <div className="space-y-2">
          {accessList.map((access) => (
            <div
              key={access.id}
              onClick={() => router.push(`/price-groups/${access.price_group_id}`)}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-line/10 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-line" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{access.price_group?.name}</p>
                    {access.last_updated_at && isUpdatedToday(access.last_updated_at) && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        อัปเดตวันนี้
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <p className="text-sm text-gray-600">{access.price_group?.description}</p>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {access.last_updated_at ? formatLastUpdated(access.last_updated_at) : 'ยังไม่เคยอัปเดต'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

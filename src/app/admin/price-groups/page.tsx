'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Tag, Image as ImageIcon, ChevronRight, Search, Clock } from 'lucide-react'
import Link from 'next/link'
import type { PriceGroup } from '@/types'

export default function AdminPriceGroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [priceGroups, setPriceGroups] = useState<PriceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatedFilter, setUpdatedFilter] = useState<'all' | 'today'>('all')

  const formatLastUpdated = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isUpdatedToday = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  }

  const filteredGroups = priceGroups
    .filter((group) =>
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(search.toLowerCase()))
    )
    .filter((group) => {
      if (updatedFilter === 'today') {
        return !!group.last_updated_at && isUpdatedToday(group.last_updated_at)
      }
      return true
    })

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin) {
      router.push('/')
      return
    }
    fetchPriceGroups()
  }, [session, status, router])

  const fetchPriceGroups = async () => {
    try {
      const res = await fetch('/api/price-groups')
      if (res.ok) {
        const data = await res.json()
        setPriceGroups(data)
      }
    } catch (error) {
      console.error('Error fetching price groups:', error)
    } finally {
      setLoading(false)
    }
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-line/10 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-line" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการรูปภาพราคา</h1>
              <p className="text-sm text-gray-600">อัปโหลดรูปภาพราคาสำหรับแต่ละกลุ่ม</p>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหากลุ่มราคา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-line/50"
            />
          </div>
          <select
            value={updatedFilter}
            onChange={(e) => setUpdatedFilter(e.target.value as 'all' | 'today')}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-line/50 shadow-sm text-sm"
          >
            <option value="all">ทั้งหมด</option>
            <option value="today">อัปเดตวันนี้</option>
          </select>
        </div>

        {/* Price Groups List */}
        <div className="bg-white rounded-xl shadow-sm">
          {filteredGroups.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>ยังไม่มีกลุ่มราคา</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/admin/price-groups/${group.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-line/10 rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-line" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{group.name}</p>
                        {group.last_updated_at && isUpdatedToday(group.last_updated_at) && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            อัปเดตวันนี้
                          </span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-500">{group.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        {group.last_updated_at ? formatLastUpdated(group.last_updated_at) : 'ยังไม่เคยอัปเดต'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Tag, Plus, Trash2, Edit2, X, Save, Search } from 'lucide-react'
import Link from 'next/link'
import type { PriceGroup } from '@/types'

export default function AdminManageGroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [priceGroups, setPriceGroups] = useState<PriceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState('')

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

  const filteredGroups = priceGroups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(search.toLowerCase()))
  )
  const [editingGroup, setEditingGroup] = useState<PriceGroup | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', telegram_chat_id: '' })

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin) {
      router.push('/')
      return
    }
    fetchGroups()
  }, [session, status, router])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/price-groups')
      if (res.ok) {
        const data = await res.json()
        setPriceGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) return

    try {
      const res = await fetch('/api/admin/price-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        logAction('create_group', {
          message: `สร้างกลุ่มราคา: ${formData.name}`,
          name: formData.name
        })
        setShowCreateModal(false)
        setFormData({ name: '', description: '', telegram_chat_id: '' })
        fetchGroups()
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  const handleUpdate = async () => {
    if (!editingGroup || !formData.name.trim()) return

    try {
      const res = await fetch(`/api/admin/price-groups/${editingGroup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        logAction('edit_group', {
          message: `แก้ไขกลุ่มราคา: ${editingGroup.name}`,
          changes: formData
        })
        setEditingGroup(null)
        setFormData({ name: '', description: '', telegram_chat_id: '' })
        fetchGroups()
      }
    } catch (error) {
      console.error('Error updating group:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ลบกลุ่มนี้? รูปภาพและสิทธิ์การเข้าถึงทั้งหมดจะถูกลบด้วย')) return

    try {
      const res = await fetch(`/api/admin/price-groups/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        const group = priceGroups.find(g => g.id === id)
        logAction('delete_group', {
          message: `ลบกลุ่มราคา: ${group?.name || id}`,
          group_id: id
        })
        fetchGroups()
      }
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }

  const openEditModal = (group: PriceGroup) => {
    setEditingGroup(group)
    setFormData({ name: group.name, description: group.description || '', telegram_chat_id: group.telegram_chat_id || '' })
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-line/10 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-line" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">จัดการกลุ่มราคา</h1>
                <p className="text-sm text-gray-600">เพิ่ม แก้ไข ลบกลุ่มราคา</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', description: '', telegram_chat_id: '' })
              setShowCreateModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition"
          >
            <Plus className="w-4 h-4" />
            เพิ่มกลุ่ม
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหากลุ่มราคา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-line/50"
          />
        </div>

        {/* Groups List */}
        <div className="bg-white rounded-xl shadow-sm">
          {filteredGroups.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>ยังไม่มีกลุ่มราคา</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition"
              >
                สร้างกลุ่มแรก
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredGroups.map((group) => (
                <div key={group.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-line/10 rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-line" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{group.name}</p>
                      {group.description && (
                        <p className="text-sm text-gray-500">{group.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(group)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="แก้ไข"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">สร้างกลุ่มใหม่</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อกลุ่ม *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="เช่น ราคาทอง, ราคาเงิน"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={formData.telegram_chat_id}
                  onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="เช่น -1001234567890 (ไม่บังคับ)"
                />
                <p className="text-xs text-gray-500 mt-1">สำหรับส่งรูปภาพอัตโนมัติไปยัง Telegram</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  สร้างกลุ่ม
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">แก้ไขกลุ่ม</h3>
              <button
                onClick={() => setEditingGroup(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อกลุ่ม *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={formData.telegram_chat_id}
                  onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="เช่น -1001234567890 (ไม่บังคับ)"
                />
                <p className="text-xs text-gray-500 mt-1">สำหรับส่งรูปภาพอัตโนมัติไปยัง Telegram</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setEditingGroup(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdate}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  บันทึก
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Megaphone, Plus, Trash2, Eye, EyeOff, Upload, X, Pencil } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Announcement } from '@/types'

export default function AdminAnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editUploading, setEditUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    images: [] as string[]
  })
  const [editFormData, setEditFormData] = useState({
    id: '',
    title: '',
    body: '',
    images: [] as string[]
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user?.isAdmin) {
      router.push('/')
      return
    }
    fetchAnnouncements()
  }, [session, status, router])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = 5 - formData.images.length
    if (remaining <= 0) return

    setUploading(true)
    try {
      const selected = Array.from(files).slice(0, remaining)
      const newUrls: string[] = []

      for (const file of selected) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('folder', 'announcements')

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formDataUpload
        })

        if (res.ok) {
          const data = await res.json()
          if (data.public_url) newUrls.push(data.public_url)
        }
      }

      if (newUrls.length > 0) {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...newUrls].slice(0, 5) }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = 5 - editFormData.images.length
    if (remaining <= 0) return

    setEditUploading(true)
    try {
      const selected = Array.from(files).slice(0, remaining)
      const newUrls: string[] = []

      for (const file of selected) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('folder', 'announcements')

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formDataUpload
        })

        if (res.ok) {
          const data = await res.json()
          if (data.public_url) newUrls.push(data.public_url)
        }
      }

      if (newUrls.length > 0) {
        setEditFormData(prev => ({ ...prev, images: [...prev.images, ...newUrls].slice(0, 5) }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setEditUploading(false)
      if (editFileInputRef.current) editFileInputRef.current.value = ''
    }
  }

  const handleCreate = async () => {
    if (!formData.title) return

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          body: formData.body,
          images: formData.images
        })
      })

      if (res.ok) {
        setShowCreateModal(false)
        setFormData({ title: '', body: '', images: [] })
        fetchAnnouncements()
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
    }
  }

  const handleOpenEdit = (item: Announcement) => {
    const itemImages = (item.images || []).map((x) => x.image_path).filter(Boolean)
    setEditFormData({
      id: item.id,
      title: item.title || '',
      body: item.body || '',
      images: itemImages.length > 0 ? itemImages.slice(0, 5) : (item.image_path ? [item.image_path] : [])
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editFormData.id || !editFormData.title) return

    try {
      const res = await fetch(`/api/admin/announcements/${editFormData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editFormData.title,
          body: editFormData.body,
          images: editFormData.images
        })
      })

      if (res.ok) {
        setShowEditModal(false)
        setEditFormData({ id: '', title: '', body: '', images: [] })
        fetchAnnouncements()
      }
    } catch (error) {
      console.error('Error updating announcement:', error)
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !currentStatus })
      })
      fetchAnnouncements()
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบประกาศนี้?')) return

    try {
      await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      })
      fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">จัดการประกาศ</h1>
                <p className="text-sm text-gray-600">สร้างและจัดการประกาศประชาสัมพันธ์</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition"
          >
            <Plus className="w-4 h-4" />
            สร้างประกาศ
          </button>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-xl shadow-sm">
          {announcements.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>ยังไม่มีประกาศ</p>
            </div>
          ) : (
            <div className="divide-y">
              {announcements.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  {item.image_path && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={item.image_path}
                        alt=""
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-sm text-gray-500 truncate">{item.body}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                      title="แก้ไข"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTogglePublish(item.id, item.is_published)}
                      className={`p-2 rounded-lg transition ${
                        item.is_published
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={item.is_published ? 'ซ่อนประกาศ' : 'แสดงประกาศ'}
                    >
                      {item.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
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
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">สร้างประกาศใหม่</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ title: '', body: '', images: [] })
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หัวข้อ *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="หัวข้อประกาศ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เนื้อหา
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="รายละเอียดประกาศ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปภาพ
                </label>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {formData.images.map((url, idx) => (
                      <div key={url} className="relative rounded-lg overflow-hidden bg-gray-100">
                        <Image src={url} alt="" width={200} height={200} className="w-full h-20 object-cover" />
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                          title="ลบรูป"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.images.length < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-line transition"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-line mx-auto"></div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูป (สูงสุด 5 รูป)</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ title: '', body: '', images: [] })
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.title}
                className="flex-1 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition disabled:opacity-50"
              >
                สร้างประกาศ
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">แก้ไขประกาศ</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditFormData({ id: '', title: '', body: '', images: [] })
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หัวข้อ *
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="หัวข้อประกาศ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เนื้อหา
                </label>
                <textarea
                  value={editFormData.body}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, body: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-line focus:border-transparent"
                  placeholder="รายละเอียดประกาศ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปภาพ
                </label>
                {editFormData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {editFormData.images.map((url, idx) => (
                      <div key={url} className="relative rounded-lg overflow-hidden bg-gray-100">
                        <Image src={url} alt="" width={200} height={200} className="w-full h-20 object-cover" />
                        <button
                          onClick={() => setEditFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                          title="ลบรูป"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editFormData.images.length < 5 && (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-line transition"
                  >
                    {editUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-line mx-auto"></div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูป (สูงสุด 5 รูป)</p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleEditImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditFormData({ id: '', title: '', body: '', images: [] })
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdate}
                disabled={!editFormData.title}
                className="flex-1 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition disabled:opacity-50"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

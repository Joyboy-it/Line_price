'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, use } from 'react'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Upload, Trash2, X, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { PriceGroup, PriceGroupImage } from '@/types'

interface PreviewFile {
  file: File
  url: string
}

export default function AdminPriceGroupImagesPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [priceGroup, setPriceGroup] = useState<PriceGroup | null>(null)
  const [images, setImages] = useState<PriceGroupImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!session?.user?.isAdmin) {
      router.push('/')
      return
    }
    fetchData()
  }, [session, status, router, id])

  const fetchData = async () => {
    try {
      const [groupRes, imagesRes] = await Promise.all([
        fetch(`/api/price-groups/${id}`),
        fetch(`/api/price-groups/${id}/images`)
      ])

      if (groupRes.ok) {
        const groupData = await groupRes.json()
        setPriceGroup(groupData)
      }
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json()
        setImages(imagesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newPreviews: PreviewFile[] = []
    for (let i = 0; i < files.length; i++) {
      newPreviews.push({
        file: files[i],
        url: URL.createObjectURL(files[i])
      })
    }
    setPreviewFiles(newPreviews)
    setShowUploadModal(true)
  }

  const handleUpload = async () => {
    if (previewFiles.length === 0) return

    const confirmMsg = images.length > 0
      ? `จะลบรูปเก่า ${images.length} รูป และอัปโหลดรูปใหม่ ${previewFiles.length} รูป ยืนยัน?`
      : `อัปโหลดรูปใหม่ ${previewFiles.length} รูป ยืนยัน?`

    if (!confirm(confirmMsg)) return

    setUploading(true)
    try {
      // Step 1: Clear old images
      if (images.length > 0) {
        setUploadProgress('กำลังลบรูปเก่า...')
        await fetch(`/api/price-groups/${id}/images/clear`, { method: 'DELETE' })
      }

      // Step 2: Upload new files
      for (let i = 0; i < previewFiles.length; i++) {
        const pf = previewFiles[i]
        setUploadProgress(`กำลังอัปโหลด ${i + 1}/${previewFiles.length}...`)

        const formData = new FormData()
        formData.append('file', pf.file)
        formData.append('folder', `price-groups/${id}`)

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) throw new Error(`Upload failed: ${pf.file.name}`)

        const uploadData = await uploadRes.json()

        // Save to database
        await fetch(`/api/price-groups/${id}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_path: uploadData.file_path,
            file_name: uploadData.file_name,
            title: ''
          })
        })
      }

      setShowUploadModal(false)
      setPreviewFiles([])

      logAction('upload_image', {
        message: `อัปโหลดรูปภาพ ${previewFiles.length} รูป ไปยังกลุ่ม ${priceGroup?.name}`,
        group_id: id,
        count: previewFiles.length
      })

      // Send to Telegram if chat_id is configured
      if (priceGroup?.telegram_chat_id) {
        setUploadProgress('กำลังส่งไปยัง Telegram...')
        try {
          // Get the newly uploaded images
          const newImagesRes = await fetch(`/api/price-groups/${id}/images`)
          if (newImagesRes.ok) {
            const newImages = await newImagesRes.json()
            
            // Send each image to Telegram
            for (const img of newImages) {
              // Send file_path directly - API will convert to Supabase URL
              await fetch('/api/telegram/send-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: img.file_path,
                  caption: `<b>${priceGroup.name}</b>\n${img.file_name || ''}`,
                  chatId: priceGroup.telegram_chat_id
                })
              })
            }
          }
        } catch (telegramError) {
          console.error('Error sending to Telegram:', telegramError)
          // Don't fail the upload if Telegram fails
        }
      }

      fetchData()
    } catch (error) {
      console.error('Error uploading:', error)
      alert('เกิดข้อผิดพลาดในการอัปโหลด')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  const removePreview = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDelete = async (imageId: string) => {
    if (!confirm('ต้องการลบรูปนี้?')) return

    try {
      const res = await fetch(`/api/admin/price-group-images/${imageId}`, {
        method: 'DELETE'
      })
      if (res.ok) {

        logAction('edit_group', {
          message: `ลบรูปภาพออกจากกลุ่ม ${priceGroup?.name}`,
          image_id: imageId
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting:', error)
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
            <Link href="/admin/price-groups" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {priceGroup?.name || 'กลุ่มราคา'}
              </h1>
              <p className="text-sm text-gray-600">จัดการรูปภาพราคา</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition"
          >
            <Upload className="w-4 h-4" />
            อัปโหลดรูป
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Images Grid */}
        {images.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">ยังไม่มีรูปภาพ</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition"
            >
              อัปโหลดรูปแรก
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden group"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  <Image
                    src={image.file_path.startsWith('http') ? image.file_path : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/price-images/${image.file_path}`}
                    alt={image.title || 'รูปราคา'}
                    fill
                    className="object-contain"
                  />
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 border-t">
                  <p className="font-medium text-gray-900 truncate">
                    {image.title || image.file_name || 'ไม่มีชื่อ'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(image.created_at).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                อัปโหลดรูปภาพ ({previewFiles.length} ไฟล์)
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setPreviewFiles([])
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning if has existing images */}
            {images.length > 0 && (
              <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">รูปเก่าจะถูกลบ</p>
                  <p className="text-sm text-amber-700">
                    รูปภาพเดิม {images.length} รูป จะถูกลบทั้งหมด และแทนที่ด้วยรูปใหม่
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 overflow-y-auto flex-1">
              {uploading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-line mx-auto mb-4"></div>
                  <p className="text-gray-600">{uploadProgress}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {previewFiles.map((pf, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={pf.url}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removePreview(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-gray-500 truncate mt-1">{pf.file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setPreviewFiles([])
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || previewFiles.length === 0}
                className="flex-1 px-4 py-2 bg-line text-white rounded-lg hover:bg-line-dark transition disabled:opacity-50"
              >
                {uploading ? 'กำลังอัปโหลด...' : `อัปโหลด ${previewFiles.length} รูป`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

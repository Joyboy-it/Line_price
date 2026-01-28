'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Megaphone, ChevronRight, X, ChevronLeft, ZoomIn } from '@/components/icons'
import Image from 'next/image'
import type { Announcement } from '@/types'
import { useSession } from 'next-auth/react'

interface AnnouncementListProps {
  initialData: Announcement[]
}

export function AnnouncementList({ initialData }: AnnouncementListProps) {
  const { data: session } = useSession()
  const [announcements] = useState<Announcement[]>(initialData)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [modalScale, setModalScale] = useState(1)
  const wheelLockRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const logViewAnnouncement = async (announcementId: string, title: string) => {
    if (!session?.user?.id) return
    try {
      await fetch('/api/user-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'view_announcement',
          details: {
            announcement_id: announcementId,
            announcement_title: title
          }
        })
      })
    } catch (error) {
      console.error('Error logging view announcement:', error)
    }
  }

  const selectedImages = useMemo(() => {
    if (!selectedAnnouncement) return [] as string[]
    const imgs = (selectedAnnouncement.images || []).map((x) => x.image_path).filter(Boolean)
    if (imgs.length > 0) return imgs.slice(0, 5)
    return selectedAnnouncement.image_path ? [selectedAnnouncement.image_path] : []
  }, [selectedAnnouncement])

  const thumbFor = (item: Announcement) => {
    const imgs = (item.images || []).map((x) => x.image_path).filter(Boolean)
    return imgs[0] || item.image_path || ''
  }

  const prev = useCallback(() => {
    if (selectedImages.length === 0) return
    setActiveIndex((i) => (i - 1 + selectedImages.length) % selectedImages.length)
  }, [selectedImages.length])

  const next = useCallback(() => {
    if (selectedImages.length === 0) return
    setActiveIndex((i) => (i + 1) % selectedImages.length)
  }, [selectedImages.length])

  useEffect(() => {
    setModalScale(1)
  }, [selectedAnnouncement, activeIndex, isFullscreenOpen])

  useEffect(() => {
    if (!isFullscreenOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreenOpen(false)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isFullscreenOpen, next, prev])

  const onModalWheel = useCallback(
    (e: any) => {
      if (!selectedAnnouncement) return
      if (selectedImages.length === 0) return

      const now = Date.now()
      if (now - wheelLockRef.current < 120) return
      wheelLockRef.current = now

      if (isFullscreenOpen) {
        e.preventDefault()
        const direction = e.deltaY > 0 ? -1 : 1
        setModalScale((s) => {
          const nextScale = s + direction * 0.15
          return Math.min(4, Math.max(1, Math.round(nextScale * 100) / 100))
        })
        return
      }

      if (e.ctrlKey) {
        e.preventDefault()
        const direction = e.deltaY > 0 ? -1 : 1
        setModalScale((s) => {
          const nextScale = s + direction * 0.15
          return Math.min(4, Math.max(1, Math.round(nextScale * 100) / 100))
        })
        return
      }

      e.preventDefault()
      if (e.deltaY > 0) next()
      if (e.deltaY < 0) prev()
    },
    [isFullscreenOpen, next, prev, selectedAnnouncement, selectedImages.length]
  )

  const onModalTouchStart = useCallback((e: any) => {
    const t = e.touches?.[0]
    if (!t) return
    touchStartRef.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onModalTouchEnd = useCallback(
    (e: any) => {
      const start = touchStartRef.current
      if (!start) return
      touchStartRef.current = null

      const t = e.changedTouches?.[0]
      if (!t) return

      const dx = t.clientX - start.x
      const dy = t.clientY - start.y

      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      const minSwipe = 45

      if (absX < minSwipe) return
      if (absY > absX * 0.8) return

      if (dx < 0) next()
      if (dx > 0) prev()
    },
    [next, prev]
  )

  return (
    <>
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm p-6 border border-amber-100" style={{ minHeight: '140px' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">ประกาศ</h2>
        </div>
        {announcements.length === 0 ? (
          <div className="p-4 bg-white rounded-lg border border-amber-100 text-gray-600 text-sm">
            ยังไม่มีประกาศ
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedAnnouncement(item)
                  setActiveIndex(0)
                  logViewAnnouncement(item.id, item.title)
                }}
                className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-gray-50 transition cursor-pointer border border-amber-100"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {!!thumbFor(item) && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={thumbFor(item)}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal แสดงรายละเอียดประกาศ */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{selectedAnnouncement.title}</h3>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {selectedImages.length > 0 && (
                <div className="space-y-3">
                  <div
                    className="relative rounded-lg overflow-hidden bg-gray-100"
                    style={{ aspectRatio: '5/3' }}
                    onWheel={onModalWheel}
                    onTouchStart={onModalTouchStart}
                    onTouchEnd={onModalTouchEnd}
                  >
                    <Image
                      src={selectedImages[activeIndex]}
                      alt=""
                      width={500}
                      height={300}
                      className="w-full h-auto"
                      style={{ transform: `scale(${modalScale})`, transformOrigin: 'center center' }}
                      priority
                      sizes="(max-width: 768px) 100vw, 500px"
                    />

                    <button
                      type="button"
                      onClick={() => setIsFullscreenOpen(true)}
                      className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/70 text-white rounded-lg"
                      title="ดูเต็มจอ"
                    >
                      <ZoomIn className="w-4 h-4" />
                      ดูเต็มจอ
                    </button>

                    {selectedImages.length > 1 && (
                      <>
                        <button
                          onClick={prev}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition"
                          title="ก่อนหน้า"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={next}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition"
                          title="ถัดไป"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                          {activeIndex + 1}/{selectedImages.length}
                        </div>
                      </>
                    )}
                  </div>

                  {selectedImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedImages.map((url, idx) => (
                        <button
                          key={url}
                          onClick={() => setActiveIndex(idx)}
                          className={`flex-shrink-0 rounded-md overflow-hidden border transition ${idx === activeIndex ? 'border-line ring-2 ring-line/30' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          title={`รูปที่ ${idx + 1}`}
                        >
                          <Image
                            src={url}
                            alt=""
                            width={96}
                            height={96}
                            className="w-20 h-16 object-cover"
                            loading="lazy"
                            sizes="80px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {selectedAnnouncement.body && (
                <p className="text-gray-700 whitespace-pre-wrap">{selectedAnnouncement.body}</p>
              )}
              <p className="text-sm text-gray-500">
                โพสต์เมื่อ {new Date(selectedAnnouncement.created_at).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedAnnouncement && isFullscreenOpen && selectedImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setIsFullscreenOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullscreenOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"
            aria-label="ปิด"
          >
            <X className="w-6 h-6" />
          </button>

          {selectedImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full"
                aria-label="ก่อนหน้า"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full"
                aria-label="ถัดไป"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <div
            className="max-w-5xl w-full max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
            onWheel={onModalWheel}
            onTouchStart={onModalTouchStart}
            onTouchEnd={onModalTouchEnd}
          >
            <Image
              src={selectedImages[activeIndex]}
              alt=""
              width={1200}
              height={800}
              className="w-full h-auto max-h-[90vh] object-contain"
              style={{ transform: `scale(${modalScale})`, transformOrigin: 'center center' }}
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            <div className="mt-3 text-center text-white/80 text-sm">
              {activeIndex + 1} / {selectedImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

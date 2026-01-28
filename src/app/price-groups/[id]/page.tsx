'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Image as ImageIcon, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { PriceGroupImage, PriceGroup } from '@/types'

export default function PriceGroupDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [images, setImages] = useState<PriceGroupImage[]>([])
  const [priceGroup, setPriceGroup] = useState<PriceGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [modalScale, setModalScale] = useState(1)
  const mainWheelLockRef = useRef(0)
  const modalWheelLockRef = useRef(0)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const hasLoggedViewRef = useRef(false)

  const buildImageUrl = useCallback((filePath: string) => {
    if (filePath.startsWith('http')) return filePath
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/price-images/${filePath}`
  }, [])

  const prev = useCallback(() => {
    if (images.length === 0) return
    setActiveIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const next = useCallback(() => {
    if (images.length === 0) return
    setActiveIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const prevModal = useCallback(() => {
    if (images.length === 0) return
    setSelectedIndex((i) => {
      if (i === null) return i
      return (i - 1 + images.length) % images.length
    })
  }, [images.length])

  const nextModal = useCallback(() => {
    if (images.length === 0) return
    setSelectedIndex((i) => {
      if (i === null) return i
      return (i + 1) % images.length
    })
  }, [images.length])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id && id) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, id])

  useEffect(() => {
    if (images.length === 0) return
    if (activeIndex >= images.length) setActiveIndex(0)
  }, [images.length, activeIndex])

  useEffect(() => {
    if (selectedIndex === null) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowLeft') prevModal()
      if (e.key === 'ArrowRight') nextModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedIndex, prevModal, nextModal])

  useEffect(() => {
    setModalScale(1)
  }, [selectedIndex])

  const onMainWheel = useCallback(
    (e: any) => {
      if (images.length === 0) return

      e.preventDefault()

      const now = Date.now()
      if (now - mainWheelLockRef.current < 180) return
      mainWheelLockRef.current = now

      if (e.deltaY > 0) next()
      if (e.deltaY < 0) prev()
    },
    [images.length, next, prev]
  )

  const onModalWheel = useCallback(
    (e: any) => {
      if (selectedIndex === null || images.length === 0) return

      const now = Date.now()
      if (now - modalWheelLockRef.current < 120) return
      modalWheelLockRef.current = now

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

      if (e.deltaY > 0) nextModal()
      if (e.deltaY < 0) prevModal()
    },
    [images.length, nextModal, prevModal, selectedIndex]
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

      // Avoid interfering with vertical scroll.
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      const minSwipe = 45

      if (absX < minSwipe) return
      if (absY > absX * 0.8) return

      // Swipe left => next, swipe right => prev
      if (dx < 0) nextModal()
      if (dx > 0) prevModal()
    },
    [nextModal, prevModal]
  )

  const fetchData = async () => {
    try {
      // Fetch price group info
      const groupRes = await fetch(`/api/price-groups/${id}`)
      if (groupRes.ok) {
        const groupData = await groupRes.json()
        setPriceGroup(groupData)

        // Log view (only once per page load)
        if (!hasLoggedViewRef.current) {
          hasLoggedViewRef.current = true
          fetch('/api/user-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'view_price',
              details: { message: `เข้าดูรายการราคา: ${groupData.name}` },
            }),
          }).catch((err) => console.error('Error logging view:', err))
        }
      }

      // Fetch images
      const imagesRes = await fetch(`/api/price-groups/${id}/images`)
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {priceGroup?.name || 'กลุ่มราคา'}
            </h1>
            {priceGroup?.description && (
              <p className="text-gray-600">{priceGroup.description}</p>
            )}
          </div>
        </div>

        {/* Images */}
        {images.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">ยังไม่มีรูปภาพราคาในกลุ่มนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative aspect-[4/3] bg-gray-100" onWheel={onMainWheel}>
                <Image
                  src={buildImageUrl(images[activeIndex].file_path)}
                  alt={images[activeIndex].title || 'รูปราคา'}
                  fill
                  className="object-contain"
                  priority
                />

                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow"
                  aria-label="ก่อนหน้า"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow"
                  aria-label="ถัดไป"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIndex(activeIndex)}
                  className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/70 text-white rounded-lg"
                >
                  <ZoomIn className="w-4 h-4" />
                  ดูเต็มจอ
                </button>

                <div className="absolute bottom-3 left-3 px-2 py-1 text-xs bg-black/60 text-white rounded">
                  {activeIndex + 1} / {images.length}
                </div>
              </div>

              {(images[activeIndex].title || images[activeIndex].created_at) && (
                <div className="p-4 border-t">
                  {images[activeIndex].title && (
                    <p className="font-medium text-gray-900">{images[activeIndex].title}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {new Date(images[activeIndex].created_at).toLocaleDateString('th-TH')}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-3">
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border transition ${idx === activeIndex
                      ? 'border-line ring-2 ring-line/30'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    aria-label={`ดูรูปที่ ${idx + 1}`}
                  >
                    <Image
                      src={buildImageUrl(img.file_path)}
                      alt={img.title || 'thumbnail'}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedIndex !== null && images[selectedIndex] && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedIndex(null)}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prevModal()
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
                nextModal()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full"
              aria-label="ถัดไป"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            <div
              className="max-w-5xl w-full max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
              onWheel={onModalWheel}
              onTouchStart={onModalTouchStart}
              onTouchEnd={onModalTouchEnd}
            >
              <Image
                src={buildImageUrl(images[selectedIndex].file_path)}
                alt={images[selectedIndex].title || 'รูปราคา'}
                width={1200}
                height={800}
                className="w-full h-auto max-h-[90vh] object-contain"
                style={{ transform: `scale(${modalScale})`, transformOrigin: 'center center' }}
              />
              <div className="mt-3 text-center text-white/80 text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

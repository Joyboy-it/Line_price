import { Navbar } from '@/components/Navbar'
import { getServerSession } from 'next-auth'
import { LogIn } from '@/components/icons'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { AnnouncementList } from '@/components/AnnouncementList'
import { HomeClientSections } from '@/components/HomeClientSections'
import { Suspense } from 'react'
import { getUserAccess, getBranches, getUserAccessRequest, getAnnouncements } from '@/lib/data'

async function HomeDataFetcher({ userId }: { userId: string }) {
  const [userAccess, branches, accessRequest, announcements] = await Promise.all([
    getUserAccess(userId),
    getBranches(),
    getUserAccessRequest(userId),
    getAnnouncements(),
  ])

  return (
    <>
      <AnnouncementList initialData={announcements} />
      <div className="space-y-6">
        <HomeClientSections
          userAccess={userAccess}
          branches={branches}
          accessRequest={accessRequest}
        />
      </div>
    </>
  )
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!session ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-line/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-10 h-10 text-line" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ยินดีต้อนรับสู่ วงษ์พาณิชย์ ส.เจริญชัย รีไซเคิล
            </h1>
            <p className="text-gray-600 mb-6">
              กรุณาเข้าสู่ระบบด้วย LINE เพื่อเข้าใช้งาน
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-line text-white px-6 py-3 rounded-lg hover:bg-line-dark transition"
            >
              <LogIn className="w-5 h-5" />
              เข้าสู่ระบบด้วย LINE
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <Suspense fallback={
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm p-6 border border-amber-100" style={{ minHeight: '140px' }}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-amber-200 rounded w-1/3"></div>
                    <div className="h-20 bg-white/50 rounded"></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6" style={{ minHeight: '120px' }}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6" style={{ minHeight: '280px' }}>
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            }>
              <HomeDataFetcher userId={session.user.id} />
            </Suspense>
          </div>
        )}
      </main>
    </div>
  )
}

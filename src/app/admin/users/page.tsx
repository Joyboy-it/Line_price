import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { getAdminUsers, getAdminPriceGroups, getBranches } from '@/lib/data'
import { UsersManagement } from './UsersManagement'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin && !session?.user?.isOperator) {
    redirect('/')
  }

  // Fetch all data server-side in parallel
  const [users, priceGroups, branches] = await Promise.all([
    getAdminUsers(),
    getAdminPriceGroups(),
    getBranches()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg" aria-label="กลับไปหน้า Admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">จัดการผู้ใช้</h1>
              <p className="text-sm text-gray-600">แก้ไขกลุ่มและสิทธิ์ของผู้ใช้</p>
            </div>
          </div>
        </div>

        <UsersManagement
          initialUsers={users}
          initialPriceGroups={priceGroups}
          initialBranches={branches}
        />
      </main>
    </div>
  )
}

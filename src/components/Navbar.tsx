'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, User, Shield } from '@/components/icons'

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8 object-contain" 
                priority
              />
            </div>
            <span className="font-semibold text-gray-900">วงษ์พาณิชย์ ส.เจริญชัย รีไซเคิล</span>
          </Link>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                {(session.user.isAdmin || session.user.isOperator) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-line"
                  >
                    <Shield className="w-4 h-4" />
                    {session.user.isAdmin ? 'Admin' : 'Operator'}
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  {session.user.image ? (
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 hidden sm:inline">{session.user.name}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-line text-white px-4 py-2 rounded-lg text-sm hover:bg-line-dark transition"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

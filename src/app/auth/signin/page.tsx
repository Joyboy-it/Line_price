'use client'

import { signIn } from 'next-auth/react'
import { MessageCircle } from 'lucide-react'
import Image from 'next/image'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-white">
            <Image src="/logo.png" alt="Logo" width={64} height={64} className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">วงษ์พาณิชย์ ส.เจริญชัย รีไซเคิล</h1>
          <p className="text-gray-600 mt-2">เข้าสู่ระบบเพื่อเช็คราคาสินค้า</p>
        </div>

        <button
          onClick={() => signIn('line', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 bg-line text-white py-3 px-4 rounded-lg hover:bg-line-dark transition font-medium"
        >
          <MessageCircle className="w-6 h-6" />
          เข้าสู่ระบบด้วย LINE
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          เมื่อเข้าสู่ระบบ คุณยอมรับ{' '}
          <a href="#" className="text-line hover:underline">
            ข้อกำหนดการใช้งาน
          </a>
        </p>
      </div>
    </div>
  )
}

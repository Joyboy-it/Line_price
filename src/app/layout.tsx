import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'optional',
  preload: true,
  variable: '--font-inter',
  weight: ['400', '600'],
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true
})

export const metadata: Metadata = {
  title: 'วงษ์พาณิชย์ ส.เจริญชัย รีไซเคิล',
  description: 'ระบบเช็คราคาสินค้าผ่าน LINE Login',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06C755'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="th">
      <body className={inter.className}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}

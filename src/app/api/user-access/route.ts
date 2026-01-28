import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserAccess } from '@/lib/data'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await getUserAccess(session.user.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching user access:', error)
    return NextResponse.json({ error: 'Failed to fetch access' }, { status: 500 })
  }
}

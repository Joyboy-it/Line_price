import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserAccessRequest } from '@/lib/data'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await getUserAccessRequest(session.user.id)
    return NextResponse.json(data || null)
  } catch (error) {
    console.error('Error fetching user request:', error)
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 })
  }
}

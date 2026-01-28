import { NextResponse } from 'next/server'
import { getAnnouncements } from '@/lib/data'

export async function GET() {
  try {
    const data = await getAnnouncements()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

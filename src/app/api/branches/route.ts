import { NextResponse } from 'next/server'
import { getBranches } from '@/lib/data'

export async function GET() {
  try {
    const data = await getBranches()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
  }
}

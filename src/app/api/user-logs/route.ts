import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Create a new log entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, details } = body

    const ip_address = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
    const user_agent = request.headers.get('user-agent') || 'unknown'

    const { error } = await supabaseAdmin
      .from('user_logs')
      .insert({
        user_id: session.user.id,
        action,
        details,
        ip_address,
        user_agent
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating log:', error)
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
  }
}

// GET - Get logs (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin/Operator only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id')
    const action = searchParams.get('action')

    // Query logs
    let query = supabaseAdmin
      .from('user_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (action) {
      query = query.eq('action', action)
    }

    const { data: logs, error: logsError } = await query

    if (logsError) throw logsError

    if (!logs || logs.length === 0) {
      return NextResponse.json([])
    }

    // Get unique user IDs
    const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))]

    // Query users separately
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name, email, image')
      .in('id', userIds)

    // Merge data
    const logsWithUsers = logs.map(log => ({
      ...log,
      users: users?.find(u => u.id === log.user_id) || null
    }))

    return NextResponse.json(logsWithUsers)
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

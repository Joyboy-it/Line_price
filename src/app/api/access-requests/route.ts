import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { branchId, shopName, note } = await request.json()

    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .insert({
        user_id: session.user.id,
        branch_id: branchId,
        shop_name: shopName,
        note: note || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Log request_access action
    await supabaseAdmin.from('user_logs').insert({
      user_id: session.user.id,
      action: 'request_access',
      details: {
        request_id: data.id,
        branch_id: branchId,
        shop_name: shopName
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating access request:', error)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('access_requests')
      .select(`
        *,
        user:users(*),
        branch:branches(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching access requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

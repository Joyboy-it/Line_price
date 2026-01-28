import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { reason } = await request.json()

    const { data: requestData, error } = await supabaseAdmin
      .from('access_requests')
      .update({
        status: 'rejected',
        reject_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('user_id')
      .single()

    if (error) throw error

    // Log reject action
    await supabaseAdmin.from('user_logs').insert({
      user_id: session.user.id,
      action: 'reject_request',
      details: {
        request_id: id,
        target_user_id: requestData.user_id,
        reason: reason || null
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error rejecting request:', error)
    return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
  }
}

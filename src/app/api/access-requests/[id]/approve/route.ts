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
    const { priceGroupIds } = await request.json()

    // Update request status
    const { data: requestData, error: updateError } = await supabaseAdmin
      .from('access_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('user_id')
      .single()

    if (updateError) throw updateError

    // Grant access to price groups
    if (priceGroupIds && priceGroupIds.length > 0) {
      const accessEntries = priceGroupIds.map((groupId: string) => ({
        user_id: requestData.user_id,
        price_group_id: groupId,
        granted_by: session.user.id,
      }))

      const { error: accessError } = await supabaseAdmin
        .from('user_group_access')
        .upsert(accessEntries, { onConflict: 'user_id,price_group_id' })

      if (accessError) throw accessError
    }

    // Log approve action
    await supabaseAdmin.from('user_logs').insert({
      user_id: session.user.id,
      action: 'approve_request',
      details: {
        request_id: id,
        target_user_id: requestData.user_id,
        price_group_ids: priceGroupIds
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error approving request:', error)
    return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 })
  }
}

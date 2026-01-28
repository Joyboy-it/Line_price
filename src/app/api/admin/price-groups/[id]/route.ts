import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const { name, description, telegram_chat_id } = await request.json()

    const { error } = await supabaseAdmin
      .from('price_groups')
      .update({ name, description, telegram_chat_id })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating price group:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params

    // Get group info before deleting
    const { data: groupData } = await supabaseAdmin
      .from('price_groups')
      .select('name')
      .eq('id', id)
      .single()

    // Delete related records first
    await supabaseAdmin
      .from('user_group_access')
      .delete()
      .eq('price_group_id', id)

    await supabaseAdmin
      .from('price_group_images')
      .delete()
      .eq('price_group_id', id)

    await supabaseAdmin
      .from('access_requests')
      .delete()
      .eq('price_group_id', id)

    // Delete the group
    const { error } = await supabaseAdmin
      .from('price_groups')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Log delete group action
    await supabaseAdmin.from('user_logs').insert({
      user_id: session.user.id,
      action: 'delete_group',
      details: {
        group_id: id,
        group_name: groupData?.name || 'Unknown'
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting price group:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

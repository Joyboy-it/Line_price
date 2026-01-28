import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Update user's groups (replace all)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const { group_ids } = await request.json()

    // Delete existing access
    await supabaseAdmin
      .from('user_group_access')
      .delete()
      .eq('user_id', id)

    // Add new access
    if (group_ids && group_ids.length > 0) {
      const accessRecords = group_ids.map((groupId: string) => ({
        user_id: id,
        price_group_id: groupId
      }))

      const { error } = await supabaseAdmin
        .from('user_group_access')
        .insert(accessRecords)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user groups:', error)
    return NextResponse.json({ error: 'Failed to update groups' }, { status: 500 })
  }
}

// Remove user from a specific group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')

    if (!groupId) {
      return NextResponse.json({ error: 'group_id required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('user_group_access')
      .delete()
      .eq('user_id', id)
      .eq('price_group_id', groupId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing user from group:', error)
    return NextResponse.json({ error: 'Failed to remove from group' }, { status: 500 })
  }
}

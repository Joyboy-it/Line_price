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
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { is_admin, is_operator, shop_name, phone, address, bank_account, bank_name, note } = body

    const updateData: Record<string, unknown> = {}
    const roleChanged = session.user.isAdmin && (typeof is_admin === 'boolean' || typeof is_operator === 'boolean')

    // Role changes are Admin-only
    if (session.user.isAdmin) {
      if (typeof is_admin === 'boolean') updateData.is_admin = is_admin
      if (typeof is_operator === 'boolean') updateData.is_operator = is_operator
    }
    if (shop_name !== undefined) updateData.shop_name = shop_name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (bank_account !== undefined) updateData.bank_account = bank_account
    if (bank_name !== undefined) updateData.bank_name = bank_name
    if (note !== undefined) updateData.note = note

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    // Log edit_user or grant_admin action
    if (roleChanged) {
      await supabaseAdmin.from('user_logs').insert({
        user_id: session.user.id,
        action: 'grant_admin',
        details: {
          target_user_id: id,
          is_admin: is_admin,
          is_operator: is_operator
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })
    } else {
      await supabaseAdmin.from('user_logs').insert({
        user_id: session.user.id,
        action: 'edit_user',
        details: {
          target_user_id: id,
          updated_fields: Object.keys(updateData)
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
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

    // Delete user's group access first
    await supabaseAdmin
      .from('user_group_access')
      .delete()
      .eq('user_id', id)

    // Delete user's access requests
    await supabaseAdmin
      .from('access_requests')
      .delete()
      .eq('user_id', id)

    // Delete user
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

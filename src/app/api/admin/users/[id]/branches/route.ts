import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Get user's branches
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin/Operator only' }, { status: 403 })
    }

    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('user_branches')
      .select(`
        id,
        user_id,
        branch_id,
        assigned_by,
        created_at,
        branches:branch_id (
          id,
          name,
          code
        )
      `)
      .eq('user_id', id)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching user branches:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// PUT - Update user's branches (replace all)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin/Operator only' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { branchIds } = body

    if (!Array.isArray(branchIds)) {
      return NextResponse.json({ error: 'branchIds must be an array' }, { status: 400 })
    }

    // Delete existing branches
    const { error: deleteError } = await supabaseAdmin
      .from('user_branches')
      .delete()
      .eq('user_id', id)

    if (deleteError) throw deleteError

    // Insert new branches
    if (branchIds.length > 0) {
      const rows = branchIds.map((branchId: string) => ({
        user_id: id,
        branch_id: branchId,
        assigned_by: session.user.id
      }))

      const { error: insertError } = await supabaseAdmin
        .from('user_branches')
        .insert(rows)

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user branches:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE - Remove a specific branch from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin/Operator only' }, { status: 403 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')

    if (!branchId) {
      return NextResponse.json({ error: 'branchId is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('user_branches')
      .delete()
      .eq('user_id', id)
      .eq('branch_id', branchId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user branch:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

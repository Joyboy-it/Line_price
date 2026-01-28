import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Admin/Operator only' }, { status: 403 })
    }

    // Get all users with their branches
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Users error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json([])
    }

    // Get user branches
    const userIds = users.map(u => u.id)
    const { data: userBranches } = await supabaseAdmin
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
      .in('user_id', userIds)

    // Get user_group_access separately
    const { data: accessData, error: accessError } = await supabaseAdmin
      .from('user_group_access')
      .select(`
        id,
        user_id,
        price_group_id,
        created_at,
        price_groups (
          id,
          name
        )
      `)

    if (accessError) {
      console.error('Access error:', accessError)
      // Continue without access data
    }

    // Merge access data into users
    const usersWithGroups = users.map(user => ({
      ...user,
      user_group_access: (accessData || [])
        .filter(ga => ga.user_id === user.id)
        .map(ga => ({
          id: ga.id,
          price_group_id: ga.price_group_id,
          created_at: ga.created_at,
          price_groups: ga.price_groups
        })),
      user_branches: (userBranches || [])
        .filter(ub => ub.user_id === user.id)
        .map(ub => ({
          id: ub.id,
          user_id: ub.user_id,
          branch_id: ub.branch_id,
          assigned_by: ub.assigned_by,
          created_at: ub.created_at,
          branch: ub.branches
        }))
    }))

    return NextResponse.json(usersWithGroups)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin && !session?.user?.isOperator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const branchId = request.nextUrl.searchParams.get('branchId')

    let query = supabaseAdmin.from('price_groups').select('*')
    
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data, error } = await query.order('name')

    if (error) throw error

    const groupIds = (data || []).map((g) => g.id).filter(Boolean)
    if (groupIds.length === 0) {
      return NextResponse.json(data || [])
    }

    const { data: images, error: imagesError } = await supabaseAdmin
      .from('price_group_images')
      .select('price_group_id, created_at')
      .in('price_group_id', groupIds)
      .order('created_at', { ascending: false })

    if (imagesError) throw imagesError

    const latestMap = new Map<string, string>()
    for (const img of images || []) {
      if (!latestMap.has(img.price_group_id)) {
        latestMap.set(img.price_group_id, img.created_at)
      }
    }

    const enriched = (data || []).map((group) => ({
      ...group,
      last_updated_at: latestMap.get(group.id) || null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching price groups:', error)
    return NextResponse.json({ error: 'Failed to fetch price groups' }, { status: 500 })
  }
}

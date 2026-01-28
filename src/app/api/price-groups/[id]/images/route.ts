import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user has access to this price group
    const { data: access } = await supabaseAdmin
      .from('user_group_access')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('price_group_id', id)
      .single()

    // Allow if user has access OR is admin
    if (!access && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('price_group_images')
      .select('*')
      .eq('price_group_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { file_path, file_name, title } = body

    if (!file_path) {
      return NextResponse.json({ error: 'file_path is required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('price_group_images')
      .insert({
        price_group_id: id,
        file_path,
        file_name,
        title,
        uploaded_by: session.user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error adding image:', error)
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 })
  }
}

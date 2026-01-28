import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('price_groups')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching price groups:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { name, description, telegram_chat_id } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('price_groups')
      .insert({ name, description, telegram_chat_id })
      .select()
      .single()

    if (error) throw error

    // Log create group action
    await supabaseAdmin.from('user_logs').insert({
      user_id: session.user.id,
      action: 'create_group',
      details: {
        group_id: data.id,
        group_name: name,
        description: description || null
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating price group:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

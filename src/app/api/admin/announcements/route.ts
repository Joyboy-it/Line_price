import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const announcementIds = (data || []).map((a) => a.id).filter(Boolean)
    if (announcementIds.length === 0) {
      return NextResponse.json(data || [])
    }

    const { data: images, error: imagesError } = await supabaseAdmin
      .from('announcement_images')
      .select('*')
      .in('announcement_id', announcementIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (imagesError) throw imagesError

    const byAnnouncement = new Map<string, any[]>()
    for (const img of images || []) {
      const arr = byAnnouncement.get(img.announcement_id) || []
      arr.push(img)
      byAnnouncement.set(img.announcement_id, arr)
    }

    const enriched = (data || []).map((a) => ({
      ...a,
      images: byAnnouncement.get(a.id) || [],
      image_path: a.image_path || (byAnnouncement.get(a.id)?.[0]?.image_path ?? null)
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, body: content, image_path, images } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const imagePaths: string[] = Array.isArray(images)
      ? images.filter((x: unknown) => typeof x === 'string' && x).slice(0, 5)
      : []

    const primaryImagePath = imagePaths[0] || image_path

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        body: content,
        image_path: primaryImagePath,
        is_published: true,
        created_by: session.user.id
      })
      .select()
      .single()

    if (error) throw error

    if (data?.id && imagePaths.length > 0) {
      const rows = imagePaths.map((p, idx) => ({
        announcement_id: data.id,
        image_path: p,
        sort_order: idx,
      }))

      const { error: insertImagesError } = await supabaseAdmin
        .from('announcement_images')
        .insert(rows)

      if (insertImagesError) throw insertImagesError

      return NextResponse.json({
        ...data,
        images: rows
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const { images, image_path, ...rest } = body || {}

    const imagePaths: string[] | null = Array.isArray(images)
      ? images.filter((x: unknown) => typeof x === 'string' && x).slice(0, 5)
      : null

    const primaryImagePath = (imagePaths && imagePaths[0]) || image_path

    const updateBody = {
      ...rest,
      ...(primaryImagePath !== undefined ? { image_path: primaryImagePath } : {})
    }

    const { data, error } = await supabaseAdmin
      .from('announcements')
      .update(updateBody)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (imagePaths) {
      const { error: delError } = await supabaseAdmin
        .from('announcement_images')
        .delete()
        .eq('announcement_id', id)

      if (delError) throw delError

      if (imagePaths.length > 0) {
        const rows = imagePaths.map((p, idx) => ({
          announcement_id: id,
          image_path: p,
          sort_order: idx,
        }))

        const { error: insError } = await supabaseAdmin
          .from('announcement_images')
          .insert(rows)

        if (insError) throw insError

        return NextResponse.json({
          ...data,
          images: rows,
          image_path: data.image_path || rows[0]?.image_path || null
        })
      }

      return NextResponse.json({
        ...data,
        images: [],
        image_path: data.image_path
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating announcement:', error)
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    const { error } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

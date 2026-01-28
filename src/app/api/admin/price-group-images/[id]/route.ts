import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Get image info first
    const { data: image } = await supabaseAdmin
      .from('price_group_images')
      .select('file_path')
      .eq('id', id)
      .single()

    // Delete from storage if exists
    if (image?.file_path) {
      await supabaseAdmin.storage
        .from('price-images')
        .remove([image.file_path])
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from('price_group_images')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

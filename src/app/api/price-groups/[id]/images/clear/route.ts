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

    // Get all images for this group
    const { data: images } = await supabaseAdmin
      .from('price_group_images')
      .select('id, file_path')
      .eq('price_group_id', id)

    if (images && images.length > 0) {
      // Delete from storage
      const filePaths = images.map(img => img.file_path).filter(Boolean)
      if (filePaths.length > 0) {
        await supabaseAdmin.storage
          .from('price-images')
          .remove(filePaths)
      }

      // Delete from database
      await supabaseAdmin
        .from('price_group_images')
        .delete()
        .eq('price_group_id', id)
    }

    return NextResponse.json({ success: true, deleted: images?.length || 0 })
  } catch (error) {
    console.error('Error clearing images:', error)
    return NextResponse.json({ error: 'Failed to clear images' }, { status: 500 })
  }
}

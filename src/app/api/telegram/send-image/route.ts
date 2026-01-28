import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { imageUrl, caption, chatId } = await request.json()

    console.log('[Telegram] Request:', { imageUrl, chatId, caption })

    if (!imageUrl || !chatId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('[Telegram] TELEGRAM_BOT_TOKEN not configured')
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 })
    }

    // Convert to Supabase Storage public URL
    let fullImageUrl = imageUrl
    
    // If it's a relative path, convert to Supabase public URL
    if (imageUrl.startsWith('/')) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        // Remove leading slash and construct Supabase Storage URL
        const cleanPath = imageUrl.replace(/^\//, '')
        fullImageUrl = `${supabaseUrl}/storage/v1/object/public/${cleanPath}`
      } else {
        // Fallback to Vercel URL if Supabase URL not available
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        fullImageUrl = `${baseUrl}${imageUrl}`
      }
    }

    console.log('[Telegram] Full image URL:', fullImageUrl)

    // Send photo to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: fullImageUrl,
        caption: caption || '',
        parse_mode: 'HTML'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Telegram] API error:', {
        url: telegramUrl,
        chatId,
        imageUrl: fullImageUrl,
        response: data,
        botToken: botToken ? 'SET' : 'NOT SET',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'
      })
      return NextResponse.json({ 
        error: 'Failed to send to Telegram', 
        details: data,
        debug: {
          imageUrl: fullImageUrl,
          chatId,
          errorCode: data.error_code,
          errorDescription: data.description
        }
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending to Telegram:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

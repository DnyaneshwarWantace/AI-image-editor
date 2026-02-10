import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/fonts - Get all fonts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const searchKeyword = searchParams.get('searchKeyword')
    const limit = searchParams.get('limit')

    let query = supabase.from('fonts').select('*')

    if (type) {
      query = query.eq('type', type)
    }

    if (searchKeyword) {
      query = query.or(`name.ilike.%${searchKeyword}%,font_family.ilike.%${searchKeyword}%`)
    }

    query = query.order('sort', { ascending: true })

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: fonts, error } = await query

    if (error) throw error

    return NextResponse.json(fonts)
  } catch (error) {
    console.error('Error fetching fonts:', error)
    return NextResponse.json({ error: 'Failed to fetch fonts' }, { status: 500 })
  }
}

// POST /api/fonts - Create a new font
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, fontFamily, type, url, imageUrl, sort } = body

    const { data: font, error } = await supabase
      .from('fonts')
      .insert({
        name,
        font_family: fontFamily,
        type,
        url,
        image_url: imageUrl,
        sort,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(font)
  } catch (error) {
    console.error('Error creating font:', error)
    return NextResponse.json({ error: 'Failed to create font' }, { status: 500 })
  }
}

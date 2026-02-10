import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')

    let query = supabase
      .from('font_styles')
      .select('*')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching font styles:', error)
    return NextResponse.json({ error: 'Failed to fetch font styles' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('material_types')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching material types:', error)
    return NextResponse.json({ error: 'Failed to fetch material types' }, { status: 500 })
  }
}

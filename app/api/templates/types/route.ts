import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // Get all template types from the template_types table
    const { data, error } = await supabase
      .from('template_types')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching template types:', error)
    return NextResponse.json({ error: 'Failed to fetch template types' }, { status: 500 })
  }
}

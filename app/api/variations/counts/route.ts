import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const type = searchParams.get('type')

    if (!projectId || !type) {
      return NextResponse.json({ error: 'Project ID and type are required' }, { status: 400 })
    }

    let tableName: string
    switch (type) {
      case 'text':
        tableName = 'text_variations'
        break
      case 'image':
        tableName = 'image_variations'
        break
      case 'font':
        tableName = 'font_variations'
        break
      case 'backgroundColor':
        tableName = 'background_color_variations'
        break
      case 'textColor':
        tableName = 'text_color_variations'
        break
      default:
        return NextResponse.json({ error: 'Invalid variation type' }, { status: 400 })
    }

    // For backgroundColor, it doesn't have element_id, just count all rows
    if (type === 'backgroundColor') {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .eq('project_id', projectId)

      if (error) throw error

      return NextResponse.json({ count: data?.length || 0 })
    }

    // For other types, count by element_id
    const { data, error } = await supabase
      .from(tableName)
      .select('element_id')
      .eq('project_id', projectId)

    if (error) throw error

    // Count variations per element
    const counts: Record<string, number> = {}
    data?.forEach((row: any) => {
      const elementId = row.element_id
      counts[elementId] = (counts[elementId] || 0) + 1
    })

    return NextResponse.json(counts)
  } catch (error) {
    console.error('Error fetching variation counts:', error)
    return NextResponse.json({ error: 'Failed to fetch variation counts' }, { status: 500 })
  }
}

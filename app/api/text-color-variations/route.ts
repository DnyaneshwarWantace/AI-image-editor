import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const elementId = searchParams.get('elementId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('text_color_variations')
      .select('*')
      .eq('project_id', projectId)

    if (elementId) {
      query = query.eq('element_id', elementId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching text color variations:', error)
    return NextResponse.json({ error: 'Failed to fetch text color variations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, elementId, originalColor, variations, userId } = body

    if (!projectId || !elementId) {
      return NextResponse.json({ error: 'Project ID and element ID are required' }, { status: 400 })
    }

    // Delete existing variations for this element
    await supabase
      .from('text_color_variations')
      .delete()
      .eq('project_id', projectId)
      .eq('element_id', elementId)

    // Insert new variations
    if (variations && variations.length > 0) {
      const variationsToInsert = variations.map((v: any) => ({
        project_id: projectId,
        element_id: elementId,
        original_color: originalColor,
        color: v.color,
        name: v.name,
        user_id: userId,
      }))

      const { error } = await supabase
        .from('text_color_variations')
        .insert(variationsToInsert)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving text color variations:', error)
    return NextResponse.json({ error: 'Failed to save text color variations' }, { status: 500 })
  }
}

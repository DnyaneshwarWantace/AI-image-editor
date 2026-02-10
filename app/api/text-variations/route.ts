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
      .from('text_variations')
      .select('*')
      .eq('project_id', projectId)

    if (elementId) {
      query = query.eq('element_id', elementId)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by element_id if no specific elementId was requested
    if (!elementId) {
      return NextResponse.json(data || [])
    }

    // For specific element, return in expected format
    return NextResponse.json({
      variations: data || []
    })
  } catch (error) {
    console.error('Error fetching text variations:', error)
    return NextResponse.json({ error: 'Failed to fetch text variations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, elementId, originalText, variations, userId } = body

    if (!projectId || !elementId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Delete existing variations for this element
    await supabase
      .from('text_variations')
      .delete()
      .eq('project_id', projectId)
      .eq('element_id', elementId)

    // Insert new variations
    if (variations && variations.length > 0) {
      const variationsToInsert = variations.map((v: any) => ({
        project_id: projectId,
        element_id: elementId,
        original_text: originalText,
        text: v.text,
        type: v.type || 'manual',
        language: v.language,
        user_id: userId,
      }))

      const { error } = await supabase
        .from('text_variations')
        .insert(variationsToInsert)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving text variations:', error)
    return NextResponse.json({ error: 'Failed to save text variations' }, { status: 500 })
  }
}

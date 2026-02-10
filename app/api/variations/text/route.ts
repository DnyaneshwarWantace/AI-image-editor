import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/variations/text - Get text variations by project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const { data: variations, error } = await supabase
      .from('text_variations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(variations)
  } catch (error) {
    console.error('Error fetching text variations:', error)
    return NextResponse.json({ error: 'Failed to fetch text variations' }, { status: 500 })
  }
}

// POST /api/variations/text - Save text variations
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, elementId, originalText, variations, userId } = body

    // Check if variation already exists
    const { data: existing } = await supabase
      .from('text_variations')
      .select('*')
      .eq('project_id', projectId)
      .eq('element_id', elementId)
      .single()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('text_variations')
        .update({
          original_text: originalText,
          variations,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('text_variations')
        .insert({
          project_id: projectId,
          element_id: elementId,
          original_text: originalText,
          variations,
          user_id: userId,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving text variations:', error)
    return NextResponse.json({ error: 'Failed to save text variations' }, { status: 500 })
  }
}

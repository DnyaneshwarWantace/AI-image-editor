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
      .from('image_variations')
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

    // For specific element, return in expected format with image URLs
    const variations = (data || []).map(v => ({
      id: v.id,
      imageUrl: v.image_url,
      storageId: v.storage_id,
      type: v.type
    }))

    return NextResponse.json({
      variations
    })
  } catch (error) {
    console.error('Error fetching image variations:', error)
    return NextResponse.json({ error: 'Failed to fetch image variations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, elementId, originalImageUrl, variations, userId } = body

    if (!projectId || !elementId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Delete existing variations for this element
    await supabase
      .from('image_variations')
      .delete()
      .eq('project_id', projectId)
      .eq('element_id', elementId)

    // Insert new variations
    if (variations && variations.length > 0) {
      const variationsToInsert = variations.map((v: any) => ({
        id: v.id,
        project_id: projectId,
        element_id: elementId,
        original_image_url: originalImageUrl,
        image_url: v.imageUrl,
        storage_id: v.storageId,
        type: v.type || 'uploaded',
        user_id: userId,
      }))

      const { error } = await supabase
        .from('image_variations')
        .insert(variationsToInsert)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving image variations:', error)
    return NextResponse.json({ error: 'Failed to save image variations' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, canvasTextIds } = body

    if (!projectId || !Array.isArray(canvasTextIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Get all variations for this project
    const { data: allVariations, error: fetchError } = await supabase
      .from('text_variations')
      .select('element_id')
      .eq('project_id', projectId)

    if (fetchError) throw fetchError

    // Find element IDs that are NOT in the canvas
    const allElementIds = new Set(allVariations?.map(v => v.element_id) || [])
    const orphanedElementIds = Array.from(allElementIds).filter(
      elementId => !canvasTextIds.includes(elementId)
    )

    if (orphanedElementIds.length === 0) {
      return NextResponse.json({
        deletedCount: 0,
        deletedElements: []
      })
    }

    // Delete variations for orphaned elements
    const { error: deleteError } = await supabase
      .from('text_variations')
      .delete()
      .eq('project_id', projectId)
      .in('element_id', orphanedElementIds)

    if (deleteError) throw deleteError

    return NextResponse.json({
      deletedCount: orphanedElementIds.length,
      deletedElements: orphanedElementIds
    })
  } catch (error) {
    console.error('Error cleaning up orphaned variations:', error)
    return NextResponse.json({ error: 'Failed to cleanup variations' }, { status: 500 })
  }
}

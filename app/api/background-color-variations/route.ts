import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('background_color_variations')
      .select('*')
      .eq('project_id', projectId)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching background color variations:', error)
    return NextResponse.json({ error: 'Failed to fetch background color variations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, variations, userId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Delete existing variations for this project
    await supabase
      .from('background_color_variations')
      .delete()
      .eq('project_id', projectId)

    // Insert new variations
    if (variations && variations.length > 0) {
      const variationsToInsert = variations.map((v: any) => ({
        project_id: projectId,
        color: v.color,
        name: v.name,
        user_id: userId,
      }))

      const { error } = await supabase
        .from('background_color_variations')
        .insert(variationsToInsert)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving background color variations:', error)
    return NextResponse.json({ error: 'Failed to save background color variations' }, { status: 500 })
  }
}

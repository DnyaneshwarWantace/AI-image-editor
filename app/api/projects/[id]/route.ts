import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, width, height, canvasState, imageUrl } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (width !== undefined) updateData.width = width
    if (height !== undefined) updateData.height = height
    if (canvasState !== undefined) updateData.canvas_state = canvasState
    if (imageUrl !== undefined) updateData.image_url = imageUrl

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Update a project (alias for PATCH)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PATCH(request, { params })
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}

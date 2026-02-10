import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { randomUUID } from 'crypto'

// GET /api/projects - Get all projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = supabase.from('projects').select('*')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    query = query.order('created_at', { ascending: false })

    const { data: projects, error } = await query

    if (error) throw error

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, width, height, canvasState, imageUrl, userId } = body

    const now = new Date().toISOString()

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        id: randomUUID(),
        title,
        width,
        height,
        canvas_state: canvasState,
        image_url: imageUrl,
        user_id: userId,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

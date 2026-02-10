import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/materials - Get all materials
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const materialTypeId = searchParams.get('materialTypeId')
    const searchKeyword = searchParams.get('searchKeyword')
    const limit = searchParams.get('limit')
    const isPublic = searchParams.get('is_public')

    let query = supabase.from('materials').select('*, material_type:material_types(*)')

    if (materialTypeId) {
      query = query.eq('material_type_id', materialTypeId)
    }

    if (isPublic !== null) {
      query = query.eq('is_public', isPublic === 'true')
    }

    if (searchKeyword) {
      query = query.ilike('name', `%${searchKeyword}%`)
    }

    query = query.order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: materials, error } = await query

    if (error) throw error

    return NextResponse.json(materials)
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}

// POST /api/materials - Create a new material
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data: material, error } = await supabase
      .from('materials')
      .insert({
        name: body.name,
        description: body.description,
        image_url: body.imageUrl,
        small_url: body.smallUrl,
        thumbnail_url: body.thumbnailUrl,
        material_type_id: body.materialTypeId,
        is_public: body.isPublic ?? true,
        user_id: body.userId,
        sort: body.sort,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(material)
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
  }
}

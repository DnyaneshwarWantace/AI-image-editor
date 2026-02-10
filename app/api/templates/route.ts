import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/templates - Get all templates
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const templateTypeId = searchParams.get('templateTypeId')
    const searchKeyword = searchParams.get('searchKeyword')
    const limit = searchParams.get('limit')
    const isPublic = searchParams.get('isPublic')

    let query = supabase.from('templates').select('*, template_type:template_types(*)')

    if (templateTypeId) {
      query = query.eq('template_type_id', templateTypeId)
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

    const { data: templates, error } = await query

    if (error) throw error

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/templates - Create a new template
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        name: body.name,
        description: body.description,
        json: body.json,
        image_url: body.imageUrl,
        template_type_id: body.templateTypeId,
        width: body.width,
        height: body.height,
        price: body.price,
        pro_info: body.proInfo,
        pro_images: body.proImages,
        is_public: body.isPublic ?? true,
        user_id: body.userId,
        sort: body.sort,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

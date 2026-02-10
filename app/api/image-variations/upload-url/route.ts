import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Generate a unique file name
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Create a signed upload URL for Supabase Storage
    const { data, error } = await supabase.storage
      .from('image-variations')
      .createSignedUploadUrl(`uploads/${fileName}`)

    if (error) throw error

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      path: data.path
    })
  } catch (error) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}

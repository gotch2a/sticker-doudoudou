import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Récupérer les photos avec leurs métadonnées
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('photos')
      .select('*')
      .eq('is_active', true)
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data: photos, error } = await query

    if (error) {
      console.error('❌ Erreur récupération photos:', error)
      return NextResponse.json(
        { error: 'Erreur récupération photos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photos,
      total: photos.length
    })

  } catch (error) {
    console.error('❌ Erreur API photos:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une photo (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json(
        { error: 'Nom de fichier requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('photos')
      .update({ is_active: false })
      .eq('filename', filename)
      .select()

    if (error) {
      console.error('❌ Erreur suppression photo:', error)
      return NextResponse.json(
        { error: 'Erreur suppression photo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Photo supprimée avec succès',
      photo: data[0]
    })

  } catch (error) {
    console.error('❌ Erreur suppression photo:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export interface DiscountCode {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  minimum_amount: number
  usage_limit: number | null
  used_count: number
  valid_from: string
  valid_until: string | null
  active: boolean
  created_at: string
  updated_at: string
}

// GET - Récupérer tous les codes de remise
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération codes de remise:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur récupération codes de remise' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, discountCodes: data })
  } catch (error) {
    console.error('❌ Erreur récupération codes de remise:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau code de remise
export async function POST(request: NextRequest) {
  try {
    const codeData = await request.json()
    
    // Validation des données requises
    if (!codeData.code || !codeData.discount_type || !codeData.discount_value) {
      return NextResponse.json(
        { success: false, error: 'Code, type et valeur de remise requis' },
        { status: 400 }
      )
    }

    // Validation du type de remise
    if (!['percentage', 'fixed'].includes(codeData.discount_type)) {
      return NextResponse.json(
        { success: false, error: 'Type de remise invalide' },
        { status: 400 }
      )
    }

    // Validation de la valeur de remise
    if (codeData.discount_type === 'percentage' && (codeData.discount_value <= 0 || codeData.discount_value > 100)) {
      return NextResponse.json(
        { success: false, error: 'Le pourcentage doit être entre 1 et 100' },
        { status: 400 }
      )
    }

    if (codeData.discount_type === 'fixed' && codeData.discount_value <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le montant fixe doit être positif' },
        { status: 400 }
      )
    }

    console.log('💾 Tentative création code de remise:', {
      code: codeData.code.toUpperCase(),
      discount_type: codeData.discount_type,
      discount_value: codeData.discount_value
    })

    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code: codeData.code.toUpperCase(),
        description: codeData.description || '',
        discount_type: codeData.discount_type,
        discount_value: codeData.discount_value,
        minimum_amount: codeData.minimum_amount || 0,
        usage_limit: codeData.usage_limit || null,
        valid_from: codeData.valid_from || new Date().toISOString(),
        valid_until: codeData.valid_until || null,
        active: codeData.active !== false
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur Supabase complète:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      if (error.code === '23505') { // Code unique violation
        return NextResponse.json(
          { success: false, error: 'Ce code de remise existe déjà' },
          { status: 400 }
        )
      }
      
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json(
          { success: false, error: 'Table discount_codes non trouvée. Veuillez créer la table dans Supabase d\'abord.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: `Erreur Supabase: ${error.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Nouveau code de remise créé:', data.code)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Code de remise créé avec succès',
      discountCode: data
    })
  } catch (error) {
    console.error('❌ Erreur création code de remise:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un code de remise
export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json()
    
    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: 'ID et mises à jour requis' },
        { status: 400 }
      )
    }

    // Validation du type de remise si modifié
    if (updates.discount_type && !['percentage', 'fixed'].includes(updates.discount_type)) {
      return NextResponse.json(
        { success: false, error: 'Type de remise invalide' },
        { status: 400 }
      )
    }

    // Validation de la valeur de remise si modifiée
    if (updates.discount_value !== undefined) {
      if (updates.discount_type === 'percentage' && (updates.discount_value <= 0 || updates.discount_value > 100)) {
        return NextResponse.json(
          { success: false, error: 'Le pourcentage doit être entre 1 et 100' },
          { status: 400 }
        )
      }
      if (updates.discount_type === 'fixed' && updates.discount_value <= 0) {
        return NextResponse.json(
          { success: false, error: 'Le montant fixe doit être positif' },
          { status: 400 }
        )
      }
    }

    // Mettre le code en majuscules si modifié
    if (updates.code) {
      updates.code = updates.code.toUpperCase()
    }

    const { data, error } = await supabase
      .from('discount_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur mise à jour code de remise:', error)
      if (error.code === '23505') { // Code unique violation
        return NextResponse.json(
          { success: false, error: 'Ce code de remise existe déjà' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Erreur mise à jour code de remise' },
        { status: 500 }
      )
    }
    
    console.log(`✅ Code de remise ${id} mis à jour:`, data.code)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Code de remise mis à jour avec succès',
      discountCode: data
    })
  } catch (error) {
    console.error('❌ Erreur mise à jour code de remise:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un code de remise (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      )
    }

    // Soft delete : désactiver le code au lieu de le supprimer
    const { data, error } = await supabase
      .from('discount_codes')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur suppression code de remise:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur suppression code de remise' },
        { status: 500 }
      )
    }
    
    console.log(`✅ Code de remise ${id} désactivé`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Code de remise désactivé avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur suppression code de remise:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

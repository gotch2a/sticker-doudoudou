import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API pour la gestion des codes de remise
 * GET - Récupérer tous les codes de remise
 * POST - Créer un nouveau code de remise
 * PUT - Mettre à jour un code de remise
 * DELETE - Supprimer un code de remise
 */

// GET - Récupérer tous les codes de remise
export async function GET() {
  try {
    console.log('🏷️ API - Récupération des codes de remise...')
    
    const { data: discountCodes, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération codes de remise:', error)
      throw error
    }
    
    console.log(`✅ ${discountCodes.length} codes de remise récupérés côté serveur`)
    
    return NextResponse.json({
      success: true,
      discountCodes: discountCodes,
      count: discountCodes.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erreur API codes de remise:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      discountCodes: [],
      count: 0
    }, { status: 500 })
  }
}

// POST - Créer un nouveau code de remise
export async function POST(request: Request) {
  try {
    console.log('➕ API - Création d\'un nouveau code de remise...')
    
    const body = await request.json()
    const { 
      code, 
      description, 
      discount_type, 
      discount_value, 
      minimum_amount = 0,
      usage_limit = null,
      valid_from,
      valid_until = null,
      active = true 
    } = body
    
    // Validation des données
    if (!code || !description || !discount_type || !discount_value) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes (code, description, discount_type, discount_value requis)'
      }, { status: 400 })
    }
    
    // Vérifier que le code n'existe pas déjà
    const { data: existingCode } = await supabase
      .from('discount_codes')
      .select('id')
      .eq('code', code.toUpperCase())
      .single()
    
    if (existingCode) {
      return NextResponse.json({
        success: false,
        error: 'Ce code de remise existe déjà'
      }, { status: 400 })
    }
    
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .insert({
        code: code.toUpperCase(),
        description,
        discount_type,
        discount_value,
        minimum_amount,
        usage_limit,
        used_count: 0,
        valid_from,
        valid_until,
        active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur création code de remise:', error)
      throw error
    }
    
    console.log('✅ Code de remise créé avec succès:', discountCode.code)
    
    return NextResponse.json({
      success: true,
      discountCode,
      message: 'Code de remise créé avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur création code de remise:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// PUT - Mettre à jour un code de remise
export async function PUT(request: Request) {
  try {
    console.log('✏️ API - Mise à jour d\'un code de remise...')
    
    const body = await request.json()
    console.log('🔍 Données reçues pour mise à jour:', body)
    const { 
      id, 
      code, 
      description, 
      discount_type, 
      discount_value, 
      minimum_amount,
      usage_limit,
      valid_from,
      valid_until,
      active 
    } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID du code de remise requis'
      }, { status: 400 })
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (code !== undefined) {
      // Vérifier que le nouveau code n'existe pas déjà (sauf pour le code actuel)
      const { data: existingCode } = await supabase
        .from('discount_codes')
        .select('id')
        .eq('code', code.toUpperCase())
        .neq('id', id)
        .single()
      
      if (existingCode) {
        return NextResponse.json({
          success: false,
          error: 'Ce code de remise existe déjà'
        }, { status: 400 })
      }
      
      updateData.code = code.toUpperCase()
    }
    
    if (description !== undefined) updateData.description = description
    if (discount_type !== undefined) updateData.discount_type = discount_type
    if (discount_value !== undefined) updateData.discount_value = discount_value
    if (minimum_amount !== undefined) updateData.minimum_amount = minimum_amount
    if (usage_limit !== undefined) updateData.usage_limit = usage_limit
    if (valid_from !== undefined) updateData.valid_from = valid_from
    if (valid_until !== undefined) updateData.valid_until = valid_until
    if (active !== undefined) updateData.active = active
    
    const { data: discountCodes, error } = await supabase
      .from('discount_codes')
      .update(updateData)
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('❌ Erreur mise à jour code de remise:', error)
      throw error
    }
    
    if (!discountCodes || discountCodes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Code de remise non trouvé'
      }, { status: 404 })
    }
    
    const discountCode = discountCodes[0]
    
    console.log('✅ Code de remise mis à jour avec succès:', discountCode.code)
    
    return NextResponse.json({
      success: true,
      discountCode,
      message: 'Code de remise mis à jour avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur mise à jour code de remise:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// DELETE - Supprimer un code de remise
export async function DELETE(request: Request) {
  try {
    console.log('🗑️ API - Suppression d\'un code de remise...')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID du code de remise requis'
      }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Erreur suppression code de remise:', error)
      throw error
    }
    
    console.log('✅ Code de remise supprimé avec succès:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Code de remise supprimé avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur suppression code de remise:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
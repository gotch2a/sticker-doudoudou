import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API pour la gestion des articles/produits
 * GET - Récupérer tous les articles
 * POST - Créer un nouvel article
 * PUT - Mettre à jour un article
 * DELETE - Supprimer un article
 */

// GET - Récupérer tous les articles
export async function GET() {
  try {
    console.log('📦 API - Récupération des articles...')
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération articles:', error)
      throw error
    }
    
    console.log(`✅ ${articles.length} articles récupérés côté serveur`)
    
    return NextResponse.json({
      success: true,
      articles: articles,
      count: articles.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erreur API articles:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      articles: [],
      count: 0
    }, { status: 500 })
  }
}

// POST - Créer un nouvel article
export async function POST(request: Request) {
  try {
    console.log('➕ API - Création d\'un nouvel article...')
    
    const body = await request.json()
    const { name, description, originalPrice, salePrice, features, category, active = true } = body
    
    // Validation des données
    if (!name || !description || !originalPrice || !salePrice || !category) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes (name, description, originalPrice, salePrice, category requis)'
      }, { status: 400 })
    }
    
    // Calcul des économies
    const savings = originalPrice - salePrice
    
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        name,
        description,
        original_price: originalPrice,
        sale_price: salePrice,
        savings,
        features: features || [],
        category,
        active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur création article:', error)
      throw error
    }
    
    console.log('✅ Article créé avec succès:', article.id)
    
    return NextResponse.json({
      success: true,
      article,
      message: 'Article créé avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur création article:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// PUT - Mettre à jour un article
export async function PUT(request: Request) {
  try {
    console.log('✏️ API - Mise à jour d\'un article...')
    
    const body = await request.json()
    const { id, name, description, originalPrice, salePrice, features, category, active } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de l\'article requis'
      }, { status: 400 })
    }
    
    // Calcul des économies si prix fournis
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (originalPrice !== undefined) updateData.original_price = originalPrice
    if (salePrice !== undefined) updateData.sale_price = salePrice
    if (features !== undefined) updateData.features = features
    if (category !== undefined) updateData.category = category
    if (active !== undefined) updateData.active = active
    
    // Recalculer les économies si les prix changent
    if (originalPrice !== undefined && salePrice !== undefined) {
      updateData.savings = originalPrice - salePrice
    }
    
    const { data: article, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur mise à jour article:', error)
      throw error
    }
    
    console.log('✅ Article mis à jour avec succès:', article.id)
    
    return NextResponse.json({
      success: true,
      article,
      message: 'Article mis à jour avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur mise à jour article:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

// DELETE - Supprimer un article
export async function DELETE(request: Request) {
  try {
    console.log('🗑️ API - Suppression d\'un article...')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de l\'article requis'
      }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Erreur suppression article:', error)
      throw error
    }
    
    console.log('✅ Article supprimé avec succès:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Article supprimé avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur suppression article:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
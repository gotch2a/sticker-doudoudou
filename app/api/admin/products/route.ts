import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/supabase'

// GET - Récupérer les paramètres produits depuis Supabase
export async function GET() {
  try {
    const articles = await OrderService.getAllArticles()
    
    // Transformer les articles Supabase en format attendu par le frontend
    const products = articles.map(article => ({
      id: article.id,
      name: article.name,
      description: article.description,
      originalPrice: article.original_price,
      salePrice: article.sale_price,
      savings: article.savings,
      icon: article.icon,
      badge: article.badge,
      popular: article.popular,
      features: article.features,
      active: article.active,
      category: article.category
    }))

    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error('Erreur récupération paramètres produits:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur récupération paramètres' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel article
export async function POST(request: NextRequest) {
  try {
    const articleData = await request.json()
    
    // Validation des données requises
    if (!articleData.name || !articleData.sale_price || !articleData.category) {
      return NextResponse.json(
        { success: false, error: 'Nom, prix et catégorie requis' },
        { status: 400 }
      )
    }

    const newArticle = await OrderService.createArticle({
      name: articleData.name,
      description: articleData.description || '',
      original_price: articleData.original_price || articleData.sale_price,
      sale_price: articleData.sale_price,
      savings: articleData.savings || 0,
      icon: articleData.icon || '🏷️',
      badge: articleData.badge,
      popular: articleData.popular || false,
      features: articleData.features || [],
      active: true,
      category: articleData.category
    })
    
    console.log('✅ Nouvel article créé:', newArticle.name)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Article créé avec succès',
      article: newArticle
    })
  } catch (error) {
    console.error('Erreur création article:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur création article' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un article
export async function PUT(request: NextRequest) {
  try {
    const { id, updates } = await request.json()
    
    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: 'ID et mises à jour requis' },
        { status: 400 }
      )
    }

    const updatedArticle = await OrderService.updateArticle(id, updates)
    
    console.log(`✅ Article ${id} mis à jour:`, updatedArticle.name)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Article mis à jour avec succès',
      article: updatedArticle
    })
  } catch (error) {
    console.error('Erreur mise à jour article:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur mise à jour article' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un article
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

    await OrderService.deleteArticle(id)
    
    console.log(`✅ Article ${id} supprimé`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Article supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur suppression article:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur suppression article' },
      { status: 500 }
    )
  }
}

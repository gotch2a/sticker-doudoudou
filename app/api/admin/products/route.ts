import { NextRequest, NextResponse } from 'next/server'
import { serverProductSettingsService, ProductSettings } from '@/lib/serverProductSettings'

// GET - Récupérer les paramètres produits
export async function GET() {
  try {
    const products = serverProductSettingsService.getProducts()
    return NextResponse.json({ success: true, products })
  } catch (error) {
    console.error('Erreur récupération paramètres produits:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur récupération paramètres' },
      { status: 500 }
    )
  }
}

// POST - Sauvegarder les paramètres produits
export async function POST(request: NextRequest) {
  try {
    const { products }: { products: ProductSettings[] } = await request.json()
    
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, error: 'Format de données invalide' },
        { status: 400 }
      )
    }

    serverProductSettingsService.saveProducts(products)
    
    console.log('✅ Paramètres produits synchronisés depuis le dashboard')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Paramètres sauvegardés avec succès' 
    })
  } catch (error) {
    console.error('Erreur sauvegarde paramètres produits:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur sauvegarde paramètres' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un produit spécifique
export async function PUT(request: NextRequest) {
  try {
    const { productId, updates }: { productId: string, updates: Partial<ProductSettings> } = await request.json()
    
    if (!productId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const updatedProducts = serverProductSettingsService.updateProduct(productId, updates)
    
    console.log(`✅ Produit ${productId} mis à jour:`, updates)
    
    return NextResponse.json({ 
      success: true, 
      products: updatedProducts,
      message: 'Produit mis à jour avec succès' 
    })
  } catch (error) {
    console.error('Erreur mise à jour produit:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur mise à jour produit' },
      { status: 500 }
    )
  }
}

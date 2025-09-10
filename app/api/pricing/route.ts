/**
 * API de tarification intelligente
 * Calcule les prix avec réductions automatiques
 */

import { NextRequest, NextResponse } from 'next/server'
import { SmartPricingService, PricingData } from '@/lib/smartPricingService'
import { serverShippingSettingsService } from '@/lib/serverShippingSettings'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec privilèges service
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Interface pour la requête de calcul de prix
 */
interface PricingRequest {
  email: string
  petName: string
  animalType: string
  numberOfSheets: number
  upsellIds?: string[]
  photoUrl?: string
}

/**
 * Calculer le prix intelligent avec réductions
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💰 Calcul tarification intelligente...')
    
    const body: PricingRequest = await request.json()
    
    // Validation des données
    if (!body.email || !body.petName || !body.animalType || !body.numberOfSheets) {
      return NextResponse.json(
        { error: 'Données manquantes pour le calcul de prix' },
        { status: 400 }
      )
    }
    
    console.log('📝 Données reçues:', {
      email: body.email,
      petName: body.petName,
      animalType: body.animalType,
      numberOfSheets: body.numberOfSheets,
      upsellIds: body.upsellIds || [],
      hasPhoto: !!body.photoUrl
    })
    
    // Calculer les frais de livraison
    const shippingInfo = serverShippingSettingsService.calculateShipping(body.upsellIds || [])
    
    // Générer hash photo si fournie
    const photoHash = body.photoUrl ? SmartPricingService.generatePhotoHash(body.photoUrl) : undefined
    
    // Préparer données pour calcul
    const pricingData: PricingData = {
      email: body.email,
      petName: body.petName,
      animalType: body.animalType,
      numberOfSheets: body.numberOfSheets,
      upsellIds: body.upsellIds || [],
      shippingCost: shippingInfo.cost,
      photoHash
    }
    
    // Calculer prix intelligent
    const pricingResult = await SmartPricingService.calculateSmartPrice(pricingData)
    
    console.log('💰 Résultat tarification:', {
      originalPrice: pricingResult.originalPrice,
      finalPrice: pricingResult.finalPrice,
      discount: pricingResult.discount,
      savingsAmount: pricingResult.savingsAmount
    })
    
    // Réponse enrichie
    return NextResponse.json({
      success: true,
      pricing: pricingResult,
      shipping: shippingInfo,
      message: pricingResult.discount.type !== 'none' 
        ? `Réduction ${pricingResult.discount.percentage}% appliquée !`
        : 'Prix standard appliqué',
      debug: {
        photoHash,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur calcul tarification:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du calcul de prix',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

/**
 * Obtenir l'historique des réductions d'un utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const action = searchParams.get('action')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }
    
    if (action === 'history') {
      // Récupérer historique des réductions
      let user = null
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        if (usersData?.users) {
          user = usersData.users.find(u => u.email === email)
        }
      } catch (userError) {
        console.log('⚠️ Erreur récupération utilisateur pour historique:', userError)
      }
      
      if (!user) {
        return NextResponse.json({
          success: true,
          history: [],
          totalSavings: 0,
          message: 'Aucun historique trouvé'
        })
      }
      
      const history = await SmartPricingService.getUserDiscountHistory(user.id)
      const totalSavings = await SmartPricingService.getUserTotalSavings(user.id)
      
      return NextResponse.json({
        success: true,
        history,
        totalSavings,
        message: `${history.length} réductions trouvées`
      })
    }
    
    if (action === 'eligibility') {
      // Vérifier éligibilité aux réductions
      let user = null
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        if (usersData?.users) {
          user = usersData.users.find(u => u.email === email)
        }
      } catch (userError) {
        console.log('⚠️ Erreur récupération utilisateur pour éligibilité:', userError)
      }
      
      if (!user) {
        return NextResponse.json({
          success: true,
          isEligible: false,
          eligibility: {
            repeatDoudou: false,
            upsellDiscount: false,
            loyaltyProgram: false
          },
          message: 'Nouveau client - aucune réduction disponible'
        })
      }
      
      // Récupérer profil et doudous
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('total_orders, total_spent')
        .eq('id', user.id)
        .single()
      
      const { data: doudous } = await supabaseAdmin
        .from('user_doudous')
        .select('pet_name, animal_type, total_orders')
        .eq('user_id', user.id)
      
      return NextResponse.json({
        success: true,
        isEligible: (profile?.total_orders || 0) > 0,
        eligibility: {
          repeatDoudou: (doudous?.length || 0) > 0,
          upsellDiscount: (profile?.total_orders || 0) >= 1 || (profile?.total_spent || 0) >= 20,
          loyaltyProgram: (profile?.total_orders || 0) >= 3
        },
        stats: {
          totalOrders: profile?.total_orders || 0,
          totalSpent: profile?.total_spent || 0,
          totalDoudous: doudous?.length || 0
        },
        doudous: doudous || [],
        message: 'Éligibilité calculée avec succès'
      })
    }
    
    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('❌ Erreur API tarification GET:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des données',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

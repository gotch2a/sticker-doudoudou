import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API pour la gestion des paramètres de livraison
 * GET - Récupérer les paramètres de livraison
 * PUT - Mettre à jour les paramètres de livraison
 */

// GET - Récupérer les paramètres de livraison
export async function GET() {
  try {
    console.log('🚚 API - Récupération des paramètres de livraison...')
    
    // Récupérer les paramètres depuis Supabase ou utiliser des valeurs par défaut
    const { data: settings, error } = await supabase
      .from('shipping_settings')
      .select('*')
      .single()
    
    let shippingSettings
    
    if (error && error.code === 'PGRST116') {
      // Aucun paramètre trouvé, créer des paramètres par défaut
      console.log('📦 Création des paramètres de livraison par défaut...')
      
      const defaultSettings = {
        france_price: 4.90,
        europe_price: 8.90,
        world_price: 12.90,
        free_shipping_threshold: 50.00,
        estimated_delivery_france: "2-3 jours ouvrés",
        estimated_delivery_europe: "5-7 jours ouvrés",
        estimated_delivery_world: "10-15 jours ouvrés",
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data: newSettings, error: createError } = await supabase
        .from('shipping_settings')
        .insert(defaultSettings)
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Erreur création paramètres par défaut:', createError)
        // Retourner les paramètres par défaut même si l'insertion échoue
        shippingSettings = defaultSettings
      } else {
        shippingSettings = newSettings
      }
    } else if (error) {
      console.error('❌ Erreur récupération paramètres livraison:', error)
      throw error
    } else {
      shippingSettings = settings
    }
    
    console.log('✅ Paramètres de livraison récupérés côté serveur')
    
    return NextResponse.json({
      success: true,
      settings: shippingSettings,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erreur API shipping settings:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      settings: null
    }, { status: 500 })
  }
}

// PUT - Mettre à jour les paramètres de livraison
export async function PUT(request: Request) {
  try {
    console.log('✏️ API - Mise à jour des paramètres de livraison...')
    
    const body = await request.json()
    const { 
      france_price, 
      europe_price, 
      world_price, 
      letter_price,
      free_shipping_threshold,
      estimated_delivery_france,
      estimated_delivery_europe,
      estimated_delivery_world,
      active 
    } = body
    
    // Validation des données
    if (france_price !== undefined && france_price < 0) {
      return NextResponse.json({
        success: false,
        error: 'Le prix pour la France ne peut pas être négatif'
      }, { status: 400 })
    }
    
    if (europe_price !== undefined && europe_price < 0) {
      return NextResponse.json({
        success: false,
        error: 'Le prix pour l\'Europe ne peut pas être négatif'
      }, { status: 400 })
    }
    
    if (world_price !== undefined && world_price < 0) {
      return NextResponse.json({
        success: false,
        error: 'Le prix pour le monde ne peut pas être négatif'
      }, { status: 400 })
    }
    
    if (letter_price !== undefined && letter_price < 0) {
      return NextResponse.json({
        success: false,
        error: 'Le prix lettre ne peut pas être négatif'
      }, { status: 400 })
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (france_price !== undefined) updateData.france_price = france_price
    if (europe_price !== undefined) updateData.europe_price = europe_price
    if (world_price !== undefined) updateData.world_price = world_price
    if (letter_price !== undefined) updateData.letter_price = letter_price
    if (free_shipping_threshold !== undefined) updateData.free_shipping_threshold = free_shipping_threshold
    if (estimated_delivery_france !== undefined) updateData.estimated_delivery_france = estimated_delivery_france
    if (estimated_delivery_europe !== undefined) updateData.estimated_delivery_europe = estimated_delivery_europe
    if (estimated_delivery_world !== undefined) updateData.estimated_delivery_world = estimated_delivery_world
    if (active !== undefined) updateData.active = active
    
    // D'abord, récupérer l'ID du premier enregistrement
    const { data: currentSettings, error: selectError } = await supabase
      .from('shipping_settings')
      .select('id')
      .limit(1)
      .single()
    
    let finalSettings
    let finalError
    
    if (currentSettings && !selectError) {
      // Mettre à jour l'enregistrement existant
      const { data: updatedSettings, error } = await supabase
        .from('shipping_settings')
        .update(updateData)
        .eq('id', currentSettings.id)
        .select()
        .single()
      
      finalSettings = updatedSettings
      finalError = error
    } else {
      // Créer un nouvel enregistrement si aucun n'existe
      const { data: newSettings, error } = await supabase
        .from('shipping_settings')
        .insert({
          ...updateData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      finalSettings = newSettings
      finalError = error
    }
    
    if (finalError) {
      console.error('❌ Erreur mise à jour paramètres livraison:', finalError)
      throw finalError
    }
    
    console.log('✅ Paramètres de livraison mis à jour avec succès')
    
    return NextResponse.json({
      success: true,
      settings: finalSettings,
      message: 'Paramètres de livraison mis à jour avec succès'
    })
  } catch (error) {
    console.error('❌ Erreur mise à jour paramètres livraison:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { serverShippingSettingsService, ShippingSettings } from '@/lib/serverShippingSettings'

// GET - Récupérer les paramètres de livraison
export async function GET() {
  try {
    const settings = serverShippingSettingsService.getSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Erreur récupération paramètres livraison:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur récupération paramètres' },
      { status: 500 }
    )
  }
}

// POST - Sauvegarder les paramètres de livraison
export async function POST(request: NextRequest) {
  try {
    const { settings }: { settings: ShippingSettings } = await request.json()
    
    if (!settings || !settings.tarif1 || !settings.tarif2) {
      return NextResponse.json(
        { success: false, error: 'Format de données invalide' },
        { status: 400 }
      )
    }

    serverShippingSettingsService.saveSettings(settings)
    
    console.log('✅ Paramètres livraison synchronisés depuis le dashboard')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Paramètres livraison sauvegardés avec succès',
      settings
    })
  } catch (error) {
    console.error('Erreur sauvegarde paramètres livraison:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur sauvegarde paramètres' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un tarif spécifique
export async function PUT(request: NextRequest) {
  try {
    const { tarif, updates }: { 
      tarif: 'tarif1' | 'tarif2', 
      updates: Partial<ShippingSettings['tarif1']> 
    } = await request.json()
    
    if (!tarif || !updates) {
      return NextResponse.json(
        { success: false, error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const updatedSettings = serverShippingSettingsService.updateTarif(tarif, updates)
    
    console.log(`✅ Tarif ${tarif} mis à jour:`, updates)
    
    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings,
      message: 'Tarif mis à jour avec succès' 
    })
  } catch (error) {
    console.error('Erreur mise à jour tarif:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur mise à jour tarif' },
      { status: 500 }
    )
  }
}

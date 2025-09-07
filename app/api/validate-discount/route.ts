import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Valider un code de remise
export async function POST(request: NextRequest) {
  try {
    const { code, totalAmount } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code de remise requis' },
        { status: 400 }
      )
    }

    // Rechercher le code de remise
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single()

    if (error || !discountCode) {
      console.log('❌ Code de remise non trouvé:', code)
      return NextResponse.json(
        { success: false, error: 'Code de remise invalide' },
        { status: 404 }
      )
    }

    // Vérifier la date de validité
    const now = new Date()
    const validFrom = new Date(discountCode.valid_from)
    const validUntil = discountCode.valid_until ? new Date(discountCode.valid_until) : null

    if (now < validFrom) {
      return NextResponse.json(
        { success: false, error: 'Ce code de remise n\'est pas encore valide' },
        { status: 400 }
      )
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json(
        { success: false, error: 'Ce code de remise a expiré' },
        { status: 400 }
      )
    }

    // Vérifier la limite d'utilisation
    if (discountCode.usage_limit && discountCode.used_count >= discountCode.usage_limit) {
      return NextResponse.json(
        { success: false, error: 'Ce code de remise a atteint sa limite d\'utilisation' },
        { status: 400 }
      )
    }

    // Vérifier le montant minimum
    if (totalAmount < discountCode.minimum_amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Montant minimum requis: ${discountCode.minimum_amount.toFixed(2)}€` 
        },
        { status: 400 }
      )
    }

    // Calculer la remise
    let discountAmount = 0
    if (discountCode.discount_type === 'percentage') {
      discountAmount = (totalAmount * discountCode.discount_value) / 100
    } else if (discountCode.discount_type === 'fixed') {
      discountAmount = discountCode.discount_value
    }

    // S'assurer que la remise ne dépasse pas le montant total
    discountAmount = Math.min(discountAmount, totalAmount)

    console.log(`✅ Code de remise validé: ${code} - Remise: ${discountAmount.toFixed(2)}€`)

    return NextResponse.json({
      success: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        description: discountCode.description,
        discount_type: discountCode.discount_type,
        discount_value: discountCode.discount_value,
        discountAmount: discountAmount
      }
    })
  } catch (error) {
    console.error('❌ Erreur validation code de remise:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Marquer un code comme utilisé (appelé après paiement réussi)
export async function PUT(request: NextRequest) {
  try {
    const { codeId } = await request.json()
    
    if (!codeId) {
      return NextResponse.json(
        { success: false, error: 'ID du code requis' },
        { status: 400 }
      )
    }

    // Incrémenter le compteur d'utilisation
    // Note: Supabase client ne supporte pas sql() directement, utilisons RPC à la place
    const { data, error } = await supabase
      .rpc('increment_discount_usage', { discount_id: codeId })

    if (error) {
      console.error('❌ Erreur incrémentation compteur code:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur mise à jour compteur' },
        { status: 500 }
      )
    }

    console.log(`✅ Code de remise utilisé: ${data.code} (${data.used_count} utilisations)`)

    return NextResponse.json({
      success: true,
      message: 'Utilisation du code enregistrée'
    })
  } catch (error) {
    console.error('❌ Erreur incrémentation compteur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}


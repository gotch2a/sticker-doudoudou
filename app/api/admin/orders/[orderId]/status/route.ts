import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { status } = await request.json()
    const { orderId } = params

    console.log(`🔄 API - Mise à jour statut commande ${orderId} vers: ${status}`)

    // Vérifier que le statut est valide
    const validStatuses = ['nouveau', 'en_cours', 'termine', 'expedie', 'livre']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // MISE À JOUR via fonction Supabase admin (contourne RLS)
    console.log('🔧 Mise à jour via fonction admin Supabase...')
    
    try {
      // Utiliser la fonction SQL admin qui contourne RLS
      const { data, error } = await OrderService.updateOrderStatusAdmin(orderId, status)
      
      if (error) {
        console.error('❌ Erreur fonction admin:', error)
        throw error
      }
      
      console.log('✅ Statut mis à jour avec succès via fonction admin:', data)

      return NextResponse.json({
        success: true,
        data: data,
        note: 'Mise à jour via fonction admin Supabase'
      })

    } catch (dbError) {
      console.error('❌ Erreur mise à jour BDD:', dbError)
      
      // Fallback: essayer la méthode classique
      console.log('🔄 Tentative fallback avec méthode classique...')
      try {
        const updatedOrder = await OrderService.updateOrderStatus(orderId, status)
        console.log('✅ Fallback réussi:', updatedOrder)
        
        return NextResponse.json({
          success: true,
          data: updatedOrder,
          note: 'Mise à jour via fallback'
        })
      } catch (fallbackError) {
        console.error('❌ Fallback échoué aussi:', fallbackError)
        
        return NextResponse.json(
          { error: 'Impossible de mettre à jour le statut - permissions insuffisantes' },
          { status: 403 }
        )
      }
    }

  } catch (error) {
    console.error('❌ Erreur API générale:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params
    
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Numéro de commande requis' },
        { status: 400 }
      )
    }

    console.log('🔍 Recherche commande:', orderNumber)

    // Récupérer toutes les commandes et trouver celle qui correspond
    const orders = await OrderService.getAllOrders()
    const order = orders.find(o => o.order_number === orderNumber)

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    console.log('✅ Commande trouvée:', {
      orderNumber: order.order_number,
      total: order.total_amount,
      status: order.payment_status
    })

    // Extraire les détails des upsells depuis les notes admin
    let upsells: string[] = []
    if (order.admin_notes) {
      const upsellMatches = order.admin_notes.match(/🎁 PRODUITS BONUS:([\s\S]*?)💰 TOTAL:/);
      if (upsellMatches) {
        const upsellText = upsellMatches[1]
        if (upsellText.includes('Photo Doudou Premium')) upsells.push('photo-premium')
        if (upsellText.includes('Livre d\'Histoire')) upsells.push('livre-histoire')
        if (upsellText.includes('Planche Bonus')) upsells.push('planche-bonus')
      }
    }

    const orderDetails = {
      orderNumber: order.order_number,
      petName: order.pet_name,
      animalType: order.animal_type,
      childName: order.child_name,
      email: order.client_email,
      numberOfSheets: order.number_of_sheets,
      totalAmount: order.total_amount,
      paymentStatus: order.payment_status,
      photoUrl: order.photo_url,
      createdAt: order.created_at,
      upsells: upsells
    }

    return NextResponse.json(orderDetails)

  } catch (error) {
    console.error('❌ Erreur récupération commande:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/supabase'

// Configuration PayPal
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com'

const getPayPalAccessToken = async () => {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  
  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    const { paypalOrderId, orderNumber } = await request.json()
    
    console.log('💳 Capture du paiement PayPal:', paypalOrderId)
    
    const accessToken = await getPayPalAccessToken()
    
    // Capturer le paiement PayPal
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      }
    })
    
    const capture = await captureResponse.json()
    
    console.log('✅ Paiement PayPal capturé:', capture.id)
    
    // Récupérer la commande par numéro
    const orders = await OrderService.getAllOrders()
    const order = orders.find(o => o.order_number === orderNumber)
    
    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }
    
    // Mettre à jour le statut de paiement
    await OrderService.updatePaymentStatus(order.id, 'paid', paypalOrderId)
    
    console.log('✅ Statut de commande mis à jour:', orderNumber)
    
    return NextResponse.json({
      success: true,
      captureId: capture.id,
      orderNumber: orderNumber,
      message: 'Paiement confirmé avec succès'
    })
    
  } catch (error) {
    console.error('❌ Erreur capture PayPal:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la capture du paiement' },
      { status: 500 }
    )
  }
}

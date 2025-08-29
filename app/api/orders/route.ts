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

console.log('🔧 API Orders initialisée avec Supabase')
console.log('🗄️ Configuration Supabase:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  mode: 'SUPABASE'
})

interface OrderData {
  photo: string
  petName: string
  animalType: string
  childName: string
  address?: string
  city?: string
  postalCode?: string
  numberOfSheets: number
  notes?: string
  email: string
  upsells?: string[]
  totalAmount?: number
}

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Création nouvelle commande avec Supabase...')
    
    const orderData: OrderData = await request.json()
    
    console.log('📝 Données reçues:', {
      petName: orderData.petName,
      animalType: orderData.animalType,
      childName: orderData.childName,
      email: orderData.email,
      numberOfSheets: orderData.numberOfSheets,
      upsells: orderData.upsells,
      totalAmount: orderData.totalAmount
    })
    
    // Validation des données
    if (!orderData.petName || !orderData.childName || !orderData.email) {
      console.log('❌ Données manquantes')
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Calcul du prix avec upsells
    const basePrice = orderData.numberOfSheets * 12.90
    let upsellTotal = 0
    let upsellDetails = ''
    
    if (orderData.upsells && orderData.upsells.length > 0) {
      const upsellPrices: Record<string, number> = {
        'photo-premium': 29.90,
        'livre-histoire': 24.90,
        'planche-bonus': 4.90
      }
      
      const upsellNames: Record<string, string> = {
        'photo-premium': 'Photo Doudou Premium',
        'livre-histoire': 'Livre d\'Histoire Personnalisé',
        'planche-bonus': '1 Planche Bonus'
      }
      
      orderData.upsells.forEach(upsellId => {
        if (upsellPrices[upsellId]) {
          upsellTotal += upsellPrices[upsellId]
          upsellDetails += `\n+ ${upsellNames[upsellId]}: ${upsellPrices[upsellId].toFixed(2)}€`
        }
      })
    }
    
    const totalAmount = orderData.totalAmount || (basePrice + upsellTotal)
    
    console.log('💰 Calcul des prix:', {
      basePrice: basePrice.toFixed(2),
      upsellTotal: upsellTotal.toFixed(2),
      totalReceived: orderData.totalAmount,
      finalTotal: totalAmount.toFixed(2)
    })

    // Créer la commande dans Supabase avec le prix total
    const newOrder = await OrderService.createOrder({
      photo_url: orderData.photo,
      pet_name: orderData.petName,
      animal_type: orderData.animalType,
      child_name: orderData.childName,
      client_email: orderData.email,
      address: orderData.address || '',
      city: orderData.city || '',
      postal_code: orderData.postalCode || '',
      number_of_sheets: orderData.numberOfSheets,
      notes: orderData.notes || '',
      total_amount: totalAmount
    })

    console.log('✅ Commande créée en base:', newOrder.order_number, 'Total:', newOrder.total_amount, '€')

    // Ajouter une note automatique pour l'artiste
    const briefNote = `🎨 NOUVEAU BRIEF ARTISTE
==========================================
📋 Doudou: ${orderData.petName} (${orderData.animalType})
👶 Pour: ${orderData.childName}
📧 Contact: ${orderData.email}
📦 Planches: ${orderData.numberOfSheets} (${basePrice.toFixed(2)}€)
${upsellDetails ? '🎁 PRODUITS BONUS:' + upsellDetails : ''}
💰 TOTAL: ${totalAmount.toFixed(2)}€
📍 Adresse: ${orderData.address || 'Non renseignée'}, ${orderData.city || ''} ${orderData.postalCode || ''}
📝 Notes: ${orderData.notes || 'Aucune note'}
🔗 Photo: ${orderData.photo}

⏰ Date limite indicative: ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('fr-FR')}`

    await OrderService.addAdminNote(newOrder.id, briefNote, 'system')

    console.log('📝 Brief artiste ajouté en note admin')

    // Créer un ordre PayPal pour le paiement (ou mode démo)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    // Vérifier si PayPal est configuré
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.log('🚨 PayPal non configuré')
      return NextResponse.json({
        success: false,
        error: 'PayPal non configuré. Veuillez configurer PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET.'
      }, { status: 500 })
    }

    console.log('✅ PayPal configuré, utilisation du vrai flux')

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const accessToken = await getPayPalAccessToken()
      
      const paypalOrderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: newOrder.order_number,
            amount: {
              currency_code: 'EUR',
              value: newOrder.total_amount.toFixed(2)
            },
            description: `Stickers DOUDOU - ${orderData.petName} pour ${orderData.childName}${orderData.upsells && orderData.upsells.length > 0 ? ` + ${orderData.upsells.length} bonus` : ''}`
          }
        ],
        application_context: {
          return_url: `${baseUrl}/confirmation?order_id=${newOrder.order_number}`,
          cancel_url: `${baseUrl}/commande?cancelled=true`,
          brand_name: 'Sticker DOUDOU',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW'
        }
      }

      const paypalResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(paypalOrderData)
      })

      const paypalOrder = await paypalResponse.json()

      if (!paypalOrder.id) {
        throw new Error(`Erreur PayPal: ${JSON.stringify(paypalOrder)}`)
      }

      console.log('💳 Ordre PayPal créé:', paypalOrder.id)
      
      // Mettre à jour la commande avec l'ordre PayPal
      await OrderService.updatePaymentStatus(newOrder.id, 'pending', paypalOrder.id)
      
      console.log('✅ Commande enregistrée avec succès dans Supabase')

      // Les emails seront envoyés après la capture PayPal réussie

      // Trouver l'URL d'approbation PayPal
      const approvalUrl = paypalOrder.links?.find((link: any) => link.rel === 'approve')?.href

      return NextResponse.json({
        success: true,
        paymentUrl: approvalUrl,
        paypalOrderId: paypalOrder.id,
        orderNumber: newOrder.order_number,
        orderId: newOrder.id,
        totalAmount: newOrder.total_amount,
        message: 'Commande créée, redirection vers PayPal'
      })
    } catch (paypalError) {
      console.error('❌ Erreur PayPal:', paypalError)
      
      // Fallback mode démo si PayPal échoue
      await OrderService.updatePaymentStatus(newOrder.id, 'pending', `fallback_${Date.now()}`)
      
      // En mode fallback, les emails seront envoyés depuis la page de confirmation
      
      return NextResponse.json({
        success: true,
        paymentUrl: `${baseUrl}/confirmation?order_id=${newOrder.order_number}&demo=true`,
        paypalOrderId: `fallback_${Date.now()}`,
        orderNumber: newOrder.order_number,
        orderId: newOrder.id,
        totalAmount: newOrder.total_amount,
        message: 'Commande créée en mode démo (PayPal indisponible)'
      })
    }

  } catch (error) {
    console.error('❌ Erreur création commande:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Récupérer toutes les commandes pour l'admin
    const orders = await OrderService.getAllOrders()
    
    return NextResponse.json({
      message: 'API Orders - Mode Supabase',
      totalOrders: orders.length,
      endpoints: {
        POST: 'Créer une nouvelle commande',
        GET: 'Récupérer toutes les commandes'
      },
      orders: orders.slice(0, 5) // Afficher les 5 dernières seulement pour la démo
    })
  } catch (error) {
    console.error('❌ Erreur récupération commandes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    )
  }
}
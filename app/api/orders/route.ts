import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/supabase'
import { serverProductSettingsService } from '@/lib/serverProductSettings'
import { serverShippingSettingsService } from '@/lib/serverShippingSettings'
import { AuthService, AuthUtils } from '@/lib/authService'
// import { sendOrderConfirmationEmails } from '@/lib/email' // ✅ Emails envoyés depuis /api/paypal/capture

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
  childAge?: string
  parentFirstName?: string
  parentLastName?: string
  address?: string
  city?: string
  postalCode?: string
  numberOfSheets: number
  notes?: string
  email: string
  upsells?: string[]
  totalAmount?: number
  subtotal?: number
  discountCode?: string | null
  discountAmount?: number
}

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Création nouvelle commande avec Supabase...')
    
    const orderData: OrderData = await request.json()
    
    console.log('📝 Données reçues:', {
      petName: orderData.petName,
      animalType: orderData.animalType,
      childName: orderData.childName,
      parentFirstName: orderData.parentFirstName,
      parentLastName: orderData.parentLastName,
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

    // Récupérer les articles depuis Supabase
    const allArticles = await OrderService.getAllArticles()
    const articlesToAdd: Array<{id: string, quantity: number, price: number}> = []
    
    // Article de base (planche)
    const baseArticle = allArticles.find(a => a.category === 'base')
    if (!baseArticle) {
      throw new Error('Article de base non trouvé dans la base de données')
    }
    
    const basePrice = orderData.numberOfSheets * baseArticle.sale_price
    articlesToAdd.push({
      id: baseArticle.id,
      quantity: orderData.numberOfSheets,
      price: baseArticle.sale_price
    })
    
    console.log(`💰 Prix planche de base: ${baseArticle.sale_price}€ (${orderData.numberOfSheets} × ${baseArticle.sale_price}€ = ${basePrice}€)`)
    
    let upsellTotal = 0
    let upsellDetails = ''
    
    // Traiter les upsells depuis Supabase
    if (orderData.upsells && orderData.upsells.length > 0) {
      orderData.upsells.forEach(upsellId => {
        const upsellArticle = allArticles.find(a => a.id === upsellId && a.active)
        
        if (upsellArticle) {
          upsellTotal += upsellArticle.sale_price
          upsellDetails += `\n+ ${upsellArticle.name}: ${upsellArticle.sale_price.toFixed(2)}€`
          articlesToAdd.push({
            id: upsellArticle.id,
            quantity: 1,
            price: upsellArticle.sale_price
          })
          console.log(`💰 Upsell ${upsellId}: ${upsellArticle.sale_price}€`)
        } else {
          console.warn(`⚠️ Produit upsell non trouvé ou inactif: ${upsellId}`)
        }
      })
    }
    
    // Calcul des frais de livraison avec paramètres dynamiques
    const shippingInfo = serverShippingSettingsService.calculateShipping(orderData.upsells || [])
    const shippingCost = shippingInfo.cost
    console.log(`🚚 Frais de livraison: ${shippingCost}€ (${shippingInfo.reason})`)
    
    const totalAmount = orderData.totalAmount || (basePrice + upsellTotal + shippingCost)
    
    console.log('💰 Calcul des prix:', {
      basePrice: basePrice.toFixed(2),
      upsellTotal: upsellTotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      totalReceived: orderData.totalAmount,
      finalTotal: totalAmount.toFixed(2)
    })

    // Créer la commande dans Supabase avec le prix total
    console.log('📍 Données complètes à enregistrer:', {
      address: orderData.address,
      city: orderData.city,
      postalCode: orderData.postalCode,
      childAge: orderData.childAge,
      notes: orderData.notes,
      photo: orderData.photo
    })

    const newOrder = await OrderService.createOrder({
      photo_url: orderData.photo,
      pet_name: orderData.petName,
      animal_type: orderData.animalType,
      child_name: orderData.childName,
      child_age: orderData.childAge || '',
      client_email: orderData.email,
      address: orderData.address || '',
      city: orderData.city || '',
      postal_code: orderData.postalCode || '',
      number_of_sheets: orderData.numberOfSheets,
      notes: orderData.notes || '',
      total_amount: totalAmount,
      discount_code: orderData.discountCode || null,
      discount_amount: orderData.discountAmount || 0
    })

    console.log('✅ Commande créée en base:', newOrder.order_number, 'Total:', newOrder.total_amount, '€')

    // ============================================================================
    // 🔐 CRÉATION AUTOMATIQUE DU COMPTE UTILISATEUR
    // ============================================================================
    
    console.log('🔐 Début processus création compte automatique...')
    
    // Utiliser les vrais données parent ou fallback sur nom enfant
    let firstName = orderData.parentFirstName?.trim() || ''
    let lastName = orderData.parentLastName?.trim() || ''
    
    // Fallback : si pas de nom parent, extraire depuis email ou nom enfant
    if (!firstName && !lastName) {
      if (orderData.email) {
        firstName = orderData.email.split('@')[0] // Prénom depuis email
      } else {
        // Dernier recours : utiliser nom enfant
        const parsed = AuthUtils.parseFullName(orderData.childName)
        firstName = parsed.firstName
        lastName = parsed.lastName
      }
    }
    
    // Préparer les données utilisateur
    const userData = {
      email: orderData.email,
      firstName: firstName,
      lastName: lastName,
      phone: '', // Sera ajouté dans une version future
      address: orderData.address,
      city: orderData.city,
      postalCode: orderData.postalCode,
      orderNumber: newOrder.order_number
    }
    
    // Créer le compte automatiquement
    const authResult = await AuthService.createUserFromOrder(userData)
    
    if (authResult.success && authResult.userId) {
      console.log('✅ Compte utilisateur créé/trouvé:', authResult.userId)
      
      // Lier la commande à l'utilisateur
      const linkSuccess = await AuthService.linkOrderToUser(newOrder.order_number, authResult.userId)
      
      if (linkSuccess) {
        console.log('✅ Commande liée au compte utilisateur')
        
        // Enregistrer le doudou pour cet utilisateur
        const doudouSuccess = await AuthService.registerUserDoudou(
          authResult.userId,
          newOrder.order_number,
          orderData.petName,
          orderData.animalType,
          orderData.photo
        )
        
        if (doudouSuccess) {
          console.log('✅ Doudou enregistré pour l\'utilisateur')
        }
        
        // Mettre à jour les statistiques utilisateur
        await AuthService.updateUserStats(
          authResult.userId, 
          totalAmount, 
          orderData.discountAmount || 0
        )
        
        console.log('✅ Statistiques utilisateur mises à jour')
        
      } else {
        console.warn('⚠️ Impossible de lier la commande au compte utilisateur')
      }
      
    } else {
      console.warn('⚠️ Création compte automatique échouée:', authResult.error)
      // La commande continue même si la création de compte échoue
    }

    // Ajouter les articles à la commande dans order_articles
    console.log('📦 Ajout des articles à la commande...')
    for (const article of articlesToAdd) {
      await OrderService.addOrderArticle(
        newOrder.id,
        article.id,
        article.quantity,
        article.price
      )
      console.log(`✅ Article ajouté: ${article.id} x${article.quantity} à ${article.price}€`)
    }

    // Ajouter une note automatique pour l'artiste
    const briefNote = `🎨 NOUVEAU BRIEF ARTISTE
==========================================
📋 Doudou: ${orderData.petName} (${orderData.animalType})
👶 Pour: ${orderData.childName} (${orderData.childAge || 'âge non spécifié'})
📧 Contact: ${orderData.email}
📦 Planches: ${orderData.numberOfSheets} (${basePrice.toFixed(2)}€)
${upsellDetails ? '🎁 PRODUITS BONUS:' + upsellDetails : ''}
${orderData.discountCode ? `🏷️ CODE PROMO: ${orderData.discountCode} (-${orderData.discountAmount?.toFixed(2)}€)` : ''}
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
      console.log('🚨 PayPal non configuré - Mode démo activé')
      
      // Mode démo : pas de paiement PayPal
      await OrderService.updatePaymentStatus(newOrder.id, 'pending', `demo_${Date.now()}`)
      
      // En mode démo, on peut envoyer les emails directement (optionnel)
      // Les emails seront envoyés depuis la page de confirmation
      
      return NextResponse.json({
        success: true,
        orderNumber: newOrder.order_number,
        orderId: newOrder.id,
        totalAmount: newOrder.total_amount,
        message: 'Commande créée en mode démo (PayPal non configuré)'
      })
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
            description: `Stickers DOUDOU - ${orderData.petName} pour ${orderData.childName}${(orderData.upsells || []).length > 0 ? ` + ${(orderData.upsells || []).length} bonus` : ''}`
          }
        ],
        application_context: {
          return_url: `${baseUrl}/confirmation?order_id=${newOrder.order_number}`,
          cancel_url: `${baseUrl}/commande?cancelled=true`,
          brand_name: 'Doudoudou',
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

      // ✅ Les emails de confirmation seront envoyés après la validation du paiement PayPal
      // Voir /api/paypal/capture/route.ts pour l'envoi des emails
      console.log('📧 Emails de confirmation programmés après validation PayPal')

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
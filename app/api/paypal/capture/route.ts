import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/supabase'
import { sendOrderConfirmationEmails } from '@/lib/email'
import { EmailService } from '@/lib/emailService'
import { AuthService } from '@/lib/authService'

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
    
    // Si la commande est déjà payée, ne pas renvoyer d'emails
    if (order.payment_status === 'paid') {
      console.log('⚠️ Commande déjà payée, pas de nouvel email:', orderNumber)
      return NextResponse.json({
        success: true,
        captureId: capture.id,
        orderNumber: orderNumber,
        message: 'Paiement déjà confirmé'
      })
    }
    
    // Mettre à jour le statut de paiement
    await OrderService.updatePaymentStatus(order.id, 'paid', paypalOrderId)
    
    console.log('✅ Statut de commande mis à jour:', orderNumber)
    
    // ============================================================================
    // 📧 ENVOI DES EMAILS APRÈS PAIEMENT VALIDÉ
    // ============================================================================
    
    console.log('📧 Envoi des emails de confirmation après paiement...')
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://votre-domaine.com' 
        : 'http://localhost:3000'
      
      // 1. Email de confirmation standard (client + artiste)
      const emailResults = await sendOrderConfirmationEmails({
        orderNumber: order.order_number,
        petName: order.pet_name,
        animalType: order.animal_type,
        childName: order.child_name,
        email: order.client_email,
        numberOfSheets: order.number_of_sheets,
        totalAmount: order.total_amount,
        photoUrl: order.photo_url ? `${baseUrl}${order.photo_url}` : undefined,
        notes: order.notes || undefined,
        orderId: order.id,
        discountCode: order.discount_code || null,
        discountAmount: order.discount_amount || 0
      })
      
      console.log('📧 Emails confirmation envoyés:', emailResults)
      
      // 2. Email de bienvenue avec identifiants (si nouveau compte créé)
      console.log('🔐 Vérification du statut du compte utilisateur...')
      
      const user = await AuthService.getUserByEmail(order.client_email)
      
      if (user) {
        // Récupérer les informations du profil utilisateur
        const { createClient } = await import('@supabase/supabase-js')
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
        
        if (supabaseAdmin) {
          const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          // Vérifier si le compte a été créé récemment (dans les 30 minutes)
          const accountCreatedRecently = profile?.account_created_at && 
            (new Date().getTime() - new Date(profile.account_created_at).getTime()) < 30 * 60 * 1000
          
          // Vérifier si c'est le premier order du compte (compte créé depuis cette commande)
          const isFirstOrder = profile?.account_created_from_order === order.order_number
          
          if (accountCreatedRecently && isFirstOrder) {
            console.log('🎉 Nouveau compte détecté, envoi email de bienvenue...')
            
            // Générer un nouveau mot de passe temporaire (l'ancien n'est plus accessible)
            const temporaryPassword = Math.random().toString(36).slice(-12) + '!'
            
            // Mettre à jour le mot de passe dans Supabase Auth
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              password: temporaryPassword
            })
            
            // Envoyer l'email de bienvenue
            const welcomeResult = await EmailService.sendWelcomeEmail({
              email: order.client_email,
              firstName: profile.first_name,
              lastName: profile.last_name,
              temporaryPassword: temporaryPassword,
              orderNumber: order.order_number,
              loginUrl: `${baseUrl}
              /auth/login`
            })
            
            if (welcomeResult.success) {
              console.log('✅ Email de bienvenue envoyé avec succès')
            } else {
              console.error('❌ Erreur envoi email de bienvenue:', welcomeResult.error)
            }
          } else {
            console.log('👤 Compte existant, pas d\'email de bienvenue nécessaire')
          }
        }
      } else {
        console.warn('⚠️ Utilisateur non trouvé pour l\'email:', order.client_email)
      }
      
    } catch (emailError) {
      console.error('❌ Erreur envoi emails:', emailError)
      // Ne pas faire échouer la capture pour un problème d'email
    }
    
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

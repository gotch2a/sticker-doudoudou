'use server'

import { Resend } from 'resend'

// Initialisation de Resend
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'votre_cle_resend_optionnelle') {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

// Mode démo pour les emails
const isDemoMode = () => {
  const apiKey = process.env.RESEND_API_KEY
  return !apiKey || apiKey === 'votre_cle_resend_optionnelle'
}

// Email autorisé en mode test Resend
const getTestEmail = () => {
  return process.env.RESEND_TEST_EMAIL || 'go_tcha@hotmail.com'
}

// Types pour les données d'email
interface OrderData {
  orderNumber: string
  petName: string
  animalType: string
  childName: string
  email: string
  numberOfSheets: number
  totalAmount: number
  photoUrl?: string
  notes?: string
  orderId?: string // ID de la commande pour récupérer les articles
}

// Template d'email pour le client
export async function sendClientConfirmationEmail(orderData: OrderData) {
  try {
    // Récupérer les articles de la commande si orderId est fourni
    let orderArticles: any[] = []
    let upsellsHtml = ''
    
    if (orderData.orderId) {
      try {
        const { OrderService } = await import('./supabase')
        orderArticles = await OrderService.getOrderArticles(orderData.orderId)
        
        // Séparer les articles de base des upsells
        const baseArticles = orderArticles.filter(item => item.articles?.category === 'base')
        const upsellArticles = orderArticles.filter(item => item.articles?.category === 'upsell')
        
        if (upsellArticles.length > 0) {
          upsellsHtml = `
            <h3><span class="emoji">🎁</span> Produits bonus inclus</h3>
            <div class="upsells-list">
              ${upsellArticles.map(item => `
                <div class="upsell-item">
                  <span class="upsell-name">${item.articles.name}</span>
                  <span class="upsell-price">${item.total_price.toFixed(2)} €</span>
                </div>
              `).join('')}
            </div>
          `
        }
      } catch (error) {
        console.error('⚠️ Erreur récupération articles pour email:', error)
        // Continuer sans les détails des upsells
      }
    }

    // Mode démo si Resend n'est pas configuré
    if (isDemoMode()) {
      console.log('📧 MODE DÉMO - Email client simulé:')
      console.log(`  ✉️  Destinataire: ${orderData.email}`)
      console.log(`  📝 Sujet: ✅ Commande confirmée - ${orderData.orderNumber}`)
      console.log(`  💰 Montant: ${orderData.totalAmount.toFixed(2)} €`)
      if (orderArticles.length > 0) {
        console.log(`  🎁 Upsells: ${orderArticles.filter(item => item.articles?.category === 'upsell').map(item => item.articles.name).join(', ') || 'Aucun'}`)
      }
      if (orderData.notes) {
        console.log(`  💭 Notes: "${orderData.notes}"`)
      }
      console.log(`  🎯 Pour activer les vrais emails, configurez RESEND_API_KEY dans .env.local`)
      return { success: true, emailId: 'demo_client_' + Date.now() }
    }

    const resend = getResend()
    
    // En mode développement, utiliser l'email de test autorisé
    const recipientEmail = process.env.NODE_ENV === 'production' ? orderData.email : getTestEmail()
    console.log(`📧 Envoi email client à: ${recipientEmail} ${recipientEmail !== orderData.email ? `(original: ${orderData.email})` : ''}`)
    
    const { data, error } = await resend.emails.send({
      from: 'Doudoudou <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `✅ Commande confirmée - ${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Commande confirmée - Doudoudou</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
              }
              .header {
                background: linear-gradient(135deg, #ec4899, #f97316);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .order-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .highlight {
                color: #ec4899;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
              .emoji {
                font-size: 1.2em;
              }
              .upsells-list {
                margin: 15px 0;
              }
              .upsell-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #f0f9ff;
                border-left: 3px solid #ec4899;
                margin: 8px 0;
                border-radius: 4px;
              }
              .upsell-name {
                font-weight: 500;
                color: #1f2937;
              }
              .upsell-price {
                font-weight: bold;
                color: #ec4899;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1><span class="emoji">🎨</span> Doudoudou</h1>
              <p>Votre commande a été confirmée avec succès !</p>
            </div>
            
            <div class="content">
              ${recipientEmail !== orderData.email ? `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>🧪 MODE TEST :</strong> Cet email aurait dû être envoyé à <strong>${orderData.email}</strong>
                  </p>
                </div>
              ` : ''}
              
              <h2>Bonjour ! <span class="emoji">👋</span></h2>
              
              <p>Merci pour votre commande ! Nous avons bien reçu votre demande de transformation du doudou <strong class="highlight">${orderData.petName}</strong> en stickers personnalisés pour <strong class="highlight">${orderData.childName}</strong>.</p>
              
              <div class="order-details">
                <h3><span class="emoji">📋</span> Détails de votre commande</h3>
                <p><strong>N° de commande :</strong> <span class="highlight">${orderData.orderNumber}</span></p>
                <p><strong>Doudou :</strong> ${orderData.petName} (${orderData.animalType})</p>
                <p><strong>Pour :</strong> ${orderData.childName}</p>
                <p><strong>Nombre de planches :</strong> ${orderData.numberOfSheets}</p>
                <p><strong>Montant total :</strong> <span class="highlight">${orderData.totalAmount.toFixed(2)} €</span></p>
              </div>
              
              ${upsellsHtml}
              
              ${orderData.notes ? `
                <h3><span class="emoji">💭</span> Vos commentaires</h3>
                <div class="order-details">
                  <p style="font-style: italic; color: #6b7280;">"${orderData.notes}"</p>
                </div>
              ` : ''}
              
              <h3><span class="emoji">⏰</span> Prochaines étapes</h3>
              <ol>
                <li><strong>Création artistique</strong> - Notre artiste va transformer votre photo en magnifiques stickers (2-3 jours ouvrés)</li>
                <li><strong>Validation</strong> - Nous vous enverrons un aperçu pour validation</li>
                <li><strong>Production</strong> - Impression haute qualité sur papier premium</li>
                <li><strong>Expédition</strong> - Envoi sous 24-48h après production</li>
              </ol>
              
              <p><span class="emoji">📧</span> <strong>Vous recevrez un email de confirmation dès que notre artiste aura terminé la création de vos stickers !</strong></p>
              
              <p>Si vous avez des questions, n'hésitez pas à nous contacter à <a href="mailto:contact@doudoudoud.fr" style="color: #ec4899;">contact@doudoudoud.fr</a></p>
              
              <p>Merci de nous faire confiance ! <span class="emoji">❤️</span></p>
              
              <p>L'équipe Doudoudou</p>
            </div>
            
            <div class="footer">
              <p>© 2024 Doudoudou - Transformez les doudous en souvenirs magiques</p>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('❌ Erreur envoi email client:', error)
      throw error
    }

    console.log('✅ Email client envoyé:', data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('❌ Erreur service email client:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

// Template d'email pour l'artiste
export async function sendArtistNotificationEmail(orderData: OrderData) {
  try {
    // Email de l'artiste (en mode test, sera remplacé par l'email autorisé)
    const artistEmail = process.env.ARTIST_EMAIL || 'artiste@stickerdoudou.fr'
    
    // Mode démo si Resend n'est pas configuré
    if (isDemoMode()) {
      console.log('🎨 MODE DÉMO - Email artiste simulé:')
      console.log(`  ✉️  Destinataire: ${artistEmail}`)
      console.log(`  📝 Sujet: 🎨 Nouvelle commande à traiter - ${orderData.orderNumber}`)
      console.log(`  👤 Client: ${orderData.email}`)
      console.log(`  🐾 Doudou: ${orderData.petName} (${orderData.animalType})`)
      console.log(`  👶 Pour: ${orderData.childName}`)
      console.log(`  📊 ${orderData.numberOfSheets} planche(s) - ${orderData.totalAmount.toFixed(2)} €`)
      console.log(`  🎯 Pour activer les vrais emails, configurez RESEND_API_KEY dans .env.local`)
      return { success: true, emailId: 'demo_artist_' + Date.now() }
    }

    const resend = getResend()
    
    // En mode développement, utiliser l'email de test autorisé
    const recipientEmail = process.env.NODE_ENV === 'production' ? artistEmail : getTestEmail()
    console.log(`🎨 Envoi email artiste à: ${recipientEmail} ${recipientEmail !== artistEmail ? `(original: ${artistEmail})` : ''}`)
    
    const { data, error } = await resend.emails.send({
      from: 'Doudoudou <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `🎨 Nouvelle commande à traiter - ${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nouvelle commande - ${orderData.orderNumber}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
              }
              .header {
                background: linear-gradient(135deg, #8b5cf6, #06b6d4);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: white;
                padding: 30px;
                border-radius: 0 0 10px 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .order-card {
                background: #f8f9fa;
                border: 2px solid #e5e7eb;
                padding: 25px;
                border-radius: 12px;
                margin: 20px 0;
              }
              .urgent {
                background: #fef3cd;
                border-color: #f59e0b;
                border-left: 4px solid #f59e0b;
              }
              .highlight {
                color: #8b5cf6;
                font-weight: bold;
              }
              .admin-link {
                display: inline-block;
                background: #8b5cf6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 0;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
              .emoji {
                font-size: 1.2em;
              }
              .brief {
                background: #f0f9ff;
                border-left: 4px solid #06b6d4;
                padding: 15px;
                margin: 15px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1><span class="emoji">🎨</span> Nouvelle Commande Doudoudou</h1>
              <p>Une nouvelle commande vient d'être passée et attend votre talent !</p>
            </div>
            
            <div class="content">
              ${recipientEmail !== artistEmail ? `
                <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>🧪 MODE TEST :</strong> Cet email aurait dû être envoyé à <strong>${artistEmail}</strong>
                  </p>
                </div>
              ` : ''}
              
              <div class="order-card urgent">
                <h2><span class="emoji">🆕</span> Commande ${orderData.orderNumber}</h2>
                <p><strong>Montant :</strong> <span class="highlight">${orderData.totalAmount.toFixed(2)} €</span></p>
                <p><strong>Client :</strong> ${orderData.email}</p>
                <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              
              <h3><span class="emoji">📋</span> Détails de la création</h3>
              <div class="order-card">
                <p><strong>Doudou à transformer :</strong> <span class="highlight">${orderData.petName}</span></p>
                <p><strong>Type d'animal :</strong> ${orderData.animalType}</p>
                <p><strong>Pour l'enfant :</strong> <span class="highlight">${orderData.childName}</span></p>
                <p><strong>Nombre de planches demandées :</strong> ${orderData.numberOfSheets}</p>
                ${orderData.photoUrl ? `<p><strong>Photo fournie :</strong> Voir en pièce jointe ou dans l'admin</p>` : ''}
              </div>
              
              ${orderData.notes ? `
              <div class="brief">
                <h4><span class="emoji">💡</span> Brief créatif</h4>
                <p>${orderData.notes}</p>
              </div>
              ` : ''}
              
              <h3><span class="emoji">🎯</span> Actions à réaliser</h3>
              <ol>
                <li><strong>Récupérer la photo</strong> depuis l'interface admin</li>
                <li><strong>Créer les stickers</strong> en vous inspirant du doudou</li>
                <li><strong>Préparer ${orderData.numberOfSheets} planche(s)</strong> avec des stickers variés</li>
                <li><strong>Valider avec le client</strong> si nécessaire</li>
                <li><strong>Marquer comme "En production"</strong> dans l'admin</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin" class="admin-link">
                  <span class="emoji">⚡</span> Accéder à l'Admin
                </a>
              </div>
              
              <p><strong>Objectif :</strong> Livraison sous 2-3 jours ouvrés max !</p>
              
              <p>Bonne création ! <span class="emoji">🎨</span></p>
            </div>
            
            <div class="footer">
              <p>Interface admin : <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin">${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin</a></p>
            </div>
          </body>
        </html>
      `
    })

    if (error) {
      console.error('❌ Erreur envoi email artiste:', error)
      throw error
    }

    console.log('✅ Email artiste envoyé:', data?.id)
    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('❌ Erreur service email artiste:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

// Fonction pour envoyer les deux emails en parallèle
export async function sendOrderConfirmationEmails(orderData: OrderData) {
  try {
    console.log('📧 Envoi des emails de confirmation...')
    
    // Envoyer les deux emails en parallèle
    const [clientResult, artistResult] = await Promise.allSettled([
      sendClientConfirmationEmail(orderData),
      sendArtistNotificationEmail(orderData)
    ])
    
    const results = {
      client: clientResult.status === 'fulfilled' ? clientResult.value : { success: false, error: clientResult.reason },
      artist: artistResult.status === 'fulfilled' ? artistResult.value : { success: false, error: artistResult.reason }
    }
    
    console.log('📧 Résultats envoi emails:', {
      client: results.client.success ? '✅' : '❌',
      artist: results.artist.success ? '✅' : '❌'
    })
    
    return results
  } catch (error) {
    console.error('❌ Erreur générale envoi emails:', error)
    return {
      client: { success: false, error: 'Erreur système' },
      artist: { success: false, error: 'Erreur système' }
    }
  }
}

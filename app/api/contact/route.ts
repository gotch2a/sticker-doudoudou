import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialiser Resend avec la clé API
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * API pour traiter le formulaire de contact
 * Envoie l'email via Resend
 */
export async function POST(request: NextRequest) {
  try {
    const { firstName, email, subject, message } = await request.json()
    
    // Validation des données
    if (!firstName || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Format email invalide' },
        { status: 400 }
      )
    }
    
    console.log('📧 Envoi email de contact depuis:', email)
    
    // Envoyer l'email via Resend
    const emailResult = await resend.emails.send({
      from: 'Contact TAGADOU <contact@tagadou.fr>', // Domaine vérifié dans Resend
      to: ['coucou@tagadou.fr'], // Email de destination
      replyTo: email, // L'utilisateur peut répondre directement
      subject: `[CONTACT] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">📧 Nouveau message TAGADOU</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; margin-top: 0;">Détails du message :</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151; width: 120px;">
                    👤 Expéditeur :
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
                    ${firstName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">
                    📧 Email :
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
                    <a href="mailto:${email}" style="color: #dc2626; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">
                    📝 Sujet :
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
                    ${subject}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 10px 0 10px; font-weight: bold; color: #374151; vertical-align: top;">
                    💬 Message :
                  </td>
                  <td style="padding: 10px 10px 0 10px; color: #1f2937; vertical-align: top;">
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5;">${message}</div>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="mailto:${email}" 
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                📧 Répondre à ${firstName}
              </a>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #fef3f2; border: 1px solid #fed7d7; border-radius: 6px; text-align: center; font-size: 14px; color: #7f1d1d;">
              <strong>💡 Rappel :</strong> Ce message a été envoyé depuis le formulaire de contact du site TAGADOU.
              <br>Pour répondre, utilisez directement l'email : <strong>${email}</strong>
            </div>
          </div>
        </div>
      `,
      text: `
NOUVEAU MESSAGE TAGADOU

Expéditeur: ${firstName}
Email: ${email}  
Sujet: ${subject}

Message:
${message}

---
Pour répondre, utilisez directement: ${email}
      `
    })
    
    if (emailResult.error) {
      console.error('❌ Erreur envoi Resend:', emailResult.error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }
    
    console.log('✅ Email de contact envoyé:', emailResult.data?.id)
    
    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès !',
      emailId: emailResult.data?.id
    })
    
  } catch (error) {
    console.error('❌ Erreur API contact:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}


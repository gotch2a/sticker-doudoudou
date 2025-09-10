/**
 * Service d'envoi d'emails pour l'authentification automatique
 * Gère l'envoi des emails de bienvenue avec identifiants
 */

import nodemailer from 'nodemailer'

/**
 * Interface pour les données d'email de bienvenue
 */
export interface WelcomeEmailData {
  email: string
  firstName?: string
  lastName?: string
  temporaryPassword: string
  orderNumber: string
  loginUrl: string
}

/**
 * Interface pour les résultats d'envoi d'email
 */
export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Service d'email avec templates pour l'authentification
 */
export class EmailService {
  
  private static transporter: nodemailer.Transporter | null = null
  
  /**
   * Initialiser le transporteur email
   */
  private static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true pour port 465, false pour autres ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      })
    }
    
    return this.transporter
  }
  
  /**
   * Envoyer email de bienvenue avec identifiants
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
    try {
      console.log('📧 Envoi email de bienvenue à:', data.email)
      
      const transporter = this.getTransporter()
      
      const mailOptions = {
        from: `"Sticker DOUDOU" <${process.env.SMTP_USER}>`,
        to: data.email,
        subject: '🎉 Bienvenue chez Sticker DOUDOU - Votre compte est créé !',
        html: this.generateWelcomeEmailTemplate(data),
        text: this.generateWelcomeEmailText(data)
      }
      
      const info = await transporter.sendMail(mailOptions)
      
      console.log('✅ Email de bienvenue envoyé:', info.messageId)
      
      return {
        success: true,
        messageId: info.messageId
      }
      
    } catch (error) {
      console.error('❌ Erreur envoi email de bienvenue:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }
  
  /**
   * Template HTML pour email de bienvenue
   */
  private static generateWelcomeEmailTemplate(data: WelcomeEmailData): string {
    const firstName = data.firstName || 'Cher(e) client(e)'
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue chez Sticker DOUDOU</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px;
          border: 1px solid #e1e5e9;
          border-top: none;
        }
        .welcome-box {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
        }
        .credentials-box {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 15px 0;
          font-weight: bold;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
          font-size: 14px;
          color: #6c757d;
        }
        .order-info {
          background: #e3f2fd;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Bienvenue chez Sticker DOUDOU !</h1>
        <p>Votre compte a été créé automatiquement</p>
      </div>
      
      <div class="content">
        <div class="welcome-box">
          <h2>Bonjour ${firstName} !</h2>
          <p>Suite à votre commande, nous avons automatiquement créé votre compte Sticker DOUDOU. 
          Vous pouvez maintenant profiter de nombreux avantages !</p>
        </div>
        
        <div class="order-info">
          <strong>📦 Votre commande :</strong> ${data.orderNumber}<br>
          <small>Cette commande a déclenché la création de votre compte</small>
        </div>
        
        <div class="credentials-box">
          <h3>🔐 Vos identifiants de connexion</h3>
          <p><strong>Email :</strong> ${data.email}</p>
          <p><strong>Mot de passe temporaire :</strong> <code style="background:#fff;padding:4px 8px;border-radius:4px;font-weight:bold;">${data.temporaryPassword}</code></p>
          
          <div style="margin-top: 15px; padding: 10px; background: #fff; border-radius: 4px;">
            ⚠️ <strong>Important :</strong> Pour votre sécurité, changez ce mot de passe dès votre première connexion.
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.loginUrl}" class="button">🚀 Accéder à mon compte</a>
        </div>
        
        <h3>✨ Vos avantages membre</h3>
        <ul>
          <li><strong>🏷️ Réductions fidélité :</strong> 30% sur les nouvelles planches du même doudou</li>
          <li><strong>📊 Historique complet :</strong> Toutes vos commandes dans votre dashboard</li>
          <li><strong>🎯 Commandes rapides :</strong> Informations pré-remplies pour vos prochains achats</li>
          <li><strong>🔔 Notifications :</strong> Suivi en temps réel de vos commandes</li>
          <li><strong>🎁 Offres exclusives :</strong> Promotions réservées aux membres</li>
        </ul>
        
        <div style="background: #e8f5e8; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h4>💡 Le saviez-vous ?</h4>
          <p>Si vous recommandez une nouvelle planche pour le même doudou, vous bénéficierez automatiquement 
          d'une <strong>réduction de 30%</strong> ! Idéal si vous voulez offrir des stickers aux grands-parents 
          ou si votre enfant a perdu sa planche favorite.</p>
        </div>
      </div>
      
      <div class="footer">
        <p>
          <strong>Sticker DOUDOU</strong><br>
          Des stickers uniques pour des doudous uniques<br>
          <a href="mailto:${process.env.SMTP_USER}">Contact</a> | 
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/cgv">CGV</a> | 
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/confidentialite">Confidentialité</a>
        </p>
        
        <p style="font-size: 12px; color: #999;">
          Cet email a été envoyé automatiquement suite à votre commande ${data.orderNumber}.<br>
          Si vous n'êtes pas à l'origine de cette commande, contactez-nous immédiatement.
        </p>
      </div>
    </body>
    </html>
    `
  }
  
  /**
   * Version texte de l'email de bienvenue
   */
  private static generateWelcomeEmailText(data: WelcomeEmailData): string {
    const firstName = data.firstName || 'Cher(e) client(e)'
    
    return `
🎉 BIENVENUE CHEZ STICKER DOUDOU !

Bonjour ${firstName},

Suite à votre commande ${data.orderNumber}, nous avons automatiquement créé votre compte Sticker DOUDOU.

🔐 VOS IDENTIFIANTS :
Email : ${data.email}
Mot de passe temporaire : ${data.temporaryPassword}

⚠️ IMPORTANT : Changez ce mot de passe dès votre première connexion pour votre sécurité.

🚀 CONNEXION : ${data.loginUrl}

✨ VOS AVANTAGES MEMBRE :
• 30% de réduction sur les nouvelles planches du même doudou
• Historique complet de vos commandes
• Commandes rapides avec informations pré-remplies
• Notifications de suivi en temps réel
• Offres exclusives membres

💡 LE SAVIEZ-VOUS ?
Si vous recommandez une nouvelle planche pour le même doudou, vous bénéficierez automatiquement d'une réduction de 30% !

---
Sticker DOUDOU
Des stickers uniques pour des doudous uniques
Contact : ${process.env.SMTP_USER}

Cet email a été envoyé automatiquement suite à votre commande ${data.orderNumber}.
Si vous n'êtes pas à l'origine de cette commande, contactez-nous immédiatement.
    `
  }
  
  /**
   * Envoyer email de réinitialisation de mot de passe personnalisé
   */
  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailResult> {
    try {
      console.log('📧 Envoi email réinitialisation mot de passe à:', email)
      
      const transporter = this.getTransporter()
      
      const mailOptions = {
        from: `"Sticker DOUDOU" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '🔑 Réinitialisation de votre mot de passe - Sticker DOUDOU',
        html: this.generatePasswordResetTemplate(email, resetUrl),
        text: `Réinitialisation de mot de passe\n\nCliquez sur ce lien pour créer un nouveau mot de passe :\n${resetUrl}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.`
      }
      
      const info = await transporter.sendMail(mailOptions)
      
      console.log('✅ Email de réinitialisation envoyé:', info.messageId)
      
      return {
        success: true,
        messageId: info.messageId
      }
      
    } catch (error) {
      console.error('❌ Erreur envoi email de réinitialisation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }
  
  /**
   * Template HTML pour réinitialisation mot de passe
   */
  private static generatePasswordResetTemplate(email: string, resetUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Réinitialisation mot de passe</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔑 Réinitialisation de mot de passe</h1>
      </div>
      <div class="content">
        <p>Bonjour,</p>
        <p>Vous avez demandé à réinitialiser le mot de passe de votre compte Sticker DOUDOU (${email}).</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Créer un nouveau mot de passe</a>
        </div>
        
        <div class="warning">
          ⚠️ <strong>Important :</strong><br>
          • Ce lien expire dans 1 heure<br>
          • Il ne peut être utilisé qu'une seule fois<br>
          • Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
        </div>
        
        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>
      </div>
    </body>
    </html>
    `
  }
}

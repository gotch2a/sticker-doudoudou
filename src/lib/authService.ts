/**
 * Service d'authentification automatique
 * Gère la création automatique de comptes lors de la validation de commandes
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Client Supabase avec privilèges admin (service_role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Clé service_role requise
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Interface pour les données de création d'utilisateur
 */
export interface CreateUserData {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  orderNumber: string
}

/**
 * Interface pour le résultat de création d'utilisateur
 */
export interface CreateUserResult {
  success: boolean
  userId?: string
  temporaryPassword?: string
  error?: string
  isExistingUser?: boolean
}

/**
 * Service principal pour l'authentification automatique
 */
export class AuthService {
  
  /**
   * Créer un compte utilisateur automatiquement après validation de commande
   */
  static async createUserFromOrder(userData: CreateUserData): Promise<CreateUserResult> {
    try {
      console.log('🔐 Début création compte automatique pour:', userData.email)
      
      // 1. Vérifier si l'utilisateur existe déjà
      // Note : getUserByEmail nécessite la version @supabase/supabase-js v2+
      let existingUser = null
      try {
        const { data, error: checkError } = await supabaseAdmin.auth.admin.listUsers()
        if (data?.users) {
          existingUser = data.users.find(user => user.email === userData.email)
        }
      } catch (listError) {
        console.warn('⚠️ Impossible de lister les utilisateurs:', listError)
      }
      
      // 2. Si utilisateur existe déjà, juste retourner son ID
      if (existingUser) {
        console.log('✅ Utilisateur existant trouvé:', existingUser.id)
        return {
          success: true,
          userId: existingUser.id,
          isExistingUser: true
        }
      }
      
      // 3. Générer mot de passe temporaire sécurisé
      const temporaryPassword = this.generateSecurePassword()
      
      // 4. Créer nouvel utilisateur dans Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: temporaryPassword,
        email_confirm: true, // Auto-confirmer l'email
        user_metadata: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          created_from_order: userData.orderNumber,
          account_type: 'auto_created'
        }
      })
      
      if (createError) {
        console.error('❌ Erreur création utilisateur:', createError)
        return { success: false, error: createError.message }
      }
      
      if (!newUser.user) {
        return { success: false, error: 'Utilisateur non créé - erreur inconnue' }
      }
      
      console.log('✅ Utilisateur créé dans Auth:', newUser.user.id)
      
      // 5. Créer profil utilisateur dans la table user_profiles
      const profileResult = await this.createUserProfile(newUser.user.id, userData)
      
      if (!profileResult.success) {
        console.error('❌ Erreur création profil:', profileResult.error)
        // Optionnel : supprimer l'utilisateur Auth si le profil échoue
        return { success: false, error: profileResult.error }
      }
      
      console.log('✅ Compte automatique créé avec succès pour:', userData.email)
      
      return {
        success: true,
        userId: newUser.user.id,
        temporaryPassword: temporaryPassword,
        isExistingUser: false
      }
      
    } catch (error) {
      console.error('❌ Erreur création compte automatique:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }
  
  /**
   * Créer le profil utilisateur dans la table user_profiles
   */
  private static async createUserProfile(userId: string, userData: CreateUserData) {
    try {
      const defaultAddress = {
        address: userData.address || '',
        city: userData.city || '',
        postal_code: userData.postalCode || ''
      }
      
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: userId,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          default_address: defaultAddress,
          account_created_from_order: userData.orderNumber,
          total_orders: 1, // Première commande
          newsletter_subscribed: true,
          marketing_emails: true
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Erreur création profil:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Profil utilisateur créé:', data.id)
      return { success: true, data }
      
    } catch (error) {
      console.error('❌ Erreur création profil (catch):', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }
  
  /**
   * Lier une commande à un utilisateur
   */
  static async linkOrderToUser(orderNumber: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ user_id: userId })
        .eq('order_number', orderNumber)
      
      if (error) {
        console.error('❌ Erreur liaison commande-utilisateur:', error)
        return false
      }
      
      console.log('✅ Commande liée à l\'utilisateur:', orderNumber, '→', userId)
      return true
      
    } catch (error) {
      console.error('❌ Erreur liaison commande-utilisateur (catch):', error)
      return false
    }
  }
  
  /**
   * Enregistrer ou mettre à jour un doudou pour un utilisateur
   */
  static async registerUserDoudou(
    userId: string, 
    orderNumber: string,
    petName: string, 
    animalType: string, 
    photoUrl?: string
  ): Promise<boolean> {
    try {
      // Générer hash de la photo si fournie
      const photoHash = photoUrl ? this.generatePhotoHash(photoUrl) : null
      
      // Vérifier si ce doudou existe déjà pour cet utilisateur
      const { data: existingDoudou } = await supabaseAdmin
        .from('user_doudous')
        .select('*')
        .eq('user_id', userId)
        .eq('pet_name', petName)
        .eq('animal_type', animalType)
        .single()
      
      if (existingDoudou) {
        // Mettre à jour doudou existant
        const { error } = await supabaseAdmin
          .from('user_doudous')
          .update({
            total_orders: existingDoudou.total_orders + 1,
            last_order_date: new Date().toISOString(),
            photo_hash: photoHash || existingDoudou.photo_hash
          })
          .eq('id', existingDoudou.id)
        
        if (error) {
          console.error('❌ Erreur mise à jour doudou existant:', error)
          return false
        }
        
        console.log('✅ Doudou existant mis à jour:', petName)
        
      } else {
        // Créer nouveau doudou
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id, total_amount, created_at')
          .eq('order_number', orderNumber)
          .single()
        
        const { error } = await supabaseAdmin
          .from('user_doudous')
          .insert({
            user_id: userId,
            pet_name: petName,
            animal_type: animalType,
            photo_hash: photoHash,
            first_order_id: order?.id,
            first_order_date: order?.created_at,
            total_orders: 1,
            last_order_date: new Date().toISOString(),
            standard_price: order?.total_amount || 0
          })
        
        if (error) {
          console.error('❌ Erreur création nouveau doudou:', error)
          return false
        }
        
        console.log('✅ Nouveau doudou enregistré:', petName)
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Erreur enregistrement doudou (catch):', error)
      return false
    }
  }
  
  /**
   * Mettre à jour les statistiques utilisateur
   */
  static async updateUserStats(userId: string, orderAmount: number, savingsAmount: number = 0): Promise<boolean> {
    try {
      // D'abord récupérer les stats actuelles
      const { data: currentStats } = await supabaseAdmin
        .from('user_profiles')
        .select('total_orders, total_spent, total_savings')
        .eq('id', userId)
        .single()
      
      // Calculer les nouvelles valeurs
      const newTotalOrders = (currentStats?.total_orders || 0) + 1
      const newTotalSpent = (currentStats?.total_spent || 0) + orderAmount
      const newTotalSavings = (currentStats?.total_savings || 0) + savingsAmount
      
      // Mettre à jour avec les nouvelles valeurs
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          total_orders: newTotalOrders,
          total_spent: newTotalSpent,
          total_savings: newTotalSavings
        })
        .eq('id', userId)
      
      if (error) {
        console.error('❌ Erreur mise à jour stats utilisateur:', error)
        return false
      }
      
      console.log('✅ Stats utilisateur mises à jour:', {
        total_orders: newTotalOrders,
        total_spent: newTotalSpent,
        total_savings: newTotalSavings
      })
      return true
      
    } catch (error) {
      console.error('❌ Erreur mise à jour stats (catch):', error)
      return false
    }
  }
  
  /**
   * Générer un mot de passe sécurisé temporaire
   */
  private static generateSecurePassword(): string {
    // Générer un mot de passe de 12 caractères avec lettres, chiffres et symboles
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&'
    let password = ''
    
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return password
  }
  
  /**
   * Générer un hash simple pour une photo
   */
  private static generatePhotoHash(photoUrl: string): string {
    return crypto.createHash('sha256').update(photoUrl).digest('hex').substring(0, 16)
  }
  
  /**
   * Vérifier si un utilisateur existe par email
   */
  static async getUserByEmail(email: string) {
    try {
      // Utiliser listUsers pour trouver l'utilisateur par email
      const { data, error } = await supabaseAdmin.auth.admin.listUsers()
      
      if (error) {
        console.error('❌ Erreur récupération utilisateurs:', error)
        return null
      }
      
      if (data?.users) {
        const user = data.users.find(u => u.email === email)
        return user || null
      }
      
      return null
      
    } catch (error) {
      console.error('❌ Erreur getUserByEmail (catch):', error)
      return null
    }
  }
}

/**
 * Utilitaires pour l'authentification
 */
export class AuthUtils {
  
  /**
   * Extraire le prénom et nom depuis une chaîne complète
   */
  static parseFullName(fullName?: string): { firstName?: string, lastName?: string } {
    if (!fullName) return {}
    
    const parts = fullName.trim().split(' ')
    
    if (parts.length === 1) {
      return { firstName: parts[0] }
    }
    
    if (parts.length >= 2) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
      }
    }
    
    return {}
  }
  
  /**
   * Valider format email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  /**
   * Générer un nom d'utilisateur suggéré depuis l'email
   */
  static generateUsernameFromEmail(email: string): string {
    return email.split('@')[0].toLowerCase()
  }
}

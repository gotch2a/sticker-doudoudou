/**
 * Service de tarification intelligente
 * Gère les réductions automatiques selon les règles métier
 */

import { createClient } from '@supabase/supabase-js'

// Client Supabase avec privilèges service
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

/**
 * Interface pour le résultat de calcul de prix
 */
export interface PricingResult {
  originalPrice: number
  finalPrice: number
  discount: {
    type: 'none' | 'repeat_doudou' | 'upsell' | 'loyalty'
    percentage: number
    amount: number
    reason: string
  }
  savingsAmount: number
  priceBreakdown: {
    basePrice: number
    upsellPrice: number
    shippingPrice: number
    discountAmount: number
  }
}

/**
 * Interface pour les données de calcul
 */
export interface PricingData {
  email: string
  petName: string
  animalType: string
  numberOfSheets: number
  upsellIds?: string[]
  shippingCost: number
  photoHash?: string
}

/**
 * Service principal de tarification intelligente
 */
export class SmartPricingService {
  
  /**
   * Calculer le prix avec réductions automatiques
   */
  static async calculateSmartPrice(data: PricingData): Promise<PricingResult> {
    try {
      console.log('💰 Calcul tarification intelligente pour:', data.email, '-', data.petName)
      
      // 1. Récupérer les prix de base depuis Supabase
      const { data: articles, error: articlesError } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('active', true)
      
      if (articlesError || !articles) {
        throw new Error('Impossible de récupérer les articles')
      }
      
      // 2. Calculer prix de base
      const baseArticle = articles.find(a => a.category === 'base')
      if (!baseArticle) {
        throw new Error('Article de base non trouvé')
      }
      
      const basePrice = data.numberOfSheets * baseArticle.sale_price
      
      // 3. Calculer prix upsells
      let upsellPrice = 0
      const selectedUpsells = []
      
      if (data.upsellIds && data.upsellIds.length > 0) {
        for (const upsellId of data.upsellIds) {
          const upsell = articles.find(a => a.id === upsellId && a.category === 'upsell')
          if (upsell) {
            upsellPrice += upsell.sale_price
            selectedUpsells.push(upsell)
          }
        }
      }
      
      const subtotal = basePrice + upsellPrice
      const originalPrice = subtotal + data.shippingCost
      
      // 4. Vérifier si client existant et doudou répété
      const repeatDoudouDiscount = await this.checkRepeatDoudouDiscount(
        data.email, 
        data.petName, 
        data.animalType, 
        data.photoHash
      )
      
      if (repeatDoudouDiscount.isApplicable) {
        console.log('🎉 Réduction doudou répété détectée:', repeatDoudouDiscount.percentage + '%')
        
        // Réduction de 30% sur le prix de base, arrondie sympa
        const discountAmount = basePrice * (repeatDoudouDiscount.percentage / 100)
        const finalBasePrice = this.roundToNicePrice(basePrice - discountAmount)
        const finalPrice = finalBasePrice + upsellPrice + data.shippingCost
        
        return {
          originalPrice,
          finalPrice,
          discount: {
            type: 'repeat_doudou',
            percentage: repeatDoudouDiscount.percentage,
            amount: basePrice - finalBasePrice,
            reason: `Nouvelle planche pour ${data.petName}`
          },
          savingsAmount: originalPrice - finalPrice,
          priceBreakdown: {
            basePrice: finalBasePrice,
            upsellPrice,
            shippingPrice: data.shippingCost,
            discountAmount: basePrice - finalBasePrice
          }
        }
      }
      
      // 5. Vérifier réduction upsell (client existant + upsells)
      if (selectedUpsells.length > 0) {
        const upsellDiscount = await this.checkUpsellDiscount(data.email, selectedUpsells)
        
        if (upsellDiscount.isApplicable) {
          console.log('🎁 Réduction upsell détectée:', upsellDiscount.percentage + '%')
          
          // Réduction de 60% sur les upsells
          const discountAmount = upsellPrice * (upsellDiscount.percentage / 100)
          const finalUpsellPrice = this.roundToNicePrice(upsellPrice - discountAmount)
          const finalPrice = basePrice + finalUpsellPrice + data.shippingCost
          
          return {
            originalPrice,
            finalPrice,
            discount: {
              type: 'upsell',
              percentage: upsellDiscount.percentage,
              amount: upsellPrice - finalUpsellPrice,
              reason: 'Réduction fidélité sur les produits bonus'
            },
            savingsAmount: originalPrice - finalPrice,
            priceBreakdown: {
              basePrice,
              upsellPrice: finalUpsellPrice,
              shippingPrice: data.shippingCost,
              discountAmount: upsellPrice - finalUpsellPrice
            }
          }
        }
      }
      
      // 6. Aucune réduction applicable
      return {
        originalPrice,
        finalPrice: originalPrice,
        discount: {
          type: 'none',
          percentage: 0,
          amount: 0,
          reason: 'Aucune réduction applicable'
        },
        savingsAmount: 0,
        priceBreakdown: {
          basePrice,
          upsellPrice,
          shippingPrice: data.shippingCost,
          discountAmount: 0
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur calcul tarification:', error)
      
      // Fallback en cas d'erreur : prix standard
      const fallbackPrice = (data.numberOfSheets * 15.90) + (data.upsellIds?.length || 0) * 10 + data.shippingCost
      
      return {
        originalPrice: fallbackPrice,
        finalPrice: fallbackPrice,
        discount: {
          type: 'none',
          percentage: 0,
          amount: 0,
          reason: 'Erreur calcul tarification - prix standard appliqué'
        },
        savingsAmount: 0,
        priceBreakdown: {
          basePrice: data.numberOfSheets * 15.90,
          upsellPrice: (data.upsellIds?.length || 0) * 10,
          shippingPrice: data.shippingCost,
          discountAmount: 0
        }
      }
    }
  }
  
  /**
   * Vérifier si le doudou a déjà été commandé (réduction 30%)
   */
  private static async checkRepeatDoudouDiscount(
    email: string, 
    petName: string, 
    animalType: string, 
    photoHash?: string
  ) {
    try {
      // Vérifier si utilisateur existe via listUsers (compatible toutes versions)
      let user = null
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        if (usersData?.users) {
          user = usersData.users.find(u => u.email === email)
        }
      } catch (userError) {
        console.log('⚠️ Erreur récupération utilisateur:', userError)
      }
      
      if (!user) {
        console.log('⚠️ Utilisateur non trouvé pour répeat')
        return { isApplicable: false, percentage: 0, reason: 'Nouveau client' }
      }
      
      // Chercher doudou existant pour cet utilisateur
      const { data: existingDoudou, error } = await supabaseAdmin
        .from('user_doudous')
        .select('*')
        .eq('user_id', user.id)
        .eq('pet_name', petName)
        .eq('animal_type', animalType)
        .single()
      
      if (error || !existingDoudou) {
        return { isApplicable: false, percentage: 0, reason: 'Premier doudou de ce type' }
      }
      
      // Vérifier correspondance photo si fournie
      if (photoHash && existingDoudou.photo_hash && existingDoudou.photo_hash !== photoHash) {
        return { isApplicable: false, percentage: 0, reason: 'Photo différente du doudou original' }
      }
      
      console.log('✅ Doudou répété trouvé:', existingDoudou.pet_name, 'commandé', existingDoudou.total_orders, 'fois')
      
      return {
        isApplicable: true,
        percentage: 30,
        reason: `${existingDoudou.total_orders}e commande pour ${petName}`,
        existingDoudou
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification doudou répété:', error)
      return { isApplicable: false, percentage: 0, reason: 'Erreur vérification' }
    }
  }
  
  /**
   * Vérifier éligibilité réduction upsell (réduction 60%)
   */
  private static async checkUpsellDiscount(email: string, selectedUpsells: any[]) {
    try {
      // Vérifier si utilisateur existe
      let user = null
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        if (usersData?.users) {
          user = usersData.users.find(u => u.email === email)
        }
      } catch (userError) {
        console.log('⚠️ Erreur récupération utilisateur:', userError)
      }
      
      if (!user) {
        console.log('⚠️ Utilisateur non trouvé pour upsell')
        return { isApplicable: false, percentage: 0, reason: 'Nouveau client' }
      }
      
      // Récupérer profil utilisateur
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('total_orders, total_spent')
        .eq('id', user.id)
        .single()
      
      if (!profile) {
        return { isApplicable: false, percentage: 0, reason: 'Profil non trouvé' }
      }
      
      // Critères pour réduction upsell :
      // - Au moins 1 commande précédente OU montant dépensé > 20€
      const isEligible = profile.total_orders >= 1 || profile.total_spent >= 20
      
      if (!isEligible) {
        return { isApplicable: false, percentage: 0, reason: 'Pas encore éligible aux réductions upsell' }
      }
      
      console.log('✅ Client éligible réduction upsell:', profile.total_orders, 'commandes,', profile.total_spent, '€ dépensés')
      
      return {
        isApplicable: true,
        percentage: 60,
        reason: `Client fidèle (${profile.total_orders} commandes)`,
        profile
      }
      
    } catch (error) {
      console.error('❌ Erreur vérification réduction upsell:', error)
      return { isApplicable: false, percentage: 0, reason: 'Erreur vérification' }
    }
  }
  
  /**
   * Arrondir à un prix "sympa" (ex: 17.43€ → 16.90€)
   */
  private static roundToNicePrice(price: number): number {
    // Arrondir au .90 le plus proche en dessous
    const rounded = Math.floor(price * 10) / 10 // 1 décimale
    const euros = Math.floor(rounded)
    
    // Si le prix se termine par .90, le garder
    // Sinon, l'arrondir au .90 inférieur
    const cents = Math.round((rounded - euros) * 100)
    
    if (cents >= 90) {
      return euros + 0.90
    } else {
      return Math.max(euros - 1 + 0.90, 0.90) // Minimum 0.90€
    }
  }
  
  /**
   * Générer un hash simple pour une photo
   */
  static generatePhotoHash(photoUrl: string): string {
    // Hash simple basé sur l'URL (peut être amélioré avec un vrai hash de contenu)
    return btoa(photoUrl).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
  }
  
  /**
   * Enregistrer une réduction appliquée dans l'historique
   */
  static async recordAppliedDiscount(
    orderId: string,
    userId: string,
    discountData: {
      type: string
      reason: string
      originalPrice: number
      discountedPrice: number
      savingsAmount: number
      percentage: number
    },
    doudouId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('applied_discounts')
        .insert({
          order_id: orderId,
          user_id: userId,
          discount_type: discountData.type,
          discount_reason: discountData.reason,
          original_price: discountData.originalPrice,
          discounted_price: discountData.discountedPrice,
          savings_amount: discountData.savingsAmount,
          discount_percentage: discountData.percentage,
          doudou_id: doudouId || null
        })
      
      if (error) {
        console.error('❌ Erreur enregistrement réduction:', error)
        return false
      }
      
      console.log('✅ Réduction enregistrée dans l\'historique')
      return true
      
    } catch (error) {
      console.error('❌ Erreur enregistrement réduction (catch):', error)
      return false
    }
  }
  
  /**
   * Obtenir l'historique des réductions d'un utilisateur
   */
  static async getUserDiscountHistory(userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('applied_discounts')
        .select(`
          *,
          orders:order_id (
            order_number,
            pet_name,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Erreur récupération historique réductions:', error)
        return []
      }
      
      return data || []
      
    } catch (error) {
      console.error('❌ Erreur récupération historique réductions (catch):', error)
      return []
    }
  }
  
  /**
   * Calculer les économies totales d'un utilisateur
   */
  static async getUserTotalSavings(userId: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('applied_discounts')
        .select('savings_amount')
        .eq('user_id', userId)
      
      if (error || !data) {
        return 0
      }
      
      return data.reduce((total, discount) => total + (discount.savings_amount || 0), 0)
      
    } catch (error) {
      console.error('❌ Erreur calcul économies totales:', error)
      return 0
    }
  }
}

/**
 * Utilitaires pour la tarification
 */
export class PricingUtils {
  
  /**
   * Formater un prix pour affichage
   */
  static formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',') + '€'
  }
  
  /**
   * Calculer le pourcentage d'économie
   */
  static calculateSavingsPercentage(originalPrice: number, finalPrice: number): number {
    if (originalPrice <= 0) return 0
    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
  }
  
  /**
   * Générer un message de réduction personnalisé
   */
  static generateDiscountMessage(discount: PricingResult['discount'], petName: string): string {
    switch (discount.type) {
      case 'repeat_doudou':
        return `🎉 Youpi ! ${discount.percentage}% de remise pour une nouvelle planche de ${petName} !`
      
      case 'upsell':
        return `🎁 En tant que client fidèle, vous bénéficiez de ${discount.percentage}% sur les produits bonus !`
      
      case 'loyalty':
        return `⭐ Réduction fidélité de ${discount.percentage}% appliquée à votre commande !`
      
      default:
        return ''
    }
  }
  
  /**
   * Vérifier si un prix semble raisonnable
   */
  static isPriceReasonable(price: number, numberOfSheets: number = 1): boolean {
    const minPrice = numberOfSheets * 5 // Prix minimum 5€ par planche
    const maxPrice = numberOfSheets * 50 // Prix maximum 50€ par planche
    
    return price >= minPrice && price <= maxPrice
  }
}

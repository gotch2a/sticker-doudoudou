/**
 * Hook React pour la tarification intelligente
 * Gère l'appel à l'API de pricing et l'affichage des réductions
 */

import { useState, useCallback, useEffect } from 'react'

/**
 * Interface pour le résultat de pricing
 */
interface PricingResult {
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
 * Interface pour les données d'entrée
 */
interface PricingInput {
  email: string
  petName: string
  animalType: string
  numberOfSheets: number
  upsellIds?: string[]
  photoUrl?: string
}

/**
 * Hook de tarification intelligente
 */
export function useSmartPricing() {
  const [pricing, setPricing] = useState<PricingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCalculation, setLastCalculation] = useState<string>('')
  
  /**
   * Calculer le prix intelligent
   */
  const calculatePrice = useCallback(async (input: PricingInput) => {
    // Vérifier les données minimales
    if (!input.email || !input.petName || !input.animalType) {
      return
    }
    
    // Éviter les calculs en double
    const inputKey = JSON.stringify(input)
    if (inputKey === lastCalculation && pricing) {
      return pricing
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur de calcul de prix')
      }
      
      setPricing(data.pricing)
      setLastCalculation(inputKey)
      
      console.log('💰 Prix calculé:', data.pricing)
      
      return data.pricing
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      console.error('❌ Erreur calcul prix:', err)
      return null
      
    } finally {
      setLoading(false)
    }
  }, [lastCalculation, pricing])
  
  /**
   * Calculer le prix avec debounce (éviter trop d'appels)
   */
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  
  const calculatePriceDebounced = useCallback((input: PricingInput, delay = 500) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    const timer = setTimeout(() => {
      calculatePrice(input)
    }, delay)
    
    setDebounceTimer(timer)
  }, [calculatePrice, debounceTimer])
  
  /**
   * Obtenir l'historique des réductions d'un utilisateur
   */
  const getDiscountHistory = useCallback(async (email: string) => {
    if (!email) return null
    
    try {
      const response = await fetch(`/api/pricing?email=${encodeURIComponent(email)}&action=history`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }
      
      const data = await response.json()
      return data.success ? data : null
      
    } catch (err) {
      console.error('❌ Erreur récupération historique:', err)
      return null
    }
  }, [])
  
  /**
   * Vérifier l'éligibilité aux réductions
   */
  const checkEligibility = useCallback(async (email: string) => {
    if (!email) return null
    
    try {
      const response = await fetch(`/api/pricing?email=${encodeURIComponent(email)}&action=eligibility`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`)
      }
      
      const data = await response.json()
      return data.success ? data : null
      
    } catch (err) {
      console.error('❌ Erreur vérification éligibilité:', err)
      return null
    }
  }, [])
  
  /**
   * Réinitialiser le state
   */
  const reset = useCallback(() => {
    setPricing(null)
    setError(null)
    setLastCalculation('')
  }, [])
  
  /**
   * Nettoyer le timer au démontage
   */
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])
  
  return {
    // State
    pricing,
    loading,
    error,
    
    // Actions
    calculatePrice,
    calculatePriceDebounced,
    getDiscountHistory,
    checkEligibility,
    reset,
    
    // Utilitaires
    hasDiscount: pricing?.discount.type !== 'none' && (pricing?.discount.percentage || 0) > 0,
    discountMessage: pricing?.discount.reason || '',
    formattedOriginalPrice: pricing ? `${pricing.originalPrice.toFixed(2)}€` : '',
    formattedFinalPrice: pricing ? `${pricing.finalPrice.toFixed(2)}€` : '',
    formattedSavings: pricing ? `${pricing.savingsAmount.toFixed(2)}€` : ''
  }
}

/**
 * Hook pour les utilitaires de prix
 */
export function usePricingUtils() {
  
  /**
   * Formater un prix
   */
  const formatPrice = useCallback((price: number): string => {
    return price.toFixed(2).replace('.', ',') + '€'
  }, [])
  
  /**
   * Calculer le pourcentage d'économie
   */
  const calculateSavingsPercentage = useCallback((originalPrice: number, finalPrice: number): number => {
    if (originalPrice <= 0) return 0
    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
  }, [])
  
  /**
   * Générer un message de réduction
   */
  const generateDiscountMessage = useCallback((discount: PricingResult['discount'], petName: string): string => {
    switch (discount.type) {
      case 'repeat_doudou':
        return `🎉 Youpi ! ${discount.percentage}% de remise pour une nouvelle planche de ${petName} !`
      
      case 'upsell':
        return `🎁 En tant que client fidèle, vous bénéficiez de ${discount.percentage}% sur les produits bonus !`
      
      case 'loyalty':
        return `⭐ Réduction fidélité de ${discount.percentage}% appliquée !`
      
      default:
        return ''
    }
  }, [])
  
  /**
   * Obtenir la classe CSS pour le badge de réduction
   */
  const getDiscountBadgeClass = useCallback((discount: PricingResult['discount']) => {
    const bgColor = {
      repeat_doudou: 'bg-green-100 text-green-800',
      upsell: 'bg-blue-100 text-blue-800',
      loyalty: 'bg-purple-100 text-purple-800',
      none: 'bg-gray-100 text-gray-800'
    }[discount.type] || 'bg-gray-100 text-gray-800'
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`
  }, [])
  
  return {
    formatPrice,
    calculateSavingsPercentage,
    generateDiscountMessage,
    getDiscountBadgeClass
  }
}

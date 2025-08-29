'use client'

import { useState } from 'react'

interface OrderData {
  photo: File | null
  petName: string
  animalType: string
  childName: string
  address: string
  city: string
  postalCode: string
  numberOfSheets: number
  notes: string
  email: string
}

interface UsePayPalReturn {
  createOrder: (orderData: OrderData) => Promise<{ success: boolean; paymentUrl?: string; error?: string }>
  isLoading: boolean
}

export function usePayPal(): UsePayPalReturn {
  const [isLoading, setIsLoading] = useState(false)

  const createOrder = async (orderData: OrderData) => {
    setIsLoading(true)
    
    try {
      // 1. Upload de la photo d'abord
      let photoUrl = ''
      if (orderData.photo) {
        const formData = new FormData()
        formData.append('photo', orderData.photo)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json()
          throw new Error(uploadError.error || 'Erreur upload photo')
        }
        
        const uploadResult = await uploadResponse.json()
        photoUrl = uploadResult.secureUrl
      }

      // 2. Création de la commande avec PayPal
      const orderPayload = {
        ...orderData,
        photo: photoUrl, // URL sécurisée au lieu du fichier
        email: extractEmailFromAddress(orderData) // Extraction email si pas fourni
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de la commande')
      }

      // Rediriger vers PayPal
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }

      return {
        success: true,
        paymentUrl: result.paymentUrl
      }

    } catch (error) {
      console.error('Erreur création commande:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createOrder,
    isLoading
  }
}

// Fonction utilitaire pour extraire un email si pas fourni
function extractEmailFromAddress(orderData: OrderData): string {
  // En production, vous pourriez demander l'email explicitement
  // Pour le MVP, on génère un email temporaire ou on utilise un champ dédié
  return orderData.email || `commande.${Date.now()}@temp.stickerdoudou.fr`
}

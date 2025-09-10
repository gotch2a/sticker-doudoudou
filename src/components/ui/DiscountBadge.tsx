/**
 * Composant badge de réduction
 * Affiche un badge avec le pourcentage de réduction selon le type
 */

import React from 'react'

/**
 * Interface pour le discount
 */
interface Discount {
  type: 'none' | 'repeat_doudou' | 'upsell' | 'loyalty'
  percentage: number
  amount: number
  reason: string
}

/**
 * Props du composant DiscountBadge
 */
interface DiscountBadgeProps {
  discount: Discount
  className?: string
}

/**
 * Composant DiscountBadge
 */
export default function DiscountBadge({ discount, className = '' }: DiscountBadgeProps) {
  // Ne pas afficher si pas de réduction
  if (discount.type === 'none' || discount.percentage === 0) {
    return null
  }
  
  // Couleurs selon le type de réduction
  const bgColor = {
    repeat_doudou: 'bg-green-100 text-green-800',
    upsell: 'bg-blue-100 text-blue-800', 
    loyalty: 'bg-purple-100 text-purple-800'
  }[discount.type] || 'bg-gray-100 text-gray-800'
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${className}`}
      title={discount.reason}
    >
      -{discount.percentage}%
    </span>
  )
}

/**
 * Composant pour notification de réduction (plus visible)
 */
interface DiscountNotificationProps {
  discount: Discount
  petName: string
  savingsAmount: number
  className?: string
}

export function DiscountNotification({ discount, petName, savingsAmount, className = '' }: DiscountNotificationProps) {
  if (discount.type === 'none' || discount.percentage === 0) {
    return null
  }

  // Message personnalisé selon le type
  const getMessage = () => {
    switch (discount.type) {
      case 'repeat_doudou':
        return `🎉 Youpi ! ${discount.percentage}% de remise pour une nouvelle planche de ${petName} !`
      case 'upsell':
        return `🎁 En tant que client fidèle, vous bénéficiez de ${discount.percentage}% sur les produits bonus !`
      case 'loyalty':
        return `⭐ Réduction fidélité de ${discount.percentage}% appliquée !`
      default:
        return `💰 ${discount.percentage}% de réduction appliquée !`
    }
  }

  const formatPrice = (price: number) => price.toFixed(2).replace('.', ',') + '€'

  return (
    <div className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-4 shadow-lg ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <span className="text-lg">🎉</span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            {getMessage()}
          </h3>
          <p className="text-green-100 text-sm">
            Économisez {formatPrice(savingsAmount)} sur votre commande !
          </p>
        </div>
        <DiscountBadge 
          discount={discount} 
          className="bg-white bg-opacity-20 text-white"
        />
      </div>
    </div>
  )
}

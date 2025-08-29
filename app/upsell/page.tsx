'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Heart,
  Star,
  Gift,
  ArrowRight,
  BookOpen,
  Image,
  Sticker,
  Crown,
  Sparkles,
  Timer
} from 'lucide-react'
import Link from 'next/link'

interface UpsellProduct {
  id: string
  name: string
  description: string
  originalPrice: number
  salePrice: number
  savings: number
  icon: React.ElementType
  features: string[]
  badge?: string
  popular?: boolean
}

const upsellProducts: UpsellProduct[] = [
  {
    id: 'photo-premium',
    name: 'Photo Doudou Premium',
    description: 'Une magnifique photo haute qualité avec cadre inclus',
    originalPrice: 39.90,
    salePrice: 29.90,
    savings: 10.00,
    icon: Image,
    badge: 'Cadre Inclus',
    features: [
      'Format A4 haute qualité',
      'Papier photo premium',
      'Cadre élégant inclus',
      'Prêt à accrocher',
      'Texte personnalisé avec prénom'
    ]
  },
  {
    id: 'livre-histoire',
    name: 'Livre d\'Histoire Personnalisé',
    description: 'L\'histoire magique de votre doudou en 16 pages illustrées',
    originalPrice: 34.90,
    salePrice: 24.90,
    savings: 10.00,
    icon: BookOpen,
    badge: 'Nouveau',
    popular: true,
    features: [
      '16 pages d\'histoire',
      'Illustrations personnalisées',
      'Prénom intégré dans l\'histoire',
      'Couverture rigide',
      'Format 21x21cm'
    ]
  },
  {
    id: 'pack-stickers',
    name: 'Pack 3 Planches Bonus',
    description: 'Profitez d\'un prix exceptionnel sur 3 planches supplémentaires',
    originalPrice: 25.80,
    salePrice: 9.90,
    savings: 15.90,
    icon: Sticker,
    badge: '-60%',
    features: [
      '3 planches au lieu d\'1',
      'Prix ultra-attractif',
      'Formats variés',
      'Même qualité premium',
      'Livraison groupée'
    ]
  }
]

export default function UpsellPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get('order') || 'CMD-000000'
  const petName = searchParams.get('pet') || 'votre doudou'
  const childName = searchParams.get('child') || 'votre enfant'
  
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [isProcessing, setIsProcessing] = useState(false)

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(selectedProduct === productId ? null : productId)
  }

  const handleAddUpsell = async () => {
    if (!selectedProduct) return
    
    setIsProcessing(true)
    
    // Ici on ajouterait la logique pour créer une commande additionnelle
    // Pour l'instant, on simule le processus
    setTimeout(() => {
      router.push(`/confirmation-finale?order=${orderNumber}&upsell=${selectedProduct}`)
    }, 2000)
  }

  const handleSkip = () => {
    router.push(`/confirmation-finale?order=${orderNumber}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header avec urgence */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6" />
            <span className="font-bold">Offre Exclusive Post-Commande</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Timer className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* En-tête de félicitations */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Félicitations ! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Votre commande <span className="font-bold text-purple-600">{orderNumber}</span> est confirmée !
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 inline-block">
            <p className="text-sm text-yellow-800">
              <Sparkles className="w-4 h-4 inline mr-2" />
              <strong>Offre spéciale :</strong> Complétez votre collection avec ces produits exclusifs !
            </p>
          </div>
        </div>

        {/* Produits d'upsell */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {upsellProducts.map((product) => {
            const Icon = product.icon
            const isSelected = selectedProduct === product.id
            
            return (
              <div
                key={product.id}
                className={`relative bg-white rounded-xl shadow-lg border-2 transition-all cursor-pointer transform hover:scale-105 ${
                  isSelected 
                    ? 'border-purple-500 ring-4 ring-purple-200' 
                    : 'border-gray-200 hover:border-purple-300'
                } ${product.popular ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => handleProductSelect(product.id)}
              >
                {/* Badge populaire */}
                {product.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      POPULAIRE
                    </div>
                  </div>
                )}

                {/* Badge promo */}
                {product.badge && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    {product.badge}
                  </div>
                )}

                <div className="p-6">
                  {/* Icône et titre */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.description}</p>
                    </div>
                  </div>

                  {/* Prix */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-purple-600">
                        {product.salePrice.toFixed(2)}€
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        {product.originalPrice.toFixed(2)}€
                      </span>
                    </div>
                    <p className="text-sm text-green-600 font-medium">
                      Économisez {product.savings.toFixed(2)}€ !
                    </p>
                  </div>

                  {/* Caractéristiques */}
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Bouton de sélection */}
                  <div className={`w-full p-3 rounded-lg border-2 border-dashed transition-colors ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-purple-400'
                  }`}>
                    <div className="text-center">
                      {isSelected ? (
                        <span className="text-purple-600 font-medium">✓ Sélectionné</span>
                      ) : (
                        <span className="text-gray-600">Cliquez pour sélectionner</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleAddUpsell}
            disabled={!selectedProduct || isProcessing}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              selectedProduct && !isProcessing
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Traitement...
              </div>
            ) : selectedProduct ? (
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Ajouter à ma commande
                <ArrowRight className="w-5 h-5" />
              </div>
            ) : (
              'Sélectionnez un produit'
            )}
          </button>

          <button
            onClick={handleSkip}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors underline"
          >
            Non merci, continuer
          </button>
        </div>

        {/* Garanties et réassurance */}
        <div className="mt-12 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-center mb-6 text-gray-800">
            🛡️ Nos Garanties
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Qualité Premium</h4>
              <p className="text-sm text-gray-600">Matériaux de haute qualité, satisfaction garantie</p>
            </div>
            <div>
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Livraison Groupée</h4>
              <p className="text-sm text-gray-600">Tout dans le même colis, économique et pratique</p>
            </div>
            <div>
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Offre Exclusive</h4>
              <p className="text-sm text-gray-600">Prix spéciaux uniquement après commande</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { productSettingsService } from '@/lib/productSettings'
import { shippingSettingsService } from '@/lib/shippingSettings'
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
  ShoppingCart,
  Check,
  Plus,
  X
} from 'lucide-react'

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

// Les produits upsell sont maintenant chargés dynamiquement

// Articles mis en pause (Photo et Livre) - peuvent être réactivés depuis l'admin
const pausedProducts: UpsellProduct[] = [
  {
    id: 'photo-premium',
    name: 'Photo Doudou Premium (en pause)',
    description: 'Une magnifique photo format 13x18 avec cadre inclus',
    originalPrice: 39.90,
    salePrice: 29.90,
    savings: 10.00,
    icon: Image,
    badge: 'Cadre Inclus',
    features: [
      'Format 13x18 haute qualité',
      'Papier photo premium',
      'Cadre élégant inclus',
      'Prêt à accrocher',
      'Texte personnalisé avec prénom'
    ]
  },
  {
    id: 'livre-histoire',
    name: 'Livre d\'Histoire Personnalisé (en pause)',
    description: 'L\'histoire magique de votre doudou en 8-10 pages illustrées',
    originalPrice: 34.90,
    salePrice: 24.90,
    savings: 10.00,
    icon: BookOpen,
    badge: 'Populaire',
    features: [
      '8-10 pages d\'histoire',
      'Illustrations personnalisées',
      'Prénom intégré dans l\'histoire',
      'Couverture rigide',
      'Format 21x21cm'
    ]
  }
]

export default function PreCommandePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Données du formulaire transmises
  const petName = searchParams.get('petName') || 'votre doudou'
  const animalType = searchParams.get('animalType') || 'animal'
  const childName = searchParams.get('childName') || 'votre enfant'
  const childAge = searchParams.get('childAge') || ''
  const email = searchParams.get('email') || ''
  const address = searchParams.get('address') || ''
  const city = searchParams.get('city') || ''
  const postalCode = searchParams.get('postalCode') || ''
  const notes = searchParams.get('notes') || ''
  const numberOfSheets = parseInt(searchParams.get('numberOfSheets') || '1')
  const photo = searchParams.get('photo') || ''
  
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([])

  // Charger les produits upsell actifs au montage du composant
  useEffect(() => {
    const activeProducts = productSettingsService.getActiveUpsellProducts()
    const convertedProducts: UpsellProduct[] = activeProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      originalPrice: product.originalPrice,
      salePrice: product.salePrice,
      savings: product.savings,
      icon: getIconComponent(product.icon),
      badge: product.badge,
      popular: product.popular,
      features: product.features
    }))
    setUpsellProducts(convertedProducts)
    
    // Charger le prix de base dynamiquement
    const baseProduct = productSettingsService.getProduct('planche-base')
    if (baseProduct) {
      setBasePricePerSheet(baseProduct.salePrice)
      console.log('💰 Prix planche de base chargé:', baseProduct.salePrice)
    }
    
    console.log('🏷️ Produits upsell actifs chargés:', convertedProducts)
  }, [])

  // Fonction pour convertir les icônes texte en composants
  const getIconComponent = (iconText: string) => {
    switch (iconText) {
      case '🏷️': return Sticker
      case '🖼️': return Image
      case '📖': return BookOpen
      default: return Sticker
    }
  }

  // Prix de base
  const [basePricePerSheet, setBasePricePerSheet] = useState(12.90)
  const basePrice = numberOfSheets * basePricePerSheet
  
  // Calcul du total avec upsells
  const upsellTotal = selectedProducts.reduce((total, productId) => {
    const product = upsellProducts.find(p => p.id === productId)
    return total + (product?.salePrice || 0)
  }, 0)
  
  // Calcul des frais de livraison dynamiques
  const shippingInfo = shippingSettingsService.calculateShipping(selectedProducts)
  const shippingCost = shippingInfo.cost
  
  const totalPrice = basePrice + upsellTotal + shippingCost

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleRemoveFromCart = (productId: string) => {
    setSelectedProducts(prev => prev.filter(id => id !== productId))
  }

  const handleFinalizeOrder = async () => {
    setIsProcessing(true)
    
    try {
      // Création de la commande avec upsells inclus
      const orderData = {
        petName,
        animalType,
        childName,
        childAge,
        email,
        address,
        city,
        postalCode,
        notes,
        numberOfSheets,
        photo,
        upsells: selectedProducts,
        totalAmount: totalPrice
      }

      console.log('📝 Données envoyées à l\'API:', {
        ...orderData,
        calculatedTotal: totalPrice,
        basePrice,
        upsellTotal,
        selectedProducts
      })

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.paymentUrl) {
          // Redirection vers PayPal avec le montant total
          window.location.href = result.paymentUrl
        } else {
          // Mode démo
          router.push(`/confirmation?order_id=${result.orderNumber}&demo=true`)
        }
      } else {
        console.error('Erreur lors de la création de la commande')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGoBack = () => {
    // Retour au formulaire de commande avec les données pré-remplies
    const params = new URLSearchParams({
      petName,
      animalType,
      childName,
      email,
      numberOfSheets: numberOfSheets.toString(),
      ...(photo && { photo })
    })
    router.push(`/commande?${params.toString()}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-4 rounded-full">
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ✨ Complétez votre collection !
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Ajoutez ces produits exclusifs à votre commande pour <strong>{childName}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 inline-block">
            <p className="text-sm text-blue-800">
              <Sparkles className="w-4 h-4 inline mr-2" />
              <strong>Livraison groupée :</strong> Tout arrive dans le même colis !
            </p>
          </div>
        </div>

        {/* Récapitulatif commande de base */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🛒 Votre commande actuelle
          </h2>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">
                  Stickers de {petName} ({animalType})
                </h3>
                <p className="text-sm text-gray-600">{numberOfSheets} planche(s)</p>
              </div>
            </div>
            <span className="font-bold text-purple-600">{basePrice.toFixed(2)}€</span>
          </div>
        </div>

        {/* Produits d'upsell */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎁 Produits exclusifs disponibles
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {upsellProducts.map((product) => {
              const Icon = product.icon
              const isSelected = selectedProducts.includes(product.id)
              
              return (
                <div
                  key={product.id}
                  className={`relative bg-white rounded-xl shadow-lg border-2 transition-all cursor-pointer transform hover:scale-105 ${
                    isSelected 
                      ? 'border-green-500 ring-4 ring-green-200' 
                      : 'border-gray-200 hover:border-purple-300'
                  } ${product.popular ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => handleProductToggle(product.id)}
                >
                  {/* Badge populaire */}
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {product.badge}
                      </div>
                    </div>
                  )}

                  {/* Badge promo */}
                  {product.badge && !product.popular && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                      {product.badge}
                    </div>
                  )}

                  {/* Icône de sélection */}
                  <div className="absolute top-4 left-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>

                  <div className="p-6 pt-12">
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

                    {/* Bouton d'action */}
                    <div className={`w-full p-3 rounded-lg border-2 transition-colors ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-purple-400'
                    }`}>
                      <div className="text-center">
                        {isSelected ? (
                          <span className="text-green-600 font-medium flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" />
                            Ajouté au panier
                          </span>
                        ) : (
                          <span className="text-purple-600 font-medium flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Ajouter au panier
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Récapitulatif final et total */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📋 Récapitulatif final
          </h2>
          
          {/* Commande de base */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-gray-700">Stickers personnalisés ({numberOfSheets} planche(s))</span>
            <span className="font-medium">{basePrice.toFixed(2)}€</span>
          </div>

          {/* Upsells sélectionnés */}
          {selectedProducts.length > 0 ? (
            selectedProducts.map(productId => {
              const product = upsellProducts.find(p => p.id === productId)
              if (!product) return null
              
              return (
                <div key={productId} className="flex items-center justify-between py-3 border-b border-gray-200 group">
                  <span className="text-gray-700 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-600" />
                    {product.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-green-600">{product.salePrice.toFixed(2)}€</span>
                    <button
                      onClick={() => handleRemoveFromCart(productId)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700"
                      title="Supprimer cet article"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-3 border-b border-gray-200">
              <span className="text-gray-500 text-sm italic">
                Aucun produit supplémentaire sélectionné
              </span>
            </div>
          )}

          {/* Frais de livraison */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-gray-700 flex items-center gap-2">
              🚚 Frais de livraison 
              <span className="text-xs text-gray-500">({shippingInfo.reason})</span>
            </span>
            <span className="font-medium">{shippingCost.toFixed(2)}€</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-4 text-xl font-bold border-t-2 border-gray-300 mt-4">
            <span className="text-gray-800">Total à payer :</span>
            <span className="text-green-600 text-2xl">{totalPrice.toFixed(2)}€</span>
          </div>

          {selectedProducts.length > 0 && (
            <div className="text-center text-sm text-green-600 font-medium">
              ✨ Vous économisez {selectedProducts.reduce((total, id) => {
                const product = upsellProducts.find(p => p.id === id)
                return total + (product?.savings || 0)
              }, 0).toFixed(2)}€ avec ces offres exclusives !
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleFinalizeOrder}
            disabled={isProcessing}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              !isProcessing
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Traitement...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Payer {totalPrice.toFixed(2)}€
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </button>

          <button
            onClick={handleGoBack}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors underline"
          >
            Modifier ma commande
          </button>
        </div>

        {/* Garanties */}
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
              <p className="text-sm text-gray-600">Prix spéciaux disponibles uniquement ici</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

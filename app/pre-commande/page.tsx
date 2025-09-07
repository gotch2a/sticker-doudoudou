'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  X,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react'

interface UpsellProduct {
  id: string
  name: string
  description: string
  originalPrice: number
  salePrice: number
  icon: React.ElementType
  features: string[]
  badge?: string
  popular?: boolean
}

// Les produits upsell sont maintenant chargés dynamiquement

// Fonction pour mapper les icônes selon l'ID du produit
const getIconForProduct = (productId: string): React.ElementType => {
  const iconMap: Record<string, React.ElementType> = {
    'planche-bonus': Sticker,
    'photo-premium': Image,
    'livre-histoire': BookOpen,
  }
  return iconMap[productId] || Gift
}

// Articles mis en pause (Photo et Livre) - peuvent être réactivés depuis l'admin
const pausedProducts: UpsellProduct[] = [
  {
    id: 'photo-premium',
    name: 'Photo Doudou Premium (en pause)',
    description: 'Une magnifique photo format 13x18 avec cadre inclus',
    originalPrice: 39.90,
    salePrice: 29.90,
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
  const [shippingCost, setShippingCost] = useState(3.5) // Valeur par défaut
  const [shippingReason, setShippingReason] = useState('Pour stickers uniquement (planche de base seule ou avec planche bonus)')
  
  // États pour le code de remise
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null)
  const [discountError, setDiscountError] = useState('')
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false)
  const [showDiscountField, setShowDiscountField] = useState(false)
  
  // Ref pour maintenir le focus sur le champ de saisie du code de remise
  const discountInputRef = useRef<HTMLInputElement>(null)

  // Charger les produits upsell actifs au montage du composant
  // DOCUMENTATION : Cette fonction charge les produits upsell depuis deux sources :
  // 1. D'abord depuis Supabase via l'API /api/admin/products (structure snake_case)
  // 2. En fallback depuis le fichier JSON local /data/product-settings.json (structure camelCase)
  // Cette approche garantit l'affichage des upsells même si Supabase ne contient pas les bons produits
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🔄 Chargement des produits depuis Supabase...')
        
        // Charger directement depuis l'API (Supabase) comme dans /commande
        const response = await fetch('/api/admin/products')
        let upsellProductsLoaded = false
        
        if (response.ok) {
          const data = await response.json()
          
          // L'API retourne { articles: [...] } et non { products: [...] }
          const products = data.articles || data.products || []
          console.log('📦 Articles récupérés depuis Supabase:', products.length)
          
          // Convertir la structure snake_case vers camelCase et filtrer les upsells
          const activeUpsellProducts = products
            .filter((p: any) => p.active && p.category === 'upsell')
            .map((product: any) => ({
              id: product.id,
              name: product.name,
              description: product.description,
              originalPrice: product.original_price || product.originalPrice,
              salePrice: product.sale_price || product.salePrice,
              features: product.features || [],
              badge: product.badge,
              popular: product.popular
            }))
          
          console.log('📦 Produits upsell actifs trouvés dans Supabase:', activeUpsellProducts.map((p: any) => p.name))
          
          if (activeUpsellProducts.length > 0) {
            const convertedProducts: UpsellProduct[] = activeUpsellProducts.map((product: any) => ({
              id: product.id,
              name: product.name,
              description: product.description,
              originalPrice: product.originalPrice,
              salePrice: product.salePrice,
              icon: getIconForProduct(product.id),
              features: product.features || [],
              badge: product.badge,
              popular: product.popular
            }))
            setUpsellProducts(convertedProducts)
            upsellProductsLoaded = true
            console.log('🏷️ Produits upsell actifs chargés depuis Supabase:', convertedProducts.length, 'produits')
          }
          
          // Charger le prix de base dynamiquement depuis Supabase
          const baseProduct = products.find((p: any) => p.id === 'planche-base' || p.category === 'base')
          if (baseProduct) {
            const basePrice = baseProduct.sale_price || baseProduct.salePrice
            setBasePricePerSheet(basePrice)
            console.log('💰 Prix planche de base chargé depuis Supabase:', basePrice)
          }
        }
        
        // Fallback : charger depuis le fichier JSON local si aucun upsell trouvé dans Supabase
        if (!upsellProductsLoaded) {
          console.log('⚠️ Aucun produit upsell trouvé dans Supabase, chargement depuis le fichier JSON local...')
          
          try {
            // Charger les produits depuis le fichier JSON local
            const jsonResponse = await fetch('/data/product-settings.json')
            if (jsonResponse.ok) {
              const localProducts = await jsonResponse.json()
              
              // Filtrer les produits upsell actifs
              const activeUpsellProducts = localProducts.filter((p: any) => p.active && p.category === 'upsell')
              console.log('📦 Produits upsell actifs trouvés dans le JSON local:', activeUpsellProducts.map((p: any) => p.name))
              
              const convertedProducts: UpsellProduct[] = activeUpsellProducts.map((product: any) => ({
                id: product.id,
                name: product.name,
                description: product.description,
                originalPrice: product.originalPrice,
                salePrice: product.salePrice,
                icon: getIconForProduct(product.id),
                features: product.features || [],
                badge: product.badge,
                popular: product.popular
              }))
              setUpsellProducts(convertedProducts)
              
              // Charger le prix de base depuis le JSON local
              const baseProduct = localProducts.find((p: any) => p.id === 'planche-base')
              if (baseProduct) {
                setBasePricePerSheet(baseProduct.salePrice)
                console.log('💰 Prix planche de base chargé depuis le JSON local:', baseProduct.salePrice)
              }
              
              console.log('🏷️ Produits upsell actifs chargés depuis le JSON local:', convertedProducts.length, 'produits')
              convertedProducts.forEach(p => console.log('  ✅', p.name))
            } else {
              console.error('❌ Erreur chargement du fichier JSON local')
            }
          } catch (jsonError) {
            console.error('❌ Erreur lors du chargement du fichier JSON local:', jsonError)
          }
        }

        // Charger les paramètres de livraison depuis le serveur
        await shippingSettingsService.loadFromServer()
        const initialShippingInfo = shippingSettingsService.calculateShipping([]) // Aucun produit sélectionné au début
        setShippingCost(initialShippingInfo.cost)
        setShippingReason(initialShippingInfo.reason)
        console.log('🚚 Paramètres de livraison chargés:', initialShippingInfo)
        
      } catch (error) {
        console.error('❌ Erreur chargement produits:', error)
      }
    }
    
    loadProducts()
  }, [])

  // Recalculer les frais de livraison quand les produits sélectionnés changent
  useEffect(() => {
    const updatedShippingInfo = shippingSettingsService.calculateShipping(selectedProducts)
    setShippingCost(updatedShippingInfo.cost)
    setShippingReason(updatedShippingInfo.reason)
    console.log('🚚 Frais de livraison mis à jour:', updatedShippingInfo)
  }, [selectedProducts])



  // Fonction pour calculer le pourcentage de remise dynamiquement
  const calculateDiscountPercentage = (originalPrice: number, salePrice: number): string => {
    if (originalPrice <= salePrice) return ''
    const discount = ((originalPrice - salePrice) / originalPrice) * 100
    return `-${Math.round(discount)}%`
  }

  // Fonction pour calculer les économies dynamiquement
  const calculateSavings = (originalPrice: number, salePrice: number): number => {
    return Math.max(0, originalPrice - salePrice)
  }

  // Calcul des remises totales pour tous les produits sélectionnés
  const calculateTotalSavings = (): number => {
    return selectedProducts.reduce((total, productId) => {
      const product = upsellProducts.find(p => p.id === productId)
      if (product) {
        return total + calculateSavings(product.originalPrice, product.salePrice)
      }
      return total
    }, 0)
  }

  // Calcul du prix original total (avant remises)
  const calculateOriginalTotal = (): number => {
    const baseOriginalPrice = basePrice // Le prix de base n'a pas de remise
    const upsellOriginalTotal = selectedProducts.reduce((total, productId) => {
      const product = upsellProducts.find(p => p.id === productId)
      return total + (product?.originalPrice || 0)
    }, 0)
    return baseOriginalPrice + upsellOriginalTotal + shippingCost
  }



  // Prix de base
  const [basePricePerSheet, setBasePricePerSheet] = useState(12.90)
  const basePrice = numberOfSheets * basePricePerSheet
  
  // Calcul du total avec upsells
  const upsellTotal = selectedProducts.reduce((total, productId) => {
    const product = upsellProducts.find(p => p.id === productId)
    return total + (product?.salePrice || 0)
  }, 0)
  
  // Les frais de livraison sont maintenant gérés par les variables d'état
  
  // Calcul du total avec remise
  const subtotal = basePrice + upsellTotal + shippingCost
  const discountAmount = appliedDiscount ? appliedDiscount.discountAmount : 0
  const totalPrice = Math.max(0, subtotal - discountAmount)

  // Fonction pour valider le code de remise
  // DOCUMENTATION : Utilisation de useCallback pour éviter les re-créations de fonction
  // qui peuvent causer des re-rendus et la perte de focus
  const validateDiscountCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setAppliedDiscount(null)
      setDiscountError('')
      return
    }

    setIsValidatingDiscount(true)
    setDiscountError('')

    try {
      // Calculer le subtotal au moment de la validation pour avoir la valeur la plus récente
      const currentSubtotal = basePrice + upsellTotal + shippingCost
      
      const response = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.trim(),
          totalAmount: currentSubtotal 
        })
      })

      const result = await response.json()

      if (result.success) {
        setAppliedDiscount(result.discountCode)
        setDiscountError('')
        console.log('✅ Code de remise appliqué:', result.discountCode)
      } else {
        setAppliedDiscount(null)
        setDiscountError(result.error)
      }
    } catch (error) {
      console.error('❌ Erreur validation code de remise:', error)
      setAppliedDiscount(null)
      setDiscountError('Erreur de validation du code')
    } finally {
      setIsValidatingDiscount(false)
    }
  }, [basePrice, upsellTotal, shippingCost]) // Dépendances nécessaires pour le calcul

  // Validation automatique du code quand il change
  // DOCUMENTATION : Optimisation pour éviter la perte de focus du curseur
  // Le useEffect ne se déclenche que quand discountCode change, pas subtotal
  // La validation du montant se fait dans validateDiscountCode directement
  useEffect(() => {
    const timer = setTimeout(() => {
      if (discountCode.trim()) {
        validateDiscountCode(discountCode)
      } else {
        setAppliedDiscount(null)
        setDiscountError('')
      }
    }, 800) // Debounce augmenté à 800ms pour réduire les appels

    return () => clearTimeout(timer)
  }, [discountCode]) // Suppression de 'subtotal' des dépendances

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
      // Création de la commande avec upsells et code de remise inclus
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
        totalAmount: totalPrice,
        subtotal: subtotal,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        discountAmount: appliedDiscount ? appliedDiscount.discountAmount : 0
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
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 p-4 rounded-full">
              <Gift className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ✨ Complétez votre collection !
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Ajoutez ces produits exclusifs à votre commande pour <strong>{childName}</strong>
          </p>
          <div className="bg-sage-50 border border-sage-200 rounded-lg p-4 mb-6 inline-block">
            <p className="text-sm text-sage-800">
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
              <div className="bg-primary-100 p-2 rounded-lg">
                <Heart className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">
                  Stickers de {petName} ({animalType})
                </h3>
                <p className="text-sm text-gray-600">{numberOfSheets} planche(s)</p>
              </div>
            </div>
            <span className="font-bold text-primary-600">{basePrice.toFixed(2)}€</span>
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
                      : 'border-gray-200 hover:border-primary-300'
                  } ${product.popular ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => handleProductToggle(product.id)}
                >
                  {/* Badge populaire - sans afficher le pourcentage de remise */}
                  {(() => {
                    const discountPercentage = calculateDiscountPercentage(product.originalPrice, product.salePrice)
                    const hasDiscount = !!discountPercentage
                    
                    return product.popular && !hasDiscount ? (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Populaire
                        </div>
                      </div>
                    ) : null
                  })()}

                  {/* Badge promo - uniquement calculé dynamiquement */}
                  {(() => {
                    const discountPercentage = calculateDiscountPercentage(product.originalPrice, product.salePrice)
                    return discountPercentage ? (
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        {discountPercentage}
                      </div>
                    ) : null
                  })()}

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
                      <div className="bg-primary-100 p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.description}</p>
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-primary-600">
                          {product.salePrice.toFixed(2)}€
                        </span>
                        {product.originalPrice > product.salePrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {product.originalPrice.toFixed(2)}€
                          </span>
                        )}
                      </div>
                      {(() => {
                        const savings = calculateSavings(product.originalPrice, product.salePrice)
                        return savings > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            Économisez {savings.toFixed(2)}€ !
                          </p>
                        )
                      })()}
                    </div>

                    {/* Caractéristiques */}
                    <ul className="space-y-2 mb-6">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Bouton d'action */}
                    <div className={`w-full p-3 rounded-lg border-2 transition-colors ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-primary-400'
                    }`}>
                      <div className="text-center">
                        {isSelected ? (
                          <span className="text-green-600 font-medium flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" />
                            Ajouté au panier
                          </span>
                        ) : (
                          <span className="text-primary-600 font-medium flex items-center justify-center gap-2">
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

          {/* Section code de remise */}
          <div className="py-3 border-b border-gray-200">
            <button
              onClick={() => setShowDiscountField(!showDiscountField)}
              className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Avez-vous un code de remise ?
              </span>
              {showDiscountField ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showDiscountField && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={discountInputRef}
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      const newValue = e.target.value.toUpperCase()
                      setDiscountCode(newValue)
                    }}
                    placeholder="Entrez votre code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isValidatingDiscount}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {discountCode && (
                    <button
                      onClick={() => {
                        setDiscountCode('')
                        setAppliedDiscount(null)
                        setDiscountError('')
                      }}
                      className="px-3 py-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {isValidatingDiscount && (
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border border-gray-300 border-t-primary-500 rounded-full"></div>
                    Validation en cours...
                  </div>
                )}
                
                {discountError && (
                  <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    {discountError}
                  </div>
                )}
                
                {appliedDiscount && (
                  <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Code appliqué: -{appliedDiscount.discountAmount.toFixed(2)}€
                    {appliedDiscount.description && (
                      <span className="text-gray-500">({appliedDiscount.description})</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Frais de livraison */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-gray-700 flex items-center gap-2">
              🚚 Frais de livraison 
              <span className="text-xs text-gray-500">({shippingReason})</span>
            </span>
            <span className="font-medium">{shippingCost.toFixed(2)}€</span>
          </div>

          {/* Récapitulatif des remises si applicable */}
          {(() => {
            const productSavings = calculateTotalSavings()
            const codeDiscount = appliedDiscount ? appliedDiscount.discountAmount : 0
            const totalSavings = productSavings + codeDiscount
            
            return totalSavings > 0 ? (
              <div className="py-3 border-b border-gray-200 bg-green-50 -mx-4 px-4 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="text-gray-600">{subtotal.toFixed(2)}€</span>
                </div>
                
                {productSavings > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700 flex items-center gap-1">
                      🏷️ Remises produits
                    </span>
                    <span className="text-green-700">-{productSavings.toFixed(2)}€</span>
                  </div>
                )}
                
                {codeDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Code {appliedDiscount.code}
                    </span>
                    <span className="text-green-700">-{codeDiscount.toFixed(2)}€</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm font-medium pt-1 border-t border-green-200 mt-1">
                  <span className="text-green-700">Économies totales</span>
                  <span className="text-green-700">-{totalSavings.toFixed(2)}€</span>
                </div>
              </div>
            ) : null
          })()}

          {/* Total */}
          <div className="flex items-center justify-between py-4 text-xl font-bold border-t-2 border-gray-300 mt-4">
            <span className="text-gray-800">Total à payer :</span>
            <span className="text-green-600 text-2xl">{totalPrice.toFixed(2)}€</span>
          </div>


        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col gap-4 justify-center items-center text-center w-full">
          <button
            onClick={handleFinalizeOrder}
            disabled={isProcessing}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all mx-auto ${
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

          {/* Logo PayPal et sécurité */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Paiement 100% sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Propulsé par</span>
              <svg width="120" height="30" viewBox="0 0 200 50" className="opacity-90">
                <defs>
                  <linearGradient id="paypal-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#009cde', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#003087', stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <text x="10" y="35" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="url(#paypal-blue)">PayPal</text>
              </svg>
            </div>
          </div>

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
              <div className="bg-sage-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-sage-600" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Livraison Groupée</h4>
              <p className="text-sm text-gray-600">Tout dans le même colis, économique et pratique</p>
            </div>
            <div>
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6 text-primary-600" />
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

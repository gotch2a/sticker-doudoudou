'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Camera, 
  Upload, 
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePayPal } from '@/hooks/usePayPal'
import { shippingSettingsService } from '@/lib/shippingSettings'
import { useSmartPricing, usePricingUtils } from '@/hooks/useSmartPricing'
import { DiscountNotification } from '@/components/ui/DiscountBadge'

interface FormData {
  photo: File | null
  petName: string
  animalType: string
  childName: string
  childAge: string
  parentFirstName: string
  parentLastName: string
  address: string
  city: string
  postalCode: string
  numberOfSheets: number
  notes: string
  email: string
  consent: boolean
}

export default function CommandePage() {
  const router = useRouter()
  const { createOrder, isLoading: paypalLoading } = usePayPal()
  const { 
    pricing, 
    loading: pricingLoading,
    hasDiscount,
    calculatePriceDebounced,
    reset: resetPricing
  } = useSmartPricing()
  const { formatPrice } = usePricingUtils()
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    petName: '',
    animalType: '',
    childName: '',
    childAge: '',
    parentFirstName: '',
    parentLastName: '',
    address: '',
    city: '',
    postalCode: '',
    numberOfSheets: 1, // Fixé à 1 planche pour cette étape
    notes: '',
    email: '',
    consent: false
  })
  
  // Préremplir les données utilisateur si connecté
  useEffect(() => {
    const loadUserData = () => {
      if (typeof window !== 'undefined') {
        const isAuth = localStorage.getItem('isAuthenticated') === 'true'
        const userStr = localStorage.getItem('user')
        
        if (isAuth && userStr) {
          try {
            const user = JSON.parse(userStr)
            console.log('👤 Préremplissage données utilisateur:', user.first_name)
            
            setFormData(prev => ({
              ...prev,
              parentFirstName: user.first_name || prev.parentFirstName,
              parentLastName: user.last_name || prev.parentLastName,
              email: user.email || prev.email,
              // 🎯 CORRECTION: Préremplir aussi l'adresse
              address: user.address || prev.address,
              city: user.city || prev.city,
              postalCode: user.postalCode || prev.postalCode
            }))
          } catch (error) {
            console.error('❌ Erreur préremplissage:', error)
          }
        }
      }
    }
    
    loadUserData()
  }, [])
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shippingCost, setShippingCost] = useState(3.5) // Valeur par défaut
  const [shippingReason, setShippingReason] = useState('Pour stickers uniquement (planche de base seule ou avec planche bonus)')

  // Charger les paramètres de livraison depuis le serveur
  useEffect(() => {
    const loadShippingSettings = async () => {
      try {
        await shippingSettingsService.loadFromServer()
        const shippingInfo = shippingSettingsService.calculateShipping([]) // Pas d'upsells sur cette page
        setShippingCost(shippingInfo.cost)
        setShippingReason(shippingInfo.reason)
        console.log('🚚 Paramètres de livraison chargés:', shippingInfo)
      } catch (error) {
        console.error('❌ Erreur chargement paramètres livraison:', error)
      }
    }
    
    loadShippingSettings()
  }, [])



  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validation du fichier
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
      
      if (file.size > maxSize) {
        setErrors({ ...errors, photo: 'L\'image doit faire moins de 10MB' })
        return
      }
      
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, photo: 'Format accepté: JPEG, PNG, HEIC' })
        return
      }

      setFormData({ ...formData, photo: file })
      setErrors({ ...errors, photo: '' })
      
      // Prévisualisation
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.photo) newErrors.photo = 'Une photo du doudou est requise'
    if (!formData.petName.trim()) newErrors.petName = 'Le surnom du doudou est requis'
    if (!formData.animalType.trim()) newErrors.animalType = 'Dites-nous ce que c\'est comme objet'
    if (!formData.childName.trim()) newErrors.childName = 'Le prénom de l\'enfant est requis'
    if (!formData.childAge) newErrors.childAge = 'L\'âge de l\'enfant est requis'
    if (!formData.parentFirstName.trim()) newErrors.parentFirstName = 'Votre prénom est requis'
    if (!formData.parentLastName.trim()) newErrors.parentLastName = 'Votre nom de famille est requis'
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise'
    if (!formData.city.trim()) newErrors.city = 'La ville est requise'
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Le code postal est requis'
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis'
    if (formData.email && !isValidEmail(formData.email)) newErrors.email = 'Email invalide'
    if (!formData.consent) newErrors.consent = 'Vous devez accepter les conditions'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      // Upload de la photo d'abord
      let photoFileName = ''
      if (formData.photo) {
        const uploadFormData = new FormData()
        uploadFormData.append('photo', formData.photo)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          photoFileName = uploadResult.fileName
        } else {
          const errorText = await uploadResponse.text()
          console.error('❌ Erreur upload photo:', errorText)
          throw new Error(`Upload échoué: ${uploadResponse.status}`)
        }
      }

      // Redirection vers page d'upsell avec les données du formulaire et prix
      const params = new URLSearchParams({
        petName: formData.petName,
        animalType: formData.animalType,
        childName: formData.childName,
        childAge: formData.childAge,
        parentFirstName: formData.parentFirstName,
        parentLastName: formData.parentLastName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        notes: formData.notes,
        numberOfSheets: formData.numberOfSheets.toString(),
        // 🎯 CORRECTION: Passer les prix corrects à la page pré-commande
        basePrice: (pricing ? pricing.priceBreakdown.basePrice : basePrice).toString(),
        shippingPrice: (pricing ? pricing.priceBreakdown.shippingPrice : shippingCost).toString(),
        totalPrice: totalPrice.toString(),
        hasDiscount: hasDiscount.toString(),
        ...(photoFileName && { photo: `/api/photos/${photoFileName}` }),
        // Passer les informations de réduction si applicable
        ...(pricing && hasDiscount && {
          discountAmount: pricing.discount.amount.toString(),
          discountReason: pricing.discount.reason,
          originalPrice: pricing.originalPrice.toString(),
          savingsAmount: pricing.savingsAmount.toString()
        })
      })
      
      router.push(`/pre-commande?${params.toString()}`)
    } catch (error) {
      console.error('❌ Erreur:', error)
      setErrors({ submit: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}` })
    } finally {
      setIsLoading(false)
    }
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const [pricePerSheet, setPricePerSheet] = useState(12.90)
  
  // 🎯 CORRECTION: Charger le prix dynamiquement depuis l'admin
  useEffect(() => {
    const loadBasePrice = async () => {
      try {
        const response = await fetch('/api/admin/products')
        if (response.ok) {
          const { articles } = await response.json()
          const baseProduct = articles.find((p: any) => p.id === 'planche-base' || p.category === 'base')
          if (baseProduct) {
            setPricePerSheet(baseProduct.sale_price)
            console.log('💰 Prix planche chargé depuis admin:', baseProduct.sale_price)
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement prix admin:', error)
      }
    }
    
    loadBasePrice()
  }, [])
  const basePrice = 1 * pricePerSheet // Toujours 1 planche à cette étape
  
  // Prix intelligent ou prix standard
  const displayPrice = pricing?.finalPrice || (basePrice + shippingCost)
  const totalPrice = displayPrice

  // Charger le prix dynamique au montage
  useEffect(() => {
    const loadPrice = async () => {
      try {
        const response = await fetch('/api/admin/products')
        if (response.ok) {
          const { products } = await response.json()
          const baseProduct = products.find((p: any) => p.id === 'planche-base')
          if (baseProduct) {
            setPricePerSheet(baseProduct.salePrice)
          }
        }
      } catch (error) {
        console.error('Erreur chargement prix:', error)
      }
    }
    loadPrice()
  }, [])

  // TEMPORAIREMENT DÉSACTIVÉ - Calculer le prix intelligent quand les données changent
  // useEffect(() => {
  //   if (formData.email && formData.petName && formData.animalType) {
  //     console.log('🧮 Recalcul prix intelligent...')
      
  //     calculatePriceDebounced({
  //       email: formData.email,
  //       petName: formData.petName,
  //       animalType: formData.animalType,
  //       numberOfSheets: formData.numberOfSheets,
  //       photoUrl: photoPreview || undefined
  //     })
  //   } else {
  //     // Réinitialiser le pricing si données insuffisantes
  //     resetPricing()
  //   }
  // }, [
  //   formData.email, 
  //   formData.petName, 
  //   formData.animalType, 
  //   formData.numberOfSheets,
  //   photoPreview,
  //   calculatePriceDebounced,
  //   resetPricing
  // ])

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/" 
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-600">Créer les stickers</h1>
            <p className="text-gray-600">Étape 1 sur 3</p>
          </div>
        </div>

        {/* TEMPORAIREMENT DÉSACTIVÉ - Notification de réduction */}
        {/* {hasDiscount && pricing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <DiscountNotification
              discount={pricing.discount}
              petName={formData.petName}
              savingsAmount={pricing.savingsAmount}
            />
          </motion.div>
        )} */}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Photo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <label className="block text-lg font-semibold text-gray-600 mb-4">
              📸 Photo du doudou
            </label>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className={`block w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  photoPreview 
                    ? 'border-green-300 bg-green-50' 
                    : errors.photo 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                {photoPreview ? (
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                      <img 
                        src={photoPreview} 
                        alt="Prévisualisation" 
                        className="max-w-full max-h-full object-contain rounded-xl"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Photo ajoutée !</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      Ajoutez une photo du doudou
                    </p>
                    <p className="text-sm text-gray-500">
                      JPEG, PNG ou HEIC • Max 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>
            
            {errors.photo && (
              <div className="flex items-center gap-2 text-red-600 mt-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.photo}</span>
              </div>
            )}
          </motion.div>

          {/* Infos Doudou */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-600 mb-4">
              🧸 À propos du doudou
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Surnom du doudou *
              </label>
              <input
                type="text"
                value={formData.petName}
                onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                placeholder="Ex: Nounours, Pinky, Gros Câlin..."
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.petName ? 'border-red-300' : 'border-gray-300'
                } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
              />
              {errors.petName && (
                <span className="text-red-600 text-sm mt-1">{errors.petName}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                C'est quoi comme objet ? *
              </label>
              <input
                type="text"
                value={formData.animalType}
                onChange={(e) => setFormData({ ...formData, animalType: e.target.value })}
                placeholder="Ex: lion, poulpe, carotte, voiture, dragon..."
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.animalType ? 'border-red-300' : 'border-gray-300'
                } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
              />
              {errors.animalType && (
                <span className="text-red-600 text-sm mt-1">{errors.animalType}</span>
              )}
            </div>
          </motion.div>

          {/* Infos Enfant */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-600 mb-4">
              👶 Infos de livraison
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom de l'enfant *
              </label>
              <input
                type="text"
                name="field_child_name_xyz123"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                placeholder="Le prénom de votre petit bout"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.childName ? 'border-red-300' : 'border-gray-300'
                } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
                autoComplete="new-password"
                role="textbox"
                aria-autocomplete="none"
                data-form-type="other"
              />
              {errors.childName && (
                <span className="text-red-600 text-sm mt-1">{errors.childName}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Âge de l'enfant *
              </label>
              <select
                value={formData.childAge}
                onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.childAge ? 'border-red-300' : 'border-gray-300'
                } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
              >
                <option value="">Sélectionner l'âge</option>
                <option value="0-12mois">0-12 mois (bébé)</option>
                <option value="1-2ans">1-2 ans (bambin)</option>
                <option value="3-5ans">3-5 ans (petite enfance)</option>
                <option value="6-8ans">6-8 ans (enfant)</option>
                <option value="9-12ans">9-12 ans (pré-ado)</option>
                <option value="13-17ans">13-17 ans (adolescent)</option>
                <option value="18ans+">18 ans et plus (adulte)</option>
              </select>
              {errors.childAge && (
                <span className="text-red-600 text-sm mt-1">{errors.childAge}</span>
              )}
            </div>

            {/* Informations du parent */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <h3 className="text-md font-medium text-gray-800 mb-4">👤 Vos informations</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre prénom *
                  </label>
                  <input
                    type="text"
                    name="parentFirstName"
                    autoComplete="given-name"
                    value={formData.parentFirstName}
                    onChange={(e) => setFormData({ ...formData, parentFirstName: e.target.value })}
                    placeholder="Votre prénom"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.parentFirstName ? 'border-red-300' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
                  />
                  {errors.parentFirstName && (
                    <span className="text-red-600 text-sm mt-1">{errors.parentFirstName}</span>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre nom de famille *
                  </label>
                  <input
                    type="text"
                    name="parentLastName"
                    autoComplete="family-name"
                    value={formData.parentLastName}
                    onChange={(e) => setFormData({ ...formData, parentLastName: e.target.value })}
                    placeholder="Votre nom"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.parentLastName ? 'border-red-300' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
                  />
                  {errors.parentLastName && (
                    <span className="text-red-600 text-sm mt-1">{errors.parentLastName}</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète *
              </label>
              <input
                type="text"
                name="address"
                autoComplete="street-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Numéro et nom de rue"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
              />
              {errors.address && (
                <span className="text-red-600 text-sm mt-1">{errors.address}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  name="city"
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Votre ville"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
                />
                {errors.city && (
                  <span className="text-red-600 text-sm mt-1">{errors.city}</span>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  autoComplete="postal-code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="75001"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.postalCode ? 'border-red-300' : 'border-gray-300'
                  } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
                />
                {errors.postalCode && (
                  <span className="text-red-600 text-sm mt-1">{errors.postalCode}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email pour la confirmation *
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="votre@email.fr"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors`}
              />
              {errors.email && (
                <span className="text-red-600 text-sm mt-1">{errors.email}</span>
              )}
            </div>
          </motion.div>

          {/* Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-600 mb-4">
              ⚙️ Options
            </h2>
            


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes pour l'artiste (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Aidez l'artiste ! Couleurs préférées de votre enfant ? Détails importants sur le doudou ? Contexte particulier ?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors resize-none"
              />
            </div>
          </motion.div>

          {/* Prix et Consentement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            {/* Affichage des prix avec tarification intelligente */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Planche de stickers personnalisés</span>
                <div className="flex items-center gap-2">
                  {pricing && hasDiscount ? (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        {pricing.priceBreakdown.basePrice + pricing.priceBreakdown.discountAmount}€
                      </span>
                      <span className="font-medium text-green-600">
                        {pricing.priceBreakdown.basePrice.toFixed(2)}€
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">{basePrice.toFixed(2)}€</span>
                  )}
                </div>
              </div>
              
              {/* Ligne de réduction si applicable */}
              {pricing && hasDiscount && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm flex items-center gap-1">
                    🎉 {pricing.discount.reason}
                  </span>
                  <span className="text-sm font-medium">
                    -{pricing.discount.amount.toFixed(2)}€
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 flex items-center gap-2">
                  🚚 Frais de livraison
                  <span className="text-xs text-gray-500">({shippingReason})</span>
                </span>
                <span className="font-medium">
                  {pricing ? pricing.priceBreakdown.shippingPrice.toFixed(2) : shippingCost.toFixed(2)}€
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <span className="text-lg font-semibold text-gray-600">Total</span>
              <div className="text-right">
                {pricing && hasDiscount && (
                  <div className="text-sm text-gray-400 line-through">
                    {pricing.originalPrice.toFixed(2)}€
                  </div>
                )}
                <span className={`text-2xl font-bold ${hasDiscount ? 'text-green-600' : 'text-primary-600'}`}>
                  {totalPrice.toFixed(2)}€
                </span>
                {pricing && hasDiscount && (
                  <div className="text-xs text-green-600 font-medium">
                    Économie: {pricing.savingsAmount.toFixed(2)}€
                  </div>
                )}
              </div>
            </div>
            
            {/* Indicateur de calcul en cours */}
            {pricingLoading && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
                Calcul du meilleur prix...
              </div>
            )}
            
            <div className="space-y-4 mt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  J'accepte les <Link href="/cgv" className="text-primary-600 underline">conditions générales</Link> et 
                  la <Link href="/confidentialite" className="text-primary-600 underline">politique de confidentialité</Link>. 
                  Je confirme que cette photo ne contient pas de personnages sous droits d'auteur.
                </span>
              </label>
              {errors.consent && (
                <span className="text-red-600 text-sm">{errors.consent}</span>
              )}
              
              {errors.submit && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors.submit}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Submit Button */}
          {/* Affichage erreur de soumission */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.submit}</span>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="submit"
              disabled={isLoading || paypalLoading}
              className={`w-full py-4 px-6 rounded-xl text-white font-semibold transition-all transform ${
                isLoading || paypalLoading
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary-600 hover:bg-primary-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading || paypalLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Traitement en cours...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Continuer ma commande
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </main>
  )
}

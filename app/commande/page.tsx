'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Camera, 
  Upload, 
  ArrowLeft,
  ArrowRight,
  Heart,
  AlertCircle,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePayPal } from '@/hooks/usePayPal'

interface FormData {
  photo: File | null
  petName: string
  animalType: string
  childName: string
  childAge: string
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
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    petName: '',
    animalType: '',
    childName: '',
    childAge: '',
    address: '',
    city: '',
    postalCode: '',
    numberOfSheets: 1, // Fixé à 1 planche pour cette étape
    notes: '',
    email: '',
    consent: false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)



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
        uploadFormData.append('file', formData.photo)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          photoFileName = uploadResult.filename
        }
      }

      // Redirection vers page d'upsell avec les données du formulaire
      const params = new URLSearchParams({
        petName: formData.petName,
        animalType: formData.animalType,
        childName: formData.childName,
        childAge: formData.childAge,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        notes: formData.notes,
        numberOfSheets: formData.numberOfSheets.toString(),
        ...(photoFileName && { photo: `/api/photos/${photoFileName}` })
      })
      
      router.push(`/pre-commande?${params.toString()}`)
    } catch (error) {
      console.error('Erreur:', error)
      setErrors({ submit: 'Une erreur est survenue. Veuillez réessayer.' })
    } finally {
      setIsLoading(false)
    }
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const [pricePerSheet, setPricePerSheet] = useState(12.90)
  const basePrice = formData.numberOfSheets * pricePerSheet
  const shippingCost = 3.5 // Prix de base pour les stickers seuls
  const totalPrice = basePrice + shippingCost

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
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
            <h1 className="text-2xl font-bold text-gray-900">Créer les stickers</h1>
            <p className="text-gray-600">Étape 1 sur 3</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Photo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <label className="block text-lg font-semibold text-gray-900 mb-4">
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
                    : 'border-gray-300 bg-gray-50 hover:border-pink-300 hover:bg-pink-50'
                }`}
              >
                {photoPreview ? (
                  <div className="text-center">
                    <img 
                      src={photoPreview} 
                      alt="Prévisualisation" 
                      className="w-32 h-32 object-cover rounded-xl mx-auto mb-4"
                    />
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Photo ajoutée !</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
                } focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors`}
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
                } focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors`}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              👶 Infos de livraison
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom de l'enfant *
              </label>
              <input
                type="text"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                placeholder="Le prénom de votre petit bout"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.childName ? 'border-red-300' : 'border-gray-300'
                } focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors`}
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
                } focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors`}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse complète *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Numéro et nom de rue"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                } focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors`}
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
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Votre ville"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  } focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors`}
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
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="75001"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.postalCode ? 'border-red-300' : 'border-gray-300'
                  } focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors`}
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="votre@email.fr"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors`}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ⚙️ Options
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de planches
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xl font-semibold text-pink-600 bg-pink-50 px-4 py-2 rounded-lg">
                  1 planche incluse
                </span>
                <span className="text-sm text-gray-500">
                  🎁 Des planches supplémentaires seront proposées à l'étape suivante
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes pour l'artiste (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Des détails spéciaux ? Couleurs préférées ? Accessoires du doudou ?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-colors resize-none"
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
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Stickers ({formData.numberOfSheets} planche{formData.numberOfSheets > 1 ? 's' : ''})</span>
                <span className="font-medium">{basePrice.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">🚚 Frais de livraison</span>
                <span className="font-medium">{shippingCost.toFixed(2)}€</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-pink-600">{totalPrice.toFixed(2)}€</span>
            </div>
            
            <div className="space-y-4 mt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-1 w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-600">
                  J'accepte les <Link href="/cgv" className="text-pink-600 underline">conditions générales</Link> et 
                  la <Link href="/confidentialite" className="text-pink-600 underline">politique de confidentialité</Link>. 
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
                  : 'bg-pink-600 hover:bg-pink-700 hover:scale-105 shadow-lg hover:shadow-xl'
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

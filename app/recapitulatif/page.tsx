'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  CreditCard,
  Shield,
  Truck,
  Clock,
  Heart,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RecapitulatifPage() {
  const router = useRouter()
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Données mockées - en réalité, elles viendraient de la session ou du state global
  const orderData = {
    photo: '/api/placeholder/doudou-photo.jpg',
    petName: 'Nounours',
    animalType: 'Ours',
    childName: 'Emma',
    numberOfSheets: 2,
    notes: 'Couleurs douces, il a un petit ruban rouge',
    address: '123 Rue de la Paix, 75001 Paris',
    pricePerSheet: 12.90,
    total: 25.80
  }

  const handlePayment = async () => {
    setIsProcessingPayment(true)
    
    try {
      // Ici on intégrerait PayPal
      // Pour le moment, simulation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Redirection vers la confirmation
      router.push('/confirmation?orderId=CMD-' + Date.now())
    } catch (error) {
      console.error('Erreur de paiement:', error)
      setIsProcessingPayment(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/commande" 
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-600">Récapitulatif</h1>
            <p className="text-gray-600">Étape 2 sur 3</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Résumé de la commande */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Votre commande
            </h2>

            <div className="space-y-6">
              {/* Photo et infos doudou */}
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                  {/* Placeholder pour la photo */}
                  <span className="text-3xl">🧸</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{orderData.petName}</h3>
                  <p className="text-gray-600">Type: {orderData.animalType}</p>
                  <p className="text-gray-600">Pour: {orderData.childName}</p>
                </div>
              </div>

              {/* Détails commande */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Nombre de planches:</span>
                  <p className="font-semibold">{orderData.numberOfSheets}</p>
                </div>
                <div>
                  <span className="text-gray-500">Prix unitaire:</span>
                  <p className="font-semibold">{orderData.pricePerSheet}€</p>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <span className="text-gray-500 text-sm">Adresse de livraison:</span>
                <p className="font-medium">{orderData.address}</p>
              </div>

              {/* Notes */}
              {orderData.notes && (
                <div>
                  <span className="text-gray-500 text-sm">Notes pour l'artiste:</span>
                  <p className="text-gray-700 italic">"{orderData.notes}"</p>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-pink-600">{orderData.total}€</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Garanties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nos garanties ✨
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Paiement sécurisé</p>
                  <p className="text-xs text-gray-500">PayPal & SSL</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Livraison gratuite</p>
                  <p className="text-xs text-gray-500">Colissimo</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Délai rapide</p>
                  <p className="text-xs text-gray-500">5-7 jours</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Processus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ce qui va se passer 🎨
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Votre commande est transmise</p>
                  <p className="text-sm text-gray-600">Notre artiste reçoit immédiatement toutes les infos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Création des stickers</p>
                  <p className="text-sm text-gray-600">Dessin à la main basé sur votre photo (2-3 jours)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Impression et expédition</p>
                  <p className="text-sm text-gray-600">Qualité premium, envoi sécurisé (2-3 jours)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-medium">Dans votre boîte aux lettres !</p>
                  <p className="text-sm text-gray-600">La joie de votre enfant n'a pas de prix</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bouton de paiement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className={`w-full py-4 px-6 rounded-xl text-white font-semibold transition-all transform ${
                isProcessingPayment 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessingPayment ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Traitement du paiement...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <CreditCard className="w-5 h-5" />
                  <span>Payer {orderData.total}€ et envoyer à l'artiste</span>
                </div>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              🔒 Paiement sécurisé par PayPal • Aucun stockage de vos données bancaires
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

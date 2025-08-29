'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  CheckCircle,
  Gift,
  Heart,
  Home,
  Calendar,
  Truck,
  Star,
  Mail,
  Download,
  Share2
} from 'lucide-react'
import Link from 'next/link'

export default function ConfirmationFinalePage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') || 'CMD-000000'
  const upsellProduct = searchParams.get('upsell')
  
  const [confetti, setConfetti] = useState(true)

  useEffect(() => {
    // Arrêter les confettis après 4 secondes
    const timer = setTimeout(() => setConfetti(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  const getUpsellDetails = (productId: string | null) => {
    switch (productId) {
      case 'photo-premium':
        return {
          name: 'Photo Doudou Premium',
          price: '29,90€',
          icon: '🖼️',
          description: 'Photo haute qualité avec cadre inclus'
        }
      case 'livre-histoire':
        return {
          name: 'Livre d\'Histoire Personnalisé',
          price: '24,90€',
          icon: '📖',
          description: 'Histoire magique en 16 pages illustrées'
        }
      case 'pack-stickers':
        return {
          name: 'Pack 3 Planches Bonus',
          price: '9,90€',
          icon: '🏷️',
          description: '3 planches supplémentaires à prix réduit'
        }
      default:
        return null
    }
  }

  const upsellDetails = getUpsellDetails(upsellProduct)

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Confettis animés */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-3 h-3 rounded-full animate-bounce`}
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'][Math.floor(Math.random() * 6)],
                animationDelay: Math.random() * 2 + 's',
                animationDuration: (Math.random() * 3 + 2) + 's'
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header principal */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-6 rounded-full shadow-lg">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            🎉 Commande Finalisée !
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            Merci pour votre confiance ! Votre commande est en cours de traitement.
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📋 Récapitulatif de votre commande
            </h2>
            
            <div className="space-y-4">
              {/* Commande principale */}
              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Stickers Doudou Personnalisés</h3>
                    <p className="text-sm text-gray-600">Commande #{orderNumber}</p>
                  </div>
                </div>
                <span className="font-bold text-purple-600">12,90€</span>
              </div>

              {/* Upsell si ajouté */}
              {upsellDetails && (
                <div className="flex items-center justify-between py-4 border-b border-gray-200 bg-green-50 rounded-lg px-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Gift className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {upsellDetails.icon} {upsellDetails.name}
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">AJOUTÉ</span>
                      </h3>
                      <p className="text-sm text-gray-600">{upsellDetails.description}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">{upsellDetails.price}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between py-4 text-xl font-bold border-t-2 border-gray-300">
                <span className="text-gray-800">Total :</span>
                <span className="text-green-600">
                  {upsellDetails ? 
                    (12.90 + parseFloat(upsellDetails.price.replace('€', '').replace(',', '.'))).toFixed(2) + '€'
                    : '12,90€'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Prochaines étapes */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Calendar className="w-7 h-7 text-blue-600" />
            Prochaines étapes
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Confirmation par email</h3>
              <p className="text-sm text-gray-600">Vous allez recevoir un email de confirmation avec tous les détails</p>
              <span className="text-xs text-blue-600 font-medium">Dans quelques minutes</span>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Création en cours</h3>
              <p className="text-sm text-gray-600">Notre artiste commence la création de vos produits personnalisés</p>
              <span className="text-xs text-purple-600 font-medium">Dans 24-48h</span>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Expédition</h3>
              <p className="text-sm text-gray-600">Livraison rapide à votre domicile</p>
              <span className="text-xs text-green-600 font-medium">3-5 jours ouvrés</span>
            </div>
          </div>
        </div>

        {/* Messages spéciaux selon upsell */}
        {upsellDetails && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                🎁 Excellent choix !
              </h2>
              <p className="text-lg mb-4">
                Votre {upsellDetails.name.toLowerCase()} sera créé avec le même soin que vos stickers.
              </p>
              <div className="bg-white/20 rounded-lg p-4 inline-block">
                <p className="font-medium">
                  ✨ Tous vos produits seront livrés ensemble dans le même colis !
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link 
            href="/"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all transform hover:scale-105 flex items-center gap-3"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
            <Share2 className="w-5 h-5" />
            Partager ma joie
          </button>
        </div>

        {/* Support client */}
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <h3 className="font-bold text-gray-800 mb-3">
            🤝 Besoin d'aide ?
          </h3>
          <p className="text-gray-600 mb-4">
            Notre équipe est là pour vous accompagner à chaque étape
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@stickerdoudou.fr" className="text-purple-600 hover:text-purple-800 font-medium">
              📧 support@stickerdoudou.fr
            </a>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="text-gray-600">
              📞 Réponse sous 24h
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}

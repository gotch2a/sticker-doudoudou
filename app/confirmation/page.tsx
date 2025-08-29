'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle,
  Mail,
  Heart,
  Home,
  Calendar,
  Truck,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id') || 'CMD-000000'
  const paypalToken = searchParams.get('token')
  const isDemo = searchParams.get('demo') === 'true'
  const [confetti, setConfetti] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'error'>('processing')

  useEffect(() => {
    // Mode démo : succès immédiat
    if (isDemo) {
      console.log('🎭 Mode démo activé - paiement simulé')
      setPaymentStatus('success')
    }
    // Capturer le paiement PayPal si on vient de PayPal
    else if (paypalToken && orderId) {
      capturePayPalPayment()
    } else {
      setPaymentStatus('success')
    }
    
    // Arrêter les confettis après 3 secondes
    const timer = setTimeout(() => setConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [paypalToken, orderId, isDemo])

  const capturePayPalPayment = async () => {
    try {
      const response = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paypalOrderId: paypalToken,
          orderNumber: orderId
        })
      })

      if (response.ok) {
        setPaymentStatus('success')
      } else {
        setPaymentStatus('error')
      }
    } catch (error) {
      console.error('Erreur capture PayPal:', error)
      setPaymentStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Confettis animés */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-pink-400 rounded-full"
              initial={{
                x: Math.random() * 800,
                y: -10,
                rotate: 0
              }}
              animate={{
                y: 800,
                rotate: 360
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                delay: Math.random() * 2,
                ease: "linear"
              }}
              style={{
                backgroundColor: ['#f472b6', '#a855f7', '#3b82f6', '#10b981'][Math.floor(Math.random() * 4)]
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {/* Animation de succès */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Commande confirmée ! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            Votre numéro de commande :
          </p>
          <p className="text-xl font-mono font-bold text-pink-600 bg-white px-4 py-2 rounded-lg inline-block shadow-md">
            {orderId}
          </p>
        </motion.div>

        {/* Carte principale */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Merci pour votre confiance !
            </h2>
            <p className="text-gray-600">
              Notre artiste a reçu votre commande et va créer quelque chose de magique pour votre petit bout.
            </p>
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-pink-600" />
              <span className="font-medium text-gray-900">Email de confirmation envoyé</span>
            </div>
            <p className="text-sm text-gray-600">
              Vérifiez votre boîte mail, vous avez reçu un récapitulatif complet de votre commande.
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 mb-4">Prochaines étapes :</h3>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                ✓
              </div>
              <div>
                <p className="font-medium text-green-700">Commande reçue</p>
                <p className="text-sm text-gray-600">Votre brief est transmis à l'artiste</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Création en cours</p>
                <p className="text-sm text-gray-600">
                  L'artiste dessine les stickers personnalisés (2-3 jours)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Impression & expédition</p>
                <p className="text-sm text-gray-600">
                  Impression haute qualité et envoi Colissimo (2-3 jours)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold">
                4
              </div>
              <div>
                <p className="font-medium text-gray-500">Livraison</p>
                <p className="text-sm text-gray-600">
                  Réception chez vous sous 5-7 jours ouvrés
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Infos supplémentaires */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid sm:grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Délai de livraison</span>
            </div>
            <p className="text-sm text-gray-600">
              Vous recevrez vos stickers dans <strong>5 à 7 jours ouvrés</strong>
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-5 h-5 text-green-600" />
              <span className="font-medium">Suivi de livraison</span>
            </div>
            <p className="text-sm text-gray-600">
              Un numéro de suivi vous sera envoyé par email dès l'expédition
            </p>
          </div>
        </motion.div>

        {/* Témoignage */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border border-yellow-200"
        >
          <div className="flex items-center gap-2 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-gray-800 mb-3 italic">
            "Ma fille de 3 ans n'en revient toujours pas ! Ses stickers de 'Lapinou' 
            sont affichés partout dans sa chambre. Merci pour cette belle surprise !"
          </p>
          <p className="text-sm text-gray-600 font-medium">— Sarah M., maman d'Emma</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link 
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-pink-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          
          <Link 
            href="/commande"
            className="flex-1 flex items-center justify-center gap-2 border border-pink-600 text-pink-600 py-3 px-6 rounded-xl font-medium hover:bg-pink-50 transition-colors"
          >
            <Heart className="w-5 h-5" />
            Commander pour un autre doudou
          </Link>
        </motion.div>

        {/* Note de bas de page */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500">
            Une question ? Contactez-nous à <a href="mailto:hello@stickerdoudou.fr" className="text-pink-600 underline">hello@stickerdoudou.fr</a>
          </p>
        </motion.div>
      </div>
    </main>
  )
}

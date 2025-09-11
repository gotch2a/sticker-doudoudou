'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle,
  Mail,
  Heart,
  Home,
  Calendar,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('order_id') || 'CMD-000000'
  const paypalToken = searchParams.get('token')
  const isDemo = searchParams.get('demo') === 'true'
  const [confetti, setConfetti] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [orderDetailsLoaded, setOrderDetailsLoaded] = useState(false)
  const [basePricePerSheet, setBasePricePerSheet] = useState(12.90)
  const captureInProgressRef = useRef(false)

  const capturePayPalPayment = async () => {
    if (captureInProgressRef.current) return
    captureInProgressRef.current = true
    
    try {
      console.log('🔄 Capture PayPal en cours...')
      const response = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paypalOrderId: paypalToken,  // ✅ Nom correct du paramètre
          orderNumber: orderId         // ✅ Nom correct du paramètre
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Paiement capturé avec succès')
        setPaymentStatus('success')
        fetchOrderDetails()
      } else {
        console.error('❌ Erreur capture:', result.error)
        setPaymentStatus('error')
      }
    } catch (error) {
      console.error('❌ Erreur capture PayPal:', error)
      setPaymentStatus('error')
    }
  }

  const fetchOrderDetails = async () => {
    if (orderDetailsLoaded) return
    
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const result = await response.json()
      
      if (result.success) {
        setOrderDetails(result.order)
        setOrderDetailsLoaded(true)
        
        // Connecter automatiquement l'utilisateur après commande validée
        await autoLoginAfterOrder(result.order)
      }
    } catch (error) {
      console.error('Erreur chargement détails commande:', error)
    }
  }

  const autoLoginAfterOrder = async (order: any) => {
    try {
      console.log('🔐 Connexion automatique après commande...')
      
      // Récupérer les infos utilisateur depuis l'email de la commande
      const response = await fetch(`/api/user/profile?email=${encodeURIComponent(order.client_email)}`)
      const result = await response.json()
      
      if (result.success && result.user) {
        // Connecter l'utilisateur localement
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('user', JSON.stringify(result.user))
        
        console.log('✅ Utilisateur connecté automatiquement:', result.user.first_name)
        
        // Forcer le rafraîchissement de la navigation
        window.dispatchEvent(new Event('storage'))
      }
    } catch (error) {
      console.error('❌ Erreur connexion automatique:', error)
    }
  }

  useEffect(() => {
    // Mode démo : succès immédiat + envoi des emails
    if (isDemo) {
      console.log('🎭 Mode démo activé - paiement simulé')
      setPaymentStatus('success')
      fetchOrderDetails()
      // Envoyer les emails en mode démo
      sendDemoEmails()
    }
    // Capturer le paiement PayPal si on vient de PayPal
    else if (paypalToken && orderId && !captureInProgressRef.current) {
      capturePayPalPayment()
    } else if (!paypalToken) {
      setPaymentStatus('success')
      fetchOrderDetails()
    }
  }, [isDemo, paypalToken, orderId])

  const sendDemoEmails = async () => {
    try {
      console.log('📧 Envoi des emails en mode démo...')
      const response = await fetch('/api/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paypalOrderId: 'demo_payment',
          orderNumber: orderId
        }),
      })
      const result = await response.json()
      if (result.success) {
        console.log('✅ Emails démo envoyés avec succès')
      }
    } catch (error) {
      console.error('❌ Erreur envoi emails démo:', error)
    }
  }

  useEffect(() => {
    // Arrêter les confettis après 3 secondes
    const timer = setTimeout(() => setConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, []) // Une seule fois au mount

  // Charger le prix de base dynamiquement depuis Supabase
  useEffect(() => {
    const loadBasePrice = async () => {
      try {
        const response = await fetch('/api/admin/products')
        if (response.ok) {
          const { products } = await response.json()
          const baseProduct = products.find((p: any) => p.id === 'planche-base')
          if (baseProduct) {
            setBasePricePerSheet(baseProduct.salePrice)
            console.log('💰 Prix planche de base chargé pour confirmation:', baseProduct.salePrice)
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement prix de base:', error)
      }
    }
    loadBasePrice()
  }, [])





  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50 relative overflow-hidden">
      {/* Confettis animés */}
      {confetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary-400 rounded-full"
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
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-600 mb-4">
            Commande confirmée ! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            Votre numéro de commande :
          </p>
          <p className="text-xl font-mono font-bold text-primary-600 bg-white px-4 py-2 rounded-lg inline-block shadow-md">
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
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              Merci pour votre confiance !
            </h2>
            <p className="text-gray-600">
              Notre artiste a reçu votre commande et va créer quelque chose de magique pour votre petit bout.
            </p>
          </div>

          <div className="bg-gradient-to-r from-primary-50 to-warm-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-gray-900">Email de confirmation envoyé</span>
            </div>
            <p className="text-sm text-gray-600">
              Vérifiez votre boîte mail, vous avez reçu un récapitulatif complet de votre commande.
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-600 mb-4">Prochaines étapes :</h3>
            
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
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
              <div className="w-8 h-8 bg-sage-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
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
          className="grid gap-4 mb-6"
        >
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-sage-600" />
              <span className="font-medium">Délai de livraison</span>
            </div>
            <p className="text-sm text-gray-600">
              Vous recevrez vos stickers dans <strong>5 à 7 jours ouvrés</strong>
            </p>
          </div>


        </motion.div>

        {/* Invitation à laisser un avis */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-sage-50 to-primary-50 rounded-xl p-6 mb-6 border border-sage-200"
        >
          <div className="text-center">
            <div className="text-3xl mb-3">💝</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Votre expérience nous intéresse !
            </h3>
            <p className="text-gray-600 mb-4">
              Une fois que vous aurez reçu vos stickers personnalisés, nous serions ravis 
              de connaître votre avis et celui de votre enfant. Votre retour nous aide à 
              continuer d'offrir des créations magiques qui font briller les yeux des petits !
            </p>
            <p className="text-sm text-gray-500 italic">
              N'hésitez pas à nous envoyer vos photos et témoignages par email ✨
            </p>
          </div>
        </motion.div>

        {/* Récapitulatif de la commande */}
        {paymentStatus === 'success' && orderDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="bg-white rounded-2xl p-6 mb-8 shadow-lg"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-600">
              📋 Récapitulatif de votre commande
            </h3>
            
            <div className="space-y-3">
              {/* Commande de base */}
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">
                  Stickers de {orderDetails.petName} ({orderDetails.numberOfSheets} planche(s))
                </span>
                <span className="font-medium">
                  {(orderDetails.numberOfSheets * basePricePerSheet).toFixed(2)}€
                </span>
              </div>

              {/* Upsells */}
              {orderDetails.upsells && orderDetails.upsells.map((upsellId: string) => {
                // Ces prix seront récupérés dynamiquement depuis Supabase
                // Pour l'instant, on garde les valeurs par défaut mais elles devraient être synchronisées
                const upsellPrices: Record<string, {name: string, price: number}> = {
                  'photo-premium': { name: 'Photo Doudou Premium (en pause)', price: 29.90 },
                  'livre-histoire': { name: 'Livre d\'Histoire Personnalisé (en pause)', price: 24.90 },
                  'planche-bonus': { name: '1 Planche Bonus', price: 4.90 }
                }
                const upsell = upsellPrices[upsellId]
                if (!upsell) return null
                
                return (
                  <div key={upsellId} className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="text-green-600">+</span>
                      {upsell.name}
                    </span>
                    <span className="font-medium text-green-600">
                      {upsell.price.toFixed(2)}€
                    </span>
                  </div>
                )
              })}

              {/* Total */}
              <div className="flex items-center justify-between py-3 text-lg font-bold border-t-2 border-gray-300">
                <span className="text-gray-600">Total payé :</span>
                <span className="text-green-600">
                  {orderDetails.totalAmount.toFixed(2)}€
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link 
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          
          <Link 
            href="/commande"
            className="flex-1 flex items-center justify-center gap-2 border border-primary-600 text-primary-600 py-3 px-6 rounded-xl font-medium hover:bg-primary-50 transition-colors"
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
            Une question ? Contactez-nous à <a href="mailto:hello@stickerdoudou.fr" className="text-primary-600 underline">hello@stickerdoudou.fr</a>
          </p>
        </motion.div>
      </div>
    </main>
  )
}

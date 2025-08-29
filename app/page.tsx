'use client'

import { 
  Camera, 
  Heart,
  Star,
  Gift,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Hero Section */}
      <section className="px-4 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart className="w-4 h-4" />
              Pour les petits cœurs
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transformez le doudou
              <span className="text-pink-600 block">
                en planches stickers !
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              <strong>Donnez la photo du doudou, on s'occupe du reste.</strong><br/>
              Notre artiste crée des stickers uniques pour votre enfant.
            </p>
          </div>

          <div className="mb-12 animate-fade-in-delay">
            <Link 
              href="/commande" 
              className="inline-flex items-center gap-3 bg-pink-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-pink-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Camera className="w-5 h-5" />
              Commencer
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Preview Cards */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in-slow">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Photographiez</h3>
              <p className="text-sm text-gray-600">une photo du doudou, seule si possible</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Personnalisez</h3>
              <p className="text-sm text-gray-600">Ajoutez le nom et quelques détails</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Recevez</h3>
              <p className="text-sm text-gray-600">Des stickers uniques arrivent chez vous</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Pourquoi les enfants adorent
            </h2>
            <p className="text-gray-600">
              Des stickers personnalisés qui racontent leur histoire
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                emoji: "🎨",
                title: "Dessin unique",
                description: "Chaque sticker est dessiné à la main par notre artiste"
              },
              {
                emoji: "💝",
                title: "100% personnalisé",
                description: "Basé sur LE doudou de votre enfant, pas un générique"
              },
              {
                emoji: "📱",
                title: "Super simple",
                description: "Une photo suffit, on s'occupe de tout le reste"
              },
              {
                emoji: "🚀",
                title: "Livraison rapide",
                description: "Reçu en quelques jours directement chez vous"
              },
              {
                emoji: "🔒",
                title: "Sécurisé",
                description: "Paiement protégé et données respectées (RGPD)"
              },
              {
                emoji: "💌",
                title: "Surprise garantie",
                description: "La joie dans les yeux de votre enfant !"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center animate-fade-in"
              >
                <div className="text-4xl mb-4">{feature.emoji}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Prêt pour la magie ? ✨
            </h2>
            <p className="text-pink-100 text-lg mb-8">
              Il suffit d'une photo pour commencer l'aventure
            </p>
            <Link 
              href="/commande" 
              className="inline-flex items-center gap-3 bg-white text-pink-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition-colors shadow-lg"
            >
              <Camera className="w-5 h-5" />
              Commencer maintenant
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

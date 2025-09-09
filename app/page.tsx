'use client'

import { 
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 📊 Données des transformations doudous → stickers
const beforeAfterData = [
  {
    id: 1,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg", // En attendant les vraies images
    childName: "Emma",
    doudouName: "Lapinou",
    description: "Peluche lapin rose → 12 stickers adorables"
  },
  {
    id: 2,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Lucas",
    doudouName: "Nounours",
    description: "Ours en peluche brun → Planche de stickers personnalisés"
  },
  {
    id: 3,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Léa",
    doudouName: "Chat Mimi",
    description: "Peluche chat blanc → Collection de stickers mignons"
  },
  {
    id: 4,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Tom",
    doudouName: "Dragon",
    description: "Dragon vert → Stickers aventuriers"
  },
  {
    id: 5,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Chloé",
    doudouName: "Licorne",
    description: "Licorne rose → Stickers magiques"
  },
  {
    id: 6,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Hugo",
    doudouName: "Éléphant",
    description: "Éléphant gris → Stickers rigolos"
  },
  {
    id: 7,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Zoé",
    doudouName: "Poupée Alice",
    description: "Poupée aux cheveux bouclés → Stickers précieux"
  },
  {
    id: 8,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Nathan",
    doudouName: "Dinosaure",
    description: "T-Rex vert → Stickers préhistoriques"
  },
  {
    id: 9,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Manon",
    doudouName: "Pingouin",
    description: "Pingouin noir et blanc → Stickers polaires"
  },
  {
    id: 10,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Théo",
    doudouName: "Singe Coco",
    description: "Singe marron → Stickers espiègles"
  },
  {
    id: 11,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Lina",
    doudouName: "Flamant Rose",
    description: "Flamant tropical → Stickers colorés"
  },
  {
    id: 12,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Maxime",
    doudouName: "Robot",
    description: "Robot argenté → Stickers futuristes"
  },
  {
    id: 13,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Lily",
    doudouName: "Grenouille",
    description: "Grenouille verte → Stickers amusants"
  },
  {
    id: 14,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Ethan",
    doudouName: "Voiture Rouge",
    description: "Petite voiture → Stickers de course"
  },
  {
    id: 15,
    beforeImage: "/images/placeholder-doudou.svg",
    afterImage: "/images/placeholder-doudou.svg",
    childName: "Maya",
    doudouName: "Chouette",
    description: "Chouette dorée → Stickers nocturnes"
  }
]

// 🎠 Composant Carousel
function DoudouCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = beforeAfterData.length

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  return (
    <div className="relative">
      {/* Carousel principal */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary-50 to-sage-50 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            {/* AVANT */}
            <div className="flex-1 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📸 Photo envoyée
              </h3>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Image
                    src={beforeAfterData[currentSlide].beforeImage}
                    alt={`Doudou ${beforeAfterData[currentSlide].doudouName}`}
                    width={150}
                    height={150}
                    className="object-contain opacity-50"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  <strong>{beforeAfterData[currentSlide].childName}</strong> et son doudou <strong>{beforeAfterData[currentSlide].doudouName}</strong>
                </p>
              </div>
            </div>

            {/* Flèche magique */}
            <div className="flex items-center justify-center">
              <div className="bg-primary-500 rounded-full p-4 shadow-lg">
                <ArrowRight className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* APRÈS */}
            <div className="flex-1 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ✨ Résultat TAGADOU
              </h3>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-48 h-48 mx-auto mb-4 bg-gradient-to-br from-warm-100 to-primary-100 rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-12 h-12 bg-primary-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs">🏷️</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-primary-700 font-medium">
                  {beforeAfterData[currentSlide].description}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center mt-6 gap-4">
        {/* Bouton précédent */}
        <button
          onClick={prevSlide}
          className="p-2 bg-primary-100 hover:bg-primary-200 rounded-full transition-colors"
          aria-label="Exemple précédent"
        >
          <ChevronLeft className="w-5 h-5 text-primary-600" />
        </button>

        {/* Indicateurs */}
        <div className="flex gap-2">
          {beforeAfterData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-primary-500' 
                  : 'bg-primary-200 hover:bg-primary-300'
              }`}
              aria-label={`Voir exemple ${index + 1}`}
            />
          ))}
        </div>

        {/* Bouton suivant */}
        <button
          onClick={nextSlide}
          className="p-2 bg-primary-100 hover:bg-primary-200 rounded-full transition-colors"
          aria-label="Exemple suivant"
        >
          <ChevronRight className="w-5 h-5 text-primary-600" />
        </button>
      </div>

      {/* Compteur */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          {currentSlide + 1} / {totalSlides} transformations
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50">
      {/* Hero Section */}
      <section className="px-4 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 animate-fade-in">
            {/* Logo TAGADOU */}
            <div className="flex justify-center mb-4">
              <div className="w-96 h-96 sm:w-[32rem] sm:h-[32rem]">
                <Image
                  src="/images/tagadou-logo.png"
                  alt="TAGADOU - Logo du petit cochon"
                  width={512}
                  height={512}
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transformez le doudou
              <span className="text-primary-600 block">
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
              className="inline-flex items-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Camera className="w-5 h-5" />
              Commencer
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Preview Cards */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in-slow">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: '#B2D0E0' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-white">
                  <rect x="4" y="8" width="24" height="18" rx="4" fill="currentColor" opacity="0.9"/>
                  <rect x="6" y="10" width="20" height="14" rx="2" fill="#B2D0E0"/>
                  <circle cx="16" cy="17" r="4" fill="currentColor" opacity="0.8"/>
                  <circle cx="16" cy="17" r="2.5" fill="#B2D0E0"/>
                  <rect x="20" y="6" width="4" height="3" rx="1" fill="currentColor" opacity="0.9"/>
                  <circle cx="22" cy="12" r="1" fill="currentColor" opacity="0.7"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Photographiez</h3>
              <p className="text-sm text-gray-600">une photo du doudou, seule si possible</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: '#B2D0E0' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-white">
                  <path d="M8 6 C6 6 4 8 4 10 L4 22 C4 24 6 26 8 26 L24 26 C26 26 28 24 28 22 L28 10 C28 8 26 6 24 6 Z" fill="currentColor" opacity="0.9"/>
                  <path d="M7 9 L25 9 C26 9 26 10 26 10 L26 23 C26 24 25 24 25 24 L7 24 C6 24 6 23 6 23 L6 10 C6 9 7 9 7 9 Z" fill="#B2D0E0"/>
                  <circle cx="12" cy="15" r="2" fill="currentColor" opacity="0.8"/>
                  <path d="M18 12 L24 12 M18 16 L22 16 M18 20 L24 20" stroke="currentColor" strokeWidth="1.5" opacity="0.7" strokeLinecap="round"/>
                  <path d="M8 4 C7 4 7 5 7 5 L7 7 C7 8 8 8 8 8 L10 8 C11 8 11 7 11 7 L11 5 C11 4 10 4 10 4 Z" fill="currentColor" opacity="0.6"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Personnalisez</h3>
              <p className="text-sm text-gray-600">Ajoutez le nom et quelques détails</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto" style={{ backgroundColor: '#B2D0E0' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-white">
                  <rect x="6" y="12" width="20" height="14" rx="3" fill="currentColor" opacity="0.9"/>
                  <rect x="8" y="14" width="16" height="10" rx="2" fill="#B2D0E0"/>
                  <path d="M14 6 L18 6 C19 6 20 7 20 8 L20 12 L12 12 L12 8 C12 7 13 6 14 6 Z" fill="currentColor" opacity="0.8"/>
                  <circle cx="16" cy="19" r="3" fill="currentColor" opacity="0.7"/>
                  <path d="M13 7 L19 7" stroke="#B2D0E0" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M10 4 L22 4" stroke="currentColor" strokeWidth="2" opacity="0.6" strokeLinecap="round"/>
                  <path d="M16 17 L16 21" stroke="#B2D0E0" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Recevez</h3>
              <p className="text-sm text-gray-600">Des stickers uniques arrivent chez vous</p>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel Avant/Après */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              🎨 La magie TAGADOU en action
            </h2>
            <p className="text-gray-600 text-lg">
              Découvrez comment nous transformons les doudous préférés en adorables stickers
            </p>
          </div>
          
          <DoudouCarousel />
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
      <section className="py-16 bg-primary-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Prêt pour la magie ? ✨
            </h2>
            <p className="text-primary-100 text-lg mb-8">
              Il suffit d'une photo pour commencer l'aventure
            </p>
            <Link 
              href="/commande" 
              className="inline-flex items-center gap-3 bg-white text-primary-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition-colors shadow-lg"
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

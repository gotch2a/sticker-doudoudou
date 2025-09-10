'use client'

import { 
  Camera,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 📊 Données des transformations doudous → stickers avec système de nommage
// 📁 Photos AVANT : "Photos de doudous/1_Prenom.jpg" 
// 🎨 Illustrations APRÈS : "Illustrations de doudous/2_Prenom.jpg"
const beforeAfterData = [
  {
    id: 1,
    beforeImage: "/images/Photos de doudous/1_Ariel.jpg",
    afterImage: "/images/Illustrations de doudous/2_Ariel.PNG",
    childName: "Ariel",
    doudouName: "Doudou magique",
    description: "Transformation magique → Stickers personnalisés"
  },
  {
    id: 2,
    beforeImage: "/images/Photos de doudous/1_Brune.jpg",
    afterImage: "/images/Illustrations de doudous/2_Brune.PNG",
    childName: "Brune",
    doudouName: "Compagnon fidèle",
    description: "Doudou adoré → Planche de stickers uniques"
  },
  {
    id: 3,
    beforeImage: "/images/Photos de doudous/1_Camila.jpg",
    afterImage: "/images/Illustrations de doudous/2_Camila.PNG",
    childName: "Camila",
    doudouName: "Petit trésor",
    description: "Doudou précieux → Collection de stickers"
  },
  {
    id: 4,
    beforeImage: "/images/Photos de doudous/1_Côme-lapin.jpeg",
    afterImage: "/images/Illustrations de doudous/2_Côme.PNG",
    childName: "Côme",
    doudouName: "Lapin",
    description: "Lapin tout doux → Stickers à croquer"
  },
  {
    id: 5,
    beforeImage: "/images/Photos de doudous/1_Dario.JPG",
    afterImage: "/images/Illustrations de doudous/2_Dario.PNG",
    childName: "Dario",
    doudouName: "Compagnon d'aventures",
    description: "Doudou d'aventurier → Stickers palpitants"
  },
  {
    id: 6,
    beforeImage: "/images/Photos de doudous/1_Gianni.jpg",
    afterImage: "/images/Illustrations de doudous/2_Gianni.PNG",
    childName: "Gianni",
    doudouName: "Meilleur ami",
    description: "Doudou complice → Stickers fantastiques"
  },
  {
    id: 7,
    beforeImage: "/images/Photos de doudous/1_Hugo_Yack.jpeg",
    afterImage: "/images/Illustrations de doudous/2_Hugo.PNG",
    childName: "Hugo",
    doudouName: "Yack",
    description: "Yack rigolo → Stickers amusants"
  },
  {
    id: 8,
    beforeImage: "/images/Photos de doudous/1_Jacques-Souris.jpg",
    afterImage: "/images/Illustrations de doudous/2_Jacques.PNG",
    childName: "Jacques",
    doudouName: "Souris",
    description: "Petite souris → Stickers malicieux"
  },
  {
    id: 9,
    beforeImage: "/images/Photos de doudous/1_Lou-Poulpe.jpg",
    afterImage: "/images/Illustrations de doudous/2_Lou.PNG",
    childName: "Lou",
    doudouName: "Poulpe",
    description: "Poulpe des mers → Stickers aquatiques"
  },
  {
    id: 10,
    beforeImage: "/images/Photos de doudous/1_Louison-radis.jpg",
    afterImage: "/images/Illustrations de doudous/2_Louison.PNG",
    childName: "Louison",
    doudouName: "Radis",
    description: "Radis croquant → Stickers vitaminés"
  },
  {
    id: 11,
    beforeImage: "/images/Photos de doudous/1_Michka-renard.jpg",
    afterImage: "/images/Illustrations de doudous/2_Michka.PNG",
    childName: "Michka",
    doudouName: "Renard",
    description: "Renard malin → Stickers rusés"
  },
  {
    id: 12,
    beforeImage: "/images/Photos de doudous/1_Octave-Pingui.jpg",
    afterImage: "/images/Illustrations de doudous/2_Octave.PNG",
    childName: "Octave",
    doudouName: "Pingouin",
    description: "Pingouin élégant → Stickers polaires"
  },
  {
    id: 13,
    beforeImage: "/images/Photos de doudous/1_Sam.png",
    afterImage: "/images/Illustrations de doudous/2_Sam.PNG",
    childName: "Sam",
    doudouName: "Fidèle compagnon",
    description: "Compagnon loyal → Stickers attachants"
  },
  {
    id: 14,
    beforeImage: "/images/Photos de doudous/1_Samuel-vache.jpg",
    afterImage: "/images/Illustrations de doudous/2_Samuel.PNG",
    childName: "Samuel",
    doudouName: "Vache",
    description: "Vache rigolote → Stickers de la ferme"
  },
  {
    id: 15,
    beforeImage: "/images/Photos de doudous/1_Tali_jojo.jpg",
    afterImage: "/images/Illustrations de doudous/2_Tali.PNG",
    childName: "Tali",
    doudouName: "Jojo",
    description: "Jojo tout mignon → Stickers câlins"
  }
]

// 🎠 Composant Carousel
function DoudouCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = droite, -1 = gauche
  const totalSlides = beforeAfterData.length

  const nextSlide = useCallback(() => {
    setDirection(1) // Animation vers la droite
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    setDirection(-1) // Animation vers la gauche
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  // 🎯 Navigation au clavier avec les flèches
  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          prevSlide()
          break
        case 'ArrowRight':
          event.preventDefault()
          nextSlide()
          break
      }
    }

    // Ajouter l'event listener
    window.addEventListener('keydown', handleKeyPress)

    // Nettoyer l'event listener au démontage
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [nextSlide, prevSlide]) // Fonctions stables grâce à useCallback

  return (
    <div className="relative">
      {/* Carousel principal */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary-50 to-sage-50 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            {/* AVANT */}
            <div className="flex-1 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                📸 Photo envoyée
              </h3>
              <div className="bg-white rounded-xl p-6 shadow-lg w-80 h-80 mx-auto">
                <div className="w-full h-48 mx-auto mb-4 flex items-center justify-center rounded-lg">
                  <Image
                    src={beforeAfterData[currentSlide].beforeImage}
                    alt={`Doudou ${beforeAfterData[currentSlide].doudouName}`}
                    width={160}
                    height={160}
                    className="object-contain max-w-full max-h-full shadow-md rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {beforeAfterData[currentSlide].childName} et son doudou {beforeAfterData[currentSlide].doudouName}
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                ✨ Résultat TAGADOU
              </h3>
              <div className="bg-white rounded-xl p-6 shadow-lg w-80 h-80 mx-auto">
                <div className="w-full h-48 mx-auto mb-4 flex items-center justify-center rounded-lg">
                  <Image
                    src={beforeAfterData[currentSlide].afterImage}
                    alt={`Stickers ${beforeAfterData[currentSlide].doudouName}`}
                    width={160}
                    height={160}
                    className="object-contain max-w-full max-h-full shadow-md rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600">
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
        <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-2">
          <span>Utilisez les flèches</span>
          <span className="inline-flex gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">←</kbd>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">→</kbd>
          </span>
          <span>pour naviguer</span>
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50">
      {/* Hero Section */}
      <section className="px-4 py-2 sm:py-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-3 animate-fade-in">
            {/* Logo TAGADOU */}
            <div className="flex justify-center mb-2" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
              <div className="w-48 h-48 sm:w-64 sm:h-64">
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
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg" style={{ backgroundColor: '#B2D0E0' }}>
                <svg width="48" height="48" viewBox="0 0 48 48" className="text-white">
                  {/* Caméra enfantine avec gros objectif */}
                  <rect x="8" y="16" width="32" height="24" rx="6" fill="currentColor" strokeWidth="3" stroke="#ffffff"/>
                  <circle cx="24" cy="28" r="8" fill="#ffffff" strokeWidth="4" stroke="currentColor"/>
                  <circle cx="24" cy="28" r="5" fill="currentColor"/>
                  <rect x="28" y="10" width="6" height="6" rx="3" fill="currentColor"/>
                  <circle cx="36" cy="20" r="2" fill="#ffffff"/>
                  <path d="M16 8 L20 8 C22 8 24 10 24 12 L24 16 L12 16 L12 12 C12 10 14 8 16 8 Z" fill="currentColor"/>
                  {/* Petits détails mignons */}
                  <circle cx="20" cy="32" r="1.5" fill="#B2D0E0"/>
                  <circle cx="28" cy="32" r="1.5" fill="#B2D0E0"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">1. Photographiez</h3>
              <p className="text-gray-600 font-medium">une photo du doudou, seule si possible</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg" style={{ backgroundColor: '#B2D0E0' }}>
                <svg width="48" height="48" viewBox="0 0 48 48" className="text-white">
                  {/* Formulaire enfantin avec cœur */}
                  <rect x="8" y="10" width="32" height="30" rx="4" fill="currentColor" strokeWidth="3" stroke="#ffffff"/>
                  <rect x="12" y="14" width="24" height="22" rx="2" fill="#ffffff"/>
                  {/* Visage souriant */}
                  <circle cx="18" cy="22" r="6" fill="currentColor"/>
                  <circle cx="16" cy="20" r="1.5" fill="#ffffff"/>
                  <circle cx="20" cy="20" r="1.5" fill="#ffffff"/>
                  <path d="M14 24 Q18 28 22 24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  {/* Lignes de texte mignonnes */}
                  <rect x="26" y="18" width="8" height="2" rx="1" fill="currentColor"/>
                  <rect x="26" y="22" width="6" height="2" rx="1" fill="currentColor"/>
                  <rect x="26" y="26" width="8" height="2" rx="1" fill="currentColor"/>
                  {/* Petit cœur */}
                  <path d="M30 32 C29 31 28 31 28 32 C28 31 27 31 26 32 C27 33 30 36 30 36 C30 36 33 33 34 32 C33 31 32 31 32 32 C32 31 31 31 30 32 Z" fill="#ff6b9d"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">2. Personnalisez</h3>
              <p className="text-gray-600 font-medium">Ajoutez le nom et quelques détails</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="w-24 h-24 flex items-center justify-center mb-6 mx-auto">
                <Image
                  src="/images/icon_camion.png"
                  alt="Camion de livraison"
                  width={75}
                  height={75}
                  className="object-contain"
                />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">3. Recevez</h3>
              <p className="text-gray-600 font-medium">Des stickers uniques arrivent chez vous</p>
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

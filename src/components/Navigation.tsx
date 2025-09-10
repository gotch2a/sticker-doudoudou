/**
 * Barre de navigation principale fixe avec menu hamburger responsive
 * Inspirée du design Tagadou avec menu hamburger mobile
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthButton from './AuthButton'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Détecter le scroll pour l'effet de transparence
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer le menu lors du redimensionnement desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  /**
   * Navigation items configuration
   */
  const navItems = [
    { href: '/', label: 'Accueil' },
    { href: '/comment-ca-marche', label: 'Comment ça marche' },
    { href: '/exemples', label: 'Exemples' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-white shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 z-10">
              <Image
                src="/images/Tagadou_favicon.png"
                alt="Tagadou Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <span className="text-xl font-black" style={{color: '#353535'}}>TAGADOU</span>
                <div className="text-xs text-red-500 font-medium -mt-1">
                  Stickers magiques
                </div>
              </div>
            </Link>

            {/* Navigation Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-red-500 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Actions Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <AuthButton />
              <Link
                href="/commande"
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
              >
                Commencer
              </Link>
            </div>

            {/* Bouton Hamburger Mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile avec Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Overlay sombre */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm"
                style={{ top: '64px' }}
              />
              
              {/* Menu déroulant */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t"
              >
                <div className="px-4 py-6 space-y-4">
                  
                  {/* Navigation Links */}
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="block text-gray-600 hover:text-red-500 transition-colors font-medium py-2 border-b border-gray-100 last:border-b-0"
                    >
                      {item.label}
                    </Link>
                  ))}

                  {/* Séparateur */}
                  <div className="border-t border-gray-200 pt-4">
                    
                    {/* Auth Button Mobile */}
                    <div className="mb-4">
                      <AuthButton />
                    </div>

                    {/* CTA Button Mobile */}
                    <Link
                      href="/commande"
                      onClick={() => setIsMenuOpen(false)}
                      className="block bg-red-500 hover:bg-red-600 text-white text-center px-6 py-3 rounded-full font-medium transition-colors"
                    >
                      Commencer
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer pour compenser la navigation fixe */}
      <div className="h-16" />
    </>
  )
}

/**
 * Composant bouton d'authentification
 * Affiche "Se connecter" ou "Se déconnecter" selon l'état
 */

'use client'

import { useState, useEffect } from 'react'
import { User, LogOut } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  total_orders: number
  total_spent: number
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Vérifier l'état d'authentification au chargement
    const checkAuthState = () => {
      if (typeof window !== 'undefined') {
        const storedAuth = localStorage.getItem('isAuthenticated')
        const storedUser = localStorage.getItem('user')
        
        if (storedAuth === 'true' && storedUser) {
          try {
            setUser(JSON.parse(storedUser))
            setIsAuthenticated(true)
          } catch (error) {
            console.error('Erreur parsing user:', error)
            handleLogout()
          }
        }
      }
    }
    
    checkAuthState()
    
    // Écouter les changements du localStorage (connexion automatique)
    window.addEventListener('storage', checkAuthState)
    
    return () => {
      window.removeEventListener('storage', checkAuthState)
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('user')
    }
    setIsAuthenticated(false)
    setUser(null)
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        {/* Lien vers le profil */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">
            {user.first_name || user.email.split('@')[0]}
          </span>
        </Link>

        {/* Bouton déconnexion */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/auth/login"
      className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors text-sm font-medium"
    >
      <User className="w-4 h-4" />
      <span>Se connecter</span>
    </Link>
  )
}

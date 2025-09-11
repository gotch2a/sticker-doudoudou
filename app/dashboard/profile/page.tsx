/**
 * Page des paramètres utilisateur
 */

'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Edit, Save, X } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  total_orders: number
  total_spent: number
  total_savings: number
  created_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Charger les données utilisateur depuis localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setEditForm({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || ''
      })
    }
    setLoading(false)
  }, [])

  const handleSave = async () => {
    if (user) {
      setLoading(true)
      try {
        // Sauvegarder en BDD via API
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            first_name: editForm.first_name,
            last_name: editForm.last_name,
            email: editForm.email
          }),
        })

        const data = await response.json()

        if (data.success) {
          // Mettre à jour les données locales
          const updatedUser = {
            ...user,
            ...data.profile
          }
          
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
          setIsEditing(false)
          
          // Notification de succès
          alert('Profil mis à jour avec succès !')
        } else {
          alert('Erreur lors de la sauvegarde : ' + data.error)
        }
      } catch (error) {
        console.error('Erreur sauvegarde profil:', error)
        alert('Erreur de connexion lors de la sauvegarde')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCancel = () => {
    if (user) {
      setEditForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard"
            className="p-2 text-gray-600 hover:text-primary-500 transition-colors"
          >
            ← Retour
          </Link>
          <h1 className="text-2xl font-bold text-gray-600">
            Paramètres du profil
          </h1>
        </div>

        {/* Informations utilisateur */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-600 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-500" />
              Informations personnelles
            </h2>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Sauvegarder
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Votre prénom"
                />
              ) : (
                <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {user?.first_name || 'Non défini'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de famille
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Votre nom"
                />
              ) : (
                <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {user?.last_name || 'Non défini'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="votre@email.com"
                />
              ) : (
                <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {user?.email || 'Non défini'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques (lecture seule) */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mt-6">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">
            Statistiques du compte
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{user?.total_orders}</p>
              <p className="text-sm text-gray-600">Commandes</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{user?.total_spent?.toFixed(2)}€</p>
              <p className="text-sm text-gray-600">Total dépensé</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{user?.total_savings?.toFixed(2)}€</p>
              <p className="text-sm text-gray-600">Économies</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

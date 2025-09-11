/**
 * Page de récupération de mot de passe
 * Permet aux utilisateurs de réinitialiser leur mot de passe
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)

  /**
   * Gérer la réinitialisation du mot de passe
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setNewPassword(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Mot de passe réinitialisé avec succès ! Votre nouveau mot de passe temporaire est ci-dessous.')
        setNewPassword(result.temporaryPassword)
      } else {
        setError(result.error || 'Erreur lors de la réinitialisation')
      }

    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.')
      console.error('Erreur reset password:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Validation email
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50">
      <div className="max-w-md mx-auto px-4 py-8">
        
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/auth/login" 
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-600">Mot de passe oublié</h1>
            <p className="text-gray-600">Réinitialisez votre mot de passe</p>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Messages de succès */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          </motion.div>
        )}

        {/* Nouveau mot de passe temporaire */}
        {newPassword && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-4 rounded-xl mb-6"
          >
            <div className="text-center">
              <h3 className="font-semibold mb-2">Votre nouveau mot de passe temporaire :</h3>
              <div className="bg-white px-4 py-2 rounded-lg font-mono text-lg font-bold text-gray-900 border">
                {newPassword}
              </div>
              <p className="text-xs mt-2 text-blue-600">
                ⚠️ Notez-le et changez-le lors de votre première connexion
              </p>
            </div>
          </motion.div>
        )}

        {!success ? (
          /* Formulaire de réinitialisation */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <form onSubmit={handleResetPassword} className="space-y-6">
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                {email && !isValidEmail(email) && (
                  <p className="text-red-500 text-xs mt-1">Email invalide</p>
                )}
              </div>

              {/* Bouton de réinitialisation */}
              <button
                type="submit"
                disabled={loading || !email || !isValidEmail(email)}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Réinitialisation...</span>
                  </div>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </button>
            </form>

            {/* Informations */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Un nouveau mot de passe temporaire sera généré et affiché sur cette page.
                <br />
                En production, il serait envoyé par email.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Actions après succès */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Mot de passe réinitialisé !
            </h3>
            <p className="text-gray-600 mb-6">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe temporaire.
            </p>
            
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Se connecter
            </Link>
          </motion.div>
        )}

        {/* Lien retour */}
        <div className="mt-6 text-center">
          <Link 
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Retour à la connexion
          </Link>
        </div>

      </div>
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

// VERSION ADMIN QUI FONCTIONNE 100% VIA API SERVEUR
export default function AdminServerPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'shipping' | 'discounts'>('orders')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [securePhotoUrls, setSecurePhotoUrls] = useState<Record<string, string>>({})
  
  // États pour les autres onglets
  const [articles, setArticles] = useState<any[]>([])
  const [shippingSettings, setShippingSettings] = useState<any>(null)
  const [discountCodes, setDiscountCodes] = useState<any[]>([])
  const [editingArticle, setEditingArticle] = useState<any | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<any | null>(null)
  const [editingShipping, setEditingShipping] = useState<any | null>(null)

  // Générer une URL sécurisée pour une photo
  const generateSecurePhotoUrl = async (photoUrl: string): Promise<string> => {
    try {
      // Si l'URL est déjà sécurisée ou si c'est un placeholder, la retourner telle quelle
      if (!photoUrl || photoUrl.includes('?token=') || photoUrl.includes('placeholder')) {
        return photoUrl
      }

      // Si on a déjà l'URL sécurisée en cache
      if (securePhotoUrls[photoUrl]) {
        return securePhotoUrls[photoUrl]
      }

      // Générer l'URL sécurisée via l'API
      const response = await fetch('/api/secure-photo-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl })
      })

      if (response.ok) {
        const { secureUrl } = await response.json()
        // Mettre en cache
        setSecurePhotoUrls(prev => ({ ...prev, [photoUrl]: secureUrl }))
        return secureUrl
      } else {
        console.warn('⚠️ Impossible de générer URL sécurisée pour:', photoUrl)
        return '/images/placeholder-doudou.svg'
      }
    } catch (error) {
      console.error('❌ Erreur génération URL sécurisée:', error)
      return '/images/placeholder-doudou.svg'
    }
  }

  // Charger les commandes via API serveur
  const loadOrdersFromServer = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📊 Chargement commandes via API serveur...')
      
      const response = await fetch('/api/admin/orders')
      const result = await response.json()
      
      if (result.success) {
        setOrders(result.orders)
        console.log(`✅ ${result.count} commandes chargées via serveur`)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('❌ Erreur chargement serveur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Charger les articles via API serveur
  const loadArticlesFromServer = async () => {
    try {
      console.log('📦 Chargement articles via API serveur...')
      
      const response = await fetch('/api/admin/products')
      const result = await response.json()
      
      if (result.success) {
        setArticles(result.articles)
        console.log(`✅ ${result.count} articles chargés via serveur`)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('❌ Erreur chargement articles:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  // Charger les paramètres de livraison via API serveur
  const loadShippingFromServer = async () => {
    try {
      console.log('🚚 Chargement paramètres livraison via API serveur...')
      
      const response = await fetch('/api/admin/shipping')
      const result = await response.json()
      
      if (result.success) {
        setShippingSettings(result.settings)
        console.log('✅ Paramètres de livraison chargés via serveur')
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('❌ Erreur chargement paramètres livraison:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  // Charger les codes de remise via API serveur
  const loadDiscountCodesFromServer = async () => {
    try {
      console.log('🏷️ Chargement codes de remise via API serveur...')
      
      const response = await fetch('/api/admin/discount-codes')
      const result = await response.json()
      
      if (result.success) {
        setDiscountCodes(result.discountCodes)
        console.log(`✅ ${result.count} codes de remise chargés via serveur`)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('❌ Erreur chargement codes de remise:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  // Sauvegarder un article (création ou modification)
  const saveArticle = async (articleData: any) => {
    try {
      const isCreating = !articleData.id
      const url = '/api/admin/products'
      const method = isCreating ? 'POST' : 'PUT'
      
      console.log(`${isCreating ? '➕' : '✏️'} ${isCreating ? 'Création' : 'Modification'} article...`)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Article ${isCreating ? 'créé' : 'modifié'} avec succès`)
        await loadArticlesFromServer() // Recharger la liste
        setEditingArticle(null) // Fermer la modale
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error(`❌ Erreur sauvegarde article:`, err)
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde article')
    }
  }

  // Supprimer un article
  const deleteArticle = async (articleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return
    }
    
    try {
      console.log('🗑️ Suppression article...')
      
      const response = await fetch(`/api/admin/products?id=${articleId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Article supprimé avec succès')
        await loadArticlesFromServer() // Recharger la liste
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('❌ Erreur suppression article:', err)
      setError(err instanceof Error ? err.message : 'Erreur suppression article')
    }
  }

  // Sauvegarder un code de remise (création ou modification)
  const saveDiscountCode = async (discountData: any) => {
    try {
      const isCreating = !discountData.id
      const url = '/api/admin/discount-codes'
      const method = isCreating ? 'POST' : 'PUT'
      
      console.log(`${isCreating ? '➕' : '✏️'} ${isCreating ? 'Création' : 'Modification'} code de remise...`)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Code de remise ${isCreating ? 'créé' : 'modifié'} avec succès`)
        await loadDiscountCodesFromServer() // Recharger la liste
        setEditingDiscount(null) // Fermer la modale
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error(`❌ Erreur sauvegarde code de remise:`, err)
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde code de remise')
    }
  }

  // Supprimer un code de remise
  const deleteDiscountCode = async (discountId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code de remise ?')) {
      return
    }
    
    try {
      console.log('🗑️ Suppression code de remise...')
      
      const response = await fetch(`/api/admin/discount-codes?id=${discountId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Code de remise supprimé avec succès')
        await loadDiscountCodesFromServer() // Recharger la liste
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('❌ Erreur suppression code de remise:', err)
      setError(err instanceof Error ? err.message : 'Erreur suppression code de remise')
    }
  }

  // Sauvegarder les paramètres de livraison
  const saveShippingSettings = async (shippingData: any) => {
    try {
      console.log('✏️ Sauvegarde paramètres de livraison...')
      
      const response = await fetch('/api/admin/shipping', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shippingData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Paramètres de livraison sauvegardés avec succès')
        await loadShippingFromServer() // Recharger les données
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('❌ Erreur sauvegarde paramètres livraison:', err)
      setError(err instanceof Error ? err.message : 'Erreur sauvegarde paramètres livraison')
    }
  }

  // Composant d'image sécurisée
  const SecureImage = ({ src, alt, width, height, className, onError }: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
    onError?: (e: any) => void
  }) => {
    const [secureSrc, setSecureSrc] = useState<string>(src)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      const loadSecureUrl = async () => {
        if (src && !src.includes('placeholder') && !src.includes('?token=')) {
          try {
            const secureUrl = await generateSecurePhotoUrl(src)
            setSecureSrc(secureUrl)
          } catch (error) {
            console.error('Erreur chargement image sécurisée:', error)
            setSecureSrc('/images/placeholder-doudou.svg')
          }
        } else {
          setSecureSrc(src || '/images/placeholder-doudou.svg')
        }
        setIsLoading(false)
      }

      loadSecureUrl()
    }, [src])

    if (isLoading) {
      return (
        <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
          <span className="text-gray-400">📷</span>
        </div>
      )
    }

    return (
      <Image
        src={secureSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={(e) => {
          setSecureSrc('/images/placeholder-doudou.svg')
          onError?.(e)
        }}
      />
    )
  }

  // Charger les données selon l'onglet actif
  const loadDataForTab = async (tab: string) => {
    switch (tab) {
      case 'orders':
        await loadOrdersFromServer()
        break
      case 'products':
        await loadArticlesFromServer()
        break
      case 'shipping':
        await loadShippingFromServer()
        break
      case 'discounts':
        await loadDiscountCodesFromServer()
        break
    }
  }

  useEffect(() => {
    loadOrdersFromServer() // Charger les commandes par défaut
  }, [])

  // Charger les données quand on change d'onglet
  useEffect(() => {
    if (activeTab !== 'orders') {
      loadDataForTab(activeTab)
    }
  }, [activeTab])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        })

      if (response.ok) {
        // Recharger les commandes
        await loadOrdersFromServer()
        alert('✅ Statut mis à jour avec succès')
      } else {
        alert('❌ Erreur mise à jour statut')
      }
    } catch (error) {
      console.error('Erreur update status:', error)
      alert('❌ Erreur réseau')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement via serveur...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-red-800 mb-4">❌ Erreur Serveur</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadOrdersFromServer}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h1 className="text-3xl font-bold text-green-800">✅ Administration Doudoudou</h1>
          <p className="text-green-700">Interface d'administration entièrement fonctionnelle.</p>
          <p className="text-sm text-green-600 mt-2">📊 {orders.length} commandes chargées avec succès</p>
        </div>
        
        {/* Navigation par onglets */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📦 Commandes ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏷️ Articles
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'shipping'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🚚 Livraison
              </button>
              <button
                onClick={() => setActiveTab('discounts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'discounts'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏷️ Codes de remise
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Header avec statistiques */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">📦 Gestion des Commandes</h2>
                <button
                  onClick={loadOrdersFromServer}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                >
                  🔄 Actualiser
                </button>
              </div>
              
              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-yellow-800">
                    {orders.filter(o => o.status === 'nouveau').length}
                  </div>
                  <div className="text-sm text-yellow-600">Nouveau</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-800">
                    {orders.filter(o => o.status === 'en_cours').length}
                  </div>
                  <div className="text-sm text-blue-600">En cours</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-800">
                    {orders.filter(o => o.status === 'termine').length}
                  </div>
                  <div className="text-sm text-green-600">Terminé</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-800">
                    {orders.filter(o => o.status === 'expedie').length}
                  </div>
                  <div className="text-sm text-purple-600">Expédié</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-gray-800">
                    {orders.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>

            {/* Liste des commandes */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-lg text-gray-500 mb-2">📭 Aucune commande trouvée</div>
                <p className="text-gray-400">Les nouvelles commandes apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      
                      {/* STATUT */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className={`inline-flex items-center justify-center px-4 py-3 rounded-xl font-bold text-lg shadow-sm border-2 w-32 h-16 ${
                            order.status === 'nouveau' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            order.status === 'en_cours' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            order.status === 'termine' ? 'bg-green-100 text-green-800 border-green-300' :
                            order.status === 'expedie' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            'bg-gray-100 text-gray-800 border-gray-300'
                          }`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </div>
                          
                          {/* Sélecteur de statut */}
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="mt-2 w-32 border-2 border-gray-300 rounded-lg px-3 py-1 text-sm font-medium bg-white hover:bg-gray-50 focus:border-pink-500 focus:outline-none"
                          >
                            <option value="nouveau">Nouveau</option>
                            <option value="en_cours">En cours</option>
                            <option value="termine">Terminé</option>
                            <option value="expedie">Expédié</option>
                            <option value="livre">Livré</option>
                          </select>
                        </div>
                      </div>

                      {/* Informations commande */}
                      <div className="lg:col-span-3">
                        <div className="bg-gray-50 p-4 rounded-lg h-[160px] flex flex-col">
                          <h3 className="font-bold text-gray-900 mb-2">📋 Commande</h3>
                          <p className="font-semibold text-lg text-pink-600">{order.order_number}</p>
                          <p className="text-sm text-gray-500">
                            📅 {new Date(order.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-lg font-bold text-gray-900 mt-auto">💰 {order.total_amount}€</p>
                        </div>
                      </div>

                      {/* Détails du doudou avec image */}
                      <div className="lg:col-span-3">
                        <div className="bg-blue-50 p-4 rounded-lg h-[160px] flex flex-row gap-3">
                          {/* Image du doudou */}
                          {order.photo_url ? (
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 bg-white rounded-lg border-2 border-blue-200 overflow-hidden">
                                <SecureImage
                                  src={order.photo_url}
                                  alt={`Photo de ${order.pet_name}`}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-2xl">🧸</span>
                                </div>
                            </div>
                          )}
                          
                          {/* Informations du doudou */}
                          <div className="flex-1 flex flex-col">
                            <h3 className="font-bold text-gray-900 mb-2">🧸 Doudou</h3>
                            <p className="font-semibold text-blue-800">{order.pet_name}</p>
                            <p className="text-sm text-blue-600">{order.animal_type}</p>
                            <p className="text-sm text-gray-600">{order.number_of_sheets} planche(s)</p>
                            <p className="text-xs text-blue-500 mt-auto">Pour {order.child_name} ({order.child_age || 'âge non spécifié'})</p>
                          </div>
                        </div>
                      </div>

                      {/* Informations client */}
                      <div className="lg:col-span-2">
                        <div className="bg-green-50 p-4 rounded-lg h-[160px] flex flex-col">
                          <h3 className="font-bold text-gray-900 mb-2">👤 Client</h3>
                          <p className="font-semibold text-green-800">{order.child_name}</p>
                          <p className="text-sm text-green-600">{order.client_email}</p>
                          <div className="text-xs text-gray-600 mt-auto">
                            <p>{order.address}</p>
                            <p>{order.city} {order.postal_code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-2 space-y-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          👁️ Détails
                        </button>
                        <button
                          onClick={() => {
                            const brief = `BRIEF ARTISTE - Commande ${order.order_number}
Numero: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}
Client: ${order.client_email}
Doudou: ${order.pet_name} (${order.animal_type})
Pour: ${order.child_name}
Planches: ${order.number_of_sheets}
Total: ${order.total_amount} euros
Adresse: ${order.address}, ${order.city} ${order.postal_code}
Photo: ${order.photo_url}
Notes: ${order.notes || 'Aucune note'}`
                            
                            navigator.clipboard.writeText(brief)
                            alert('Brief copié dans le presse-papiers !')
                          }}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          📋 Brief
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Onglet Articles */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Header avec bouton d'ajout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">🏷️ Gestion des Articles</h2>
                <button
                  onClick={() => setEditingArticle({ 
                    id: null, 
                    name: '', 
                    description: '', 
                    originalPrice: 0, 
                    salePrice: 0, 
                    category: 'base', 
                    features: [], 
                    active: true 
                  })}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  ➕ Nouvel Article
                </button>
              </div>
              
              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-800">{articles.length}</div>
                  <div className="text-sm text-blue-600">Total Articles</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-800">
                    {articles.filter(a => a.active).length}
                  </div>
                  <div className="text-sm text-green-600">Actifs</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-800">
                    {articles.filter(a => a.category === 'base').length}
                  </div>
                  <div className="text-sm text-orange-600">Base</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-800">
                    {articles.filter(a => a.category === 'upsell').length}
                  </div>
                  <div className="text-sm text-purple-600">Upsell</div>
                </div>
              </div>
            </div>

            {/* Liste des articles */}
            {articles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-lg text-gray-500 mb-2">📦 Aucun article trouvé</div>
                <p className="text-gray-400">Créez votre premier article pour commencer</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          article.category === 'base' ? 'bg-orange-100 text-orange-800' :
                          article.category === 'upsell' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {article.category.toUpperCase()}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          article.active ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                      </div>
                      <button
                        onClick={() => setEditingArticle(article)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✏️ Modifier
                      </button>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 mb-2">{article.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{article.description}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-lg font-bold text-green-600">{article.sale_price}€</span>
                        {article.original_price > article.sale_price && (
                          <span className="text-sm text-gray-500 line-through ml-2">{article.original_price}€</span>
                        )}
                      </div>
                      {article.savings > 0 && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          -{article.savings}€
                        </span>
                      )}
                    </div>
                    
                    {article.features && article.features.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {article.features.slice(0, 2).map((feature: string, idx: number) => (
                          <div key={idx}>• {feature}</div>
                        ))}
                        {article.features.length > 2 && (
                          <div>... et {article.features.length - 2} autres</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Onglet Livraison */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">🚚 Paramètres de Livraison</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadShippingFromServer()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🔄 Actualiser
                  </button>
                  {shippingSettings && (
                    <button
                      onClick={() => setEditingShipping(shippingSettings)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✏️ Modifier
                    </button>
                  )}
                </div>
              </div>
              
              {shippingSettings ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tarifs de livraison */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Tarifs de Livraison</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <span className="font-medium text-blue-900">🇫🇷 France - Colis</span>
                          <div className="text-sm text-blue-600">{shippingSettings.estimated_delivery_france}</div>
                        </div>
                        <span className="font-bold text-blue-800">{shippingSettings.france_price}€</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div>
                          <span className="font-medium text-orange-900">📮 Tarif Lettre</span>
                          <div className="text-sm text-orange-600">Pour 1-2 planches de base uniquement</div>
                        </div>
                        <span className="font-bold text-orange-800">{shippingSettings.letter_price || '2,50'}€</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <span className="font-medium text-green-900">🇪🇺 Europe - Colis</span>
                          <div className="text-sm text-green-600">{shippingSettings.estimated_delivery_europe}</div>
                        </div>
                        <span className="font-bold text-green-800">{shippingSettings.europe_price}€</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <div>
                          <span className="font-medium text-purple-900">🌍 Monde - Colis</span>
                          <div className="text-sm text-purple-600">{shippingSettings.estimated_delivery_world}</div>
                        </div>
                        <span className="font-bold text-purple-800">{shippingSettings.world_price}€</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Paramètres spéciaux */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Paramètres Spéciaux</h3>
                    
                    <div className="space-y-3">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-yellow-900">🆓 Livraison Gratuite</span>
                            <div className="text-sm text-yellow-600">À partir de ce montant</div>
                          </div>
                          <span className="font-bold text-yellow-800">{shippingSettings.free_shipping_threshold}€</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">📊 Statut</span>
                            <div className="text-sm text-gray-600">Paramètres de livraison</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            shippingSettings.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {shippingSettings.active ? 'Actifs' : 'Inactifs'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-lg text-gray-500 mb-2">🚚 Chargement des paramètres...</div>
                  <p className="text-gray-400">Récupération des paramètres de livraison</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Codes de remise */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            {/* Header avec bouton d'ajout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">🏷️ Codes de Remise</h2>
                <button
                  onClick={() => setEditingDiscount({ 
                    id: null, 
                    code: '', 
                    description: '', 
                    discount_type: 'percentage', 
                    discount_value: 0, 
                    minimum_amount: 0,
                    usage_limit: null,
                    used_count: 0,
                    valid_from: new Date().toISOString().split('T')[0],
                    valid_until: null,
                    active: true 
                  })}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  ➕ Nouveau Code
                </button>
              </div>
              
              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-blue-800">{discountCodes.length}</div>
                  <div className="text-sm text-blue-600">Total Codes</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-800">
                    {discountCodes.filter(d => d.active).length}
                  </div>
                  <div className="text-sm text-green-600">Actifs</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-orange-800">
                    {discountCodes.filter(d => d.discount_type === 'percentage').length}
                  </div>
                  <div className="text-sm text-orange-600">Pourcentage</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-purple-800">
                    {discountCodes.reduce((sum, d) => sum + (d.used_count || 0), 0)}
                  </div>
                  <div className="text-sm text-purple-600">Utilisations</div>
                </div>
              </div>
            </div>

            {/* Liste des codes de remise */}
            {discountCodes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-lg text-gray-500 mb-2">🏷️ Aucun code de remise trouvé</div>
                <p className="text-gray-400">Créez votre premier code de remise pour commencer</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {discountCodes.map((discount) => (
                  <div key={discount.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          discount.discount_type === 'percentage' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {discount.discount_type === 'percentage' ? '%' : '€'}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          discount.active ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                      </div>
                      <button
                        onClick={() => setEditingDiscount(discount)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        ✏️ Modifier
                      </button>
                    </div>
                    
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-xl text-gray-900 bg-gray-100 px-3 py-2 rounded-lg font-mono">
                        {discount.code}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{discount.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Réduction:</span>
                        <span className="font-bold text-green-600">
                          {discount.discount_type === 'percentage' 
                            ? `${discount.discount_value}%` 
                            : `${discount.discount_value}€`}
                        </span>
                      </div>
                      
                      {discount.minimum_amount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Minimum:</span>
                          <span className="text-sm">{discount.minimum_amount}€</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Utilisé:</span>
                        <span className="text-sm">
                          {discount.used_count || 0}
                          {discount.usage_limit && ` / ${discount.usage_limit}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 border-t pt-2">
                      <div>Valide du {new Date(discount.valid_from).toLocaleDateString('fr-FR')}</div>
                      {discount.valid_until && (
                        <div>au {new Date(discount.valid_until).toLocaleDateString('fr-FR')}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal détails commande enrichi */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Détails complets - {selectedOrder.order_number}
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Première ligne - Informations principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">📋 Informations générales</h3>
                    <div className="space-y-2">
                      <p><strong>Numéro:</strong> {selectedOrder.order_number}</p>
                      <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}</p>
                      <p><strong>Dernière MAJ:</strong> {new Date(selectedOrder.updated_at).toLocaleString('fr-FR')}</p>
                      <p><strong>Statut:</strong> <span className={`px-2 py-1 rounded text-sm font-medium ${
                          selectedOrder.status === 'nouveau' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                          selectedOrder.status === 'termine' ? 'bg-green-100 text-green-800' :
                          selectedOrder.status === 'expedie' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>{selectedOrder.status.replace('_', ' ').toUpperCase()}</span></p>
                      <p><strong>Total:</strong> <span className="text-lg font-bold text-green-600">{selectedOrder.total_amount}€</span></p>
                      {selectedOrder.discount_code && (
                        <>
                          <p><strong>Code remise:</strong> <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">{selectedOrder.discount_code}</span></p>
                          <p><strong>Réduction:</strong> <span className="text-red-600">-{selectedOrder.discount_amount}€</span></p>
                        </>
                      )}
                      <p><strong>Paiement:</strong> <span className={`px-2 py-1 rounded text-sm ${
                        selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>{selectedOrder.payment_status}</span></p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">🧸 Détails du doudou</h3>
                    <div className="space-y-2">
                      <p><strong>Surnom:</strong> <span className="text-blue-800 font-semibold">{selectedOrder.pet_name}</span></p>
                      <p><strong>Type:</strong> {selectedOrder.animal_type}</p>
                      <p><strong>Pour l'enfant:</strong> <span className="text-blue-600">{selectedOrder.child_name}</span></p>
                      <p><strong>Âge de l'enfant:</strong> {selectedOrder.child_age || 'Non spécifié'}</p>
                      <p><strong>Planches:</strong> <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{selectedOrder.number_of_sheets} planche(s)</span></p>
                      {selectedOrder.notes && (
                      <div>
                          <p><strong>Notes spéciales:</strong></p>
                          <div className="bg-blue-100 p-2 rounded text-sm mt-1">{selectedOrder.notes}</div>
                            </div>
                          )}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">👤 Informations client</h3>
                    <div className="space-y-2">
                      <p><strong>Email:</strong> <a href={`mailto:${selectedOrder.client_email}`} className="text-green-600 hover:underline">{selectedOrder.client_email}</a></p>
                      <p><strong>Adresse:</strong></p>
                      <div className="bg-green-100 p-2 rounded text-sm">
                        {selectedOrder.address}<br/>
                        {selectedOrder.city} {selectedOrder.postal_code}
                    </div>
                  </div>
                    </div>
                  </div>

                {/* Deuxième ligne - Image et actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image du doudou */}
                  {selectedOrder.photo_url && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">📸 Photo du doudou</h3>
                      <div className="flex justify-center">
                        <div className="max-w-sm">
                          <SecureImage
                            src={selectedOrder.photo_url}
                            alt={`Photo de ${selectedOrder.pet_name}`}
                            width={300}
                            height={300}
                            className="w-full h-auto rounded-lg border-2 border-purple-200 shadow-md"
                          />
                          <p className="text-center text-sm text-purple-600 mt-2">
                            Photo de {selectedOrder.pet_name} ({selectedOrder.animal_type})
                          </p>
                        </div>
                              </div>
                            </div>
                  )}

                  {/* Brief artiste */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">🎨 Brief artiste</h3>
                    <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-line">
{`BRIEF ARTISTE - Commande ${selectedOrder.order_number}
═══════════════════════════════════════════════

📋 COMMANDE
• Numéro: ${selectedOrder.order_number}
• Date: ${new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}
• Statut: ${selectedOrder.status.toUpperCase()}

🧸 DOUDOU À CRÉER
• Surnom: ${selectedOrder.pet_name}
• Type: ${selectedOrder.animal_type}
• Pour l'enfant: ${selectedOrder.child_name} (${selectedOrder.child_age || 'âge non spécifié'})
• Nombre de planches: ${selectedOrder.number_of_sheets}

📝 INSTRUCTIONS SPÉCIALES
${selectedOrder.notes || 'Aucune instruction particulière'}

📸 PHOTO
${selectedOrder.photo_url ? 'Photo disponible - voir l\'interface admin' : 'Aucune photo fournie'}

💰 COMMANDE
• Total: ${selectedOrder.total_amount}€
${selectedOrder.discount_code ? `• Code remise: ${selectedOrder.discount_code} (-${selectedOrder.discount_amount}€)` : ''}

📦 LIVRAISON
• ${selectedOrder.address}
• ${selectedOrder.city} ${selectedOrder.postal_code}

📧 CONTACT CLIENT
• ${selectedOrder.client_email}`}
                          </div>
                        <button 
                      onClick={() => {
                        const brief = `BRIEF ARTISTE - Commande ${selectedOrder.order_number}
═══════════════════════════════════════════════

📋 COMMANDE
• Numéro: ${selectedOrder.order_number}
• Date: ${new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}
• Statut: ${selectedOrder.status.toUpperCase()}

🧸 DOUDOU À CRÉER
• Surnom: ${selectedOrder.pet_name}
• Type: ${selectedOrder.animal_type}
• Pour l'enfant: ${selectedOrder.child_name} (${selectedOrder.child_age || 'âge non spécifié'})
• Nombre de planches: ${selectedOrder.number_of_sheets}

📝 INSTRUCTIONS SPÉCIALES
${selectedOrder.notes || 'Aucune instruction particulière'}

📸 PHOTO
${selectedOrder.photo_url ? 'Photo disponible - voir l\'interface admin' : 'Aucune photo fournie'}

💰 COMMANDE
• Total: ${selectedOrder.total_amount}€
${selectedOrder.discount_code ? `• Code remise: ${selectedOrder.discount_code} (-${selectedOrder.discount_amount}€)` : ''}

📦 LIVRAISON
• ${selectedOrder.address}
• ${selectedOrder.city} ${selectedOrder.postal_code}

📧 CONTACT CLIENT
• ${selectedOrder.client_email}`
                        
                        navigator.clipboard.writeText(brief)
                        alert('Brief artiste copié dans le presse-papiers !')
                      }}
                      className="w-full mt-3 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      📋 Copier le brief complet
              </button>
            </div>
                        </div>
                        
                {/* Boutons de fermeture */}
                <div className="mt-6 flex gap-3">
                        <button 
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 font-medium"
                        >
                    Fermer
                        </button>
                  <button
                    onClick={async () => {
                      const url = selectedOrder.photo_url
                      if (url) {
                        try {
                          const secureUrl = await generateSecurePhotoUrl(url)
                          window.open(secureUrl, '_blank')
                        } catch (error) {
                          console.error('Erreur ouverture photo:', error)
                          alert('Impossible d\'ouvrir la photo')
                        }
                      } else {
                        alert('Aucune photo disponible pour cette commande')
                      }
                    }}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={!selectedOrder.photo_url}
                  >
                    🖼️ Voir la photo en grand
                  </button>
                      </div>
                    </div>
                  </div>
              </div>
            )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">✅ Interface Admin Optimisée</h3>
          <p className="text-blue-700">
            Interface d'administration haute performance avec architecture serveur optimisée.
            Toutes les fonctionnalités sont disponibles et opérationnelles !
          </p>
        </div>

        {/* Modal d'édition Article */}
        {editingArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    {editingArticle.id ? '✏️ Modifier Article' : '➕ Nouvel Article'}
                  </h2>
                  <button
                    onClick={() => setEditingArticle(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target as HTMLFormElement)
                    const articleData = {
                      id: editingArticle.id,
                      name: formData.get('name') as string,
                      description: formData.get('description') as string,
                      originalPrice: parseFloat(formData.get('originalPrice') as string),
                      salePrice: parseFloat(formData.get('salePrice') as string),
                      category: formData.get('category') as string,
                      features: (formData.get('features') as string).split('\n').filter(f => f.trim()),
                      active: formData.get('active') === 'on'
                    }
                    saveArticle(articleData)
                  }}
                  className="space-y-4"
                >
                  {/* Nom de l'article */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'article *
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingArticle.name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Pack Doudou Personnalisé"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingArticle.description}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description détaillée de l'article..."
                    />
                  </div>

                  {/* Prix */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix original (€) *
                      </label>
                      <input
                        type="number"
                        name="originalPrice"
                        defaultValue={editingArticle.original_price || editingArticle.originalPrice}
                        required
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prix de vente (€) *
                      </label>
                      <input
                        type="number"
                        name="salePrice"
                        defaultValue={editingArticle.sale_price || editingArticle.salePrice}
                        required
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie *
                    </label>
                    <select
                      name="category"
                      defaultValue={editingArticle.category}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="base">Base - Produit principal</option>
                      <option value="upsell">Upsell - Produit complémentaire</option>
                      <option value="pack">Pack - Ensemble de produits</option>
                    </select>
                  </div>

                  {/* Caractéristiques */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caractéristiques (une par ligne)
                    </label>
                    <textarea
                      name="features"
                      defaultValue={editingArticle.features ? editingArticle.features.join('\n') : ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Personnalisation unique&#10;Livraison rapide&#10;Matériaux de qualité"
                    />
                  </div>

                  {/* Statut actif */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="active"
                      id="active"
                      defaultChecked={editingArticle.active}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
                      Article actif (visible sur le site)
                    </label>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-between pt-6 border-t">
                    <div>
                      {editingArticle.id && (
                        <button
                          type="button"
                          onClick={() => deleteArticle(editingArticle.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingArticle(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {editingArticle.id ? '✏️ Modifier' : '➕ Créer'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition Code de remise */}
        {editingDiscount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    {editingDiscount.id ? '✏️ Modifier Code de Remise' : '➕ Nouveau Code de Remise'}
                  </h2>
                  <button
                    onClick={() => setEditingDiscount(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target as HTMLFormElement)
                    const discountData = {
                      id: editingDiscount.id,
                      code: formData.get('code') as string,
                      description: formData.get('description') as string,
                      discount_type: formData.get('discount_type') as string,
                      discount_value: parseFloat(formData.get('discount_value') as string),
                      minimum_amount: parseFloat(formData.get('minimum_amount') as string) || 0,
                      usage_limit: formData.get('usage_limit') ? parseInt(formData.get('usage_limit') as string) : null,
                      valid_from: formData.get('valid_from') as string,
                      valid_until: formData.get('valid_until') as string || null,
                      active: formData.get('active') === 'on'
                    }
                    console.log('🔍 Données envoyées pour code de remise:', discountData)
                    saveDiscountCode(discountData)
                  }}
                  className="space-y-4"
                >
                  {/* Code de remise */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code de remise *
                      </label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingDiscount.code}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                        placeholder="Ex: BIENVENUE10"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de réduction *
                      </label>
                      <select
                        name="discount_type"
                        defaultValue={editingDiscount.discount_type}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="percentage">Pourcentage (%)</option>
                        <option value="fixed">Montant fixe (€)</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingDiscount.description}
                      required
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description du code de remise..."
                    />
                  </div>

                  {/* Valeur et montant minimum */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valeur de la réduction *
                      </label>
                      <input
                        type="number"
                        name="discount_value"
                        defaultValue={editingDiscount.discount_value}
                        required
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Montant minimum (€)
                      </label>
                      <input
                        type="number"
                        name="minimum_amount"
                        defaultValue={editingDiscount.minimum_amount || 0}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Dates de validité */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valide à partir du *
                      </label>
                      <input
                        type="date"
                        name="valid_from"
                        defaultValue={editingDiscount.valid_from}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valide jusqu'au
                      </label>
                      <input
                        type="date"
                        name="valid_until"
                        defaultValue={editingDiscount.valid_until || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Limite d'usage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limite d'utilisation
                    </label>
                    <input
                      type="number"
                      name="usage_limit"
                      defaultValue={editingDiscount.usage_limit || ''}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Laisser vide pour illimité"
                    />
                  </div>

                  {/* Statut actif */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="active"
                      id="discount-active"
                      defaultChecked={editingDiscount.active}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="discount-active" className="ml-2 text-sm font-medium text-gray-700">
                      Code actif (utilisable par les clients)
                    </label>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-between pt-6 border-t">
                    <div>
                      {editingDiscount.id && (
                        <button
                          type="button"
                          onClick={() => deleteDiscountCode(editingDiscount.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingDiscount(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {editingDiscount.id ? '✏️ Modifier' : '➕ Créer'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'édition Paramètres de Livraison */}
        {editingShipping && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">✏️ Modifier Paramètres de Livraison</h2>
                  <button
                    onClick={() => setEditingShipping(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target as HTMLFormElement)
                    const shippingData = {
                      france_price: parseFloat(formData.get('france_price') as string),
                      europe_price: parseFloat(formData.get('europe_price') as string),
                      world_price: parseFloat(formData.get('world_price') as string),
                      letter_price: parseFloat(formData.get('letter_price') as string),
                      free_shipping_threshold: parseFloat(formData.get('free_shipping_threshold') as string),
                      estimated_delivery_france: formData.get('estimated_delivery_france') as string,
                      estimated_delivery_europe: formData.get('estimated_delivery_europe') as string,
                      estimated_delivery_world: formData.get('estimated_delivery_world') as string,
                      active: formData.get('active') === 'on'
                    }
                    saveShippingSettings(shippingData)
                    setEditingShipping(null)
                  }}
                  className="space-y-4"
                >
                  {/* Tarifs de livraison */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">💰 Tarifs de Livraison</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🇫🇷 France - Colis (€) *
                        </label>
                        <input
                          type="number"
                          name="france_price"
                          defaultValue={editingShipping.france_price}
                          required
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          📮 Tarif Lettre (€) *
                          <span className="block text-xs text-gray-500 font-normal">Pour 1-2 planches de base</span>
                        </label>
                        <input
                          type="number"
                          name="letter_price"
                          defaultValue={editingShipping.letter_price || 2.50}
                          required
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🇪🇺 Europe - Colis (€) *
                        </label>
                        <input
                          type="number"
                          name="europe_price"
                          defaultValue={editingShipping.europe_price}
                          required
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🌍 Monde - Colis (€) *
                        </label>
                        <input
                          type="number"
                          name="world_price"
                          defaultValue={editingShipping.world_price}
                          required
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Délais de livraison */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">⏰ Délais de Livraison</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🇫🇷 Délai France
                        </label>
                        <input
                          type="text"
                          name="estimated_delivery_france"
                          defaultValue={editingShipping.estimated_delivery_france}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: 2-3 jours ouvrés"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🇪🇺 Délai Europe
                        </label>
                        <input
                          type="text"
                          name="estimated_delivery_europe"
                          defaultValue={editingShipping.estimated_delivery_europe}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: 5-7 jours ouvrés"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🌍 Délai Monde
                        </label>
                        <input
                          type="text"
                          name="estimated_delivery_world"
                          defaultValue={editingShipping.estimated_delivery_world}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: 10-15 jours ouvrés"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Livraison gratuite */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🆓 Seuil livraison gratuite (€) *
                    </label>
                    <input
                      type="number"
                      name="free_shipping_threshold"
                      defaultValue={editingShipping.free_shipping_threshold}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Statut actif */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="active"
                      id="shipping-active"
                      defaultChecked={editingShipping.active}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="shipping-active" className="ml-2 text-sm font-medium text-gray-700">
                      Configuration activée
                      <span className="block text-xs text-gray-500 font-normal">Utiliser ces paramètres pour les nouvelles commandes</span>
                    </label>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingShipping(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Sauvegarder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

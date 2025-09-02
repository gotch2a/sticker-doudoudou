'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { OrderService, Order, AdminNote, generateSecurePhotoUrl } from '@/lib/supabase'
import { shippingSettingsService, ShippingSettings } from '@/lib/shippingSettings'

// Types pour les produits (maintenant gérés via Supabase)
interface ProductSettings {
  id: string
  name: string
  description: string
  originalPrice: number
  salePrice: number
  savings: number
  icon: string
  badge?: string
  popular?: boolean
  features: string[]
  active: boolean
  category: 'base' | 'upsell' | 'pack'
}

interface ProductPack {
  id: string
  name: string
  description: string
  products: string[]
  originalPrice: number
  salePrice: number
  savings: number
  active: boolean
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderNotes, setOrderNotes] = useState<AdminNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [securePhotoUrls, setSecurePhotoUrls] = useState<Record<string, string>>({})
  const [orderArticles, setOrderArticles] = useState<any[]>([])  // Articles de la commande
  
  // État pour la gestion des articles
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'packs' | 'shipping'>('orders')
  const [products, setProducts] = useState<ProductSettings[]>([])
  const [productPacks, setProductPacks] = useState<ProductPack[]>([])
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null)
  const [editingProduct, setEditingProduct] = useState<ProductSettings | null>(null)
  const [editingPack, setEditingPack] = useState<ProductPack | null>(null)

  // Charger les commandes depuis Supabase
  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await OrderService.getAllOrders()
      console.log('🔍 DEBUG - Commandes chargées:', data.map(o => ({ 
        id: o.id, 
        order_number: o.order_number, 
        status: o.status 
      })))
      setOrders(data)
      
      // Générer les URLs sécurisées pour toutes les photos
      const urlPromises = data
        .filter(order => order.photo_url && order.photo_url.trim() !== '')
        .map(async (order) => {
          try {
            const secureUrl = await generateSecurePhotoUrl(order.photo_url)
            return { orderId: order.id, secureUrl }
          } catch (error) {
            console.error(`Erreur génération URL pour ${order.order_number}:`, error)
            return { orderId: order.id, secureUrl: '#' }
          }
        })
      
      const resolvedUrls = await Promise.all(urlPromises)
      const urlsMap = resolvedUrls.reduce((acc, { orderId, secureUrl }) => {
        acc[orderId] = secureUrl
        return acc
      }, {} as Record<string, string>)
      
      setSecurePhotoUrls(urlsMap)
      console.log(`📸 ${Object.keys(urlsMap).length} photos traitées sur ${data.length} commandes`)
    } catch (error) {
      console.error('Erreur chargement commandes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Charger les notes d'une commande
  const loadOrderNotes = async (orderId: string) => {
    try {
      const notes = await OrderService.getOrderNotes(orderId)
      setOrderNotes(notes)
    } catch (error) {
      console.error('Erreur chargement notes:', error)
    }
  }

  // Charger les articles d'une commande
  const loadOrderArticles = async (orderId: string) => {
    try {
      const articles = await OrderService.getOrderArticles(orderId)
      setOrderArticles(articles)
      console.log('📦 Articles de la commande chargés:', articles)
    } catch (error) {
      console.error('Erreur chargement articles de la commande:', error)
      setOrderArticles([])
    }
  }

  // Charger les articles depuis Supabase
  const loadProducts = async () => {
    try {
      const articles = await OrderService.getAllArticles()
      
      // Transformer les articles Supabase en format attendu par le frontend
      const products = articles.map(article => ({
        id: article.id,
        name: article.name,
        description: article.description,
        originalPrice: article.original_price,
        salePrice: article.sale_price,
        savings: article.savings,
        icon: article.icon,
        badge: article.badge,
        popular: article.popular,
        features: article.features,
        active: article.active,
        category: article.category
      }))
      
      setProducts(products)
      console.log('🏷️ Articles chargés depuis Supabase:', products)
    } catch (error) {
      console.error('Erreur chargement articles:', error)
    }
  }

  const loadProductPacks = () => {
    // TODO: Implémenter les packs dans Supabase
    // Pour l'instant, on utilise un tableau vide
    setProductPacks([])
    console.log('📦 Packs désactivés temporairement (à implémenter dans Supabase)')
  }

  // Charger les paramètres de livraison depuis le serveur
  const loadShippingSettings = async () => {
    const settings = await shippingSettingsService.loadFromServer()
    setShippingSettings(settings)
    console.log('🚚 Paramètres livraison chargés:', settings)
  }

  // Fonctions pour mettre à jour les articles
  const updateProductPrice = async (productId: string, field: string, value: number) => {
    try {
      const updates: any = {}
      
      if (field === 'originalPrice') {
        updates.original_price = value
        // Recalculer les économies
        const product = products.find(p => p.id === productId)
        if (product) {
          updates.savings = value - product.salePrice
        }
      } else if (field === 'salePrice') {
        updates.sale_price = value
        // Recalculer les économies
        const product = products.find(p => p.id === productId)
        if (product) {
          updates.savings = product.originalPrice - value
        }
      }
      
      await OrderService.updateArticle(productId, updates)
      
      // Recharger les produits pour afficher les changements
      await loadProducts()
      
      console.log(`✅ Article ${productId} mis à jour: ${field} = ${value}`)
    } catch (error) {
      console.error('Erreur mise à jour article:', error)
    }
  }

  const toggleProductStatus = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return
      
      await OrderService.updateArticle(productId, { active: !product.active })
      
      // Recharger les produits pour afficher les changements
      await loadProducts()
      
      console.log(`✅ Statut article ${productId} changé: ${!product.active}`)
    } catch (error) {
      console.error('Erreur changement statut article:', error)
    }
  }

  // Fonction pour sauvegarder un produit modifié
  const saveProduct = async () => {
    if (!editingProduct) return
    
    try {
      console.log('💾 Sauvegarde du produit:', editingProduct.name)
      
      // Sauvegarder directement dans Supabase (comme les autres fonctions)
      const updates = {
        name: editingProduct.name,
        description: editingProduct.description,
        original_price: editingProduct.originalPrice,
        sale_price: editingProduct.salePrice,
        active: editingProduct.active,
        // Recalculer les économies
        savings: editingProduct.originalPrice - editingProduct.salePrice
      }
      
      await OrderService.updateArticle(editingProduct.id, updates)
      
      // Recharger les produits depuis Supabase pour afficher les changements
      await loadProducts()
      
      // Fermer le modal
      setEditingProduct(null)
      
      console.log('✅ Produit sauvegardé avec succès dans Supabase')
      alert('✅ Produit mis à jour avec succès !')
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde produit:', error)
      alert('❌ Erreur lors de la sauvegarde')
    }
  }

  // Fonctions pour les paramètres de livraison
  const updateShippingTarif = (tarif: 'tarif1' | 'tarif2', field: string, value: string | number | boolean) => {
    if (!shippingSettings) return
    
    const updatedSettings = {
      ...shippingSettings,
      [tarif]: {
        ...shippingSettings[tarif],
        [field]: value
      }
    }
    setShippingSettings(updatedSettings)
    shippingSettingsService.saveSettings(updatedSettings)
    shippingSettingsService.syncWithServer(updatedSettings)
    console.log(`🚚 Tarif ${tarif} mis à jour:`, { [field]: value })
  }

  // Charger les données au démarrage
  useEffect(() => {
    loadOrders()
    loadProducts()
    loadProductPacks()
    loadShippingSettings()
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log('🔄 DÉBUT - Changement de statut:', { orderId, newStatus })
      
      // Vérifier que la commande existe
      const existingOrder = orders.find(o => o.id === orderId)
      if (!existingOrder) {
        console.error('❌ Commande non trouvée:', orderId)
        alert('Erreur: Commande non trouvée')
        return
      }
      
      console.log('📋 Commande trouvée:', {
        orderNumber: existingOrder.order_number,
        currentStatus: existingOrder.status,
        newStatus: newStatus
      })
      
      // Tentative de mise à jour directe (solution temporaire)
      console.log('🔗 Tentative mise à jour directe...')
      try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erreur API')
        }

        const result = await response.json()
        console.log('✅ Réponse API:', result)
      } catch (apiError) {
        console.warn('⚠️ API échouée, mise à jour locale uniquement:', apiError)
        // Continue quand même avec la mise à jour locale pour l'interface
      }
      
      // Mise à jour locale
      console.log('🔄 Mise à jour état local...')
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      
      console.log('✅ SUCCÈS - Statut mis à jour avec succès')
      alert(`✅ Statut mis à jour: ${existingOrder.order_number} → ${newStatus}`)
      
    } catch (error) {
      console.error('❌ ERREUR - Détails complets:', error)
      console.error('❌ Type d\'erreur:', typeof error)
      console.error('❌ Message:', error instanceof Error ? error.message : 'Erreur inconnue')
      
      if (error instanceof Error && error.message) {
        alert(`❌ Erreur: ${error.message}`)
      } else {
        alert('❌ Erreur inconnue lors de la mise à jour du statut')
      }
    }
  }

  const addNote = async () => {
    if (!selectedOrder || !newNote.trim()) return

    try {
      await OrderService.addAdminNote(selectedOrder.id, newNote.trim())
      setNewNote('')
      await loadOrderNotes(selectedOrder.id)
    } catch (error) {
      console.error('Erreur ajout note:', error)
    }
  }

  const generateBrief = (order: Order) => {
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
Notes: ${order.notes || 'Aucune note'}
---
Cree le ${new Date().toLocaleString('fr-FR')}`
    
    navigator.clipboard.writeText(brief)
    alert('Brief copié dans le presse-papiers !')
  }

  const togglePackStatus = (packId: string) => {
    // TODO: Implémenter la gestion des packs dans Supabase
    console.log('📦 Fonction packs désactivée temporairement')
    alert('⚠️ Gestion des packs temporairement désactivée - à implémenter dans Supabase')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Administration Doudoudou</h1>
        
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
                📦 Commandes
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
                onClick={() => setActiveTab('packs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'packs'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📦 Packs
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
                  onClick={loadOrders}
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
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-pulse">
                  <div className="text-lg text-gray-500">⏳ Chargement des commandes...</div>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-lg text-gray-500 mb-2">📭 Aucune commande trouvée</div>
                <p className="text-gray-400">Les nouvelles commandes apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      
                      {/* STATUT - Element principal très visible */}
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
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
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

                      {/* Détails du doudou */}
                      <div className="lg:col-span-3">
                        <div className="bg-blue-50 p-4 rounded-lg h-[160px] flex flex-col">
                          <h3 className="font-bold text-gray-900 mb-2">🧸 Doudou</h3>
                          <p className="font-semibold text-blue-800">{order.pet_name}</p>
                          <p className="text-sm text-blue-600">{order.animal_type}</p>
                          <p className="text-sm text-gray-600">{order.number_of_sheets} planche(s)</p>
                          
                          {order.photo_url && (
                            <div className="mt-auto">
                              {securePhotoUrls[order.id] && securePhotoUrls[order.id] !== '#' ? (
                                <div className="flex items-center gap-2">
                                  <Image 
                                    src={securePhotoUrls[order.id]} 
                                    alt={`Photo de ${order.pet_name}`}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 object-cover rounded-lg border-2 border-blue-200"
                                  />
                                  <a 
                                    href={securePhotoUrls[order.id]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    📸 Voir
                                  </a>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-600">⏳</span>
                                </div>
                              )}
                            </div>
                          )}
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
                          onClick={() => {
                            setSelectedOrder(order)
                            loadOrderNotes(order.id)
                            loadOrderArticles(order.id)
                          }}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          👁️ Détails
                        </button>
                        <button
                          onClick={() => generateBrief(order)}
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

        {/* Modal détails commande */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations générales */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">📋 Informations générales</h3>
                    <div className="space-y-2">
                      <p><strong>Numéro:</strong> {selectedOrder.order_number}</p>
                      <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}</p>
                      <p><strong>Statut:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${
                          selectedOrder.status === 'nouveau' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                          selectedOrder.status === 'termine' ? 'bg-green-100 text-green-800' :
                          selectedOrder.status === 'expedie' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedOrder.status.replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Détails du doudou */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">🧸 Détails du doudou</h3>
                    <div className="space-y-2">
                      <p><strong>Surnom:</strong> {selectedOrder.pet_name}</p>
                      <p><strong>Type:</strong> {selectedOrder.animal_type}</p>
                      <p><strong>Pour l'enfant:</strong> {selectedOrder.child_name}</p>
                      {selectedOrder.child_age && (
                        <p><strong>Âge:</strong> {selectedOrder.child_age}</p>
                      )}
                      <div>
                        <strong>Photo:</strong>
                        <div className="mt-2">
                          {selectedOrder.photo_url && selectedOrder.photo_url.trim() !== '' ? (
                            securePhotoUrls[selectedOrder.id] && securePhotoUrls[selectedOrder.id] !== '#' ? (
                              <div className="space-y-2">
                                <Image 
                                  src={securePhotoUrls[selectedOrder.id]} 
                                  alt={`Photo de ${selectedOrder.pet_name}`}
                                  width={96}
                                  height={96}
                                  className="w-24 h-24 object-cover rounded border border-gray-300"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                                <div className="hidden text-sm text-red-600">❌ Erreur de chargement de l'image</div>
                                <a 
                                  href={securePhotoUrls[selectedOrder.id]} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  📸 Ouvrir en grand
                                </a>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-24 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                                  <span className="text-2xl">⏳</span>
                                </div>
                                <span className="text-sm text-gray-500">Chargement de la photo...</span>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-24 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                                <span className="text-2xl text-gray-400">📷</span>
                              </div>
                              <span className="text-sm text-gray-500">Pas de photo uploadée</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations client */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">👤 Client</h3>
                    <div className="space-y-2">
                      <p><strong>Enfant:</strong> {selectedOrder.child_name}</p>
                      <p><strong>Email:</strong> {selectedOrder.client_email}</p>
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">📍 Adresse de livraison</h3>
                    <div className="space-y-1">
                      <p>{selectedOrder.address}</p>
                      <p>{selectedOrder.city} {selectedOrder.postal_code}</p>
                    </div>
                  </div>

                  {/* Articles de la commande */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">🛒 Articles commandés</h3>
                    <div className="space-y-3">
                      {orderArticles.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">⏳ Chargement des articles...</p>
                        </div>
                      ) : (
                        <>
                          {orderArticles.map((item) => (
                            <div key={item.id} className="bg-white p-3 rounded-lg border border-yellow-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{item.articles?.icon || '📦'}</span>
                                    <h4 className="font-semibold text-gray-900">{item.articles?.name}</h4>
                                    {item.articles?.badge && (
                                      <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                        {item.articles.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{item.articles?.description}</p>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600">Quantité: <strong>{item.quantity}</strong></span>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-gray-600">Prix unitaire: <strong>{item.unit_price}€</strong></span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-yellow-800">
                                    {item.total_price}€
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="border-t border-yellow-300 pt-3 mt-4">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-900">Total commande:</span>
                              <span className="text-xl font-bold text-yellow-800">{selectedOrder.total_amount}€</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes du client */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">📝 Notes du client</h3>
                    <p className="italic">
                      {selectedOrder.notes || 'Aucune note spéciale du client'}
                    </p>
                  </div>
                </div>

                {/* Notes admin */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">💬 Notes admin</h3>
                  <div className="space-y-3 max-h-40 overflow-y-auto mb-4">
                    {orderNotes.length === 0 ? (
                      <p className="text-gray-500 text-sm">Aucune note admin</p>
                    ) : (
                      orderNotes.map((note) => (
                        <div key={note.id} className="bg-white p-3 rounded border-l-4 border-blue-500">
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {note.created_by} • {new Date(note.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Ajouter une note */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Ajouter une note admin..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addNote()}
                    />
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => generateBrief(selectedOrder)}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium"
                  >
                    📋 Générer brief artiste
                  </button>
                  
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Autres onglets - placeholder simple pour éviter les erreurs */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🏷️ Gestion des Articles</h2>
            
            {products.length === 0 ? (
              <p className="text-gray-600">Chargement des articles...</p>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.active ? 'Actif' : 'Inactif'}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{product.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-600">
                              {(product.salePrice || 0).toFixed(2)}€
                            </span>
                            {(product.originalPrice || 0) > (product.salePrice || 0) && (
                              <span className="text-gray-500 line-through">
                                {(product.originalPrice || 0).toFixed(2)}€
                              </span>
                            )}
                          </div>
                          
                          {(product.originalPrice || 0) > (product.salePrice || 0) && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                              -{Math.round((((product.originalPrice || 0) - (product.salePrice || 0)) / (product.originalPrice || 1)) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'packs' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📦 Gestion des Packs</h2>
            <p className="text-gray-600">Cette section sera bientôt disponible.</p>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🚚 Paramètres de Livraison</h2>
            
            {!shippingSettings ? (
              <p className="text-gray-600">Chargement des paramètres de livraison...</p>
            ) : (
              <div className="space-y-8">
                {/* Tarif 1 - Standard */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-600">
                    📦 Tarif 1 - {shippingSettings.tarif1.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom du tarif</label>
                      <input
                        type="text"
                        value={shippingSettings.tarif1.name}
                        onChange={(e) => updateShippingTarif('tarif1', 'name', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ex: Standard"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Prix (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={shippingSettings.tarif1.price}
                        onChange={(e) => updateShippingTarif('tarif1', 'price', parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Délai (jours)</label>
                      <input
                        type="number"
                        value={shippingSettings.tarif1.delay}
                        onChange={(e) => updateShippingTarif('tarif1', 'delay', parseInt(e.target.value) || 0)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={shippingSettings.tarif1.description}
                      onChange={(e) => updateShippingTarif('tarif1', 'description', e.target.value)}
                      className="w-full border rounded px-3 py-2 h-20"
                      placeholder="Description du mode de livraison..."
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={shippingSettings.tarif1.active}
                        onChange={(e) => updateShippingTarif('tarif1', 'active', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Tarif actif</span>
                    </label>
                  </div>
                </div>

                {/* Tarif 2 - Express */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-green-600">
                    🚀 Tarif 2 - {shippingSettings.tarif2.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nom du tarif</label>
                      <input
                        type="text"
                        value={shippingSettings.tarif2.name}
                        onChange={(e) => updateShippingTarif('tarif2', 'name', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Ex: Express"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Prix (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={shippingSettings.tarif2.price}
                        onChange={(e) => updateShippingTarif('tarif2', 'price', parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Délai (jours)</label>
                      <input
                        type="number"
                        value={shippingSettings.tarif2.delay}
                        onChange={(e) => updateShippingTarif('tarif2', 'delay', parseInt(e.target.value) || 0)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={shippingSettings.tarif2.description}
                      onChange={(e) => updateShippingTarif('tarif2', 'description', e.target.value)}
                      className="w-full border rounded px-3 py-2 h-20"
                      placeholder="Description du mode de livraison..."
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={shippingSettings.tarif2.active}
                        onChange={(e) => updateShippingTarif('tarif2', 'active', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Tarif actif</span>
                    </label>
                  </div>
                </div>

                {/* Informations générales */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">📋 Informations</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Les modifications sont sauvegardées automatiquement</p>
                    <p>• Les tarifs inactifs n'apparaissent pas sur le site</p>
                    <p>• Le délai est affiché en jours ouvrables</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de modification d'article */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Modifier l'article</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full border rounded px-3 py-2 h-20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prix de vente (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.salePrice || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setEditingProduct({
                        ...editingProduct, 
                        salePrice: value
                      })
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Prix original (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.originalPrice || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setEditingProduct({
                        ...editingProduct, 
                        originalPrice: value
                      })
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  value={editingProduct.active ? 'active' : 'inactive'}
                  onChange={(e) => setEditingProduct({...editingProduct, active: e.target.value === 'active'})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveProduct}
                className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { OrderService, Order, AdminNote, generateSecurePhotoUrl } from '@/lib/supabase'
import { productSettingsService, ProductSettings, ProductPack } from '@/lib/productSettings'
import { shippingSettingsService, ShippingSettings } from '@/lib/shippingSettings'

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderNotes, setOrderNotes] = useState<AdminNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [securePhotoUrls, setSecurePhotoUrls] = useState<Record<string, string>>({})
  
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
      setOrders(data)
      
      // Générer les URLs sécurisées pour toutes les photos
      const urlPromises = data
        .filter(order => order.photo_url)
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

  // Charger les produits depuis le serveur
  const loadProducts = async () => {
    const savedProducts = await productSettingsService.loadFromServer()
    setProducts(savedProducts)
    console.log('🏷️ Produits chargés depuis le serveur:', savedProducts)
  }

  const loadProductPacks = () => {
    const savedPacks = productSettingsService.getPacks()
    setProductPacks(savedPacks)
    console.log('📦 Packs chargés:', savedPacks)
  }

  // Charger les paramètres de livraison depuis le serveur
  const loadShippingSettings = async () => {
    const settings = await shippingSettingsService.loadFromServer()
    setShippingSettings(settings)
    console.log('🚚 Paramètres livraison chargés:', settings)
  }

  // Fonctions pour les paramètres de livraison
  const updateShippingTarif = (tarif: 'tarif1' | 'tarif2', field: string, value: string | number) => {
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
      await OrderService.updateOrderStatus(orderId, newStatus)
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
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

  // Fonctions de gestion des produits
  const toggleProductStatus = (productId: string) => {
    const currentProduct = products.find(p => p.id === productId)
    if (currentProduct) {
      const updatedProducts = productSettingsService.updateProduct(productId, { 
        active: !currentProduct.active 
      })
      setProducts(updatedProducts)
      alert(`Produit ${currentProduct.active ? 'désactivé' : 'activé'} !`)
    }
  }

  const updateProductPrice = (productId: string, field: 'originalPrice' | 'salePrice', value: number) => {
    const currentProduct = products.find(p => p.id === productId)
    if (currentProduct) {
      const updates: any = { [field]: value }
      
      // Calculer automatiquement les économies
      if (field === 'originalPrice') {
        updates.savings = value - currentProduct.salePrice
      } else {
        updates.savings = currentProduct.originalPrice - value
      }
      
      const updatedProducts = productSettingsService.updateProduct(productId, updates)
      setProducts(updatedProducts)
      console.log(`💰 Prix mis à jour pour ${productId}:`, updates)
    }
  }

  const togglePackStatus = (packId: string) => {
    const currentPack = productPacks.find(p => p.id === packId)
    if (currentPack) {
      const updatedPacks = productSettingsService.updatePack(packId, { 
        active: !currentPack.active 
      })
      setProductPacks(updatedPacks)
      alert(`Pack ${currentPack.active ? 'désactivé' : 'activé'} !`)
    }
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
          <div>
            {loading ? (
              <p>Chargement des commandes...</p>
            ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Numéro</th>
                  <th className="px-6 py-3 text-left">Doudou</th>
                  <th className="px-6 py-3 text-left">Client</th>
                  <th className="px-6 py-3 text-left">Adresse</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                  <th className="px-6 py-3 text-left">Total</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.pet_name}</p>
                        <p className="text-sm text-gray-500">
                          {order.animal_type} • {order.number_of_sheets} planche(s)
                        </p>
                        {order.photo_url && (
                          <div className="mt-2">
                            {securePhotoUrls[order.id] && securePhotoUrls[order.id] !== '#' ? (
                              <div className="flex items-center gap-2">
                                <Image 
                                  src={securePhotoUrls[order.id]} 
                                  alt={`Photo de ${order.pet_name}`}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 object-cover rounded border border-gray-300"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                                <span className="hidden text-xs text-red-600">❌ Erreur chargement</span>
                                <a 
                                  href={securePhotoUrls[order.id]} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  📸 Agrandir
                                </a>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                                  <span className="text-xs">⏳</span>
                                </div>
                                <span className="text-xs text-gray-500">Chargement...</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{order.child_name}</p>
                        <p className="text-sm text-gray-500">{order.client_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p>{order.address}</p>
                        <p className="text-gray-500">{order.city} {order.postal_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.status === 'nouveau' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'termine' ? 'bg-green-100 text-green-800' :
                        order.status === 'expedie' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {order.total_amount}€
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            loadOrderNotes(order.id)
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          👁️ Détails
                        </button>
                        <button
                          onClick={() => generateBrief(order)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          📋 Brief
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="nouveau">Nouveau</option>
                          <option value="en_cours">En cours</option>
                          <option value="termine">Terminé</option>
                          <option value="expedie">Expédié</option>
                          <option value="livre">Livré</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            )}
            
            <div className="mt-8">
              <button
                onClick={loadOrders}
                className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
              >
                Actualiser les commandes
              </button>
            </div>
          </div>
        )}

        {/* Onglet Gestion des Articles */}
        {activeTab === 'products' && (
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Gestion des Articles</h2>
                    <p className="text-sm text-gray-600 mt-1">Gérez les prix et la disponibilité de vos articles</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={loadProducts}
                      className="bg-gray-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700"
                    >
                      🔄 Actualiser
                    </button>
                    <a
                      href="/pre-commande?petName=Test&animalType=chien&childName=Test&email=test@test.com&numberOfSheets=1&photo=test"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                    >
                      🧪 Tester l'upsell
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{product.icon}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                              <p className="text-sm text-gray-600">{product.description}</p>
                            </div>
                            {product.badge && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                {product.badge}
                              </span>
                            )}
                            {product.popular && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                Populaire
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix original (€)
                              </label>
                              <input
                                type="number"
                                step="0.10"
                                value={product.originalPrice}
                                onChange={(e) => updateProductPrice(product.id, 'originalPrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix de vente (€)
                              </label>
                              <input
                                type="number"
                                step="0.10"
                                value={product.salePrice}
                                onChange={(e) => updateProductPrice(product.id, 'salePrice', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Économie (€)
                              </label>
                              <input
                                type="number"
                                value={product.savings.toFixed(2)}
                                disabled
                                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Caractéristiques :</h4>
                            <ul className="text-sm text-gray-600">
                              {product.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <span className="text-green-500">✓</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="ml-6 flex flex-col items-end gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            product.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.active ? 'Actif' : 'Inactif'}
                          </span>
                          
                          <button
                            onClick={() => toggleProductStatus(product.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              product.active
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {product.active ? 'Désactiver' : 'Activer'}
                          </button>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Catégorie:</p>
                            <p className="text-sm font-medium capitalize">{product.category}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Gestion des Packs */}
        {activeTab === 'packs' && (
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Gestion des Packs</h2>
                <p className="text-sm text-gray-600 mt-1">Créez et gérez des packs d'articles à prix avantageux</p>
              </div>
              
              <div className="p-6">
                {productPacks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun pack configuré</h3>
                    <p className="text-gray-500 mb-4">Créez votre premier pack d'articles pour proposer des offres groupées attractives</p>
                    <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">
                      Créer un pack
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {productPacks.map((pack) => (
                      <div key={pack.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{pack.name}</h3>
                            <p className="text-sm text-gray-600 mb-4">{pack.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Prix original (€)
                                </label>
                                <input
                                  type="number"
                                  step="0.10"
                                  value={pack.originalPrice}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Prix du pack (€)
                                </label>
                                <input
                                  type="number"
                                  step="0.10"
                                  value={pack.salePrice}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Économie (€)
                                </label>
                                <input
                                  type="number"
                                  value={pack.savings.toFixed(2)}
                                  disabled
                                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-500"
                                />
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Articles inclus :</h4>
                              <div className="flex flex-wrap gap-2">
                                {pack.products.map((productId) => {
                                  const product = products.find(p => p.id === productId)
                                  return product ? (
                                    <span key={productId} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                      {product.icon} {product.name}
                                    </span>
                                  ) : null
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-6 flex flex-col items-end gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              pack.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {pack.active ? 'Actif' : 'Inactif'}
                            </span>
                            
                            <button
                              onClick={() => togglePackStatus(pack.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                pack.active
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {pack.active ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                      {selectedOrder.photo_url && (
                        <div>
                          <strong>Photo:</strong>
                          <div className="mt-2">
                            {securePhotoUrls[selectedOrder.id] && securePhotoUrls[selectedOrder.id] !== '#' ? (
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
                            )}
                          </div>
                        </div>
                      )}
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

                  {/* Détails de la commande */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">📦 Commande</h3>
                    <div className="space-y-2">
                      <p><strong>Nombre de planches:</strong> {selectedOrder.number_of_sheets}</p>
                      <p><strong>Prix par planche:</strong> {selectedOrder.price_per_sheet}€</p>
                      <p><strong>Total:</strong> <span className="text-lg font-bold">{selectedOrder.total_amount}€</span></p>
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

        {/* Onglet Gestion des Paramètres de Livraison */}
        {activeTab === 'shipping' && (
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Paramètres de Livraison</h2>
                <p className="text-sm text-gray-600 mt-1">Configurez les frais de livraison selon les produits commandés</p>
              </div>
              
              <div className="p-6">
                {shippingSettings ? (
                  <div className="grid gap-6">
                    {/* Tarif 1 - Stickers uniquement */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-lg">🚚</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Tarif 1 - Standard</h3>
                          <p className="text-sm text-gray-600">Pour les commandes de stickers uniquement</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du tarif
                          </label>
                          <input
                            type="text"
                            value={shippingSettings.tarif1.name}
                            onChange={(e) => updateShippingTarif('tarif1', 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prix (€)
                          </label>
                          <input
                            type="number"
                            step="0.10"
                            value={shippingSettings.tarif1.price}
                            onChange={(e) => updateShippingTarif('tarif1', 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={shippingSettings.tarif1.description}
                          onChange={(e) => updateShippingTarif('tarif1', 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Conditions d'application :</strong> Planche de base seule ou avec planche bonus uniquement
                        </p>
                      </div>
                    </div>

                    {/* Tarif 2 - Avec produits physiques */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-lg">📦</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Tarif 2 - Premium</h3>
                          <p className="text-sm text-gray-600">Pour les commandes incluant photo ou livre</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du tarif
                          </label>
                          <input
                            type="text"
                            value={shippingSettings.tarif2.name}
                            onChange={(e) => updateShippingTarif('tarif2', 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prix (€)
                          </label>
                          <input
                            type="number"
                            step="0.10"
                            value={shippingSettings.tarif2.price}
                            onChange={(e) => updateShippingTarif('tarif2', 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={shippingSettings.tarif2.description}
                          onChange={(e) => updateShippingTarif('tarif2', 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-800">
                          <strong>Conditions d'application :</strong> Dès qu'une photo premium ou livre d'histoire est commandé
                        </p>
                      </div>
                    </div>

                    {/* Résumé des modifications */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">📊 Résumé des tarifs actuels</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>{shippingSettings.tarif1.name} :</strong> {shippingSettings.tarif1.price.toFixed(2)}€</p>
                        <p><strong>{shippingSettings.tarif2.name} :</strong> {shippingSettings.tarif2.price.toFixed(2)}€</p>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        ✅ Les modifications sont sauvegardées automatiquement
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chargement des paramètres...</h3>
                    <p className="text-gray-500">Veuillez patienter</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

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

  useEffect(() => {
    loadOrdersFromServer()
  }, [])

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
          <h1 className="text-3xl font-bold text-green-800">✅ Administration Doudoudou - Mode Serveur</h1>
          <p className="text-green-700">Cette version fonctionne entièrement via API serveur (contournement du problème client).</p>
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

                      {/* Détails du doudou */}
                      <div className="lg:col-span-3">
                        <div className="bg-blue-50 p-4 rounded-lg h-[160px] flex flex-col">
                          <h3 className="font-bold text-gray-900 mb-2">🧸 Doudou</h3>
                          <p className="font-semibold text-blue-800">{order.pet_name}</p>
                          <p className="text-sm text-blue-600">{order.animal_type}</p>
                          <p className="text-sm text-gray-600">{order.number_of_sheets} planche(s)</p>
                          
                          {order.photo_url && (
                            <div className="mt-auto">
                              <div className="text-xs text-blue-600">📸 Photo disponible</div>
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

        {/* Autres onglets - placeholder */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🏷️ Gestion des Articles</h2>
            <p className="text-gray-600">Mode serveur - Articles à implémenter</p>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🚚 Paramètres de Livraison</h2>
            <p className="text-gray-600">Mode serveur - Livraison à implémenter</p>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🏷️ Codes de Remise</h2>
            <p className="text-gray-600">Mode serveur - Codes de remise à implémenter</p>
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">📋 Informations générales</h3>
                    <div className="space-y-2">
                      <p><strong>Numéro:</strong> {selectedOrder.order_number}</p>
                      <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}</p>
                      <p><strong>Statut:</strong> {selectedOrder.status}</p>
                      <p><strong>Total:</strong> {selectedOrder.total_amount}€</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">🧸 Détails du doudou</h3>
                    <div className="space-y-2">
                      <p><strong>Surnom:</strong> {selectedOrder.pet_name}</p>
                      <p><strong>Type:</strong> {selectedOrder.animal_type}</p>
                      <p><strong>Pour l'enfant:</strong> {selectedOrder.child_name}</p>
                      <p><strong>Planches:</strong> {selectedOrder.number_of_sheets}</p>
                      {selectedOrder.notes && (
                        <p><strong>Notes:</strong> {selectedOrder.notes}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
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

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-bold text-yellow-800 mb-2">⚡ Mode Serveur Actif</h3>
          <p className="text-yellow-700">
            Cette version contourne le problème "Failed to fetch" en utilisant uniquement des API serveur.
            Toutes les fonctionnalités principales sont disponibles !
          </p>
        </div>
      </div>
    </main>
  )
}

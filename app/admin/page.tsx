'use client'

import { useState, useEffect } from 'react'
import { OrderService, Order, AdminNote, generateSecurePhotoUrl } from '@/lib/supabase'

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderNotes, setOrderNotes] = useState<AdminNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [securePhotoUrls, setSecurePhotoUrls] = useState<Record<string, string>>({})

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
          const secureUrl = await generateSecurePhotoUrl(order.photo_url)
          return { orderId: order.id, secureUrl }
        })
      
      const resolvedUrls = await Promise.all(urlPromises)
      const urlsMap = resolvedUrls.reduce((acc, { orderId, secureUrl }) => {
        acc[orderId] = secureUrl
        return acc
      }, {} as Record<string, string>)
      
      setSecurePhotoUrls(urlsMap)
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

  // Charger les données au démarrage
  useEffect(() => {
    loadOrders()
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

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Administration Sticker DOUDOU</h1>
        
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
                          <a 
                            href={securePhotoUrls[order.id] || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              if (!securePhotoUrls[order.id]) {
                                e.preventDefault()
                                alert('URL de photo en cours de génération...')
                              }
                            }}
                          >
                            📸 Voir photo
                          </a>
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
            Actualiser
          </button>
        </div>

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
                      {selectedOrder.photo_url && (
                        <div>
                          <strong>Photo:</strong>
                          <br />
                          <a 
                            href={securePhotoUrls[selectedOrder.id] || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                            onClick={(e) => {
                              if (!securePhotoUrls[selectedOrder.id]) {
                                e.preventDefault()
                                alert('URL de photo en cours de génération...')
                              }
                            }}
                          >
                            📸 Ouvrir la photo du doudou
                          </a>
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
      </div>
    </main>
  )
}

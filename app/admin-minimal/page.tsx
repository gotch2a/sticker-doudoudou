'use client'

import { useState } from 'react'

// VERSION MINIMALE ADMIN - AUCUNE DÉPENDANCE EXTERNE
export default function AdminMinimalPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'shipping' | 'discounts'>('orders')
  const [mockOrders] = useState([
    { id: '1', order_number: 'CMD-001', status: 'nouveau', client_email: 'test@example.com', total_amount: 12.90 },
    { id: '2', order_number: 'CMD-002', status: 'en_cours', client_email: 'test2@example.com', total_amount: 24.90 }
  ])

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">✅ Administration Doudoudou - Version Minimale</h1>
        
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-bold text-green-800">🎯 Test de Fonctionnement</h2>
          <p className="text-green-700">Cette version fonctionne sans Supabase pour tester l'interface pure.</p>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📦 Gestion des Commandes (MOCK)</h2>
              
              <div className="space-y-4">
                {mockOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                      <div>
                        <div className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-bold ${
                          order.status === 'nouveau' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.toUpperCase()}
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-semibold text-lg text-pink-600">{order.order_number}</p>
                        <p className="text-sm text-gray-500">Commande test</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold">{order.client_email}</p>
                        <p className="text-sm text-gray-600">Client test</p>
                      </div>
                      
                      <div>
                        <p className="text-lg font-bold text-gray-900">{order.total_amount}€</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🏷️ Gestion des Articles (MOCK)</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">1 Planche de Stickers</h3>
                <p className="text-gray-600">Article de test - Interface fonctionnelle</p>
                <div className="flex items-center gap-4 text-sm mt-2">
                  <span className="text-2xl font-bold text-green-600">12.90€</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Actif</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🚚 Paramètres de Livraison (MOCK)</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Livraison Standard</h3>
                <p className="text-gray-600">5.90€ - 3-5 jours ouvrés</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Livraison Express</h3>
                <p className="text-gray-600">9.90€ - 1-2 jours ouvrés</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'discounts' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🏷️ Codes de Remise (MOCK)</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold font-mono bg-gray-100 px-2 py-1 rounded inline">BIENVENUE10</h3>
                <p className="text-gray-600 mt-2">10% de réduction - Code de test</p>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Actif</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">📋 Résultat du Test</h3>
          <p className="text-blue-700">
            ✅ Si vous voyez cette interface avec des onglets fonctionnels, le problème n'est PAS dans le code React/TypeScript.
          </p>
          <p className="text-blue-700 mt-2">
            ❌ Le problème est dans la connexion à Supabase ou la gestion des erreurs.
          </p>
        </div>

        <div className="mt-6 flex gap-4">
          <a 
            href="/admin-simple" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔍 Diagnostic Complet
          </a>
          <a 
            href="/admin" 
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            ❌ Page Admin Problématique
          </a>
        </div>
      </div>
    </main>
  )
}

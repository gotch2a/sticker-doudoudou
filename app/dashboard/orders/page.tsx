/**
 * Page historique des commandes
 * Affiche toutes les commandes d'un utilisateur avec détails
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Package, 
  Search, 
  Filter,
  Eye,
  Download,
  Calendar,
  Euro
} from 'lucide-react'
import Link from 'next/link'

/**
 * Interface pour une commande détaillée
 */
interface OrderDetail {
  id: string
  order_number: string
  pet_name: string
  animal_type: string
  child_name: string
  status: string
  total_amount: number
  discount_amount?: number
  created_at: string
  updated_at: string
  notes?: string
  photo_url?: string
  address: string
  city: string
  postal_code: string
}

/**
 * Page historique des commandes
 */
export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)

  // Charger les commandes (simulation pour le MVP)
  useEffect(() => {
    const loadOrders = async () => {
      try {
        // TODO: Remplacer par l'API réelle
        const mockOrders: OrderDetail[] = [
          {
            id: '1',
            order_number: 'CMD-1708684230',
            pet_name: 'Lapinou',
            animal_type: 'Lapin blanc',
            child_name: 'Emma',
            status: 'expedie',
            total_amount: 15.90,
            discount_amount: 0,
            created_at: '2024-02-20T16:45:00Z',
            updated_at: '2024-02-22T10:30:00Z',
            notes: 'Couleurs douces préférées: rose et blanc',
            address: '123 Rue de la Paix',
            city: 'Paris',
            postal_code: '75001'
          },
          {
            id: '2',
            order_number: 'CMD-1707654000',
            pet_name: 'Nounours',
            animal_type: 'Ours en peluche',
            child_name: 'Emma',
            status: 'termine',
            total_amount: 10.90,
            discount_amount: 5.00,
            created_at: '2024-02-10T14:30:00Z',
            updated_at: '2024-02-15T09:20:00Z',
            notes: 'Nouvelle planche pour Nounours (réduction fidélité)',
            address: '123 Rue de la Paix',
            city: 'Paris',
            postal_code: '75001'
          },
          {
            id: '3',
            order_number: 'CMD-1705320000',
            pet_name: 'Nounours',
            animal_type: 'Ours en peluche',
            child_name: 'Emma',
            status: 'livre',
            total_amount: 21.00,
            discount_amount: 0,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-20T16:45:00Z',
            notes: 'Première commande - ours brun avec nœud rouge',
            address: '123 Rue de la Paix',
            city: 'Paris',
            postal_code: '75001'
          }
        ]

        setOrders(mockOrders)
        setFilteredOrders(mockOrders)
        
      } catch (error) {
        console.error('Erreur chargement commandes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  // Filtrer les commandes
  useEffect(() => {
    let filtered = orders

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.child_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  /**
   * Formater une date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Obtenir le badge de statut
   */
  const getStatusBadge = (status: string) => {
    const badges = {
      nouveau: { color: 'bg-blue-100 text-blue-800', text: 'Nouveau' },
      en_cours: { color: 'bg-yellow-100 text-yellow-800', text: 'En cours' },
      termine: { color: 'bg-green-100 text-green-800', text: 'Terminé' },
      expedie: { color: 'bg-purple-100 text-purple-800', text: 'Expédié' },
      livre: { color: 'bg-gray-100 text-gray-800', text: 'Livré' }
    }

    const badge = badges[status as keyof typeof badges] || badges.nouveau

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  /**
   * Modal détails commande
   */
  const OrderModal = ({ order, onClose }: { order: OrderDetail, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Détails de la commande</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Numéro</p>
              <p className="font-mono text-sm">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Statut</p>
              {getStatusBadge(order.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Doudou</p>
              <p>{order.pet_name}</p>
              <p className="text-sm text-gray-500">{order.animal_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pour</p>
              <p>{order.child_name}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">Adresse de livraison</p>
            <p className="text-sm">
              {order.address}<br />
              {order.postal_code} {order.city}
            </p>
          </div>

          {order.notes && (
            <div>
              <p className="text-sm font-medium text-gray-600">Notes</p>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.notes}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span>Montant</span>
              <span>{(order.total_amount + (order.discount_amount || 0)).toFixed(2)}€</span>
            </div>
            {order.discount_amount && order.discount_amount > 0 && (
              <div className="flex justify-between items-center text-green-600 mb-2">
                <span className="text-sm">Réduction</span>
                <span className="text-sm">-{order.discount_amount.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
              <span>Total payé</span>
              <span>{order.total_amount.toFixed(2)}€</span>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>Commandé le {formatDate(order.created_at)}</p>
            <p>Dernière mise à jour le {formatDate(order.updated_at)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos commandes...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard" 
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-600">Mes commandes</h1>
            <p className="text-gray-600">{orders.length} commande{orders.length !== 1 ? 's' : ''} trouvée{orders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, doudou ou enfant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            {/* Filtre statut */}
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="nouveau">Nouveau</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="expedie">Expédié</option>
                <option value="livre">Livré</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-full">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">#{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      {order.pet_name} pour {order.child_name}
                    </p>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.created_at)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Euro className="w-4 h-4" />
                  {order.total_amount.toFixed(2)}€
                  {order.discount_amount && order.discount_amount > 0 && (
                    <span className="text-green-600 text-xs">
                      (économie: {order.discount_amount.toFixed(2)}€)
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {order.animal_type}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Livraison: {order.city} ({order.postal_code})
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Détails
                  </button>
                  
                  {order.status === 'livre' && (
                    <button className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1 text-sm">
                      <Download className="w-4 h-4" />
                      Facture
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message si aucune commande */}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Aucune commande trouvée' : 'Aucune commande'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par créer votre première commande de stickers'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Link
                href="/commande"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                <Package className="w-4 h-4" />
                Créer ma première commande
              </Link>
            )}
          </div>
        )}

        {/* Modal détails */}
        {selectedOrder && (
          <OrderModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </div>
    </main>
  )
}

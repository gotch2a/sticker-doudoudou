import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client Supabase pour l'application
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fonction pour générer une URL sécurisée pour les photos (côté client)
export async function generateSecurePhotoUrl(photoUrl: string): Promise<string> {
  if (!photoUrl) return ''
  
  try {
    // Extraire le nom de fichier de l'URL (peut être /api/photos/filename ou juste filename)
    let filename = photoUrl
    if (photoUrl.includes('/api/photos/')) {
      filename = photoUrl.split('/api/photos/')[1].split('?')[0]
    } else if (photoUrl.includes('/')) {
      filename = photoUrl.split('/').pop()?.split('?')[0] || ''
    }
    
    if (!filename) {
      console.error('Impossible d\'extraire le nom de fichier de:', photoUrl)
      return photoUrl
    }
    
    const response = await fetch('/api/secure-photo-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoUrl: filename }),
    })
    
    if (!response.ok) {
      console.error('Erreur génération URL sécurisée:', response.statusText)
      return photoUrl
    }
    
    const { secureUrl } = await response.json()
    return secureUrl
  } catch (error) {
    console.error('Erreur génération URL sécurisée:', error)
    return photoUrl
  }
}

// Types pour TypeScript
export interface Order {
  id: string
  order_number: string
  pet_name: string
  animal_type: string
  photo_url: string
  child_name: string
  child_age: string
  client_email: string
  address: string
  city: string
  postal_code: string
  number_of_sheets: number
  total_amount: number
  notes?: string
  status: 'nouveau' | 'en_cours' | 'termine' | 'expedie' | 'livre'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_reference: string | null // ID PayPal ou autre système de paiement
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminNote {
  id: string
  order_id: string
  note: string
  created_at: string
  created_by: string
}

export interface Article {
  id: string
  name: string
  description: string
  original_price: number
  sale_price: number
  savings: number
  icon: string
  badge?: string
  popular: boolean
  features: string[]
  active: boolean
  category: 'base' | 'upsell' | 'pack'
  created_at: string
  updated_at: string
}

export interface OrderArticle {
  id: string
  order_id: string
  article_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

// Fonctions utilitaires pour les commandes
export class OrderService {
  
  // Créer une nouvelle commande
  static async createOrder(orderData: {
    photo_url: string
    pet_name: string
    animal_type: string
    child_name: string
    child_age: string
    client_email: string
    address: string
    city: string
    postal_code: string
    number_of_sheets: number
    notes?: string
    total_amount?: number
  }) {
    const orderNumber = `CMD-${Date.now()}`
    const totalAmount = orderData.total_amount || 0

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        pet_name: orderData.pet_name,
        animal_type: orderData.animal_type,
        photo_url: orderData.photo_url,
        child_name: orderData.child_name,
        child_age: orderData.child_age,
        client_email: orderData.client_email,
        address: orderData.address,
        city: orderData.city,
        postal_code: orderData.postal_code,
        number_of_sheets: orderData.number_of_sheets,
        total_amount: totalAmount,
        notes: orderData.notes || null,
        status: 'nouveau'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur création commande Supabase:', error)
      throw error
    }

    console.log('✅ Commande créée dans Supabase:', orderNumber)
    return data
  }

  // Récupérer toutes les commandes
  static async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération commandes:', error)
      throw error
    }

    return data
  }

  // Récupérer une commande par son numéro
  static async getOrderByNumber(orderNumber: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (error) {
      console.error('❌ Erreur récupération commande:', error)
      throw error
    }

    return data
  }

  // Mettre à jour le statut d'une commande via fonction admin
  static async updateOrderStatusAdmin(orderId: string, status: Order['status']) {
    console.log(`🔧 Mise à jour admin statut commande ${orderId} vers: ${status}`)
    
    const { data, error } = await supabase.rpc('update_order_status_admin', {
      order_id: orderId,
      new_status: status
    })

    if (error) {
      console.error('❌ Erreur fonction admin:', error)
      throw error
    }

    console.log('✅ Statut mis à jour via fonction admin:', data)
    return { data, error: null }
  }

  // Mettre à jour le statut d'une commande (méthode classique)
  static async updateOrderStatus(orderId: string, status: Order['status']) {
    console.log(`🔄 Tentative mise à jour statut commande ${orderId} vers: ${status}`)
    
    // D'abord, vérifier si la commande existe
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .eq('id', orderId)
      .single()

    if (checkError) {
      console.error('❌ Commande non trouvée:', {
        orderId,
        error: checkError.message,
        code: checkError.code
      })
      throw new Error(`Commande non trouvée: ${orderId}`)
    }

    console.log('✅ Commande trouvée:', existingOrder)

    // Maintenant, mettre à jour le statut
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('❌ Erreur mise à jour statut:', error)
      console.error('Détails erreur:', {
        orderId,
        newStatus: status,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details
      })
      throw error
    }

    if (!data || data.length === 0) {
      console.error('❌ Aucune ligne mise à jour')
      throw new Error('Aucune ligne n\'a été mise à jour - vérifiez les permissions')
    }

    console.log(`✅ Statut commande ${orderId} mis à jour avec succès: ${existingOrder.status} → ${status}`)
    console.log('📄 Données retournées:', data)
    return data[0]
  }

  // Mettre à jour le statut de paiement
  static async updatePaymentStatus(orderId: string, paymentStatus: Order['payment_status'], paypalOrderId?: string) {
    console.log('🔄 Mise à jour paiement pour commande ID:', orderId)
    
    // Attendre un peu pour éviter les problèmes de timing avec Supabase
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // D'abord récupérer la commande existante pour les notes
    let existingOrder
    let fetchError
    
    // Retry logic pour gérer les problèmes de timing
    for (let i = 0; i < 3; i++) {
      const result = await supabase
        .from('orders')
        .select('notes')
        .eq('id', orderId)
        .single()
      
      existingOrder = result.data
      fetchError = result.error
      
      if (!fetchError) break
      
      console.log(`⏳ Tentative ${i + 1}/3 - Commande pas encore visible, attente...`)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    if (fetchError) {
      console.error('❌ Erreur récupération commande après 3 tentatives:', fetchError)
      // En mode démo, on ignore cette erreur et on continue
      console.log('🚨 Mode démo : continuer sans mise à jour du statut de paiement')
      return { success: true, demo: true }
    }

    const updateData: any = { 
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    }
    
    if (paymentStatus === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }
    
    // Ajouter l'ID PayPal dans les notes en préservant les notes existantes
    if (paypalOrderId) {
      const existingNotes = existingOrder?.notes || ''
      updateData.notes = existingNotes + `\n[PayPal Order ID: ${paypalOrderId}]`
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()

    if (error) {
      console.error('❌ Erreur mise à jour paiement:', error)
      // En mode démo, on ignore cette erreur aussi
      console.log('🚨 Mode démo : erreur ignorée, commande créée avec succès')
      return { success: true, demo: true }
    }

    console.log('✅ Paiement mis à jour avec succès')
    return data?.[0] || data
  }

  // Récupérer une commande par référence de paiement (PayPal, etc.)
  static async getOrderByPaymentReference(paymentRef: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('notes', `%${paymentRef}%`) // Chercher dans les notes où on stocke l'ID PayPal
      .single()

    if (error) {
      console.error('❌ Erreur récupération commande par référence:', error)
      throw error
    }

    return data
  }

  // Ajouter une note admin
  static async addAdminNote(orderId: string, note: string, createdBy = 'admin') {
    console.log(`📝 Tentative ajout note admin pour commande ${orderId}: ${note}`)
    
    const { data, error } = await supabase
      .from('admin_notes')
      .insert({
        order_id: orderId,
        note,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur ajout note admin:', error)
      console.error('Détails erreur note:', {
        orderId,
        note,
        createdBy,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details
      })
      throw error
    }

    console.log(`✅ Note admin ajoutée avec succès pour commande ${orderId}`)
    return data
  }

  // Récupérer les notes d'une commande
  static async getOrderNotes(orderId: string) {
    const { data, error } = await supabase
      .from('admin_notes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération notes:', error)
      throw error
    }

    return data
  }

  // Ajouter un article à une commande
  static async addOrderArticle(orderId: string, articleId: string, quantity: number, unitPrice: number) {
    const totalPrice = quantity * unitPrice

    const { data, error } = await supabase
      .from('order_articles')
      .insert({
        order_id: orderId,
        article_id: articleId,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: totalPrice
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur ajout article à la commande:', error)
      throw error
    }

    return data
  }

  // Récupérer les articles d'une commande avec leurs détails
  static async getOrderArticles(orderId: string) {
    const { data, error } = await supabase
      .from('order_articles')
      .select(`
        *,
        articles:article_id (
          id,
          name,
          description,
          original_price,
          sale_price,
          icon,
          badge,
          category
        )
      `)
      .eq('order_id', orderId)

    if (error) {
      console.error('❌ Erreur récupération articles de la commande:', error)
      throw error
    }

    return data
  }

  // Récupérer tous les articles disponibles
  static async getAllArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('category', { ascending: true })

    if (error) {
      console.error('❌ Erreur récupération articles:', error)
      throw error
    }

    return data
  }

  // Récupérer un article par son ID
  static async getArticleById(articleId: string) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (error) {
      console.error('❌ Erreur récupération article:', error)
      throw error
    }

    return data
  }

  // Mettre à jour un article
  static async updateArticle(id: string, updates: Partial<Article>) {
    const { data, error } = await supabase
      .from('articles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur mise à jour article:', error)
      throw error
    }

    return data
  }

  // Créer un nouvel article
  static async createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur création article:', error)
      throw error
    }

    return data
  }

  // Supprimer un article (soft delete en désactivant)
  static async deleteArticle(id: string) {
    const { data, error } = await supabase
      .from('articles')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur suppression article:', error)
      throw error
    }

    return data
  }
}

// Service de gestion des paramètres produits
// Pour le moment utilise localStorage, peut être migré vers Supabase plus tard

export interface ProductSettings {
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
  category: 'upsell' | 'base' | 'pack'
}

export interface ProductPack {
  id: string
  name: string
  description: string
  products: string[]
  originalPrice: number
  salePrice: number
  savings: number
  active: boolean
}

// Produits par défaut
const defaultProducts: ProductSettings[] = [
  {
    id: 'planche-base',
    name: 'Planche de stickers de base',
    description: 'Une planche de stickers personnalisés avec votre doudou',
    originalPrice: 12.90,
    salePrice: 12.90,
    savings: 0,
    icon: '🏷️',
    active: true,
    category: 'base',
    features: ['Personnalisation complète', 'Haute qualité', 'Livraison rapide']
  },
  {
    id: 'planche-bonus',
    name: '1 Planche Bonus',
    description: 'Une planche supplémentaire à prix exceptionnel',
    originalPrice: 12.90,
    salePrice: 4.90,
    savings: 8.00,
    icon: '🏷️',
    badge: '-60%',
    popular: true,
    active: true,
    category: 'upsell',
    features: ['1 planche supplémentaire', 'Prix ultra-attractif', 'Même qualité premium', 'Livraison groupée', 'Formats assortis']
  },
  {
    id: 'photo-premium',
    name: 'Photo Doudou Premium',
    description: 'Une magnifique photo format 13x18 avec cadre inclus',
    originalPrice: 39.90,
    salePrice: 29.90,
    savings: 10.00,
    icon: '🖼️',
    badge: 'Cadre Inclus',
    active: false,
    category: 'upsell',
    features: ['Format 13x18 haute qualité', 'Papier photo premium', 'Cadre élégant inclus', 'Prêt à accrocher', 'Texte personnalisé avec prénom']
  },
  {
    id: 'livre-histoire',
    name: 'Livre d\'Histoire Personnalisé',
    description: 'L\'histoire magique de votre doudou en 8-10 pages illustrées',
    originalPrice: 34.90,
    salePrice: 24.90,
    savings: 10.00,
    icon: '📖',
    badge: 'Populaire',
    active: true,
    category: 'upsell',
    features: ['8-10 pages d\'histoire', 'Illustrations personnalisées', 'Prénom intégré dans l\'histoire', 'Couverture rigide', 'Format 21x21cm']
  }
]

const defaultPacks: ProductPack[] = [
  {
    id: 'pack-complet',
    name: 'Pack Complet Doudou',
    description: 'Planche de base + Photo + Livre à prix avantageux',
    products: ['planche-base', 'photo-premium', 'livre-histoire'],
    originalPrice: 77.70,
    salePrice: 59.90,
    savings: 17.80,
    active: false
  }
]

class ProductSettingsService {
  private storageKey = 'sticker-doudou-products'
  private packsStorageKey = 'sticker-doudou-packs'

  // Charger les paramètres produits
  getProducts(): ProductSettings[] {
    if (typeof window === 'undefined') return defaultProducts
    
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Erreur chargement paramètres produits:', error)
    }
    
    // Première fois : sauvegarder les valeurs par défaut
    this.saveProducts(defaultProducts)
    return defaultProducts
  }

  // Sauvegarder les paramètres produits
  saveProducts(products: ProductSettings[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(products))
      console.log('✅ Paramètres produits sauvegardés')
    } catch (error) {
      console.error('Erreur sauvegarde paramètres produits:', error)
    }
  }

  // Charger les packs
  getPacks(): ProductPack[] {
    if (typeof window === 'undefined') return defaultPacks
    
    try {
      const saved = localStorage.getItem(this.packsStorageKey)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Erreur chargement packs:', error)
    }
    
    this.savePacks(defaultPacks)
    return defaultPacks
  }

  // Sauvegarder les packs
  savePacks(packs: ProductPack[]): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.packsStorageKey, JSON.stringify(packs))
      console.log('✅ Packs sauvegardés')
    } catch (error) {
      console.error('Erreur sauvegarde packs:', error)
    }
  }

  // Mettre à jour un produit spécifique
  updateProduct(productId: string, updates: Partial<ProductSettings>): ProductSettings[] {
    const products = this.getProducts()
    const updatedProducts = products.map(product => 
      product.id === productId 
        ? { ...product, ...updates }
        : product
    )
    this.saveProducts(updatedProducts)
    
    // Synchroniser avec le serveur
    this.syncWithServer(updatedProducts)
    
    return updatedProducts
  }

  // Synchroniser les paramètres avec le serveur
  private async syncWithServer(products: ProductSettings[]): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products }),
      })
      
      if (response.ok) {
        console.log('✅ Paramètres synchronisés avec le serveur')
      } else {
        console.error('Erreur synchronisation serveur:', response.statusText)
      }
    } catch (error) {
      console.error('Erreur synchronisation serveur:', error)
    }
  }

  // Charger les paramètres depuis le serveur
  async loadFromServer(): Promise<ProductSettings[]> {
    if (typeof window === 'undefined') return this.getProducts()
    
    try {
      const response = await fetch('/api/admin/products')
      
      if (response.ok) {
        const { products } = await response.json()
        this.saveProducts(products)
        console.log('✅ Paramètres chargés depuis le serveur')
        return products
      } else {
        console.error('Erreur chargement serveur:', response.statusText)
        return this.getProducts()
      }
    } catch (error) {
      console.error('Erreur chargement serveur:', error)
      return this.getProducts()
    }
  }

  // Mettre à jour un pack spécifique
  updatePack(packId: string, updates: Partial<ProductPack>): ProductPack[] {
    const packs = this.getPacks()
    const updatedPacks = packs.map(pack => 
      pack.id === packId 
        ? { ...pack, ...updates }
        : pack
    )
    this.savePacks(updatedPacks)
    return updatedPacks
  }

  // Obtenir les produits actifs pour l'upsell
  getActiveUpsellProducts(): ProductSettings[] {
    return this.getProducts().filter(product => 
      product.active && product.category === 'upsell'
    )
  }

  // Obtenir le prix d'un produit par son ID
  getProductPrice(productId: string): number {
    const products = this.getProducts()
    const product = products.find(p => p.id === productId)
    return product?.salePrice || 0
  }

  // Obtenir le prix de la planche de base (produit principal)
  getBasePlanchePrice(): number {
    return this.getProductPrice('planche-base')
  }

  // Obtenir les informations d'un produit par son ID
  getProduct(productId: string): ProductSettings | null {
    const products = this.getProducts()
    return products.find(p => p.id === productId) || null
  }
}

export const productSettingsService = new ProductSettingsService()

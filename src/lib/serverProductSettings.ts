// Service de gestion des paramètres produits côté serveur
// Utilise un fichier JSON pour partager les données entre client et serveur

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

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

export interface ShippingSettings {
  tarif1: {
    name: string
    description: string
    price: number
    condition: string
  }
  tarif2: {
    name: string
    description: string
    price: number
    condition: string
  }
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
    active: false,
    category: 'upsell',
    features: ['8-10 pages d\'histoire', 'Illustrations personnalisées', 'Prénom intégré dans l\'histoire', 'Couverture rigide', 'Format 21x21cm']
  }
]

class ServerProductSettingsService {
  private settingsPath = join(process.cwd(), 'data', 'product-settings.json')

  constructor() {
    this.ensureSettingsFile()
  }

  private ensureSettingsFile() {
    const dataDir = join(process.cwd(), 'data')
    
    // Créer le dossier data s'il n'existe pas
    if (!existsSync(dataDir)) {
      try {
        require('fs').mkdirSync(dataDir, { recursive: true })
      } catch (error) {
        console.warn('Impossible de créer le dossier data:', error)
        return
      }
    }

    // Créer le fichier de settings s'il n'existe pas
    if (!existsSync(this.settingsPath)) {
      this.saveProducts(defaultProducts)
      console.log('✅ Fichier de paramètres produits créé:', this.settingsPath)
    }
  }

  // Charger les paramètres produits
  getProducts(): ProductSettings[] {
    try {
      if (!existsSync(this.settingsPath)) {
        console.warn('Fichier settings non trouvé, utilisation des valeurs par défaut')
        return defaultProducts
      }

      const data = readFileSync(this.settingsPath, 'utf8')
      const products = JSON.parse(data)
      return Array.isArray(products) ? products : defaultProducts
    } catch (error) {
      console.error('Erreur chargement paramètres produits:', error)
      return defaultProducts
    }
  }

  // Sauvegarder les paramètres produits
  saveProducts(products: ProductSettings[]): void {
    try {
      writeFileSync(this.settingsPath, JSON.stringify(products, null, 2))
      console.log('✅ Paramètres produits sauvegardés côté serveur')
    } catch (error) {
      console.error('Erreur sauvegarde paramètres produits:', error)
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
    return updatedProducts
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

  // Obtenir le prix de la planche de base
  getBasePlanchePrice(): number {
    return this.getProductPrice('planche-base')
  }

  // Obtenir les informations d'un produit par son ID
  getProduct(productId: string): ProductSettings | null {
    const products = this.getProducts()
    return products.find(p => p.id === productId) || null
  }

  // Synchroniser avec le localStorage (appelé depuis une API)
  syncWithClient(clientProducts: ProductSettings[]): void {
    this.saveProducts(clientProducts)
  }
}

export const serverProductSettingsService = new ServerProductSettingsService()

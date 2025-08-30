// Service de gestion des paramètres de livraison

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

// Paramètres par défaut pour la livraison
const defaultShippingSettings: ShippingSettings = {
  tarif1: {
    name: 'Livraison Standard',
    description: 'Pour stickers uniquement (planche de base seule ou avec planche bonus)',
    price: 3.5,
    condition: 'stickers_only'
  },
  tarif2: {
    name: 'Livraison Premium', 
    description: 'Avec photo ou livre (objets physiques supplémentaires)',
    price: 5.8,
    condition: 'with_physical_products'
  }
}

class ShippingSettingsService {
  private STORAGE_KEY = 'shipping_settings'

  constructor() {
    if (typeof window !== 'undefined' && !localStorage.getItem(this.STORAGE_KEY)) {
      this.saveSettings(defaultShippingSettings)
    }
  }

  // Récupérer les paramètres de livraison
  getSettings(): ShippingSettings {
    if (typeof window === 'undefined') return defaultShippingSettings
    
    try {
      const settingsJson = localStorage.getItem(this.STORAGE_KEY)
      return settingsJson ? JSON.parse(settingsJson) : defaultShippingSettings
    } catch (error) {
      console.error('Erreur chargement paramètres livraison:', error)
      return defaultShippingSettings
    }
  }

  // Sauvegarder les paramètres de livraison
  saveSettings(settings: ShippingSettings): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings))
    }
  }

  // Mettre à jour un tarif spécifique
  updateTarif(tarif: 'tarif1' | 'tarif2', updates: Partial<ShippingSettings['tarif1']>): ShippingSettings {
    const settings = this.getSettings()
    const updatedSettings = {
      ...settings,
      [tarif]: { ...settings[tarif], ...updates }
    }
    this.saveSettings(updatedSettings)
    return updatedSettings
  }

  // Calculer les frais de livraison selon les produits sélectionnés
  calculateShipping(upsells: string[]): { cost: number, tarif: 'tarif1' | 'tarif2', reason: string } {
    const settings = this.getSettings()
    const hasPhysicalProducts = upsells.some(id => id === 'photo-premium' || id === 'livre-histoire')
    
    if (hasPhysicalProducts) {
      return {
        cost: settings.tarif2.price,
        tarif: 'tarif2',
        reason: settings.tarif2.description
      }
    } else {
      return {
        cost: settings.tarif1.price,
        tarif: 'tarif1',
        reason: settings.tarif1.description
      }
    }
  }

  // Synchroniser avec le serveur
  async syncWithServer(settings: ShippingSettings): Promise<void> {
    if (typeof window === 'undefined') return
    
    try {
      const response = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })
      
      if (response.ok) {
        console.log('✅ Paramètres livraison synchronisés avec le serveur')
      } else {
        console.error('Erreur synchronisation serveur:', response.statusText)
      }
    } catch (error) {
      console.error('Erreur synchronisation serveur:', error)
    }
  }

  // Charger depuis le serveur
  async loadFromServer(): Promise<ShippingSettings> {
    if (typeof window === 'undefined') return this.getSettings()
    
    try {
      const response = await fetch('/api/admin/shipping')
      
      if (response.ok) {
        const { settings } = await response.json()
        this.saveSettings(settings)
        console.log('✅ Paramètres livraison chargés depuis le serveur')
        return settings
      } else {
        console.error('Erreur chargement serveur:', response.statusText)
        return this.getSettings()
      }
    } catch (error) {
      console.error('Erreur chargement serveur:', error)
      return this.getSettings()
    }
  }
}

export const shippingSettingsService = new ShippingSettingsService()

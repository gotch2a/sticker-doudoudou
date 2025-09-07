// Service de gestion des paramètres de livraison

export interface ShippingSettings {
  tarif1: {
    name: string
    description: string
    price: number
    condition: string
    delay: number
    active: boolean
  }
  tarif2: {
    name: string
    description: string
    price: number
    condition: string
    delay: number
    active: boolean
  }
}

// Paramètres par défaut pour la livraison
const defaultShippingSettings: ShippingSettings = {
  tarif1: {
    name: 'Livraison Standard',
    description: 'Pour stickers uniquement (planche de base seule ou avec planche bonus)',
    price: 3.5,
    condition: 'stickers_only',
    delay: 5,
    active: true
  },
  tarif2: {
    name: 'Livraison Premium', 
    description: 'Avec photo ou livre (objets physiques supplémentaires)',
    price: 5.8,
    condition: 'with_physical_products',
    delay: 3,
    active: true
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
  // DOCUMENTATION : Calcule les frais de livraison en fonction des produits sélectionnés
  // Gère les cas où les paramètres ne sont pas chargés avec des valeurs par défaut
  calculateShipping(upsells: string[]): { cost: number, tarif: 'tarif1' | 'tarif2', reason: string } {
    const settings = this.getSettings()
    
    // Vérification de sécurité : si les paramètres ne sont pas chargés, utiliser des valeurs par défaut
    if (!settings || !settings.tarif1 || !settings.tarif2) {
      console.warn('⚠️ Paramètres de livraison non chargés, utilisation des valeurs par défaut')
      const hasPhysicalProducts = upsells.some(id => id === 'photo-premium' || id === 'livre-histoire')
      
      if (hasPhysicalProducts) {
        return {
          cost: 5.8, // Valeur par défaut tarif2
          tarif: 'tarif2',
          reason: 'Avec photo ou livre (objets physiques supplémentaires)'
        }
      } else {
        return {
          cost: 2.5, // Valeur par défaut tarif1
          tarif: 'tarif1',
          reason: 'Pour stickers uniquement (planche de base seule ou avec planche bonus)'
        }
      }
    }
    
    const hasPhysicalProducts = upsells.some(id => id === 'photo-premium' || id === 'livre-histoire')
    
    if (hasPhysicalProducts) {
      return {
        cost: settings.tarif2.price || 5.8,
        tarif: 'tarif2',
        reason: settings.tarif2.description || 'Avec photo ou livre (objets physiques supplémentaires)'
      }
    } else {
      return {
        cost: settings.tarif1.price || 2.5,
        tarif: 'tarif1',
        reason: settings.tarif1.description || 'Pour stickers uniquement (planche de base seule ou avec planche bonus)'
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
  // DOCUMENTATION : Charge les paramètres depuis Supabase et les convertit au format local
  // Gère la conversion entre la structure Supabase (france_price, letter_price) 
  // et la structure locale (tarif1, tarif2)
  async loadFromServer(): Promise<ShippingSettings> {
    if (typeof window === 'undefined') return this.getSettings()
    
    try {
      const response = await fetch('/api/admin/shipping')
      
      if (response.ok) {
        const { success, settings: supabaseSettings } = await response.json()
        
        if (success && supabaseSettings) {
          // Convertir la structure Supabase vers notre format local
          const convertedSettings: ShippingSettings = {
            tarif1: {
              name: 'Livraison Standard',
              description: 'Pour stickers uniquement (planche de base seule ou avec planche bonus)',
              price: supabaseSettings.letter_price || 2.5,
              condition: 'stickers_only',
              delay: 5,
              active: true
            },
            tarif2: {
              name: 'Livraison Premium',
              description: 'Avec photo ou livre (objets physiques supplémentaires)',
              price: supabaseSettings.france_price || 5.8,
              condition: 'with_physical_products',
              delay: 3,
              active: supabaseSettings.active !== false
            }
          }
          
          this.saveSettings(convertedSettings)
          console.log('✅ Paramètres livraison chargés et convertis depuis le serveur')
          console.log('📋 Tarif1 (stickers):', convertedSettings.tarif1.price + '€')
          console.log('📋 Tarif2 (avec objets):', convertedSettings.tarif2.price + '€')
          return convertedSettings
        } else {
          console.warn('⚠️ Réponse serveur invalide, utilisation des paramètres locaux')
          return this.getSettings()
        }
      } else {
        console.error('❌ Erreur chargement serveur:', response.statusText)
        return this.getSettings()
      }
    } catch (error) {
      console.error('❌ Erreur chargement serveur:', error)
      return this.getSettings()
    }
  }
}

export const shippingSettingsService = new ShippingSettingsService()
